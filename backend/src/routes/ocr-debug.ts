import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../modules/auth/db.js';
import { getCurrentUser } from '../modules/auth/auth-service.js';
import { classifyDocument, validatePdfPages } from '../modules/jobs/document-validator.js';
import { paddleTextForSource, runPaddleOcrBuffer } from '../modules/jobs/paddle-ocr.js';
import { suggestFields } from '../modules/jobs/ocr.js';
import { paddleToObservation } from '../modules/document-understanding/paddle-observation.js';
import { assessDocumentFields, extractDocumentEvidence } from '../modules/document-understanding/registry.js';
import type { DocumentSubjectRole, DocumentTypeId } from '../modules/document-understanding/contracts.js';

const SOURCES = new Set([
  'buyer-identity', 'seller-identity', 'tie', 'residence-proof', 'sale-document',
]);

function extractionProfile(source: string): {
  documentType: DocumentTypeId;
  subjectRole: DocumentSubjectRole;
} | null {
  if (source === 'buyer-identity') return { documentType: 'identity', subjectRole: 'person' };
  if (source === 'seller-identity') return { documentType: 'identity', subjectRole: 'seller' };
  if (source === 'tie') return { documentType: 'tie', subjectRole: 'vessel' };
  if (source === 'residence-proof') {
    return { documentType: 'residence-proof', subjectRole: 'person' };
  }
  if (source === 'sale-document') return { documentType: 'sale-document', subjectRole: 'person' };
  return null;
}

export function registerOcrDebugRoutes(app: FastifyInstance, pool?: Database): void {
  async function actor(req: FastifyRequest): Promise<void> {
    if (!pool) throw Object.assign(new Error('Indisponível.'), { statusCode: 503 });
    const user = await getCurrentUser(pool, req);
    if (!user) throw Object.assign(new Error('Não autorizado.'), { statusCode: 401 });
  }

  app.post<{Params:{source:string}}>('/api/ocr/inspect/:source', async (req, reply) => {
    await actor(req);
    if (!SOURCES.has(req.params.source)) {
      return reply.status(400).send({ error: 'invalid_ocr_source' });
    }
    if (!Buffer.isBuffer(req.body)) return reply.status(415).send({ error: 'unsupported_media' });
    let kind;
    try {
      kind = classifyDocument(req.body, req.headers['content-type'] ?? '');
    } catch {
      return reply.status(400).send({ error: 'invalid_document' });
    }
    let validationDir: string | null = null;
    try {
      if (kind === 'pdf') {
        validationDir = await mkdtemp(join(tmpdir(), 'ocr-inspect-'));
        const path = join(validationDir, 'document.pdf');
        await writeFile(path, req.body, { mode: 0o600, flag: 'wx' });
        await validatePdfPages(path);
      }
      const result = await runPaddleOcrBuffer(req.body, kind);
      const text = paddleTextForSource(result, req.params.source);
      const profile = extractionProfile(req.params.source);
      const observation = paddleToObservation(result);
      const extractionContext = profile ? {
        documentId: 'inspection',
        sourceId: req.params.source,
        ...profile,
      } : null;
      const structured = extractionContext
        ? extractDocumentEvidence(observation, extractionContext)
        : [];
      const assessments = extractionContext
        ? assessDocumentFields(observation, extractionContext)
        : [];
      const legacy = profile?.documentType === 'sale-document'
        ? Object.entries(suggestFields(text, req.params.source))
          .map(([fieldId, candidate]) => ({ fieldId, value: candidate.value }))
        : [];
      const fields = Object.fromEntries([
        ...legacy.map((item) => [item.fieldId, item.value] as const),
        ...structured.map((item) => [item.fieldId, item.value] as const),
      ]);
      return {
        engine: result.engine,
        version: result.version,
        model: result.model,
        elapsedMs: result.elapsedMs,
        fields,
        assessments,
        pages: result.pages,
      };
    } catch (error) {
      req.log.error({ err: error }, 'paddle_ocr_inspection_failed');
      return reply.status(503).send({ error: 'ocr_failed' });
    } finally {
      if (validationDir) await rm(validationDir, { recursive: true, force: true });
    }
  });
}
