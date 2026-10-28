import type {
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
} from './contracts.js';
import {
  anchoredCandidates,
  selectUniqueCandidate,
  toEvidence,
  withSpatialPhrases,
} from './extractor-utils.js';

export type SemanticFieldStatus = 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS';

export interface SemanticFieldAssessment {
  fieldId: string;
  status: SemanticFieldStatus;
  confidence: number | null;
  method?: string;
  anchor?: string;
}

export interface SemanticFieldConcept {
  fieldId: string;
  anchor: string;
  labels: readonly RegExp[];
  validate(value: string): boolean;
  normalize?(value: string): string;
}

export interface SemanticExtractionResult {
  evidence: readonly FieldEvidence[];
  assessments: readonly SemanticFieldAssessment[];
}

/**
 * Extract semantic fields without requiring an old/digital layout classifier.
 * Each concept can list aliases observed across multiple layouts. Geometry,
 * validation and OCR confidence select candidates; conflicting values remain
 * ambiguous instead of being silently chosen.
 */
export function extractSemanticConcepts(
  observation: DocumentObservation,
  context: ExtractionContext,
  concepts: readonly SemanticFieldConcept[],
): SemanticExtractionResult {
  const source = withSpatialPhrases(observation);
  const evidence: FieldEvidence[] = [];
  const assessments: SemanticFieldAssessment[] = [];

  for (const concept of concepts) {
    const candidates = anchoredCandidates(
      source,
      concept.labels,
      concept.anchor,
      concept.validate,
    );
    const selected = selectUniqueCandidate(candidates);

    if (selected) {
      const normalized = concept.normalize
        ? { ...selected, value: concept.normalize(selected.value) }
        : selected;
      const item = toEvidence(normalized, context, concept.fieldId);
      if (item) evidence.push(item);
      assessments.push({
        fieldId: concept.fieldId,
        status: 'FOUND',
        confidence: normalized.confidence,
        method: normalized.method,
        ...(normalized.anchor ? { anchor: normalized.anchor } : {}),
      });
      continue;
    }

    const distinct = new Set(candidates.map((candidate) =>
      candidate.value.normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase()));

    assessments.push({
      fieldId: concept.fieldId,
      status: distinct.size > 1 ? 'AMBIGUOUS' : 'NOT_FOUND',
      confidence: null,
    });
  }

  return { evidence, assessments };
}
