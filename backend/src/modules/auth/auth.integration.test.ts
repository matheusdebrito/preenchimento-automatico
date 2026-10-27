import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { connectDatabase } from './db.js';
import type { Database } from './db.js';
import { applyCreditMovement, creditBalance } from './credits.js';
import { hashPassword, verifyPassword } from './crypto.js';
import { pruneExpiredSessions } from './auth-service.js';
import type { AppEnv } from '../../config/env.js';

const url = process.env.DATABASE_TEST_URL;
const describePg = url ? describe : describe.skip;
const email = 'test-' + randomUUID() + '@example.invalid';
const password = 'uma-senha-de-teste-12345';

describe('scrypt', () => {
  it('valida senha correta e rejeita a incorreta', async () => {
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('senha-errada', hash)).toBe(false);
  });
});

describePg('PostgreSQL: autenticação e créditos', () => {
  let pool: Database;
  let app: FastifyInstance;
  let userId: string;
  const env: AppEnv = {
    NODE_ENV: 'test', API_HOST: '127.0.0.1', API_PORT: 3000,
    CORS_ORIGINS: ['http://localhost:5173'], LOG_LEVEL: 'silent',
  };

  beforeAll(async () => {
    pool = await connectDatabase(url!);
    app = await buildApp({ env, pool });
  });
  afterAll(async () => {
    await app?.close();
    await pool?.query('DELETE FROM app_users WHERE email=$1', [email]);
    await pool?.end();
  });

  it('registra conta, autentica com cookie HttpOnly e impede login incorreto', async () => {
    const registered = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { email, password },
    });
    expect(registered.statusCode).toBe(201);
    expect(registered.headers['set-cookie']).toContain('HttpOnly');
    userId = registered.json<{user:{id:string}}>().user.id;

    const denied = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email, password: 'senha-errada' },
    });
    expect(denied.statusCode).toBe(401);
    const logged = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email, password },
    });
    expect(logged.statusCode).toBe(200);
    const cookie = String(logged.headers['set-cookie']).split(';')[0]!;
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(me.json<{user:{id:string}}>().user.id).toBe(userId);
    const noCookie = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(noCookie.statusCode).toBe(401);
  });

  it('remove sessões vencidas e mantém sessões ainda válidas', async () => {
    const owner = randomUUID();
    const expiredToken = randomUUID().replaceAll('-', '').repeat(2);
    const activeToken = randomUUID().replaceAll('-', '').repeat(2);
    try {
      await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
        [owner, 'session-cleanup-' + owner + '@example.invalid', await hashPassword(password)]);
      await pool.query(
        "INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()-interval '1 second')",
        [expiredToken, owner],
      );
      await pool.query(
        "INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
        [activeToken, owner],
      );

      expect(await pruneExpiredSessions(pool)).toBeGreaterThanOrEqual(1);
      const result = await pool.query<{token_hash:string}>(
        'SELECT token_hash FROM app_sessions WHERE user_id=$1', [owner],
      );
      expect(result.rows.map((row) => row.token_hash.trim())).toEqual([activeToken]);
      // Repeated cleanup must not remove an active session.
      await pruneExpiredSessions(pool);
      const stillActive = await pool.query(
        'SELECT 1 FROM app_sessions WHERE token_hash=$1', [activeToken],
      );
      expect(stillActive.rowCount).toBe(1);
    } finally {
      await pool.query('DELETE FROM app_users WHERE id=$1', [owner]);
    }
  });

  it('garante saldo atomicamente e idempotência em requisições concorrentes', async () => {
    const grant = await applyCreditMovement(pool, userId, 'test_grant', 3, 'fixture_grant_01');
    expect(grant.balance).toBe(3);
    const repeatedGrant = await applyCreditMovement(pool, userId, 'test_grant', 3, 'fixture_grant_01');
    expect(repeatedGrant.applied).toBe(false);
    const debits = await Promise.all(Array.from({ length: 3 }, (_, i) =>
      applyCreditMovement(pool, userId, 'consume', -1, 'fixture_job_' + i)));
    expect(debits.every((debit) => debit.applied)).toBe(true);
    expect(await creditBalance(pool, userId)).toBe(0);
    const repeated = await applyCreditMovement(pool, userId, 'consume', -1, 'fixture_job_0');
    expect(repeated.applied).toBe(false);
    await expect(applyCreditMovement(pool, userId, 'consume', -1, 'fixture_job_4')).rejects.toThrow('Saldo');
    expect(await creditBalance(pool, userId)).toBe(0);
  });

  it('estorna um movimento de forma idempotente e rejeita reutilizar a chave para outro motivo', async () => {
    const before = await creditBalance(pool, userId);
    const refunded = await applyCreditMovement(pool, userId, 'refund', 1, 'fixture_refund_01');
    expect(refunded.applied).toBe(true);
    expect(refunded.balance).toBe(before + 1);
    const duplicate = await applyCreditMovement(pool, userId, 'refund', 1, 'fixture_refund_01');
    expect(duplicate.applied).toBe(false);
    expect(await creditBalance(pool, userId)).toBe(before + 1);
    await expect(applyCreditMovement(pool, userId, 'consume', -1, 'fixture_refund_01'))
      .rejects.toThrow('idempotente');
    expect(await creditBalance(pool, userId)).toBe(before + 1);
  });

});
