import { describe, expect, it } from 'vitest';
import { connectDatabase } from './db.js';
import type { Database } from './db.js';

const url = process.env.DATABASE_TEST_URL;
const describePg = url ? describe : describe.skip;

describePg('migrations PostgreSQL com inícios concorrentes', () => {
  it('serializa conexões simultâneas e mantém tabelas acessíveis', async () => {
    const pools: Database[] = [];
    try {
      const initial = await Promise.all(
        Array.from({ length: 6 }, async () => connectDatabase(url!)),
      );
      pools.push(...initial);
      for (const pool of pools) {
        const result = await pool.query(
          "SELECT to_regclass('public.app_users')::text AS users, " +
          "to_regclass('public.job_credit_receipts')::text AS receipts",
        );
        expect(result.rows[0]).toMatchObject({
          users: 'app_users', receipts: 'job_credit_receipts',
        });
      }
    } finally {
      await Promise.all(pools.map((pool) => pool.end()));
    }
  }, 30000);
});
