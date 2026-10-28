import { execFile } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import type { StoredDocument } from './job-store.js';
import type { DocumentObservation, ObservationLine } from '../document-understanding/contracts.js';

const execFileAsync = promisify(execFile);
const FAST_SOURCES = new Set(['tie', 'residence-proof']);

interface PdfWord {
  text: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_all, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_all, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function numberAttr(tag: string, name: string): number | null {
  const match = tag.match(new RegExp(name + '="([0-9.]+)"'));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseWords(body: string): PdfWord[] {
  const words: PdfWord[] = [];
  for (const match of body.matchAll(/(<word\b[^>]*>)([\s\S]*?)<\/word>/gi)) {
    const tag = match[1] ?? '';
    const text = decodeXml(match[2] ?? '').trim();
    const x1 = numberAttr(tag, 'xMin');
    const y1 = numberAttr(tag, 'yMin');
    const x2 = numberAttr(tag, 'xMax');
    const y2 = numberAttr(tag, 'yMax');
    if (!text || x1 === null || y1 === null || x2 === null || y2 === null) continue;
    words.push({ text, x1, y1, x2, y2 });
  }
  return words;
}

function rowCenter(word: PdfWord): number {
  return (word.y1 + word.y2) / 2;
}

function groupRows(words: readonly PdfWord[]): PdfWord[][] {
  const sorted = [...words].sort((a, b) =>
    rowCenter(a) - rowCenter(b) || a.x1 - b.x1);
  const rows: PdfWord[][] = [];

  for (const word of sorted) {
    const height = Math.max(1, word.y2 - word.y1);
    const center = rowCenter(word);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = Math.max(0, rows.length - 4); index < rows.length; index++) {
      const row = rows[index]!;
      const rowCenterValue = row.reduce((sum, item) => sum + rowCenter(item), 0) / row.length;
      const rowHeight = row.reduce((sum, item) =>
        sum + Math.max(1, item.y2 - item.y1), 0) / row.length;
      const tolerance = Math.max(2.5, Math.min(height, rowHeight) * 0.65);
      const distance = Math.abs(center - rowCenterValue);
      if (distance <= tolerance && distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    }

    if (bestIndex === -1) rows.push([word]);
    else rows[bestIndex]!.push(word);
  }

  return rows
    .map((row) => [...row].sort((a, b) => a.x1 - b.x1))
    .sort((a, b) => rowCenter(a[0]!) - rowCenter(b[0]!));
}

function splitRow(row: readonly PdfWord[]): PdfWord[][] {
  if (row.length === 0) return [];
  const averageHeight = row.reduce((sum, word) =>
    sum + Math.max(1, word.y2 - word.y1), 0) / row.length;
  // Normal spaces inside a phrase are much smaller than a form-column gap.
  // The cap keeps small-font PDFs from joining independent label/value cells.
  const splitGap = Math.max(6, Math.min(14, averageHeight * 0.9));
  const segments: PdfWord[][] = [];
  let current: PdfWord[] = [];

  for (const word of row) {
    const previous = current.at(-1);
    if (previous && word.x1 - previous.x2 > splitGap) {
      segments.push(current);
      current = [];
    }
    current.push(word);
  }
  if (current.length) segments.push(current);
  return segments;
}

function segmentToLine(
  part: readonly PdfWord[],
  pageIndex: number,
  lineIndex: number,
): ObservationLine {
  return {
    id: pageIndex + ':' + lineIndex,
    page: pageIndex,
    text: part.map((word) => word.text).join(' ').trim(),
    confidence: 1,
    box: [
      Math.min(...part.map((word) => word.x1)),
      Math.min(...part.map((word) => word.y1)),
      Math.max(...part.map((word) => word.x2)),
      Math.max(...part.map((word) => word.y2)),
    ],
    polygon: null,
  };
}

function parseBBoxXml(xml: string, elapsedMs: number): DocumentObservation | null {
  const pages = [...xml.matchAll(/<page\b[^>]*>([\s\S]*?)<\/page>/gi)]
    .map((pageMatch, pageIndex) => {
      const body = pageMatch[1] ?? '';
      const words = parseWords(body);
      const lines: ObservationLine[] = [];
      let lineIndex = 0;

      for (const row of groupRows(words)) {
        for (const part of splitRow(row)) {
          if (!part.length) continue;
          lines.push(segmentToLine(part, pageIndex, lineIndex++));
        }
      }
      return { page: pageIndex, orientation: 0, lines };
    });

  const text = pages.flatMap((page) => page.lines.map((line) => line.text)).join(' ');
  const useful = text.replace(/[^\p{L}\p{N}]/gu, '').length;
  const lineCount = pages.reduce((sum, page) => sum + page.lines.length, 0);
  if (useful < 80 || lineCount < 8 || pages.every((page) => page.lines.length < 3)) return null;

  return {
    engine: 'pdf-text',
    engineVersion: 'poppler',
    model: 'pdftotext-bbox',
    elapsedMs,
    pages,
  };
}

export async function extractPdfTextObservation(
  doc: StoredDocument,
): Promise<DocumentObservation | null> {
  if (doc.kind !== 'pdf' || !FAST_SOURCES.has(doc.requirementId)) return null;
  const started = performance.now();
  try {
    const { stdout } = await execFileAsync('pdftotext',
      ['-bbox', '-enc', 'UTF-8', doc.path, '-'],
      { timeout: 5_000, maxBuffer: 2 * 1024 * 1024 });
    return parseBBoxXml(stdout, Math.round(performance.now() - started));
  } catch {
    return null;
  }
}

export function observationText(observation: DocumentObservation): string {
  return observation.pages.flatMap((page) => page.lines.map((line) => line.text.trim())
    .filter(Boolean)).join('\n').slice(0, 50_000);
}
