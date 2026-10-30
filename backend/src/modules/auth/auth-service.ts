import { randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { isValidCpf } from '../catalog/field-validation.js';
import type { Database } from './db.js';
import { hashPassword, verifyPassword, sessionToken, tokenDigest } from './crypto.js';

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';
export type UserRole = 'USER' | 'ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  cellphone: string | null;
  cpfMasked: string | null;
  status: UserStatus;
  role: UserRole;
}

const emailSchema = z.email().max(254).transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(12).max(128);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeCellphone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  return digits.length === 11 ? '55' + digits : digits;
}

function isValidBrazilianCellphone(value: string): boolean {
  const normalized = normalizeCellphone(value);
  const national = normalized.startsWith('55') ? normalized.slice(2) : normalized;
  return /^\d{2}9\d{8}$/.test(national) && !/^0/.test(national);
}

export const registrationSchema = z.object({
  fullName: z.string().max(120).transform(normalizeWhitespace)
    .refine((value) => value.length >= 2, 'Nome inválido.'),
  cellphone: z.string().max(32).transform(normalizeCellphone)
    .refine(isValidBrazilianCellphone, 'Celular inválido.'),
  cpf: z.string().max(32).transform(normalizeCpf)
    .refine(isValidCpf, 'CPF inválido.'),
  email: emailSchema,
  password: passwordSchema,
});

interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  cellphone: string | null;
  cpf: string | null;
  status: UserStatus;
  role: UserRole;
}

function maskCpf(cpf: string | null): string | null {
  if (!cpf || !/^\d{11}$/.test(cpf)) return null;
  return '***.***.***-' + cpf.slice(-2);
}

function toSessionUser(record: Omit<UserRecord, 'password_hash'>): SessionUser {
  return {
    id: record.id,
    email: record.email,
    fullName: record.full_name,
    cellphone: record.cellphone,
    cpfMasked: maskCpf(record.cpf),
    status: record.status,
    role: record.role,
  };
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
): Promise<SessionUser | null> {
  const token = extractToken(request);
  if (!token) return null;
  const result = await pool.query<Omit<UserRecord, 'password_hash'>>(
    `SELECT u.id, u.email, u.full_name, u.cellphone, u.cpf, u.status, u.role
      FROM app_users u
      JOIN app_sessions s ON s.user_id=u.id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status='ACTIVE'`,
    [tokenDigest(token)],
  );
  const user = result.rows[0];
  return user ? toSessionUser(user) : null;
}

export async function registerUser(pool: Database, body: unknown): Promise<SessionUser> {
  const input = registrationSchema.parse(body);
  const hash = await hashPassword(input.password);
  const id = randomUUID();
  try {
    const result = await pool.query<Omit<UserRecord, 'password_hash'>>(
      `INSERT INTO app_users(id,email,password_hash,full_name,cellphone,cpf)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id,email,full_name,cellphone,cpf,status,role`,
      [id, input.email, hash, input.fullName, input.cellphone, input.cpf],
    );
    return toSessionUser(result.rows[0]!);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error as {code?:unknown}).code === '23505') {
      throw new Error('Conta já cadastrada.', { cause: error });
    }
    throw error;
  }
}

export async function authenticate(pool: Database, body: unknown): Promise<SessionUser | null> {
  const parse = credentialsSchema.safeParse(body);
  if (!parse.success) return null;
  const result = await pool.query<UserRecord>(
    `SELECT id,email,password_hash,full_name,cellphone,cpf,status,role
     FROM app_users WHERE email=$1`,
    [parse.data.email],
  );
  const user = result.rows[0];
  if (!user || user.status !== 'ACTIVE' ||
    !(await verifyPassword(parse.data.password, user.password_hash))) return null;
  return toSessionUser(user);
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

export async function removeSession(
  pool: Database,
  request: FastifyRequest,
  reply: FastifyReply,
  secure: boolean,
): Promise<void> {
  const token = extractToken(request);
  if (token) await pool.query('DELETE FROM app_sessions WHERE token_hash=$1', [tokenDigest(token)]);
  reply.header('Set-Cookie',
    'pa_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0' + (secure ? '; Secure' : ''));
}

/**
 * Delete only expired opaque session digests. Accounts and credit movements
 * remain untouched. Called on startup and periodically in the single-instance MVP.
 */
export async function pruneExpiredSessions(pool: Database): Promise<number> {
  const removed = await pool.query('DELETE FROM app_sessions WHERE expires_at <= now()');
  return removed.rowCount ?? 0;
}

