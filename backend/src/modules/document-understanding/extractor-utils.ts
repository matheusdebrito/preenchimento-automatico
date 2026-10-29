import type {
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  ObservationLine,
} from './contracts.js';

export const cleanText = (value: string): string => value.replace(/\s+/g, ' ').trim();
export const normalizeText = (value: string): string => cleanText(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export type CandidateDirection = 'right' | 'below' | 'sequential';

export interface ApproximateLabel {
  text: string;
  maxDistance: number;
}

/**
 * Field-specific geometric guidance. Distances are expressed in multiples of
 * the detected anchor height so the same rule works across resolutions.
 */
export interface SpatialSearchHint {
  minConfidence?: number;
  maxRightDistanceHeights?: number;
  sameRowToleranceHeights?: number;
  maxBelowDistanceHeights?: number;
  maxBelowHorizontalOffsetHeights?: number;
  maxSequentialLines?: number;
  /**
   * Optional margin required to resolve two different valid values by spatial
   * evidence. When omitted, distinct values remain ambiguous.
   */
  minSelectionScoreGap?: number;
}

const compactForLabelMatch = (value: string): string =>
  normalizeText(value).replace(/[^A-Z0-9]/g, '');

function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1]! + 1,
        previous[j]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length]!;
}

export function matchesApproximateLabel(
  value: string,
  aliases: readonly ApproximateLabel[],
): boolean {
  const source = compactForLabelMatch(value);
  return aliases.some(({ text, maxDistance }) => {
    const target = compactForLabelMatch(text);
    if (!target || source.length < Math.max(1, target.length - maxDistance)) return false;
    const minLength = Math.max(1, target.length - maxDistance);
    const maxLength = Math.min(source.length, target.length + maxDistance);
    for (let length = minLength; length <= maxLength; length++) {
      if (levenshteinDistance(source.slice(0, length), target) <= maxDistance) return true;
    }
    return false;
  });
}

export interface ExtractedCandidate {
  value: string;
  confidence: number | null;
  page: number;
  lineIds: readonly string[];
  method: string;
  anchor?: string;
  /** Internal ranking signal. It is never exposed as OCR confidence. */
  selectionScore?: number;
}

const boxHeight = (line: ObservationLine): number =>
  line.box ? Math.max(1, line.box[3] - line.box[1]) : 1;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function geometricSelectionScore(
  anchor: ObservationLine,
  candidate: ObservationLine,
  proximity: number,
  alignment: number,
  exactLabel: boolean,
): number {
  const confidence = Math.min(anchor.confidence, candidate.confidence);
  const phrasePenalty = candidate.id.startsWith('phrase:') ? 0.08 : 0;
  return confidence * 0.45 +
    (exactLabel ? 1 : 0.82) * 0.20 +
    clamp01(proximity) * 0.20 +
    clamp01(alignment) * 0.15 -
    phrasePenalty;
}

function horizontalOverlap(a: ObservationLine, b: ObservationLine): number {
  if (!a.box || !b.box) return 0;
  return Math.max(0, Math.min(a.box[2], b.box[2]) - Math.max(a.box[0], b.box[0]));
}

function horizontalOverlapRatio(a: ObservationLine, b: ObservationLine): number {
  if (!a.box || !b.box) return 0;
  const overlap = horizontalOverlap(a, b);
  const aWidth = Math.max(1, a.box[2] - a.box[0]);
  const bWidth = Math.max(1, b.box[2] - b.box[0]);
  return overlap / Math.min(aWidth, bWidth);
}

function looksMaskedPlaceholder(value: string): boolean {
  const compact = value.replace(/\s+/g, '');
  if (compact.length < 3) return false;
  if (/^[Xx*._•-]+$/.test(compact)) return true;
  const maskChars = compact.match(/[*._•]/g)?.length ?? 0;
  const alnum = compact.match(/[A-Z0-9]/gi)?.length ?? 0;
  return maskChars >= 3 && maskChars >= alnum;
}

export function selectUniqueCandidate(
  candidates: readonly ExtractedCandidate[],
  minSelectionScoreGap?: number,
): ExtractedCandidate | null {
  const unique = new Map<string, ExtractedCandidate>();
  const rankingScore = (candidate: ExtractedCandidate): number =>
    candidate.selectionScore ?? candidate.confidence ?? -1;

  for (const candidate of candidates) {
    const key = normalizeText(candidate.value);
    const prior = unique.get(key);
    if (!prior || rankingScore(candidate) > rankingScore(prior)) {
      unique.set(key, candidate);
    }
  }

  if (unique.size === 1) return [...unique.values()][0]!;
  if (unique.size === 0 || minSelectionScoreGap === undefined) return null;

  const ranked = [...unique.values()].sort((a, b) =>
    rankingScore(b) - rankingScore(a));
  const best = ranked[0]!;
  const second = ranked[1]!;
  return rankingScore(best) - rankingScore(second) >= minSelectionScoreGap
    ? best
    : null;
}

