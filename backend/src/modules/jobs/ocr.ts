import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { StoredDocument } from './job-store.js';

const execFile = promisify(execFileCallback);
let active = 0;
const MAX_CONCURRENT = 2;

async function run(command: string, args: readonly string[], timeout = 15_000): Promise<string> {
  const { stdout } = await execFile(command, [...args], {
    timeout, maxBuffer: 256 * 1024,
    env: { ...process.env, OMP_THREAD_LIMIT: '1', LC_ALL: 'C' },
  });
  return stdout;
}

async function extract(doc: StoredDocument, tempDir: string): Promise<string> {
  if (doc.kind !== 'pdf') {
    return run('tesseract', [doc.path, 'stdout', '-l', 'por', '--psm', '6'], 25_000);
  }
  const direct = await run('pdftotext', ['-layout', doc.path, '-'], 15_000);
  if (direct.trim().length >= 40) return direct;
  const prefix = join(tempDir, doc.id + '-page');
  await run('pdftoppm', ['-f', '1', '-l', '5', '-r', '160', '-png', doc.path, prefix], 30_000);
  const pages = (await readdir(tempDir)).filter((name) => name.startsWith(doc.id + '-page') && name.endsWith('.png')).sort();
  try {
    if (pages.length === 0) throw new Error('PDF não pôde ser convertido para OCR.');
    const texts: string[] = [];
    for (const page of pages) texts.push(await run('tesseract',
      [join(tempDir, page), 'stdout', '-l', 'por', '--psm', '6'], 25_000));
    return texts.join('\n');
  } finally {
    for (const page of pages) await rm(join(tempDir, page), { force: true });
  }
}

export async function extractText(doc: StoredDocument, tempDir: string): Promise<string> {
  if (active >= MAX_CONCURRENT) throw new Error('OCR ocupado. Tente novamente.');
  active++;
  try {
    return (await extract(doc, tempDir)).slice(0, 50_000);
  } finally {
    active--;
  }
}

export interface ExtractionCandidate {
  value: string;
  source: string;
  status: 'REVIEW_REQUIRED';
}

/** Conservative candidates only: missing/ambiguous data stays empty for human review. */
export function suggestFields(text: string, source: string): Record<string, ExtractionCandidate> {
  const result: Record<string, ExtractionCandidate> = {};
  const cpf = /(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/m.exec(text);
  if (cpf) result['person.cpf'] = { value: cpf[1]!, source, status: 'REVIEW_REQUIRED' };
  const hull = /(?:HIN|CIN|N[ºo.]?\s*do\s*casco)\s*[:-]?\s*([A-Z0-9-]{6,30})/i.exec(text);
  if (hull) result['vessel.hullId'] = { value: hull[1]!, source, status: 'REVIEW_REQUIRED' };
  // Never infer a full name or address from arbitrary lines in untrusted OCR.
  return result;
}
