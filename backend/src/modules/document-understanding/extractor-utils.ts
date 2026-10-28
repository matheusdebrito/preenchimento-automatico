import type {
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  ObservationLine,
} from './contracts.js';

export const cleanText = (value: string): string => value.replace(/\s+/g, ' ').trim();
export const normalizeText = (value: string): string => cleanText(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export interface ExtractedCandidate {
  value: string;
  confidence: number | null;
  page: number;
  lineIds: readonly string[];
  method: string;
  anchor?: string;
}

const boxHeight = (line: ObservationLine): number =>
  line.box ? Math.max(1, line.box[3] - line.box[1]) : 1;

function horizontalOverlap(a: ObservationLine, b: ObservationLine): number {
  if (!a.box || !b.box) return 0;
  return Math.max(0, Math.min(a.box[2], b.box[2]) - Math.max(a.box[0], b.box[0]));
}

export function selectUniqueCandidate(candidates: readonly ExtractedCandidate[]): ExtractedCandidate | null {
  const unique = new Map<string, ExtractedCandidate>();
  for (const candidate of candidates) {
    const key = normalizeText(candidate.value);
    const prior = unique.get(key);
    const score = candidate.confidence ?? -1;
    const priorScore = prior?.confidence ?? -1;
    if (!prior || score > priorScore) unique.set(key, candidate);
  }
  return unique.size === 1 ? [...unique.values()][0]! : null;
}

export function anchoredCandidates(
  observation: DocumentObservation,
  labels: readonly RegExp[],
  anchorName: string,
  validate: (value: string) => boolean,
): readonly ExtractedCandidate[] {
  const candidates: ExtractedCandidate[] = [];

  for (const page of observation.pages) {
    const lines = [...page.lines];
    const positioned = lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);

    for (let index = 0; index < lines.length; index++) {
      const anchor = lines[index]!;
      const match = labels.map((pattern) => pattern.exec(anchor.text)).find(Boolean);
      if (!match) continue;

      const inline = cleanText(match[1] ?? '');
      if (inline && validate(inline)) {
        candidates.push({
          value: inline, confidence: anchor.confidence, page: anchor.page,
          lineIds: [anchor.id], method: 'anchor-inline', anchor: anchorName,
        });
        continue;
      }

      if (anchor.box) {
        const height = boxHeight(anchor);
        const centerY = (anchor.box[1] + anchor.box[3]) / 2;
        const right = positioned.filter((line) => {
          if (line === anchor || !line.box || line.confidence < 0.35 || !validate(line.text)) return false;
          const center = (line.box[1] + line.box[3]) / 2;
          return line.box[0] >= anchor.box![2] - height * 0.5 &&
            line.box[0] - anchor.box![2] <= height * 16 &&
            Math.abs(center - centerY) <= height * 1.35;
        }).sort((a, b) => a.box![0] - b.box![0] || b.confidence - a.confidence)[0];

        if (right) {
          candidates.push({
            value: cleanText(right.text),
            confidence: Math.min(anchor.confidence, right.confidence),
            page: anchor.page, lineIds: [anchor.id, right.id],
            method: 'anchor-right', anchor: anchorName,
          });
          continue;
        }

        const below = positioned.filter((line) => {
          if (line === anchor || !line.box || line.confidence < 0.35 || !validate(line.text)) return false;
          const dy = line.box[1] - anchor.box![3];
          if (dy < -height * 0.25 || dy > height * 5) return false;
          return horizontalOverlap(anchor, line) > 0 ||
            Math.abs(line.box[0] - anchor.box![0]) <= height * 7;
        }).sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0])[0];

        if (below) {
          candidates.push({
            value: cleanText(below.text),
            confidence: Math.min(anchor.confidence, below.confidence),
            page: anchor.page, lineIds: [anchor.id, below.id],
            method: 'anchor-below', anchor: anchorName,
          });
          continue;
        }
      }

      for (let offset = 1; offset <= 3; offset++) {
        const next = lines[index + offset];
        if (!next || !validate(next.text)) continue;
        candidates.push({
          value: cleanText(next.text),
          confidence: Math.min(anchor.confidence, next.confidence),
          page: anchor.page, lineIds: [anchor.id, next.id],
          method: 'anchor-sequential', anchor: anchorName,
        });
        break;
      }
    }
  }

  return candidates;
}

