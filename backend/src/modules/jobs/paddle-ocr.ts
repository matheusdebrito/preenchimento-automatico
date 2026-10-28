import { readFile } from 'node:fs/promises';
import type { DocumentKind } from './document-validator.js';
import type { StoredDocument } from './job-store.js';

export type PaddleOcrLine = {
  text: string;
  confidence: number;
  box: readonly [number, number, number, number] | null;
  polygon: readonly (readonly [number, number])[] | null;
};

export type PaddleOcrPage = {
  page: number;
  orientation: number | null;
  lines: readonly PaddleOcrLine[];
};

export type PaddleOcrResult = {
  engine: 'paddleocr';
  version: string;
  model: string;
  elapsedMs: number;
  pages: readonly PaddleOcrPage[];
};

const contentType = (kind: DocumentKind): string =>
  kind === 'pdf' ? 'application/pdf' : kind === 'png' ? 'image/png' : 'image/jpeg';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseBox(value: unknown): PaddleOcrLine['box'] {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const [x1, y1, x2, y2] = value;
  if (!finite(x1) || !finite(y1) || !finite(x2) || !finite(y2)) return null;
  return [x1, y1, x2, y2];
}

function parsePolygon(value: unknown): PaddleOcrLine['polygon'] {
  if (!Array.isArray(value) || value.length < 4) return null;
  const points: [number, number][] = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length !== 2) return null;
    const [x, y] = point;
    if (!finite(x) || !finite(y)) return null;
    points.push([x, y]);
  }
  return points;
}

function parseResult(value: unknown): PaddleOcrResult {
  if (!value || typeof value !== 'object') throw new Error('Resposta PaddleOCR inválida.');
  const root = value as Record<string, unknown>;
  if (root.engine !== 'paddleocr' || typeof root.version !== 'string' ||
    typeof root.model !== 'string' || !finite(root.elapsedMs) || !Array.isArray(root.pages)) {
    throw new Error('Contrato PaddleOCR inválido.');
  }
  const pages: PaddleOcrPage[] = root.pages.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new Error('Página PaddleOCR inválida.');
    const page = raw as Record<string, unknown>;
    if (!Array.isArray(page.lines)) throw new Error('Linhas PaddleOCR inválidas.');
    const lines: PaddleOcrLine[] = page.lines.map((item) => {
      if (!item || typeof item !== 'object') throw new Error('Linha PaddleOCR inválida.');
      const line = item as Record<string, unknown>;
      if (typeof line.text !== 'string' || line.text.length > 500 ||
        !finite(line.confidence) || line.confidence < 0 || line.confidence > 1) {
        throw new Error('Conteúdo PaddleOCR inválido.');
      }
      return {
        text: line.text,
        confidence: line.confidence,
        box: parseBox(line.box),
        polygon: parsePolygon(line.polygon),
      };
    });
    return {
      page: Number.isSafeInteger(page.page) ? Number(page.page) : index,
      orientation: finite(page.orientation) ? page.orientation : null,
      lines,
    };
  });
  return {
    engine: 'paddleocr',
    version: root.version,
    model: root.model,
    elapsedMs: root.elapsedMs,
    pages,
  };
}

export async function runPaddleOcrBuffer(
  bytes: Buffer,
  kind: DocumentKind,
  url = process.env.PADDLE_OCR_URL,
): Promise<PaddleOcrResult> {
  if (!url) throw new Error('PaddleOCR não configurado.');
  const response = await fetch(new URL('/ocr', url), {
    method: 'POST',
    headers: { 'Content-Type': contentType(kind), 'Content-Length': String(bytes.length) },
    body: bytes,
    signal: AbortSignal.timeout(75_000),
  });
  if (!response.ok) throw new Error('PaddleOCR indisponível: HTTP ' + response.status);
  return parseResult(await response.json());
}

export function paddleTextForSource(result: PaddleOcrResult, source: string): string {
  void source; // Source-specific semantics live in document-understanding extractors.
  return result.pages.flatMap((page) => [...page.lines]
    .sort((a, b) => (a.box?.[1] ?? 0) - (b.box?.[1] ?? 0) ||
      (a.box?.[0] ?? 0) - (b.box?.[0] ?? 0))
    .map((line) => line.text.trim()).filter(Boolean)).join('\n').slice(0, 50_000);
}

export async function extractPaddleDocument(doc: StoredDocument): Promise<{
  result: PaddleOcrResult;
  text: string;
}> {
  const bytes = await readFile(doc.path);
  const result = await runPaddleOcrBuffer(bytes, doc.kind);
  return { result, text: paddleTextForSource(result, doc.requirementId) };
}

export async function extractPaddleText(doc: StoredDocument): Promise<string> {
  return (await extractPaddleDocument(doc)).text;
}
