import { createReadStream } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { catalog } from '../modules/catalog/catalog.js';
import { publicService } from '../modules/catalog/public-catalog.js';
import type { CatalogDefinition } from '../modules/catalog/contracts.js';
import type { Database } from '../modules/auth/db.js';
import { getCurrentUser } from '../modules/auth/auth-service.js';
import { applyCreditMovement } from '../modules/auth/credits.js';
import { JobStore } from '../modules/jobs/job-store.js';
import { extractText, suggestFields } from '../modules/jobs/ocr.js';
import { fillApprovedTemplate } from '../modules/pdf/verified-template.js';

const createSchema = z.object({ serviceId: z.string().max(100),
  answers: z.record(z.string().max(100), z.string().max(100)).default({}),
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
): void {
  const store = new JobStore(process.env.TEMP_DOCUMENT_ROOT);
  app.addHook('onClose', async () => { await store.close(); });

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
      documentCount: job.files.length,
      fields: job.stage === 'REVIEW' || job.stage === 'GENERATED' ? job.values : {},
      sources: job.sourceNotes,
      downloads: job.stage === 'GENERATED' ? [...job.outputs.keys()] : [],
    };
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
    if (job.stage !== 'UPLOADED') return reply.status(409).send({ error: 'invalid_state' });
    const service = publicService(definitions, job.serviceId, job.answers);
    if (!service) return reply.status(409).send({ error: 'service_unavailable' });
    const required = service.documentRequirements.filter((doc) => doc.required);
    if (required.some((doc) => !job.files.some((file) => file.requirementId === doc.id))) {
      return reply.status(422).send({ error: 'missing_document' });
    }

    if (!store.beginOperation(job)) return reply.status(409).send({ error: 'job_busy' });
    try {
    job.stage = 'PROCESSING';
    const conflicts = new Set<string>();
    for (const document of job.files) {
      let text: string;
      try {
        text = await extractText(document, store.directory(job));
      } catch {
        job.stage = 'UPLOADED';
        job.values = {};
        job.sourceNotes = {};
        return reply.status(503).send({ error: 'ocr_failed', message: 'Não foi possível ler o documento.' });
      }
      const suggestions = suggestFields(text, document.requirementId);
      for (const [fieldId, data] of Object.entries(suggestions)) {
        const prior = job.values[fieldId];
        if (prior && prior !== data.value) {
          conflicts.add(fieldId);
          delete job.values[fieldId];
          job.sourceNotes[fieldId] = 'Divergência entre documentos: revisar manualmente.';
        } else if (!conflicts.has(fieldId)) {
          job.values[fieldId] = data.value;
          job.sourceNotes[fieldId] = data.source;
        }
      }
    }
    job.stage = 'REVIEW';
    return { status: job.stage, fields: job.values, sources: job.sourceNotes,
      conflicts: [...conflicts], reviewRequired: true };
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
    const allowedFields = new Set(definitions.fields.map((field) => field.id));
    if (Object.keys(parsed.data.values).some((field) => !allowedFields.has(field))) {
      return reply.status(400).send({ error: 'invalid_field' });
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
    if (!store.beginOperation(job)) return reply.status(409).send({ error: 'job_busy' });
    job.stage = 'GENERATING';
    const generated = new Map<string, string>();
    try {
      for (const id of service.formVersionIds) {
        const relation = definitions.serviceForms.find((item) =>
          item.serviceId === job.serviceId && item.formVersionId === id);
        const values = { ...job.values, ...relation?.fixedValues };
        const bytes = await fillApprovedTemplate(definitions, id, values);
        const path = join(store.directory(job), id + '.pdf');
        await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
        generated.set(id, path);
      }
      await applyCreditMovement(pool!, userId, 'consume', -service.creditCost, 'job_' + job.id);
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
    stream.once('close', () => store.endOperation(job));
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
      return { removed: true };
    } catch {
      return reply.status(409).send({ error: 'job_busy' });
    }
  });
}
