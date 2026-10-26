import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AppEnv } from '../config/env.js';
import type { Database } from '../modules/auth/db.js';
import { authenticate, getCurrentUser, issueSession, registerUser, removeSession } from '../modules/auth/auth-service.js';
import { creditBalance, creditHistory, applyCreditMovement } from '../modules/auth/credits.js';

export function registerAuthRoutes(app: FastifyInstance, env: AppEnv, pool?: Database): void {
  async function requireUser(request: FastifyRequest): Promise<{ id: string; email: string }> {
    if (!pool) throw Object.assign(new Error('Banco indisponível.'), { statusCode: 503 });
    const user = await getCurrentUser(pool, request);
    if (!user) throw Object.assign(new Error('Sessão ausente.'), { statusCode: 401 });
    return user;
  }

  // Block browser cross-site mutations even when cookies are included.
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/') ||
      !['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return;
    const origin = request.headers.origin;
    const sameOrigin = request.headers['sec-fetch-site'] === 'same-origin';
    if ((origin && !env.CORS_ORIGINS.includes(origin)) || (!origin && !sameOrigin && env.NODE_ENV !== 'test')) {
      return reply.status(403).send({ error: 'forbidden', message: 'Origem não permitida.' });
    }
  });

  app.post('/api/auth/register', async (request, reply) => {
    if (!pool) return reply.status(503).send({ error: 'unavailable' });
    try {
      const user = await registerUser(pool, request.body);
      await issueSession(pool, reply, user.id, env.NODE_ENV === 'production');
      return reply.status(201).send({ user });
    } catch (error) {
      if (error instanceof Error && error.message === 'E-mail já cadastrado.') {
        return reply.status(409).send({ error: 'conflict', message: 'Não foi possível criar a conta.' });
      }
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({ error: 'invalid', message: 'E-mail ou senha inválidos.' });
      }
      throw error;
    }
  });

  app.post('/api/auth/login', async (request, reply) => {
    if (!pool) return reply.status(503).send({ error: 'unavailable' });
    const user = await authenticate(pool, request.body);
    if (!user) return reply.status(401).send({ error: 'unauthorized', message: 'Credenciais inválidas.' });
    await issueSession(pool, reply, user.id, env.NODE_ENV === 'production');
    return { user };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    if (!pool) return reply.status(503).send({ error: 'unavailable' });
    await removeSession(pool, request, reply, env.NODE_ENV === 'production');
    return { ok: true };
  });

  app.get('/api/auth/me', async (request) => {
    return { user: await requireUser(request) };
  });
  app.get('/api/credits/balance', async (request) => {
    const user = await requireUser(request);
    return { balance: await creditBalance(pool!, user.id) };
  });
  app.get('/api/credits/history', async (request) => {
    const user = await requireUser(request);
    return { movements: await creditHistory(pool!, user.id) };
  });

  // Explicit development-only hook; no user may grant themself credits in production.
  app.post('/api/dev/credits/grant', async (request, reply) => {
    if (env.NODE_ENV !== 'development' || !env.DEV_GRANT_SECRET ||
      request.headers['x-dev-grant-secret'] !== env.DEV_GRANT_SECRET) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const user = await requireUser(request);
    const result = await applyCreditMovement(
      pool!, user.id, 'test_grant', 3, 'development_test_grant_v1');
    return { balance: result.balance, applied: result.applied };
  });
}
