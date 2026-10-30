import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Database } from '../modules/auth/db.js';
import { getCurrentUser } from '../modules/auth/auth-service.js';
import {
  adminDashboard,
  changeUserRole,
  changeUserStatus,
  getAdminUser,
  grantAdminCredits,
  listAdminAudit,
  listAdminUsers,
} from '../modules/admin/admin-service.js';

const uuidSchema = z.uuid();

async function requireAdmin(pool: Database | undefined, request: FastifyRequest) {
  if (!pool) throw Object.assign(new Error('database_unavailable'), { statusCode: 503 });
  const user = await getCurrentUser(pool, request);
  if (!user) throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  if (user.role !== 'ADMIN') throw Object.assign(new Error('forbidden'), { statusCode: 403 });
  return user;
}

function adminError(reply: Parameters<FastifyInstance['get']>[1] extends never ? never : any, error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'user_not_found') {
    return reply.status(404).send({ error: 'user_not_found', message: 'Usuário não encontrado.' });
  }
  if (message === 'admin_self_protection') {
    return reply.status(409).send({
      error: 'admin_self_protection',
      message: 'Não é permitido alterar o próprio status ou perfil administrativo.',
    });
  }
  if (message === 'last_admin') {
    return reply.status(409).send({
      error: 'last_admin',
      message: 'Não é permitido remover o último administrador.',
    });
  }
  if (message === 'invalid_credit_grant') {
    return reply.status(400).send({ error: 'invalid_credit_grant', message: 'Quantidade de créditos inválida.' });
  }
  if (message === 'idempotency_conflict') {
    return reply.status(409).send({ error: 'idempotency_conflict', message: 'Operação já utilizada com outros dados.' });
  }
  throw error;
}

export function registerAdminRoutes(app: FastifyInstance, pool?: Database): void {
  app.get('/api/admin/dashboard', async (request) => {
    await requireAdmin(pool, request);
    return adminDashboard(pool!);
  });

  app.get('/api/admin/users', async (request, reply) => {
    await requireAdmin(pool, request);
    const parsed = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(25),
      q: z.string().trim().max(100).optional(),
      status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING']).optional(),
      role: z.enum(['USER', 'ADMIN']).optional(),
    }).safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_filters' });
    return listAdminUsers(pool!, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      ...(parsed.data.q ? { query: parsed.data.q } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
    });
  });

  app.get('/api/admin/users/:userId', async (request, reply) => {
    await requireAdmin(pool, request);
    const parsed = z.object({ userId: uuidSchema }).safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_user_id' });
    const detail = await getAdminUser(pool!, parsed.data.userId);
    if (!detail) return reply.status(404).send({ error: 'user_not_found' });
    return detail;
  });

  app.patch('/api/admin/users/:userId/status', async (request, reply) => {
    const admin = await requireAdmin(pool, request);
    const params = z.object({ userId: uuidSchema }).safeParse(request.params);
    const body = z.object({ status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING']) }).safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'invalid_request' });
    try {
      await changeUserStatus(pool!, admin.id, params.data.userId, body.data.status);
      return { ok: true };
    } catch (error) {
      return adminError(reply, error);
    }
  });

  app.patch('/api/admin/users/:userId/role', async (request, reply) => {
    const admin = await requireAdmin(pool, request);
    const params = z.object({ userId: uuidSchema }).safeParse(request.params);
    const body = z.object({ role: z.enum(['USER', 'ADMIN']) }).safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'invalid_request' });
    try {
      await changeUserRole(pool!, admin.id, params.data.userId, body.data.role);
      return { ok: true };
    } catch (error) {
      return adminError(reply, error);
    }
  });

  app.post('/api/admin/users/:userId/credits', async (request, reply) => {
    const admin = await requireAdmin(pool, request);
    const params = z.object({ userId: uuidSchema }).safeParse(request.params);
    const body = z.object({ amount: z.number().int().min(1).max(1000) }).safeParse(request.body);
    const key = request.headers['idempotency-key'];
    if (!params.success || !body.success || typeof key !== 'string') {
      return reply.status(400).send({ error: 'invalid_request' });
    }
    try {
      return await grantAdminCredits(pool!, admin.id, params.data.userId, body.data.amount, key);
    } catch (error) {
      return adminError(reply, error);
    }
  });

  app.get('/api/admin/audit', async (request, reply) => {
    await requireAdmin(pool, request);
    const parsed = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
    }).safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_filters' });
    return { entries: await listAdminAudit(pool!, parsed.data.limit) };
  });
}
