import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../modules/auth/db.js';
import { getCurrentUser } from '../modules/auth/auth-service.js';
import { classifyDocument } from '../modules/jobs/document-validator.js';
import { paddleTextForSource, runPaddleOcrBuffer } from '../modules/jobs/paddle-ocr.js';
import { suggestFields } from '../modules/jobs/ocr.js';

const SOURCES = new Set([
  'buyer-identity', 'seller-identity', 'tie', 'residence-proof', 'sale-document',
]);

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
    try {
      const result = await runPaddleOcrBuffer(req.body, kind);
      const text = paddleTextForSource(result, req.params.source);
      const fields = Object.fromEntries(Object.entries(suggestFields(text, req.params.source))
        .map(([id, candidate]) => [id, candidate.value]));
      return {
        engine: result.engine,
        version: result.version,
        model: result.model,
        elapsedMs: result.elapsedMs,
        fields,
        pages: result.pages,
      };
    } catch (error) {
      req.log.error({ err: error }, 'paddle_ocr_inspection_failed');
      return reply.status(503).send({ error: 'ocr_failed' });
    }
  });
}
