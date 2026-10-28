import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
} from './contracts.js';
import { identityDocumentExtractor } from './extractors/identity.js';

const extractors: readonly DocumentExtractor[] = [
  identityDocumentExtractor,
];

export function extractDocumentEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
): readonly FieldEvidence[] {
  const extractor = extractors.find((candidate) =>
    candidate.documentType === context.documentType);
  return extractor?.extract(observation, context) ?? [];
}
