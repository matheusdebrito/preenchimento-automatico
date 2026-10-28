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

export type PaddleExtractionCandidate = {
  value: string;
  source: string;
  status: 'REVIEW_REQUIRED';
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

const HOLDER_NAME_LABEL =
  /^N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\b/i;
const FORBIDDEN_NAME_LABEL =
  /^N[O0]M[E3]\s+(?:DA\s+M[ÃA]E|DO\s+PAI|SOCIAL|DA\s+GENITORA|DO\s+GENITOR)\b/i;
const HARD_BARRIER =
  /^(?:FILIACAO|FILIA[CÇ][AÃ]O|CPF|RG|REGISTRO|IDENTIDADE|DATA|NASCIMENTO|NATURALIDADE|ASSINATURA|ORGAO|[ÓO]RG[AÃ]O|EMISSOR)\b/i;

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function validName(value: string): boolean {
  const text = clean(value);
  const upper = normalize(text);
  if (text.length < 6 || text.length > 100 || text.split(/\s+/).length < 2) return false;
  if (!/^[A-ZÀ-Ý][A-ZÀ-Ý' .-]+$/i.test(text)) return false;
  if (/^(?:DATA|FILIACAO|NASCIMENTO|DOCUMENTO|REPUBLICA|CPF|RG|REGISTRO|NATURALIDADE|VALIDA|CARTEIRA|SECRETARIA|ESTADO)\b/
    .test(upper)) return false;
  return true;
}

function anchorInlineName(text: string): string | null {
  if (FORBIDDEN_NAME_LABEL.test(normalize(text))) return null;
  const stripped = text.replace(
    /^\s*N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\s*[:\-–]?\s*/i,
    '',
  );
  return validName(stripped) ? clean(stripped) : null;
}

function boxHeight(line: PaddleOcrLine): number {
  return line.box ? Math.max(1, line.box[3] - line.box[1]) : 1;
}

function verticalDistance(anchor: PaddleOcrLine, line: PaddleOcrLine): number {
  if (!anchor.box || !line.box) return Number.POSITIVE_INFINITY;
  return Math.max(0, line.box[1] - anchor.box[3]);
}

function horizontalOverlap(anchor: PaddleOcrLine, line: PaddleOcrLine): number {
  if (!anchor.box || !line.box) return 0;
  const left = Math.max(anchor.box[0], line.box[0]);
  const right = Math.min(anchor.box[2], line.box[2]);
  return Math.max(0, right - left);
}

function collectNameBelow(anchor: PaddleOcrLine, positioned: readonly PaddleOcrLine[]): string | null {
  if (!anchor.box) return null;
  const height = boxHeight(anchor);
  const [ax1, , ax2] = anchor.box;
  const width = Math.max(1, ax2 - ax1);

  const below = positioned
    .filter((line) => {
      if (line === anchor || !line.box || line.confidence < 0.45) return false;
      const dy = verticalDistance(anchor, line);
      if (dy < -height * 0.25 || dy > height * 8) return false;
      const overlap = horizontalOverlap(anchor, line);
      const xDelta = Math.abs(line.box[0] - ax1);
      return overlap > 0 || xDelta <= Math.max(width * 1.5, height * 5);
    })
    .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);

  const parts: string[] = [];
  let lastBottom = anchor.box[3];
  for (const line of below) {
    const text = clean(line.text);
    const upper = normalize(text);
    if (HARD_BARRIER.test(upper)) break;
    if (FORBIDDEN_NAME_LABEL.test(upper)) break;
    if (line.box![1] - lastBottom > height * 2.8) break;
    if (!/^[A-ZÀ-Ý][A-ZÀ-Ý' .-]+$/i.test(text)) {
      if (parts.length > 0) break;
      continue;
    }
    parts.push(text);
    lastBottom = line.box![3];
    if (parts.length >= 3) break;
    const joined = clean(parts.join(' '));
    if (validName(joined) && joined.split(/\s+/).length >= 3) {
      // Prefer a complete nearby line/group instead of drifting into later labels.
      const next = below[below.indexOf(line) + 1];
      if (!next || !next.box || next.box[1] - lastBottom > height * 0.9 ||
        HARD_BARRIER.test(normalize(next.text))) break;
    }
  }
  const joined = clean(parts.join(' '));
  return validName(joined) ? joined : null;
}

function collectNameRight(anchor: PaddleOcrLine, positioned: readonly PaddleOcrLine[]): string | null {
  if (!anchor.box) return null;
  const height = boxHeight(anchor);
  const centerY = (anchor.box[1] + anchor.box[3]) / 2;
  const candidates = positioned.filter((line) => {
    if (line === anchor || !line.box || line.confidence < 0.45 || !validName(line.text)) return false;
    const center = (line.box[1] + line.box[3]) / 2;
    return line.box[0] >= anchor.box![2] - height * 0.5 &&
      line.box[0] - anchor.box![2] <= height * 12 &&
      Math.abs(center - centerY) <= height * 1.25;
  }).sort((a, b) => a.box![0] - b.box![0] || b.confidence - a.confidence);
  return candidates[0] ? clean(candidates[0].text) : null;
}

export function paddleIdentityName(result: PaddleOcrResult): string | null {
  const found: string[] = [];
  for (const page of result.pages) {
    const positioned = page.lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);
    for (const anchor of positioned) {
      const label = normalize(anchor.text);
      if (!HOLDER_NAME_LABEL.test(label) || FORBIDDEN_NAME_LABEL.test(label)) continue;
      const inline = anchorInlineName(anchor.text);
      const right = inline ?? collectNameRight(anchor, positioned);
      const below = inline ?? collectNameBelow(anchor, positioned);
      const candidate = right ?? below;
      if (candidate) found.push(candidate);
    }
  }
  const unique = [...new Map(found.map((value) => [normalize(value), value])).values()];
  return unique.length === 1 ? unique[0]! : null;
}

function cpfCandidates(result: PaddleOcrResult): string[] {
  const values = result.pages.flatMap((page) => page.lines)
    .flatMap((line) => [...line.text.matchAll(/(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/g)])
    .map((match) => match[1]!.trim());
  const unique = new Map(values.map((value) => [value.replace(/\D/g, ''), value]));
  return [...unique.values()];
}

export function paddleIdentitySuggestions(
  result: PaddleOcrResult,
  source: string,
): Record<string, PaddleExtractionCandidate> {
  if (source !== 'buyer-identity' && source !== 'seller-identity') return {};
  const role = source === 'seller-identity' ? 'seller' : 'person';
  const suggestions: Record<string, PaddleExtractionCandidate> = {};
  const name = paddleIdentityName(result);
  if (name) suggestions[role + '.fullName'] = { value: name, source, status: 'REVIEW_REQUIRED' };

  const cpfs = cpfCandidates(result);
  if (cpfs.length === 1) {
    suggestions[role + '.cpf'] = { value: cpfs[0]!, source, status: 'REVIEW_REQUIRED' };
  }
  return suggestions;
}

export function paddleTextForSource(result: PaddleOcrResult, source: string): string {
  const text = result.pages.flatMap((page) => [...page.lines]
    .sort((a, b) => (a.box?.[1] ?? 0) - (b.box?.[1] ?? 0) ||
      (a.box?.[0] ?? 0) - (b.box?.[0] ?? 0))
    .map((line) => line.text.trim()).filter(Boolean)).join('\n');
  if (!['buyer-identity', 'seller-identity'].includes(source)) return text.slice(0, 50_000);
  const name = paddleIdentityName(result);
  return (text + (name ? '\nNOME: ' + name : '')).slice(0, 50_000);
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
