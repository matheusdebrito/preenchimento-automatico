import { execFile } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import type { StoredDocument } from './job-store.js';
import type { DocumentObservation, ObservationLine } from '../document-understanding/contracts.js';

const execFileAsync = promisify(execFile);
const FAST_SOURCES = new Set(['tie', 'residence-proof']);

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

function parseBBoxXml(xml: string, elapsedMs: number): DocumentObservation | null {
  const pages = [...xml.matchAll(/<page\b[^>]*>([\s\S]*?)<\/page>/gi)].map((pageMatch, pageIndex) => {
    const body = pageMatch[1] ?? '';
    const lines: ObservationLine[] = [];
    let lineIndex = 0;
    for (const lineMatch of body.matchAll(/<line\b[^>]*>([\s\S]*?)<\/line>/gi)) {
      const lineBody = lineMatch[1] ?? '';
      const words = [...lineBody.matchAll(/(<word\b[^>]*>)([\s\S]*?)<\/word>/gi)]
        .map((match) => {
          const tag = match[1] ?? '';
          const text = decodeXml(match[2] ?? '').trim();
          const x1 = numberAttr(tag, 'xMin');
          const y1 = numberAttr(tag, 'yMin');
          const x2 = numberAttr(tag, 'xMax');
          const y2 = numberAttr(tag, 'yMax');
          return { text, x1, y1, x2, y2 };
        })
        .filter((word) => word.text &&
          word.x1 !== null && word.y1 !== null && word.x2 !== null && word.y2 !== null)
        .sort((a, b) => a.x1! - b.x1!);
      if (words.length === 0) continue;

      const heights = words.map((word) => Math.max(1, word.y2! - word.y1!));
      const averageHeight = heights.reduce((sum, value) => sum + value, 0) / heights.length;
      const splitGap = Math.max(18, averageHeight * 2.5);
      const segments: typeof words[] = [];
      let segment: typeof words = [];

      for (const word of words) {
        const previous = segment.at(-1);
        if (previous && word.x1! - previous.x2! > splitGap) {
          segments.push(segment);
          segment = [];
        }
        segment.push(word);
      }
      if (segment.length) segments.push(segment);

      for (const part of segments) {
        const text = part.map((word) => word.text).join(' ').trim();
        if (!text) continue;
        lines.push({
          id: pageIndex + ':' + lineIndex++,
          page: pageIndex,
          text,
          confidence: 1,
          box: [
            Math.min(...part.map((word) => word.x1!)),
            Math.min(...part.map((word) => word.y1!)),
            Math.max(...part.map((word) => word.x2!)),
            Math.max(...part.map((word) => word.y2!)),
          ],
          polygon: null,
        });
      }
    }
    return { page: pageIndex, orientation: 0, lines };
  });

  const text = pages.flatMap((page) => page.lines.map((line) => line.text)).join(' ');
  const useful = text.replace(/[^\p{L}\p{N}]/gu, '').length;
  if (useful < 80 || pages.every((page) => page.lines.length < 3)) return null;

  return {
    engine: 'pdf-text',
    engineVersion: 'poppler',
    model: 'pdftotext-bbox-layout',
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
      ['-bbox-layout', '-enc', 'UTF-8', doc.path, '-'],
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
