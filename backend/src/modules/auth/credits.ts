import { randomUUID } from 'node:crypto';
import type { Database } from './db.js';

export interface CreditMovement {
  id: string;
  reason: 'test_grant' | 'consume' | 'refund' | 'adjust' | 'admin_grant' | 'admin_reversal';
  amount: number;
  created_at: Date;
}

export async function creditBalance(pool: Database, userId: string): Promise<number> {
  const result = await pool.query<{ balance: string }>(
    'SELECT COALESCE(SUM(amount), 0)::text AS balance FROM credit_ledger WHERE user_id = $1',
    [userId],
  );
  return Number(result.rows[0]?.balance ?? '0');
}

export async function creditHistory(pool: Database, userId: string): Promise<readonly CreditMovement[]> {
  const result = await pool.query<CreditMovement>(
    'SELECT id, reason, amount, created_at FROM credit_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
    [userId],
  );
  return result.rows;
}

/**
 * Lock the user row and insert one idempotent ledger movement.
 * Repeated calls return the original outcome, including after retries.
 */
export async function applyCreditMovement(
  pool: Database,
  userId: string,
  reason: CreditMovement['reason'],
  amount: number,
  idempotencyKey: string,
): Promise<{ balance: number; applied: boolean }> {
  const maxAmount = reason === 'admin_grant' || reason === 'admin_reversal' ? 1000 : 100;
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > maxAmount ||
    !/^[A-Za-z0-9:_-]{4,128}$/.test(idempotencyKey)) {
    throw new Error('Movimentação de créditos inválida.');
  }
  if ((reason === 'consume' && amount !== -1) ||
      (reason === 'test_grant' && amount <= 0) ||
      (reason === 'refund' && amount <= 0) ||
      (reason === 'admin_grant' && amount <= 0) ||
      (reason === 'admin_reversal' && amount >= 0)) {
    throw new Error('Movimentação incompatível com o motivo.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE', [userId]);
    if (user.rowCount !== 1) throw new Error('Usuário inexistente.');
    const existing = await client.query<{ amount: number; reason: string }>(
      'SELECT amount, reason FROM credit_ledger WHERE user_id=$1 AND idempotency_key=$2',
      [userId, idempotencyKey],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].amount !== amount || existing.rows[0].reason !== reason) {
        throw new Error('Chave idempotente usada para outra operação.');
      }
      const balance = await client.query<{ balance: string }>(
        'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1',
        [userId],
      );
      await client.query('COMMIT');
      return { balance: Number(balance.rows[0]?.balance ?? '0'), applied: false };
    }
    const result = await client.query<{ balance: string }>(
      'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1',
      [userId],
    );
    const oldBalance = Number(result.rows[0]?.balance ?? '0');
    if (oldBalance + amount < 0) throw new Error('Saldo insuficiente.');
    await client.query(
      'INSERT INTO credit_ledger(id,user_id,amount,reason,idempotency_key) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), userId, amount, reason, idempotencyKey],
    );
    await client.query('COMMIT');
    return { balance: oldBalance + amount, applied: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
