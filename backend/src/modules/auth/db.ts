import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import type { Pool, PoolClient } from 'pg';

export type Database = Pool;
export type DbTransaction = PoolClient;

export async function connectDatabase(databaseUrl: string): Promise<Database> {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'preenchimento-api',
  });
  try {
    for (const filename of ['001_initial.sql', '002_job_credit_receipts.sql']) {
      const sql = await readFile(resolve(process.cwd(), 'migrations', filename), 'utf8');
      await pool.query(sql);
    }
    await pool.query('SELECT 1');
    return pool;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
