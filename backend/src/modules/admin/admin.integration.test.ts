import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { connectDatabase } from '../auth/db.js';
import type { Database } from '../auth/db.js';
import { hashPassword } from '../auth/crypto.js';
import { ensureBootstrapAdmin } from '../auth/auth-service.js';
import type { AppEnv } from '../../config/env.js';

const url = process.env.DATABASE_TEST_URL;
const describePg = url ? describe : describe.skip;

describePg('PostgreSQL: painel administrativo', () => {
  let pool: Database;
  let app: FastifyInstance;
  let adminId: string;
  let userId: string;
  let adminCookie: string;
  let userCookie: string;

  const suffix = randomUUID();
  const adminEmail = 'admin-' + suffix + '@example.invalid';
  const userEmail = 'user-' + suffix + '@example.invalid';
  const password = 'fixture-admin-password-12345';
  const env: AppEnv = {
    NODE_ENV: 'test',
    API_HOST: '127.0.0.1',
    API_PORT: 3000,
    CORS_ORIGINS: ['http://localhost:5173'],
    LOG_LEVEL: 'silent',
    ADMIN_EMAIL: adminEmail,
  };

  beforeAll(async () => {
    pool = await connectDatabase(url!);
    app = await buildApp({ env, pool });

    const registered = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: adminEmail,
        password,
        fullName: 'Administrador Fixture',
        cellphone: '(21) 99999-1111',
        cpf: '529.982.247-25',
      },
    });
    expect(registered.statusCode).toBe(201);
    adminId = registered.json<{user:{id:string;role:string}}>().user.id;
    expect(registered.json<{user:{role:string}}>().user.role).toBe('USER');
    adminCookie = String(registered.headers['set-cookie']).split(';')[0]!;
    expect(await ensureBootstrapAdmin(pool, adminEmail)).toBe(true);
    const bootstrapped = await app.inject({
      method: 'GET', url: '/api/auth/me', headers: { cookie: adminCookie },
    });
    expect(bootstrapped.json<{user:{role:string}}>().user.role).toBe('ADMIN');

    userId = randomUUID();
    await pool.query(
      `INSERT INTO app_users(id,email,password_hash,full_name,status,role)
       VALUES($1,$2,$3,$4,'ACTIVE','USER')`,
      [userId, userEmail, await hashPassword(password), 'Usuário Fixture'],
    );

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: userEmail, password },
    });
    expect(login.statusCode).toBe(200);
    userCookie = String(login.headers['set-cookie']).split(';')[0]!;
  });

  afterAll(async () => {
    await app?.close();
    if (pool) {
      await pool.query('DELETE FROM admin_audit_log WHERE admin_user_id=$1 OR target_user_id=$1 OR target_user_id=$2',
        [adminId, userId]);
      await pool.query('DELETE FROM credit_ledger WHERE user_id IN ($1,$2)', [adminId, userId]);
      await pool.query('DELETE FROM app_users WHERE id IN ($1,$2)', [adminId, userId]);
      await pool.end();
    }
  });

  it('nega todas as APIs administrativas a usuário comum', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/dashboard',
      headers: { cookie: userCookie },
    });
    expect(response.statusCode).toBe(403);
    expect(response.body).not.toContain(adminEmail);
  });

  it('lista usuários e nunca devolve CPF completo', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users?q=' + encodeURIComponent(userEmail),
      headers: { cookie: adminCookie },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<{users:Array<{id:string;cpfMasked:string|null}>}>();
    expect(body.users.some((user) => user.id === userId)).toBe(true);
    expect(response.body).not.toContain('52998224725');
    expect(response.body).not.toContain('529.982.247-25');
  });

  it('concede créditos uma única vez com a mesma chave idempotente e audita a ação', async () => {
    const key = 'admin-grant-' + randomUUID();
    const first = await app.inject({
      method: 'POST',
      url: '/api/admin/users/' + userId + '/credits',
      headers: { cookie: adminCookie, 'idempotency-key': key },
      payload: { amount: 12 },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ balance: 12, applied: true });

    const repeated = await app.inject({
      method: 'POST',
      url: '/api/admin/users/' + userId + '/credits',
      headers: { cookie: adminCookie, 'idempotency-key': key },
      payload: { amount: 12 },
    });
    expect(repeated.statusCode).toBe(200);
    expect(repeated.json()).toMatchObject({ balance: 12, applied: false });

    const ledger = await pool.query<{count:string}>(
      "SELECT COUNT(*)::text AS count FROM credit_ledger WHERE user_id=$1 AND reason='admin_grant'",
      [userId],
    );
    expect(Number(ledger.rows[0]?.count)).toBe(1);

    const audit = await pool.query<{count:string}>(
      "SELECT COUNT(*)::text AS count FROM admin_audit_log WHERE target_user_id=$1 AND action='CREDIT_GRANT'",
      [userId],
    );
    expect(Number(audit.rows[0]?.count)).toBe(1);
  });

  it('altera role e status, protege o próprio admin e invalida sessão ao bloquear', async () => {
    const promote = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/' + userId + '/role',
      headers: { cookie: adminCookie },
      payload: { role: 'ADMIN' },
    });
    expect(promote.statusCode).toBe(200);

    const selfDemote = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/' + adminId + '/role',
      headers: { cookie: adminCookie },
      payload: { role: 'USER' },
    });
    expect(selfDemote.statusCode).toBe(409);
    expect(selfDemote.json<{error:string}>().error).toBe('admin_self_protection');

    const demote = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/' + userId + '/role',
      headers: { cookie: adminCookie },
      payload: { role: 'USER' },
    });
    expect(demote.statusCode).toBe(200);

    const block = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/' + userId + '/status',
      headers: { cookie: adminCookie },
      payload: { status: 'BLOCKED' },
    });
    expect(block.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: userCookie },
    });
    expect(me.statusCode).toBe(401);
  });

  it('entrega métricas e trilha de auditoria ao administrador', async () => {
    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/admin/dashboard',
      headers: { cookie: adminCookie },
    });
    expect(dashboard.statusCode).toBe(200);
    const metrics = dashboard.json<{
      users:{total:number};
      credits:{grantedMonth:number;totalBalance:number};
      usageByDay:Array<{day:string;used:number}>;
    }>();
    expect(metrics.users.total).toBeGreaterThanOrEqual(2);
    expect(metrics.credits.grantedMonth).toBeGreaterThanOrEqual(12);
    expect(metrics.credits.totalBalance).toBeGreaterThanOrEqual(12);
    expect(metrics.usageByDay).toHaveLength(30);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/admin/audit',
      headers: { cookie: adminCookie },
    });
    expect(audit.statusCode).toBe(200);
    expect(audit.body).toContain('CREDIT_GRANT');
    expect(audit.body).toContain('STATUS_CHANGE');
    expect(audit.body).toContain('ROLE_CHANGE');
  });
});