export function anchoredValue(
  observation: DocumentObservation,
  labels: readonly RegExp[],
  anchorName: string,
  validate: (value: string) => boolean,
): ExtractedCandidate | null {
  return selectUniqueCandidate(anchoredCandidates(
    observation, labels, anchorName, validate));
}

export function uniqueLineValue(
  observation: DocumentObservation,
  pattern: RegExp,
  validate: (value: string) => boolean,
  method: string,
): ExtractedCandidate | null {
  const candidates: ExtractedCandidate[] = [];
  for (const page of observation.pages) {
    for (const line of page.lines) {
      const matches = line.text.matchAll(pattern);
      for (const match of matches) {
        const value = cleanText(match[1] ?? match[0] ?? '');
        if (!validate(value)) continue;
        candidates.push({
          value, confidence: line.confidence, page: line.page,
          lineIds: [line.id], method,
        });
      }
    }
  }
  return selectUniqueCandidate(candidates);
}

export function toEvidence(
  candidate: ExtractedCandidate | null,
  context: ExtractionContext,
  fieldId: string,
): FieldEvidence | null {
  if (!candidate) return null;
  return {
    fieldId,
    value: candidate.value,
    confidence: candidate.confidence,
    documentId: context.documentId,
    sourceId: context.sourceId,
    page: candidate.page,
    method: candidate.method,
    ...(candidate.anchor ? { anchor: candidate.anchor } : {}),
    lineIds: candidate.lineIds,
    status: 'REVIEW_REQUIRED',
  };
}


function verticalCenter(line: ObservationLine): number | null {
  return line.box ? (line.box[1] + line.box[3]) / 2 : null;
}

/**
 * Builds short left-to-right phrases from nearby OCR/PDF segments on the same row.
 * This repairs layouts where a label/value is split into several boxes without
 * flattening unrelated rows or pages into one arbitrary string.
 */
export function spatialPhrases(observation: DocumentObservation): readonly ObservationLine[] {
  const phrases: ObservationLine[] = [];

  for (const page of observation.pages) {
    const positioned = page.lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);

    for (let start = 0; start < positioned.length; start++) {
      const first = positioned[start]!;
      const firstCenter = verticalCenter(first)!;
      const height = boxHeight(first);
      const selected: ObservationLine[] = [first];

      for (let offset = 1; offset <= 5; offset++) {
        const next = positioned[start + offset];
        if (!next?.box || next.page !== first.page) break;
        const center = verticalCenter(next)!;
        if (Math.abs(center - firstCenter) > Math.max(3, height * 0.8)) break;
        const previous = selected.at(-1)!;
        const gap = next.box[0] - previous.box![2];
        if (gap < -height || gap > height * 18) break;
        selected.push(next);
      }

      for (let count = 2; count <= selected.length; count++) {
        const group = selected.slice(0, count);
        const text = cleanText(group.map((line) => line.text).join(' '));
        if (!text || text.length > 220) continue;
        phrases.push({
          id: 'phrase:' + group.map((line) => line.id).join('+'),
          page: first.page,
          text,
          confidence: Math.min(...group.map((line) => line.confidence)),
          box: [
            Math.min(...group.map((line) => line.box![0])),
            Math.min(...group.map((line) => line.box![1])),
            Math.max(...group.map((line) => line.box![2])),
            Math.max(...group.map((line) => line.box![3])),
          ],
          polygon: null,
        });
      }
    }
  }

  return phrases;
}

export function withSpatialPhrases(observation: DocumentObservation): DocumentObservation {
  const extra = spatialPhrases(observation);
  if (extra.length === 0) return observation;
  return {
    ...observation,
    pages: observation.pages.map((page) => ({
      ...page,
      lines: [
        ...page.lines,
        ...extra.filter((line) => line.page === page.page),
      ],
    })),
  };
}
