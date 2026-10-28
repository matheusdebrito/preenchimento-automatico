import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { StoredDocument } from './job-store.js';
import { runPaddleOcrBuffer } from './paddle-ocr.js';
import { paddleToObservation } from '../document-understanding/paddle-observation.js';
import type { DocumentObservation, ObservationPage } from '../document-understanding/contracts.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';

const execFileAsync = promisify(execFile);
const MAX_REFERENCE_PAGES = 8;
const RASTER_DPI = 110;

async function pdfPageCount(path: string): Promise<number> {
  const { stdout } = await execFileAsync('pdfinfo', [path], {
    timeout: 5_000,
    maxBuffer: 256 * 1024,
  });
  const match = stdout.match(/^Pages:\s+(\d+)\s*$/mi);
  const pages = Number(match?.[1]);
  if (!Number.isSafeInteger(pages) || pages < 1 || pages > MAX_REFERENCE_PAGES) {
    throw new Error('Quantidade de páginas PDF fora do limite de OCR.');
  }
  return pages;
}

function pagePriority(
  requirementId: string,
  pageCount: number,
  hint: DocumentObservation | null,
): number[] {
  const natural = Array.from({ length: pageCount }, (_, index) => index);
  if (!hint) return natural;

  const scores = new Map<number, number>();
  for (const page of hint.pages) {
    let score = 0;
    for (const line of page.lines) {
      const text = line.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      if (requirementId === 'residence-proof') {
        if (/\b\d{5}-?\d{3}\b/.test(text)) score += 10;
        if (/\b(?:ENDERECO|LOGRADOURO|RUA|AVENIDA|AV\.?|R\.)\b/.test(text)) score += 4;
      } else if (requirementId === 'tie') {
        if (/\b(?:INSCRICAO|REGISTRO)\b/.test(text)) score += 8;
        if (/\b(?:HIN|CIN|CASCO)\b/.test(text)) score += 8;
        if (/\bNOME\b/.test(text)) score += 3;
      }
    }
    scores.set(page.page, score);
  }

  return natural.sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0) || a - b);
}

function sufficient(
  requirementId: string,
  observation: DocumentObservation,
): boolean {
  if (requirementId === 'tie') {
    const fields = new Set(extractDocumentEvidence(observation, {
      documentId: 'page-probe',
      sourceId: 'tie',
      documentType: 'tie',
      subjectRole: 'vessel',
    }).map((item) => item.fieldId));
    return ['vessel.registration', 'vessel.name', 'vessel.hullId']
      .every((fieldId) => fields.has(fieldId));
  }
  if (requirementId === 'residence-proof') {
    const fields = new Set(extractDocumentEvidence(observation, {
      documentId: 'page-probe',
      sourceId: 'residence-proof',
      documentType: 'residence-proof',
      subjectRole: 'person',
    }).map((item) => item.fieldId));
    return fields.has('person.postalCode') && fields.has('person.address');
  }
  return false;
}

function combinedObservation(
  pages: readonly ObservationPage[],
  elapsedMs: number,
  model: string,
  version: string,
): DocumentObservation {
  return {
    engine: 'paddleocr',
    engineVersion: version,
    model,
    elapsedMs,
    pages: [...pages].sort((a, b) => a.page - b.page),
  };
}

export async function extractPdfPagesWithPaddle(
  doc: StoredDocument,
  tempDir: string,
  hint: DocumentObservation | null,
): Promise<DocumentObservation> {
  const count = await pdfPageCount(doc.path);
  const order = pagePriority(doc.requirementId, count, hint);
  const pages: ObservationPage[] = [];
  let elapsedMs = 0;
  let model = 'PP-OCRv6';
  let version = 'unknown';

  for (const pageIndex of order) {
    const prefix = join(tempDir, '.ocr-page-' + doc.id + '-' + pageIndex);
    const png = prefix + '.png';
    try {
      await execFileAsync('pdftoppm', [
        '-f', String(pageIndex + 1),
        '-l', String(pageIndex + 1),
        '-singlefile',
        '-r', String(RASTER_DPI),
        '-png',
        doc.path,
        prefix,
      ], { timeout: 20_000, maxBuffer: 256 * 1024 });

      // Although the transport payload is PNG, this is a rasterized PDF page.
      // Keep the larger PDF inference budget so shared CI/CPU runners do not
      // abort valid document OCR at the normal image timeout.
      const result = await runPaddleOcrBuffer(
        await readFile(png), 'png', process.env.PADDLE_OCR_URL, 120_000);
      const observation = paddleToObservation(result);
      model = result.model;
      version = result.version;
      elapsedMs += result.elapsedMs;
      const first = observation.pages[0];
      if (first) {
        pages.push({
          ...first,
          page: pageIndex,
          lines: first.lines.map((line, lineIndex) => ({
            ...line,
            id: pageIndex + ':' + lineIndex,
            page: pageIndex,
          })),
        });
      }

      const combined = combinedObservation(pages, elapsedMs, model, version);
      if (sufficient(doc.requirementId, combined)) return combined;
    } finally {
      await rm(png, { force: true }).catch(() => undefined);
    }
  }

  return combinedObservation(pages, elapsedMs, model, version);
}
