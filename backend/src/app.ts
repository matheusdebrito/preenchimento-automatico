import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { loadEnv } from './config/env.js';
import type { AppEnv } from './config/env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerJobRoutes } from './routes/jobs.js';
import type { Database } from './modules/auth/db.js';
import type { CatalogDefinition } from './modules/catalog/contracts.js';

interface BuildAppOptions {
  env?: AppEnv;
  pool?: Database;
  /** Test-only override. Production always uses the verified default catalog. */
  catalogOverride?: CatalogDefinition;
  /** Local/test-only synthetic QA. Never allow in production. */
  qaPreview?: boolean;
}

const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.remoteAddress',
  'req.remotePort',
  'req.host',
  'res.headers["set-cookie"]',
];

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const isTest = env.NODE_ENV === 'test';
  if (env.NODE_ENV === 'production' && (options.catalogOverride || options.qaPreview)) {
    throw new Error('Catálogo de QA não permitido em produção.');
  }
  if (options.qaPreview && !options.catalogOverride) {
    throw new Error('Prévia QA exige catálogo sintético explícito.');
  }

  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: env.LOG_LEVEL,
          redact: {
            paths: REDACTED_LOG_PATHS,
            censor: '[redacted]',
          },
        },
    bodyLimit: 1024 * 1024,
  });

  await app.register(cors, {
    origin: [...env.CORS_ORIGINS],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });

  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Cache-Control', 'no-store');
    return payload;
  });

  registerHealthRoutes(app);
  registerCatalogRoutes(app, options.catalogOverride);
  registerAuthRoutes(app, env, options.pool);
  // Vitest executes API suites in parallel. Give each test app a unique
  // private root so orphan cleanup cannot erase another suite's live job.
  const testRoot = isTest ? resolve(tmpdir(), 'pa-test-app-' + randomUUID()) : undefined;
  registerJobRoutes(app, options.pool, options.catalogOverride, options.qaPreview === true, testRoot);

  app.setNotFoundHandler(async (_request, reply) =>
    reply.status(404).send({
      error: 'not_found',
      message: 'Recurso não encontrado.',
    }),
  );

  app.setErrorHandler(async (error, request, reply) => {
    const statusCandidate =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode?: unknown }).statusCode
        : undefined;
    const statusCode =
      typeof statusCandidate === 'number' && statusCandidate >= 400 && statusCandidate < 500
        ? statusCandidate
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'request_failed');
    }

    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'internal_error' : 'request_error',
      message:
        statusCode >= 500
          ? 'Não foi possível concluir a solicitação.'
          : 'Requisição inválida.',
    });
  });

  return app;
}
