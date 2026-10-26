import { randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Database } from './db.js';
import { hashPassword, verifyPassword, sessionToken, tokenDigest } from './crypto.js';

export const credentialsSchema = z.object({
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});

interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
}

function extractToken(request: FastifyRequest): string | null {
  const entry = request.headers.cookie?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('pa_session='));
  const token = entry?.slice('pa_session='.length);
  return token && /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : null;
}

export async function getCurrentUser(
  pool: Database, request: FastifyRequest,
): Promise<{ id: string; email: string } | null> {
  const token = extractToken(request);
  if (!token) return null;
  const result = await pool.query<{ id: string; email: string }>(
    `SELECT u.id, u.email FROM app_users u
      JOIN app_sessions s ON s.user_id=u.id
      WHERE s.token_hash=$1 AND s.expires_at>now()`,
    [tokenDigest(token)],
  );
  return result.rows[0] ?? null;
}

export async function registerUser(pool: Database, body: unknown): Promise<{ id: string; email: string }> {
  const creds = credentialsSchema.parse(body);
  const hash = await hashPassword(creds.password);
  const id = randomUUID();
  try {
    await pool.query('INSERT INTO app_users(id,email,password_hash) VALUES($1,$2,$3)',
      [id, creds.email, hash]);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error as {code?:unknown}).code === '23505') {
      throw new Error('E-mail já cadastrado.');
    }
    throw error;
  }
  return { id, email: creds.email };
}

export async function authenticate(pool: Database, body: unknown): Promise<{ id: string; email: string } | null> {
  const parse = credentialsSchema.safeParse(body);
  if (!parse.success) return null;
  const record = await pool.query<UserRecord>(
    'SELECT id,email,password_hash FROM app_users WHERE email=$1', [parse.data.email]);
  const user = record.rows[0];
  if (!user || !(await verifyPassword(parse.data.password, user.password_hash))) return null;
  return { id: user.id, email: user.email };
}

export async function issueSession(
  pool: Database, reply: FastifyReply,
  userId: string, secure: boolean,
): Promise<void> {
  const token = sessionToken();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await pool.query('INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',
    [tokenDigest(token), userId, expiresAt]);
  const cookie = 'pa_session=' + token + '; Path=/api; HttpOnly; SameSite=Strict; Max-Age=43200' +
    (secure ? '; Secure' : '');
  reply.header('Set-Cookie', cookie);
}

export async function removeSession(pool: Database, request: FastifyRequest, reply: FastifyReply, secure: boolean): Promise<void> {
  const token = extractToken(request);
  if (token) await pool.query('DELETE FROM app_sessions WHERE token_hash=$1', [tokenDigest(token)]);
  reply.header('Set-Cookie',
    'pa_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0' + (secure ? '; Secure' : ''));
}