export function anchoredCandidates(
  observation: DocumentObservation,
  labels: readonly RegExp[],
  anchorName: string,
  validate: (value: string) => boolean,
  preferredDirections: readonly CandidateDirection[] = [],
  isFieldBoundary: (value: string) => boolean = () => false,
  allowSequentialWithGeometry = true,
  firstOccurrenceOnly = false,
  approximateLabels: readonly ApproximateLabel[] = [],
  spatialHint: SpatialSearchHint = {},
): readonly ExtractedCandidate[] {
  const candidates: ExtractedCandidate[] = [];
  const minConfidence = spatialHint.minConfidence ?? 0.35;
  const maxRightDistanceHeights = spatialHint.maxRightDistanceHeights ?? 16;
  const sameRowToleranceHeights = spatialHint.sameRowToleranceHeights ?? 1.35;
  const maxBelowDistanceHeights = spatialHint.maxBelowDistanceHeights ?? 5;
  const maxBelowHorizontalOffsetHeights =
    spatialHint.maxBelowHorizontalOffsetHeights ?? 7;
  const maxSequentialLines = spatialHint.maxSequentialLines ?? 3;

  for (const page of observation.pages) {
    const lines = [...page.lines];
    const positioned = lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);

    const matchesConfiguredLabel = (value: string): boolean =>
      labels.some((pattern) => pattern.test(value)) ||
      matchesApproximateLabel(value, approximateLabels);
    const hasOriginalLabel = lines.some((line) =>
      !line.id.startsWith('phrase:') && matchesConfiguredLabel(line.text));

    for (let index = 0; index < lines.length; index++) {
      const anchor = lines[index]!;
      const candidatesBeforeAnchor = candidates.length;
      if (anchor.id.startsWith('phrase:') && hasOriginalLabel) continue;
      const match = labels.map((pattern) => pattern.exec(anchor.text)).find(Boolean);
      const approximateMatch = !match && matchesApproximateLabel(anchor.text, approximateLabels);
      if (!match && !approximateMatch) continue;

      const matchesAnyLabel = (value: string): boolean =>
        matchesConfiguredLabel(value);
      const isBoundary = (value: string): boolean =>
        matchesAnyLabel(value) || isFieldBoundary(value) ||
        looksMaskedPlaceholder(value);

      const inline = cleanText(match?.[1] ?? '');
      if (inline && looksMaskedPlaceholder(inline)) {
        // A visible mask is evidence that this field is intentionally absent.
        // Do not skip past it and promote unrelated text farther in the page.
        if (firstOccurrenceOnly) return candidates;
        continue;
      }
      const syntheticPhrase = anchor.id.startsWith('phrase:');
      const preferBelow = preferredDirections[0] === 'below';
      // A synthetic same-row phrase may join a label with unrelated text at
      // the right. When the reviewed layout says the value is primarily below,
      // do not let that generated phrase outrank the original geometric anchor.
      if (inline && !isBoundary(inline) && validate(inline) &&
        !(syntheticPhrase && preferBelow)) {
        candidates.push({
          value: inline, confidence: anchor.confidence, page: anchor.page,
          lineIds: [anchor.id], method: 'anchor-inline', anchor: anchorName,
          selectionScore: anchor.confidence * 0.6 + (match ? 1 : 0.82) * 0.4,
        });
        if (firstOccurrenceOnly) return candidates;
        continue;
      }

      const defaultDirections: readonly CandidateDirection[] =
        anchor.box && !allowSequentialWithGeometry
          ? ['right', 'below']
          : ['right', 'below', 'sequential'];
      const directions = [...new Set([...preferredDirections, ...defaultDirections])];
      let matched = false;

      for (const direction of directions) {
        if (direction === 'right' && anchor.box) {
          const height = boxHeight(anchor);
          const centerY = (anchor.box[1] + anchor.box[3]) / 2;
          const sameRow = positioned.filter((line) => {
            if (line === anchor || !line.box) return false;
            const center = (line.box[1] + line.box[3]) / 2;
            return line.box[0] >= anchor.box![2] - height * 0.5 &&
              line.box[0] - anchor.box![2] <= height * maxRightDistanceHeights &&
              Math.abs(center - centerY) <= height * sameRowToleranceHeights;
          });
          const rightBoundaryX = sameRow
            .filter((line) => isBoundary(line.text))
            .map((line) => line.box![0])
            .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY;
          const right = sameRow.filter((line) => {
            if (line.confidence < minConfidence || isBoundary(line.text) || !validate(line.text)) return false;
            return line.box![0] < rightBoundaryX;
          }).map((line) => {
            const center = (line.box![1] + line.box![3]) / 2;
            const distance = Math.max(0, line.box![0] - anchor.box![2]);
            const verticalOffset = Math.abs(center - centerY);
            return {
              line,
              score: geometricSelectionScore(
                anchor,
                line,
                1 - distance / Math.max(1, height * maxRightDistanceHeights),
                1 - verticalOffset / Math.max(1, height * sameRowToleranceHeights),
                Boolean(match),
              ),
            };
          }).sort((a, b) => b.score - a.score)[0];

          if (right) {
            candidates.push({
              value: cleanText(right.line.text),
              confidence: Math.min(anchor.confidence, right.line.confidence),
              page: anchor.page, lineIds: [anchor.id, right.line.id],
              method: 'anchor-right', anchor: anchorName,
              selectionScore: right.score,
            });
            matched = true;
          }
        }

        if (direction === 'below' && anchor.box && !matched) {
          const height = boxHeight(anchor);
          const anchorCenterX = (anchor.box[0] + anchor.box[2]) / 2;
          const belowRegion = positioned.filter((line) => {
            if (line === anchor || !line.box) return false;
            const dy = line.box[1] - anchor.box![3];
            if (dy < -height * 0.25 || dy > height * maxBelowDistanceHeights) return false;
            const lineCenterX = (line.box[0] + line.box[2]) / 2;
            return horizontalOverlapRatio(anchor, line) >= 0.25 ||
              Math.abs(lineCenterX - anchorCenterX) <=
                height * maxBelowHorizontalOffsetHeights;
          });
          const belowBoundaryY = belowRegion
            .filter((line) => {
              if (!isBoundary(line.text) || !line.box) return false;
              // Labels from a neighboring column must not close this field's
              // vertical cell. Only same-column/overlapping boundaries do.
              const overlapRatio = horizontalOverlapRatio(anchor, line);
              const lineCenterX = (line.box[0] + line.box[2]) / 2;
              return overlapRatio >= 0.35 ||
                Math.abs(lineCenterX - anchorCenterX) <= height * 1.5;
            })
            .map((line) => line.box![1])
            .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY;
          const below = belowRegion.filter((line) => {
            if (line.confidence < minConfidence || isBoundary(line.text) || !validate(line.text)) return false;
            return line.box![1] < belowBoundaryY;
          }).map((line) => {
            const distance = Math.max(0, line.box![1] - anchor.box![3]);
            const overlapRatio = horizontalOverlapRatio(anchor, line);
            const lineCenterX = (line.box![0] + line.box![2]) / 2;
            const horizontalOffset = Math.abs(lineCenterX - anchorCenterX);
            return {
              line,
              score: geometricSelectionScore(
                anchor,
                line,
                1 - distance / Math.max(1, height * maxBelowDistanceHeights),
                overlapRatio >= 0.25
                  ? Math.max(overlapRatio, 0.6)
                  : 1 - horizontalOffset /
                    Math.max(1, height * maxBelowHorizontalOffsetHeights),
                Boolean(match),
              ),
            };
          }).sort((a, b) => b.score - a.score)[0];

          if (below) {
            candidates.push({
              value: cleanText(below.line.text),
              confidence: Math.min(anchor.confidence, below.line.confidence),
              page: anchor.page, lineIds: [anchor.id, below.line.id],
              method: 'anchor-below', anchor: anchorName,
              selectionScore: below.score,
            });
            matched = true;
          }
        }

        if (direction === 'sequential' && !matched) {
          for (let offset = 1; offset <= maxSequentialLines; offset++) {
            const next = lines[index + offset];
            if (!next) break;
            if (isBoundary(next.text)) break;
            if (!validate(next.text)) continue;
            candidates.push({
              value: cleanText(next.text),
              confidence: Math.min(anchor.confidence, next.confidence),
              page: anchor.page, lineIds: [anchor.id, next.id],
              method: 'anchor-sequential', anchor: anchorName,
              selectionScore: Math.min(anchor.confidence, next.confidence) * 0.55 +
                (match ? 1 : 0.82) * 0.20 +
                (1 - (offset - 1) / Math.max(1, maxSequentialLines)) * 0.15,
            });
            matched = true;
            break;
          }
        }

        if (matched) break;
      }

      if (firstOccurrenceOnly && candidates.length > candidatesBeforeAnchor) {
        return candidates;
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
