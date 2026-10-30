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
    // CREATE TABLE IF NOT EXISTS does not prevent two independent startups from
    // racing in PostgreSQL's system catalog. Serialize schema initialization
    // across processes with a transaction-scoped advisory lock. A crash
    // automatically releases it, unlike a session-scoped lock.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(145902, 1)');
      for (const filename of ['001_initial.sql', '002_job_credit_receipts.sql', '003_user_profile_fields.sql', '004_admin_dashboard.sql', '005_admin_cli_audit.sql', '006_openai_usage.sql', '007_analysis_credit_consumption.sql']) {
        const sql = await readFile(resolve(process.cwd(), 'migrations', filename), 'utf8');
        await client.query(sql);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    await pool.query('SELECT 1');
    return pool;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
