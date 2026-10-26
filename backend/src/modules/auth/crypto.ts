import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_BYTES = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, KEY_BYTES) as Buffer;
  return 'scrypt$' + salt + '$' + hash.toString('hex');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [method, salt, digest] = stored.split('$');
  if (method !== 'scrypt' || !salt || !digest || !/^[0-9a-f]{32}$/.test(salt) ||
    !/^[0-9a-f]{128}$/.test(digest)) return false;
  const candidate = await scrypt(password, salt, KEY_BYTES) as Buffer;
  const expected = Buffer.from(digest, 'hex');
  return timingSafeEqual(candidate, expected);
}

export function sessionToken(): string {
  return randomBytes(32).toString('base64url');
}
export function tokenDigest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
