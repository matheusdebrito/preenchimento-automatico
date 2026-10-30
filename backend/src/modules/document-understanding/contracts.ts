/** Structured evidence returned by the OpenAI document-analysis provider. */
export interface FieldEvidence {
  fieldId: string;
  value: string;
  confidence: number | null;
  documentId: string;
  sourceId: string;
  page: number;
  method: string;
  anchor?: string;
  lineIds: readonly string[];
  status: 'REVIEW_REQUIRED';
}
