import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { connectDatabase } from './db.js';
import { hashPassword } from './crypto.js';
import { JobStore } from '../jobs/job-store.js';
import { applyCreditMovement, creditBalance } from './credits.js';
import { chargeJobCredit, markJobDelivered, refundExpiredJobCredits,
  refundJobsAfterRestart, refundUndeliveredJobCredit } from './job-credit.js';

const url = process.env.DATABASE_TEST_URL;
const describePg = url ? describe : describe.skip;

describePg('crédito por processo e reembolso depois de falha abrupta', () => {
  it('cobra atomicamente, não duplica cobranças e devolve pacote não entregue', async () => {
    const pool = await connectDatabase(url!);
    const id = randomUUID();
    try {
      await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
        [id,'receipt-'+id+'@example.invalid',await hashPassword('test-only-password-123')]);
      await applyCreditMovement(pool, id, 'test_grant', 3, 'receipt_test_grant_1');
      const job = randomUUID();
      const first = await chargeJobCredit(pool, id, job, Date.now());
      expect(first).toEqual({charged:true,balance:2});
      const second = await chargeJobCredit(pool, id, job, Date.now());
      expect(second.charged).toBe(false);
      expect(await creditBalance(pool,id)).toBe(2);
      expect(await refundUndeliveredJobCredit(pool,job)).toBe(true);
      expect(await refundUndeliveredJobCredit(pool,job)).toBe(false);
      expect(await creditBalance(pool,id)).toBe(3);
      await expect(chargeJobCredit(pool,id,job,Date.now())).rejects.toThrow('estornado');

      const deliveredJob = randomUUID();
      await chargeJobCredit(pool,id,deliveredJob,Date.now());
      expect(await markJobDelivered(pool,id,deliveredJob)).toBe(true);
      expect(await markJobDelivered(pool,id,deliveredJob)).toBe(false);
      expect(await refundUndeliveredJobCredit(pool,deliveredJob)).toBe(false);
      expect(await creditBalance(pool,id)).toBe(2);

      const crashedJob = randomUUID();
      await chargeJobCredit(pool,id,crashedJob,Date.now());
      expect(await creditBalance(pool,id)).toBe(1);
      expect(await refundJobsAfterRestart(pool,id)).toBe(1);
      expect(await creditBalance(pool,id)).toBe(2);
      expect(await refundJobsAfterRestart(pool,id)).toBe(0);
      expect(await refundExpiredJobCredits(pool)).toBe(0);
    } finally {
      await pool.query('DELETE FROM app_users WHERE id=$1', [id]);
      await pool.end();
    }
  }, 30000);

  it('estorna no TTL deslizante do job e preserva crédito de pacote entregue', async () => {
    const pool = await connectDatabase(url!);
    const root = await mkdtemp(join(tmpdir(), 'pa-refund-ttl-'));
    const user = randomUUID();
    const store = new JobStore(root, async (id) => {
      await refundUndeliveredJobCredit(pool, id);
    });
    try {
      await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
        [user, 'ttl-refund-' + user + '@example.invalid', await hashPassword('test-only-password-123')]);
      await applyCreditMovement(pool, user, 'test_grant', 2, 'ttl_grant');

      const abandoned = await store.create(user, 'fixture-service');
      await chargeJobCredit(pool, user, abandoned.id, abandoned.createdAt);
      expect(await creditBalance(pool, user)).toBe(1);
      abandoned.expiresAt = Date.now() - 1;
      await store.cleanup();
      expect(store.get(abandoned.id, user)).toBeNull();
      expect(await creditBalance(pool, user)).toBe(2);
      expect(await refundUndeliveredJobCredit(pool, abandoned.id)).toBe(false);

      const delivered = await store.create(user, 'fixture-service');
      await chargeJobCredit(pool, user, delivered.id, delivered.createdAt);
      expect(await markJobDelivered(pool, user, delivered.id)).toBe(true);
      delivered.expiresAt = Date.now() - 1;
      await store.cleanup();
      expect(await creditBalance(pool, user)).toBe(1);
      expect(await refundUndeliveredJobCredit(pool, delivered.id)).toBe(false);
    } finally {
      await store.close();
      await rm(root, { recursive: true, force: true });
      await pool.query('DELETE FROM app_users WHERE id=$1', [user]);
      await pool.end();
    }
  }, 30000);

  it('garante cobrança única sob requisições concorrentes', async () => {
    const pool = await connectDatabase(url!);
    const id = randomUUID();
    try {
      await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
        [id,'receipt-concurrent-'+id+'@example.invalid',await hashPassword('test-only-password-123')]);
      await applyCreditMovement(pool, id, 'test_grant', 3, 'concurrent_grant');
      const job = randomUUID();
      const results = await Promise.all([
        chargeJobCredit(pool,id,job,Date.now()),
        chargeJobCredit(pool,id,job,Date.now()),
        chargeJobCredit(pool,id,job,Date.now()),
      ]);
      expect(results.filter((result) => result.charged)).toHaveLength(1);
      expect(await creditBalance(pool,id)).toBe(2);
      expect(await refundUndeliveredJobCredit(pool,job)).toBe(true);
    } finally {
      await pool.query('DELETE FROM app_users WHERE id=$1', [id]);
      await pool.end();
    }
  }, 30000);

  it('impede confirmação de entrega por outra conta e estorna apenas o recibo vencido', async () => {
    const pool = await connectDatabase(url!);
    const owner = randomUUID();
    const stranger = randomUUID();
    const expiredJob = randomUUID();
    const deliveredJob = randomUUID();
    try {
      for (const id of [owner, stranger]) {
        await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
          [id, 'receipt-owner-' + id + '@example.invalid', await hashPassword('test-only-password-123')]);
      }
      await applyCreditMovement(pool, owner, 'test_grant', 3, 'expiry_grant');
      await chargeJobCredit(pool, owner, expiredJob, Date.now());
      await chargeJobCredit(pool, owner, deliveredJob, Date.now());

      expect(await markJobDelivered(pool, stranger, deliveredJob)).toBe(false);
      expect(await markJobDelivered(pool, owner, deliveredJob)).toBe(true);
      expect(await creditBalance(pool, owner)).toBe(1);

      // Simulate a receipt reaching its stored deadline; no clock sleeping needed.
      await pool.query(
        'UPDATE job_credit_receipts SET expires_at=now()-interval \'1 second\' WHERE job_id=$1',
        [expiredJob],
      );
      expect(await refundExpiredJobCredits(pool)).toBe(1);
      expect(await refundExpiredJobCredits(pool)).toBe(0);
      expect(await creditBalance(pool, owner)).toBe(2);
      expect(await refundUndeliveredJobCredit(pool, deliveredJob)).toBe(false);
    } finally {
      await pool.query('DELETE FROM app_users WHERE id = ANY($1::uuid[])', [[owner, stranger]]);
      await pool.end();
    }
  }, 30000);

});
