import { createReadStream } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { catalog } from '../modules/catalog/catalog.js';
import { publicService } from '../modules/catalog/public-catalog.js';
import { isValidCpf, isValidBrazilianDate } from '../modules/catalog/field-validation.js';
import type { CatalogDefinition } from '../modules/catalog/contracts.js';
import { QA_PREVIEW_SERVICE_ID } from '../modules/catalog/qa-preview.js';
import type { Database } from '../modules/auth/db.js';
import { getCurrentUser } from '../modules/auth/auth-service.js';
import { chargeJobCredit, markJobDelivered, refundUndeliveredJobCredit } from '../modules/auth/job-credit.js';
import { JobStore } from '../modules/jobs/job-store.js';
import type { ExtractionDiagnostic } from '../modules/jobs/job-store.js';
import { extractTextWithEngine, suggestFields, identityNameStage } from '../modules/jobs/ocr.js';
import {
  extractDocumentsWithOpenAi,
  OpenAiDocumentError,
} from '../modules/jobs/openai-document-extractor.js';
import { extractDocumentEvidence } from '../modules/document-understanding/registry.js';
import { resolveFieldEvidence } from '../modules/document-understanding/resolver.js';
import type { FieldEvidence } from '../modules/document-understanding/contracts.js';
import { fillApprovedTemplate } from '../modules/pdf/verified-template.js';
import { watermarkQaSample } from '../modules/pdf/qa-watermark.js';

const createSchema = z.object({ serviceId: z.string().max(100),
  answers: z.record(z.string().max(100), z.string().max(100)).default({}),
});
const extractSchema = z.object({
  provider: z.enum(['paddleocr', 'openai']).default('paddleocr'),
});

const reviewSchema = z.object({
  confirmed: z.literal(true),
  values: z.record(z.string().max(100), z.string().max(500)).refine(
    (data) => Object.keys(data).length <= 100, 'Muitos campos',
  ),
});

