import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { StoredDocument } from './job-store.js';
import { isValidCpf, isValidBrazilianDate } from '../catalog/field-validation.js';

const execFile = promisify(execFileCallback);
let active = 0;
const MAX_CONCURRENT = 2;
const MAX_RASTER_PAGE_BYTES = 16 * 1024 * 1024;
const MAX_RASTER_TOTAL_BYTES = 48 * 1024 * 1024;

/** Guard the disk footprint of Poppler output before Tesseract decodes it. */
export function validateRasterBudget(pageSizes: readonly number[]): void {
  if (pageSizes.length < 1 || pageSizes.length > 5) {
    throw new Error('Quantidade de páginas rasterizadas não suportada.');
  }
  let total = 0;
  for (const size of pageSizes) {
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_RASTER_PAGE_BYTES) {
      throw new Error('Página rasterizada excede limite de armazenamento para OCR.');
    }
    total += size;
    if (total > MAX_RASTER_TOTAL_BYTES) {
      throw new Error('Conjunto de páginas rasterizadas excede limite para OCR.');
    }
  }
}


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
    // A compressed 10 MB PDF can expand to much larger raster files.
    const pageStats = await Promise.all(pages.map((page) => stat(join(tempDir, page))));
    validateRasterBudget(pageStats.map((page) => page.size));
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

/**
 * Only source documents with known, role-specific semantic fields need OCR.
 * Photos of the vessel and payment receipts are still uploaded for the
 * official checklist, but OCR on them adds latency and false positives.
 */
const SEMANTIC_SOURCES = new Set([
  'buyer-identity', 'seller-identity', 'tie', 'residence-proof', 'sale-document',
  'source', // CI-only synthetic source; not present in the real service.
]);
export function shouldExtractDocument(requirementId: string): boolean {
  return SEMANTIC_SOURCES.has(requirementId);
}

export interface ExtractionCandidate {
  value: string;
  source: string;
  status: 'REVIEW_REQUIRED';
}

/**
 * Return a candidate only when the document has exactly one unambiguous
 * labelled value. No arbitrary "first row" or inferred associations.
 */
function singleLabelled(text: string, pattern: RegExp, maxLength: number): string | null {
  const candidates = [...text.matchAll(pattern)]
    .map((match) => match[1]?.trim().replace(/\s+/g, ' ') ?? '');
  if (candidates.length === 0 || candidates.some((value) =>
    value.length === 0 || value.length > maxLength)) return null;
  const unique = [...new Set(candidates.map((value) => value.normalize('NFC').toUpperCase()))];
  return unique.length === 1 ? candidates[0]! : null;
}

