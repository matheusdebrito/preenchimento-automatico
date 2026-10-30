import { randomUUID } from 'node:crypto';
import type { Database } from './db.js';

interface JobReceipt {
  user_id: string;
  state: 'charged' | 'delivered' | 'refunded' | 'consumed';
}

const ONE_HOUR = 60 * 60_000;

/**
 * Consume one credit at most once when the job dispatches document analysis
 * to OpenAI. Once the external request is attempted, this cost is final and
 * must not be refunded merely because the user skips PDF generation/download.
 *
 * The ledger debit and receipt are inserted atomically under the user row lock.
 * Nothing from uploaded documents or extracted field values is persisted here.
 */
export async function chargeJobCredit(
  pool: Database, userId: string, jobId: string, createdAt: number,
): Promise<{ charged: boolean; balance: number }> {
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !Number.isSafeInteger(createdAt) ||
      createdAt + ONE_HOUR <= Date.now()) {
    throw new Error('Processo inválido ou expirado para cobrança.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE', [userId]);
    if (user.rowCount !== 1) throw new Error('Usuário inexistente.');

    const receipt = await client.query<JobReceipt>(
      'SELECT user_id,state FROM job_credit_receipts WHERE job_id=$1 FOR UPDATE',
      [jobId],
    );
    const previous = receipt.rows[0];
    if (previous) {
      if (previous.user_id !== userId) throw new Error('Processo pertence a outra conta.');
      if (previous.state === 'refunded') throw new Error('Processo já estornado.');
      const result = await client.query<{balance:string}>(
        'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1', [userId],
      );
      await client.query('COMMIT');
      return { charged: false, balance: Number(result.rows[0]?.balance ?? '0') };
    }

    const balance = await client.query<{balance:string}>(
      'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1', [userId],
    );
    const current = Number(balance.rows[0]?.balance ?? '0');
    if (current < 1) throw new Error('Saldo insuficiente.');

    await client.query(
      'INSERT INTO credit_ledger(id,user_id,amount,reason,idempotency_key) VALUES($1,$2,-1,$3,$4)',
      [randomUUID(), userId, 'consume', 'job_' + jobId],
    );
    await client.query(
      "INSERT INTO job_credit_receipts(job_id,user_id,state,expires_at) VALUES($1,$2,'consumed',$3)",
      [jobId, userId, new Date(createdAt + ONE_HOUR)],
    );
    await client.query('COMMIT');
    return { charged: true, balance: current - 1 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** Mark delivered only after the HTTP response has finished writing. */
export async function markJobDelivered(
  pool: Database, userId: string, jobId: string,
): Promise<boolean> {
  const updated = await pool.query(
    `UPDATE job_credit_receipts SET state='delivered', delivered_at=now()
     WHERE job_id=$1 AND user_id=$2 AND state='charged'`,
    [jobId, userId],
  );
  return updated.rowCount === 1;
}

/** Idempotent refund, with the receipt and positive ledger movement committed atomically. */
export async function refundUndeliveredJobCredit(pool: Database, jobId: string): Promise<boolean> {
  const lookup = await pool.query<{user_id:string}>(
    'SELECT user_id FROM job_credit_receipts WHERE job_id=$1', [jobId],
  );
  const userId = lookup.rows[0]?.user_id;
  if (!userId) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const owner = await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE', [userId]);
    if (owner.rowCount !== 1) {
      await client.query('COMMIT');
      return false;
    }
    const receipt = await client.query<JobReceipt>(
      'SELECT user_id,state FROM job_credit_receipts WHERE job_id=$1 FOR UPDATE', [jobId],
    );
    if (!receipt.rows[0] || receipt.rows[0].state !== 'charged') {
      await client.query('COMMIT');
      return false;
    }
    await client.query(
      'INSERT INTO credit_ledger(id,user_id,amount,reason,idempotency_key) VALUES($1,$2,1,$3,$4)',
      [randomUUID(), userId, 'refund', 'refund_job_' + jobId],
    );
    await client.query(
      `UPDATE job_credit_receipts SET state='refunded', refunded_at=now()
       WHERE job_id=$1 AND state='charged'`, [jobId],
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * SINGLE-INSTANCE ONLY: after restart all in-memory jobs and their ephemeral PDFs
 * are gone. Refund every pending job before accepting new requests.
 * Multi-instance deployment needs a shared job state/worker before this can run.
 */
export async function refundJobsAfterRestart(pool: Database, ownerId?: string): Promise<number> {
  let total = 0;
  for (;;) {
    const pending = await pool.query<{job_id:string}>(
      ownerId
        ? `SELECT job_id FROM job_credit_receipts WHERE state='charged' AND user_id=$1 LIMIT 100`
        : `SELECT job_id FROM job_credit_receipts WHERE state='charged' LIMIT 100`,
      ownerId ? [ownerId] : [],
    );
    if (pending.rows.length === 0) return total;
    for (const {job_id} of pending.rows) {
      if (await refundUndeliveredJobCredit(pool, job_id)) total++;
    }
  }
}

/** Sweep jobs whose absolute temporary lifetime has elapsed. */
export async function refundExpiredJobCredits(pool: Database): Promise<number> {
  const pending = await pool.query<{job_id:string}>(
    `SELECT job_id FROM job_credit_receipts WHERE state='charged' AND expires_at <= now() LIMIT 100`,
  );
  let refunded = 0;
  for (const {job_id} of pending.rows) {
    if (await refundUndeliveredJobCredit(pool, job_id)) refunded++;
  }
  return refunded;
}
