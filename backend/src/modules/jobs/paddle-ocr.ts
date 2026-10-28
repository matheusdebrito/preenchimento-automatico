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

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

function validName(value: string): boolean {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return /^[A-ZÀ-Ý][A-ZÀ-Ý' .-]{5,99}$/i.test(normalized) &&
    normalized.split(/\s+/).length >= 2 &&
    !/^(?:DATA|FILIACAO|NASCIMENTO|DOCUMENTO|REPUBLICA|CPF|RG|REGISTRO|NATURALIDADE)\b/
      .test(normalize(normalized));
}

function spatialIdentityName(result: PaddleOcrResult): string | null {
  const found: string[] = [];
  for (const page of result.pages) {
    const positioned = page.lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);
    for (const anchor of positioned) {
      const label = normalize(anchor.text);
      if (!/^N[O0]M[E3](?: \/ NAME)?(?: COMPLETO| CIVIL| DO TITULAR| E SOBRENOME)?\b/.test(label) ||
        /^N[O0]M[E3] (?:DA MAE|DO PAI|SOCIAL|DA GENITORA|DO GENITOR)\b/.test(label)) continue;

      const inline = anchor.text.replace(
        /^\s*N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\s*[:\-–]?\s*/i, '',
      ).trim();
      if (inline && validName(inline)) {
        found.push(inline);
        continue;
      }

      const [ax1, ay1, ax2, ay2] = anchor.box!;
      const height = Math.max(1, ay2 - ay1);
      const centerY = (ay1 + ay2) / 2;
      const rightCandidates = positioned.filter((line) => {
        if (line === anchor || !line.box || !validName(line.text)) return false;
        const [x1, y1, , y2] = line.box;
        return x1 >= ax2 && x1 - ax2 <= height * 8 &&
          Math.abs((y1 + y2) / 2 - centerY) <= height;
      });
      const belowCandidates = positioned.filter((line) => {
        if (line === anchor || !line.box || !validName(line.text)) return false;
        const [x1, y1] = line.box;
        return y1 >= ay2 - height * 0.25 && y1 - ay2 <= height * 6 &&
          Math.abs(x1 - ax1) <= Math.max(height * 4, (ax2 - ax1) * 2);
      });
      const candidate = [...rightCandidates, ...belowCandidates]
        .sort((a, b) => {
          const aa = a.box!;
          const bb = b.box!;
          const ad = Math.max(0, aa[1] - ay2) + Math.max(0, aa[0] - ax2);
          const bd = Math.max(0, bb[1] - ay2) + Math.max(0, bb[0] - ax2);
          return ad - bd || b.confidence - a.confidence;
        })[0];
      if (candidate) found.push(candidate.text.trim());
    }
  }
  const unique = [...new Map(found.map((value) => [normalize(value), value])).values()];
  return unique.length === 1 ? unique[0]! : null;
}

export function paddleTextForSource(result: PaddleOcrResult, source: string): string {
  const text = result.pages.flatMap((page) => [...page.lines]
    .sort((a, b) => (a.box?.[1] ?? 0) - (b.box?.[1] ?? 0) ||
      (a.box?.[0] ?? 0) - (b.box?.[0] ?? 0))
    .map((line) => line.text.trim()).filter(Boolean)).join('\n');
  if (!['buyer-identity', 'seller-identity'].includes(source)) return text.slice(0, 50_000);
  const name = spatialIdentityName(result);
  return (text + (name ? '\nNOME: ' + name : '')).slice(0, 50_000);
}

export async function extractPaddleText(doc: StoredDocument): Promise<string> {
  const bytes = await readFile(doc.path);
  return paddleTextForSource(await runPaddleOcrBuffer(bytes, doc.kind), doc.requirementId);
}
