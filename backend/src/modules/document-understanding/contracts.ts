export type DocumentTypeId =
  | 'identity'
  | 'tie'
  | 'residence-proof'
  | 'sale-document';

export type DocumentSubjectRole =
  | 'person'
  | 'seller'
  | 'vessel'
  | 'representative'
  | 'declarant'
  | 'coOwner';

export type ObservationBox = readonly [number, number, number, number];

export interface ObservationLine {
  /** Stable only inside this OCR response; never persisted as an external identifier. */
  id: string;
  page: number;
  text: string;
  confidence: number;
  box: ObservationBox | null;
  polygon: readonly (readonly [number, number])[] | null;
}

export interface ObservationPage {
  page: number;
  orientation: number | null;
  lines: readonly ObservationLine[];
}

export interface DocumentObservation {
  engine: 'paddleocr' | 'pdf-text';
  engineVersion: string;
  model: string;
  elapsedMs: number;
  pages: readonly ObservationPage[];
}

export interface ExtractionContext {
  documentId: string;
  sourceId: string;
  documentType: DocumentTypeId;
  subjectRole: DocumentSubjectRole;
}

export interface FieldEvidence {
  fieldId: string;
  value: string;
  /** OCR/semantic confidence when measurable; legacy adapters use null. */
  confidence: number | null;
  documentId: string;
  sourceId: string;
  page: number;
  method: string;
  anchor?: string;
  lineIds: readonly string[];
  status: 'REVIEW_REQUIRED';
}

export interface DocumentExtractor {
  readonly documentType: DocumentTypeId;
  extract(
    observation: DocumentObservation,
    context: ExtractionContext,
  ): readonly FieldEvidence[];
}
