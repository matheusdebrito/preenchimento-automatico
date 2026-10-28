import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  FieldExtractionAssessment,
} from './contracts.js';
import { identityDocumentExtractor } from './extractors/identity.js';
import { tieDocumentExtractor } from './extractors/tie.js';
import { residenceProofDocumentExtractor } from './extractors/residence-proof.js';

const extractors: readonly DocumentExtractor[] = [
  identityDocumentExtractor,
  tieDocumentExtractor,
  residenceProofDocumentExtractor,
];

export function extractDocumentEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
): readonly FieldEvidence[] {
  const extractor = extractors.find((candidate) =>
    candidate.documentType === context.documentType);
  return extractor?.extract(observation, context) ?? [];
}


export function assessDocumentFields(
  observation: DocumentObservation,
  context: ExtractionContext,
): readonly FieldExtractionAssessment[] {
  const extractor = extractors.find((candidate) =>
    candidate.documentType === context.documentType);
  if (!extractor) return [];
  if (extractor.assess) return extractor.assess(observation, context);

  const evidence = extractor.extract(observation, context);
  if (!extractor.supportedFields) {
    return evidence.map((item) => ({
      fieldId: item.fieldId,
      status: 'FOUND' as const,
      confidence: item.confidence,
      method: item.method,
      ...(item.anchor ? { anchor: item.anchor } : {}),
    }));
  }

  const byField = new Map(evidence.map((item) => [item.fieldId, item]));
  return extractor.supportedFields.map((fieldId) => {
    const item = byField.get(fieldId);
    return item ? {
      fieldId,
      status: 'FOUND' as const,
      confidence: item.confidence,
      method: item.method,
      ...(item.anchor ? { anchor: item.anchor } : {}),
    } : {
      fieldId,
      status: 'NOT_FOUND' as const,
      confidence: null,
    };
  });
}