export function registerJobRoutes(
  app: FastifyInstance,
  pool?: Database,
  definitions: CatalogDefinition = catalog,
  qaPreview = false,
  testRoot?: string,
): void {
  const isQaJob = (serviceId: string) => qaPreview && serviceId === QA_PREVIEW_SERVICE_ID;
  const store = new JobStore(testRoot ?? process.env.TEMP_DOCUMENT_ROOT, async (jobId) => {
    if (!pool) return;
    try {
      await refundUndeliveredJobCredit(pool, jobId);
    } catch (error) {
      // The persistent expiry/restart reconciler retries when the DB returns.
      app.log.error({ err: error }, 'expired_job_refund_pending');
    }
  });
  app.addHook('onClose', async () => {
    await store.close();
    if (testRoot) await rm(testRoot, { recursive: true, force: true });
  });

  // Reject unauthenticated and unknown uploads BEFORE Fastify buffers a file.
  // The handler-level checks remain authoritative for the actual write.
  app.addHook('onRequest', async (request, reply) => {
    if (request.method !== 'POST') return;
    const parts = request.url.split('?')[0]!.split('/');
    if (parts.length !== 6 || parts[1] !== 'api' || parts[2] !== 'jobs' ||
      parts[4] !== 'documents' || !parts[3] || !parts[5]) return;

    if (!pool) return reply.status(503).send({ error: 'unavailable' });
    const user = await getCurrentUser(pool, request);
    if (!user) return reply.status(401).send({ error: 'unauthorized' });

    const job = store.get(parts[3], user.id);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service || !service.documentRequirements.some((document) => document.id === parts[5])) {
      return reply.status(400).send({ error: 'invalid_requirement' });
    }
    if (job.stage !== 'CREATED' && job.stage !== 'UPLOADED') {
      return reply.status(409).send({ error: 'invalid_state' });
    }
    const declaredLength = request.headers['content-length'];
    if (declaredLength !== undefined &&
      (!/^\d+$/.test(declaredLength) || Number(declaredLength) > 10 * 1024 * 1024)) {
      return reply.status(413).send({ error: 'document_too_large' });
    }
  });

  app.addContentTypeParser(['application/pdf', 'image/jpeg', 'image/png'],
    { parseAs: 'buffer', bodyLimit: 10 * 1024 * 1024 },
    (_request, body, done) => done(null, body));

  async function actor(req: FastifyRequest): Promise<string> {
    if (!pool) throw Object.assign(new Error('Indisponível.'), { statusCode: 503 });
    const user = await getCurrentUser(pool, req);
    if (!user) throw Object.assign(new Error('Não autorizado.'), { statusCode: 401 });
    return user.id;
  }

  app.post('/api/jobs', async (req, reply) => {
    const userId = await actor(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid' });
    const service = publicService(definitions, parsed.data.serviceId, parsed.data.answers);
    if (!service) return reply.status(409).send({
      error: 'not_available', message: 'Serviço ainda não homologado.',
    });
    if (service.formVersionIds.length === 0 ||
      service.questions.some((question) => !parsed.data.answers[question.id])) {
      return reply.status(422).send({ error: 'incomplete_service_selection' });
    }
    try {
      const job = await store.create(userId, service.id, parsed.data.answers);
      return reply.status(201).send({ id: job.id, status: job.stage, expiresAt: job.expiresAt });
    } catch {
      return reply.status(503).send({ error: 'capacity_exceeded' });
    }
  });

  app.get<{Params:{id:string}}>('/api/jobs/:id', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    return {
      id: job.id, status: job.stage, expiresAt: job.expiresAt,
      // Only enumerated service answers. Never expose document bytes or private file paths.
      answers: job.answers,
      documentCount: job.files.length,
      uploadedRequirementIds: [...new Set(job.files.map((file) => file.requirementId))],
      fields: job.stage === 'REVIEW' || job.stage === 'GENERATED' ? job.values : {},
      sources: job.sourceNotes,
      diagnostics: job.diagnostics,
      downloads: job.stage === 'GENERATED' ? [...job.outputs.keys()] : [],
    };
  });

  app.post<{Params:{id:string}}>('/api/jobs/:id/renew', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    const expiresAt = store.renew(job);
    if (!expiresAt) return reply.status(410).send({ error: 'expired' });
    return { expiresAt, maxExpiresAt: job.createdAt + 60 * 60_000 };
  });

  app.post<{Params:{id:string;requirementId:string}}>('/api/jobs/:id/documents/:requirementId', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service || !service.documentRequirements.some((doc) => doc.id === req.params.requirementId)) {
      return reply.status(400).send({ error: 'invalid_requirement' });
    }
    if (!Buffer.isBuffer(req.body)) return reply.status(415).send({ error: 'unsupported_media' });
    try {
      const stored = await store.upload(job, req.params.requirementId, req.body,
        req.headers['content-type'] ?? '');
      return reply.status(201).send({ id: stored.id, requirementId: stored.requirementId });
    } catch {
      return reply.status(400).send({ error: 'invalid_document', message: 'Documento inválido ou excede os limites.' });
    }
  });

  app.post<{Params:{id:string}}>('/api/jobs/:id/extract', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });

    const parsedRequest = extractSchema.safeParse(req.body ?? {});
    if (!parsedRequest.success) return reply.status(400).send({ error: 'invalid' });
    const provider = parsedRequest.data.provider;

    // A job with no files can transition straight from CREATED to REVIEW.
    // Uploaded documents are an optional extraction aid, not a condition of service.
    if (job.stage !== 'CREATED' && job.stage !== 'UPLOADED') {
      return reply.status(409).send({ error: 'invalid_state' });
    }
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service) return reply.status(409).send({ error: 'service_unavailable' });

    if (!store.beginOperation(job)) return reply.status(409).send({ error: 'job_busy' });
    job.stage = 'PROCESSING';

    const diagnostics: ExtractionDiagnostic[] = [];
    const evidence: FieldEvidence[] = [];
    const reviewableFields = new Set(service.reviewFields.map((field) => field.id));

    try {
      if (provider === 'openai' && job.files.length > 0) {
        const fieldsById = new Map(definitions.fields.map((field) => [field.id, field]));

        // Only send documents that can provide at least one field required by
        // the selected service. This is both a privacy boundary and a cost control.
        const documents = job.files.flatMap((document) => {
          const requirement = service.documentRequirements.find((item) =>
            item.id === document.requirementId);
          if (!requirement?.extraction) {
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: 'not_analyzed',
              suggestionCount: 0,
            });
            return [];
          }

          const allowedFieldIds = requirement.extraction.allowedFieldIds
            .filter((fieldId) => reviewableFields.has(fieldId));
          if (allowedFieldIds.length === 0) {
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: 'no_applicable_fields',
              suggestionCount: 0,
            });
            return [];
          }

          return [{
            document,
            label: requirement.label,
            documentType: requirement.extraction.documentType,
            subjectRole: requirement.extraction.subjectRole,
            allowedFieldIds,
          }];
        });

        const allowedTargetIds = new Set(documents.flatMap((document) =>
          document.allowedFieldIds));
        const targetFields = service.reviewFields
          .filter((field) => allowedTargetIds.has(field.id))
          .map((field) => ({
            id: field.id,
            label: field.label,
            valueKind: field.valueKind,
            validationRuleId: fieldsById.get(field.id)?.validationRuleId,
            required: field.required,
          }));

        try {
          const startedAt = Date.now();
          const extracted = await extractDocumentsWithOpenAi(documents, targetFields);
          evidence.push(...extracted.evidence);
          diagnostics.push(...extracted.diagnostics);
          req.log.info({
            provider: 'openai',
            model: extracted.model,
            documentCount: documents.length,
            targetFieldCount: targetFields.length,
            inputTokens: extracted.usage?.inputTokens,
            outputTokens: extracted.usage?.outputTokens,
            totalTokens: extracted.usage?.totalTokens,
            elapsedMs: Date.now() - startedAt,
          }, 'document_extraction_usage');
        } catch (error) {
          job.stage = 'UPLOADED';
          job.values = {};
          job.sourceNotes = {};
          job.diagnostics = [];
          if (error instanceof OpenAiDocumentError && error.code === 'not_configured') {
            return reply.status(503).send({
              error: 'openai_not_configured',
              message: 'Leitura pela OpenAI não configurada neste servidor.',
            });
          }
          return reply.status(503).send({
            error: 'openai_failed',
            message: 'Não foi possível analisar os documentos com a OpenAI. Tente novamente.',
          });
        }
      } else if (provider === 'paddleocr') {
        let attemptedDocuments = 0;
        let failedDocuments = 0;

        for (const document of job.files) {
          const requirement = service.documentRequirements.find((item) =>
            item.id === document.requirementId);
          // Documents without a semantic profile are not extraction inputs.
          if (!requirement?.extraction) {
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: 'not_analyzed',
              suggestionCount: 0,
            });
            continue;
          }
          const allowedDocumentFields = new Set(requirement.extraction.allowedFieldIds);
          if (![...allowedDocumentFields].some((fieldId) => reviewableFields.has(fieldId))) {
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: 'no_applicable_fields',
              suggestionCount: 0,
            });
            continue;
          }

          attemptedDocuments++;
          try {
            const extraction = await extractTextWithEngine(document, store.directory(job));
            const text = extraction.text;
            const observation = extraction.observation;
            const context = {
              documentId: document.id,
              sourceId: document.requirementId,
              documentType: requirement.extraction.documentType,
              subjectRole: requirement.extraction.subjectRole,
            } as const;

            const structured = extractDocumentEvidence(observation, context);
            // Transitional adapter: document types not migrated to their own extractor
            // still use the conservative labelled-text rules. No new document type may
            // be added here; migrate it to document-understanding instead.
            const legacy = requirement.extraction.documentType === 'sale-document'
              ? Object.entries(suggestFields(text, document.requirementId)).map(
                ([fieldId, candidate]): FieldEvidence => ({
                  fieldId,
                  value: candidate.value,
                  confidence: null,
                  documentId: document.id,
                  sourceId: candidate.source,
                  page: 0,
                  method: 'legacy-labelled-text',
                  lineIds: [],
                  status: 'REVIEW_REQUIRED',
                }),
              )
              : [];
            const documentEvidence = [...structured, ...legacy]
              .filter((item) => allowedDocumentFields.has(item.fieldId));
            evidence.push(...documentEvidence);

            const recognized = Object.fromEntries(documentEvidence.map((item) => [
              item.fieldId,
              { value: item.value, source: item.sourceId, status: item.status },
            ]));
            const applicableCount = documentEvidence
              .filter((item) => reviewableFields.has(item.fieldId)).length;
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: !text.trim() ? 'no_text'
                : applicableCount > 0 ? 'suggested'
                  : documentEvidence.length > 0 ? 'no_applicable_fields'
                    : 'no_supported_labels',
              suggestionCount: applicableCount,
              engine: extraction.engine,
              ...(isQaJob(job.serviceId) && requirement.extraction.documentType === 'identity'
                ? {
                    nameStage: identityNameStage(
                      text,
                      document.requirementId,
                      recognized,
                      reviewableFields,
                    ),
                  }
                : {}),
            });
          } catch {
            failedDocuments++;
            diagnostics.push({
              requirementId: document.requirementId,
              outcome: 'read_failed',
              suggestionCount: 0,
            });
          }
        }

        if (attemptedDocuments > 0 && failedDocuments === attemptedDocuments) {
          job.stage = 'UPLOADED';
          job.values = {};
          job.sourceNotes = {};
          job.diagnostics = diagnostics;
          return reply.status(503).send({
            error: 'ocr_failed',
            message: 'Não foi possível ler os documentos. Tente novamente.',
          });
        }
      }

      const resolved = resolveFieldEvidence(evidence, reviewableFields);
      job.values = resolved.values;
      job.sourceNotes = resolved.sourceNotes;
      job.diagnostics = diagnostics;
      job.stage = 'REVIEW';
      return {
        status: job.stage,
        fields: job.values,
        sources: job.sourceNotes,
        diagnostics: job.diagnostics,
        conflicts: resolved.conflicts,
        reviewRequired: true,
      };
    } catch {
      job.stage = 'UPLOADED';
      job.values = {};
      job.sourceNotes = {};
      job.diagnostics = [];
      return reply.status(503).send({
        error: provider === 'openai' ? 'openai_failed' : 'ocr_failed',
        message: 'Não foi possível ler os documentos. Tente novamente.',
      });
    } finally {
      store.endOperation(job);
    }
  });

  app.patch<{Params:{id:string}}>('/api/jobs/:id/review', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    if (job.stage !== 'REVIEW') return reply.status(409).send({ error: 'invalid_state' });
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid' });
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service) return reply.status(409).send({ error: 'service_unavailable' });
    const allowedFields = new Set(service.reviewFields.map((field) => field.id));
    if (Object.keys(parsed.data.values).some((field) => !allowedFields.has(field))) {
      return reply.status(400).send({ error: 'invalid_field' });
    }
    const missingField = service.reviewFields.find((field) => field.required &&
      !parsed.data.values[field.id]?.trim());
    if (missingField) {
      // Only public catalog metadata is returned, never private field content.
      return reply.status(422).send({
        error: 'missing_required_fields', fieldId: missingField.id,
      });
    }
    const fieldsById = new Map(definitions.fields.map((field) => [field.id, field]));
    for (const [fieldId, raw] of Object.entries(parsed.data.values)) {
      if (!raw.trim()) continue;
      const field = fieldsById.get(fieldId);
      const invalid = (field?.validationRuleId === 'cpf' && !isValidCpf(raw)) ||
        (field?.validationRuleId === 'simNao' && !['sim', 'nao'].includes(raw)) ||
        (field?.valueKind === 'date' && !isValidBrazilianDate(raw)) ||
        (field?.valueKind === 'boolean' && !['true', 'false'].includes(raw));
      if (invalid) {
        // The field identifier is safe catalog metadata, never sensitive content.
        return reply.status(422).send({ error: 'invalid_field_value', fieldId });
      }
    }
    job.values = { ...parsed.data.values };
    job.reviewConfirmed = true;
    return { confirmed: true, fieldCount: Object.keys(job.values).length };
  });

  app.post<{Params:{id:string}}>('/api/jobs/:id/generate', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    if (job.stage === 'GENERATED') return { downloads: [...job.outputs.keys()], reused: true };
    if (job.stage !== 'REVIEW' || !job.reviewConfirmed || Object.keys(job.values).length === 0) {
      return reply.status(409).send({ error: 'review_required' });
    }
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service || service.formVersionIds.length === 0) {
      return reply.status(409).send({ error: 'service_unavailable' });
    }
    const sample = isQaJob(job.serviceId);
    if (service.creditCost !== 1 && !(sample && service.creditCost === 0)) {
      return reply.status(422).send({ error: 'unsupported_credit_cost' });
    }
    if (!store.beginOperation(job)) return reply.status(409).send({ error: 'job_busy' });
    job.stage = 'GENERATING';
    const generated = new Map<string, string>();
    try {
      for (const id of service.formVersionIds) {
        const relation = definitions.serviceForms.find((item) =>
          item.serviceId === job.serviceId && item.formVersionId === id);
        const values = { ...job.values, ...relation?.fixedValues };
        const original = await fillApprovedTemplate(definitions, id, values);
        // Samples are conspicuously watermarked on every page. Never send
        // an unmarked draft form through the local QA service.
        const bytes = sample ? await watermarkQaSample(original) : original;
        const path = join(store.directory(job), id + '.pdf');
        await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
        generated.set(id, path);
      }
      if (!sample) await chargeJobCredit(pool!, userId, job.id, job.createdAt);
      job.outputs = generated;
      job.stage = 'GENERATED';
      return { downloads: [...generated.keys()], reused: false };
    } catch {
      job.stage = 'REVIEW';
      for (const path of generated.values()) await rm(path, { force: true });
      return reply.status(422).send({
        error: 'generation_failed', message: 'Verifique campos, saldo e modelo homologado.',
      });
    } finally {
      store.endOperation(job);
    }
  });

  app.get<{Params:{id:string;versionId:string}}>('/api/jobs/:id/download/:versionId', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    const path = job?.stage === 'GENERATED' ? job.outputs.get(req.params.versionId) : undefined;
    if (!path || !job) return reply.status(404).send({ error: 'not_found' });
    if (!store.beginOperation(job)) return reply.status(409).send({ error: 'job_busy' });
    const stream = createReadStream(path);
    let finished = false;
    reply.raw.once('finish', () => {
      finished = true;
      // A receipt is not delivered until the HTTP response is fully written.
      // On DB failure leave it pending, to be refunded on expiry or restart.
      if (isQaJob(job.serviceId)) {
        // QA previews have no ledger charge or receipt to acknowledge.
        store.endOperation(job);
      } else {
        void markJobDelivered(pool!, userId, job.id)
          .catch((error: unknown) => req.log.error({ err: error }, 'delivery_record_failed'))
          .finally(() => store.endOperation(job));
      }
    });
    reply.raw.once('close', () => {
      if (!finished) store.endOperation(job);
    });
    stream.once('error', () => store.endOperation(job));
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="' + req.params.versionId + '.pdf"');
    return reply.send(stream);
  });

  app.delete<{Params:{id:string}}>('/api/jobs/:id', async (req, reply) => {
    const userId = await actor(req);
    const job = store.get(req.params.id, userId);
    if (!job) return reply.status(404).send({ error: 'not_found' });
    try {
      await store.remove(job);
    } catch {
      return reply.status(409).send({ error: 'job_busy' });
    }
    try {
      const creditRefunded = isQaJob(job.serviceId)
        ? false : await refundUndeliveredJobCredit(pool!, job.id);
      return { removed: true, creditRefunded, refundPending: false };
    } catch (error) {
      req.log.error({ err: error }, 'job_refund_pending');
      // File deletion succeeded. Never pretend the documents remain on disk.
      // A failed refund is retried by the periodic reconciler or on restart.
      return { removed: true, creditRefunded: false, refundPending: true };
    }
  });
}
