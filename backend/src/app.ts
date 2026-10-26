import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { loadEnv } from './config/env.js';
import type { AppEnv } from './config/env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerCatalogRoutes } from './routes/catalog.js';

interface BuildAppOptions {
  env?: AppEnv;
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
  registerCatalogRoutes(app);

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