/** Label-anchored hints only: all results require explicit human review. */
export function suggestFields(text: string, source: string): Record<string, ExtractionCandidate> {
  const result: Record<string, ExtractionCandidate> = {};
  const seller = source === 'seller-identity';
  const buyer = source === 'buyer-identity';
  // Never assign a seller's CPF to the buyer, even if both documents are uploaded.
  const cpfs = [...text.matchAll(/(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/gm)]
    .map((match) => match[1]!).filter(isValidCpf);
  const uniqueCpf = [...new Set(cpfs.map((cpf) => cpf.replace(/\D/g, '')))];
  if (uniqueCpf.length === 1 && (seller || buyer)) {
    const id = seller ? 'seller.cpf' : 'person.cpf';
    result[id] = { value: cpfs[0]!, source, status: 'REVIEW_REQUIRED' };
  }
  if (buyer || seller) {
    // Avoid guessing a name from unrelated OCR lines, dates or surrounding labels.
    const nameLines = [...text.matchAll(
      /^(?:NOME(?:\s+COMPLETO)?|NOME\s+DO\s+TITULAR)\s*[:-]\s*([A-ZÀ-Ý][A-ZÀ-Ý' .-]{5,100})\s*$/gim,
    )].map((match) => match[1]!.trim());
    const uniqueNames = [...new Set(nameLines.map((name) => name.toUpperCase()))];
    if (uniqueNames.length === 1 && uniqueNames[0]!.split(/\s+/).length >= 2) {
      result[seller ? 'seller.fullName' : 'person.fullName'] = {
        value: nameLines[0]!, source, status: 'REVIEW_REQUIRED',
      };
    }
  }
  if (buyer || seller) {
    const role = seller ? 'seller' : 'person';
    const identity = singleLabelled(text,
      /^\s*(?:RG|N[ºO.]?\s*DA\s*IDENTIDADE|IDENTIDADE)\s*[:-]\s*([A-Z0-9./-]{5,24})\s*$/gim, 24);
    if (identity) result[role + '.identity'] = { value: identity, source, status: 'REVIEW_REQUIRED' };

    const issuer = singleLabelled(text,
      /^\s*(?:[ÓO]RG[AÃ]O\s+(?:EMISSOR|EXPEDIDOR)|EMISSOR)\s*[:-]\s*([A-ZÀ-Ý0-9 ./-]{2,32})\s*$/gim, 32);
    if (issuer) result[role + '.issuer'] = { value: issuer, source, status: 'REVIEW_REQUIRED' };
  }

  if (source === 'tie') {
    const registration = singleLabelled(text,
      /^\s*(?:(?:N[ÚU]MERO|N[ºO.])\s+(?:DE|DA)\s+)?INSCRI[CÇ][AÃ]O\s*[:-]\s*([A-Z0-9./-]{4,30})\s*$/gim, 30);
    if (registration) {
      result['vessel.registration'] = { value: registration, source, status: 'REVIEW_REQUIRED' };
    }

    const vesselName = singleLabelled(text,
      /^\s*NOME\s+DA\s+(?:EMBARCA[CÇ][AÃ]O|MOTO\s+AQU[AÁ]TICA)\s*[:-]\s*([A-ZÀ-Ý0-9' .-]{4,100})\s*$/gim, 100);
    if (vesselName) {
      result['vessel.name'] = { value: vesselName, source, status: 'REVIEW_REQUIRED' };
    }

    // Only explicitly labelled TIE attributes; do not infer specifications
    // from arbitrary OCR numbers or from the current owner's identity.
    const year = singleLabelled(text,
      /^\s*ANO\s+(?:DE\s+)?CONSTRU[CÇ][AÃ]O\s*[:-]\s*((?:19|20)\d{2})\s*$/gim, 4);
    if (year) result['vessel.year'] = { value: year, source, status: 'REVIEW_REQUIRED' };

    const length = singleLabelled(text,
      /^\s*COMPRIMENTO\s*(?:TOTAL\s*)?(?:\(M\)\s*)?[:-]\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:M|METROS?)?\s*$/gim, 5);
    if (length) result['vessel.length'] = { value: length, source, status: 'REVIEW_REQUIRED' };

    const capacity = singleLabelled(text,
      /^\s*(?:LOTA[CÇ][AÃ]O|CAPACIDADE\s+DE\s+PESSOAS)\s*[:-]\s*(\d{1,2})\s*$/gim, 2);
    if (capacity) result['vessel.capacity'] = { value: capacity, source, status: 'REVIEW_REQUIRED' };
  }

  if (source === 'sale-document') {
    // Invoice and sale details are candidates, not legal proof of transfer.
    // Use narrowly anchored labels so an unrelated date or price never fills the sale.
    const invoice = singleLabelled(text,
      /^\s*(?:NOTA\s+FISCAL(?:\s*N[ºO.]?)?|N[ÚU]MERO\s+DA\s+NOTA\s+FISCAL)\s*[:-]\s*([A-Z0-9./-]{3,32})\s*$/gim, 32);
    if (invoice) result['sale.invoice'] = { value: invoice, source, status: 'REVIEW_REQUIRED' };

    const date = singleLabelled(text,
      /^\s*DATA\s+(?:DA\s+VENDA|DA\s+TRANSFER[EÊ]NCIA)\s*[:-]\s*(\d{2}\/\d{2}\/\d{4})\s*$/gim, 10);
    if (date && isValidBrazilianDate(date)) {
      result['sale.date'] = { value: date, source, status: 'REVIEW_REQUIRED' };
    }

    const price = singleLabelled(text,
      /^\s*(?:VALOR\s+(?:DA\s+VENDA|TOTAL\s+DA\s+VENDA)|PRE[CÇ]O\s+DA\s+VENDA)\s*[:-]\s*((?:R\$\s*)?[\d.]+,\d{2})\s*$/gim, 32);
    if (price) result['sale.price'] = { value: price, source, status: 'REVIEW_REQUIRED' };
  }

  if (source === 'residence-proof') {
    const postal = singleLabelled(text, /^\s*CEP\s*[:-]\s*(\d{5}-?\d{3})\s*$/gim, 9);
    if (postal) result['person.postalCode'] = { value: postal, source, status: 'REVIEW_REQUIRED' };

    const address = singleLabelled(text,
      /^\s*ENDERE[CÇ]O\s*[:-]\s*(\S.{5,119})\s*$/gim, 120);
    if (address) result['person.address'] = { value: address, source, status: 'REVIEW_REQUIRED' };
  }

  if (source === 'tie' || source === 'source') {
    const hull = singleLabelled(text,
      /(?:HIN|CIN|N[ºo.]?\s*do\s*casco)\s*[:-]?\s*([A-Z0-9-]{6,30})/gim, 30);
    if (hull) result['vessel.hullId'] = { value: hull, source, status: 'REVIEW_REQUIRED' };
  }
  return result;
}
