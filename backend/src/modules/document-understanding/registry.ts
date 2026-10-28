import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
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
