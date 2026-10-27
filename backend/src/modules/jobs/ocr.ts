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
    // Only the variables required by Poppler/Tesseract. Never pass DB credentials
    // or application tokens into document-processing subprocesses.
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      LC_ALL: 'C', OMP_THREAD_LIMIT: '1',
      ...(process.env.TESSDATA_PREFIX ? { TESSDATA_PREFIX: process.env.TESSDATA_PREFIX } : {}),
    },
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
  try {
    await run('pdftoppm', ['-f', '1', '-l', '5', '-r', '160', '-png', doc.path, prefix], 30_000);
    const pages = (await readdir(tempDir))
      .filter((name) => name.startsWith(doc.id + '-page') && name.endsWith('.png')).sort();
    if (pages.length === 0) throw new Error('PDF não pôde ser convertido para OCR.');
    const texts: string[] = [];
    for (const page of pages) texts.push(await run('tesseract',
      [join(tempDir, page), 'stdout', '-l', 'por', '--psm', '6'], 25_000));
    return texts.join('\n');
  } finally {
    // Clean partial page images even when pdftoppm fails or times out.
    const files = await readdir(tempDir).catch(() => []);
    for (const filename of files) {
      if (filename.startsWith(doc.id + '-page') && filename.endsWith('.png')) {
        await rm(join(tempDir, filename), { force: true });
      }
    }
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

function validCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = Array.from({ length }, (_, i) =>
      Number(digits[i]) * (length + 1 - i)).reduce((a, b) => a + b, 0);
    const check = (sum * 10) % 11 % 10;
    if (check !== Number(digits[length])) return false;
  }
  return true;
}

/** Label-anchored hints only: all results require explicit human review. */
export function suggestFields(text: string, source: string): Record<string, ExtractionCandidate> {
  const result: Record<string, ExtractionCandidate> = {};
  const seller = source === 'seller-identity';
  const buyer = source === 'buyer-identity';
  // Never assign a seller's CPF to the buyer, even if both documents are uploaded.
  const cpfs = [...text.matchAll(/(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/gm)]
    .map((match) => match[1]!).filter(validCpf);
  const uniqueCpf = [...new Set(cpfs.map((cpf) => cpf.replace(/\D/g, '')))];
  if (uniqueCpf.length === 1) {
    const id = seller ? 'seller.cpf' : 'person.cpf';
    result[id] = { value: cpfs[0]!, source, status: 'REVIEW_REQUIRED' };
  }
  if (buyer || seller) {
    // Avoid guessing a name from unrelated OCR lines, dates or surrounding labels.
    const nameLines = [...text.matchAll(
      /^(?:NOME(?:\s+COMPLETO)?|NOME\s+DO\s+TITULAR)\s*[:\-]\s*([A-ZÀ-Ý][A-ZÀ-Ý' .-]{5,100})\s*$/gim,
    )].map((match) => match[1]!.trim());
    const uniqueNames = [...new Set(nameLines.map((name) => name.toUpperCase()))];
    if (uniqueNames.length === 1 && uniqueNames[0]!.split(/\s+/).length >= 2) {
      result[seller ? 'seller.fullName' : 'person.fullName'] = {
        value: nameLines[0]!, source, status: 'REVIEW_REQUIRED',
      };
    }
  }
  const hull = /(?:HIN|CIN|N[ºo.]?\s*do\s*casco)\s*[:-]?\s*([A-Z0-9-]{6,30})/i.exec(text);
  if (hull) result['vessel.hullId'] = { value: hull[1]!, source, status: 'REVIEW_REQUIRED' };
  return result;
}
