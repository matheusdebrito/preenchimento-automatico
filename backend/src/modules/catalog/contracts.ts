/** Contracts for independently versioned official forms and service associations. */
export type FormVersionStatus = 'IDENTIFIED' | 'VERIFIED' | 'OUTDATED';
export type MappingStatus = 'DRAFT' | 'TESTED' | 'APPROVED';
export type PdfTemplateKind = 'ACROFORM' | 'STATIC' | 'UNKNOWN';
export type FieldValueKind = 'text' | 'date' | 'boolean' | 'number';

export interface FieldDefinition {
  /** Reusable semantic ID; never a physical PDF coordinate. */
  id: string;
  label: string;
  valueKind: FieldValueKind;
  validationRuleId?: string;
}

export interface FormDefinition {
  /** Stable document identity, independent of services and revisions. */
  id: string;
  name: string;
  description?: string;
}

export interface FormVersion {
  id: string;
  formId: string;
  /** Internal immutable directory revision, e.g. v1 (not official revision). */
  revision: string;
  officialRevision: string | null;
  regulation: string;
  sourceUrl: string | null;
  verifiedAt: string | null;
  sha256: string | null;
  /** backend/templates/<formId>/<revision>/original.pdf */
  templatePath: string | null;
  pdfKind: PdfTemplateKind;
  status: FormVersionStatus;
}

export interface AcroFormPlacement {
  kind: 'ACROFORM';
  fieldId: string;
  required: boolean;
  pdfFieldName: string;
}

export interface CoordinatePlacement {
  kind: 'COORDINATES';
  fieldId: string;
  required: boolean;
  /** Zero-based page; PDF points, origin at bottom-left. */
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  maxWidth: number;
  /** Optional fixed-choice value; selected coordinates receive X, others stay blank. */
  markWhen?: string;
  /** Reviewed textual aliases accepted for this fixed choice after accent/case normalization. */
  markAliases?: readonly string[];
  /** Optional presentation-only transformation; the canonical value remains unchanged. */
  valueTransform?: 'DATE_DAY' | 'DATE_MONTH_NUMBER' | 'DATE_MONTH_NAME_PT_BR' |
    'DATE_YEAR' | 'DATE_YEAR_2';
}

export type FieldPlacement = AcroFormPlacement | CoordinatePlacement;

export interface FormMapping {
  id: string;
  formVersionId: string;
  /** Independent technical mapping revision. */
  revision: string;
  status: MappingStatus;
  placements: readonly FieldPlacement[];
  /** Human review of synthetic output, required for APPROVED. */
  reviewedAt: string | null;
  reviewer: string | null;
  reportPath: string | null;
}

export interface ServiceQuestion {
  id: string;
  label: string;
  /** Only explicitly enumerated answers may be used in rules. */
  options: readonly string[];
  /** Options displayed to the user but temporarily blocked from selection. */
  unavailableOptions?: readonly string[];
  /** All conditions must match for the question to be relevant. */
  conditions?: readonly ServiceCondition[];
}

export interface ServiceCondition {
  questionId: string;
  /** Exactly one of equals/oneOf must be defined. */
  equals?: string;
  oneOf?: readonly string[];
}

export interface DocumentExtractionProfile {
  /** Reusable document-understanding strategy; never a service ID. */
  documentType: 'identity' | 'tie' | 'residence-proof' | 'sale-document' | 'supporting-document';
  /** Semantic owner of the extracted values. */
  subjectRole: 'person' | 'seller' | 'vessel' | 'representative' | 'declarant' | 'coOwner';
  /**
   * Authoritative allow-list for fields that this specific source document may
   * provide. The extraction provider must enforce this server-side.
   */
  allowedFieldIds: readonly string[];
}

export interface DocumentRequirement {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  /**
   * Optional OCR/understanding profile. Known document types may produce
   * semantic fields; supporting-document may still run OCR while deliberately
   * producing no field until a reviewed extractor exists.
   */
  extraction?: DocumentExtractionProfile;
  /** All conditions must match; absent means unconditional. */
  conditions?: readonly ServiceCondition[];
  /** Fields physically present in the PDF but not applicable to this service relation. */
  excludedReviewFieldIds?: readonly string[];
  /** Additional per-field applicability rules evaluated against validated service answers. */
  reviewFieldConditions?: Readonly<Record<string, readonly ServiceCondition[]>>;
}

export interface ServiceDefinition {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  status: 'DRAFT' | 'AVAILABLE' | 'SUSPENDED';
  questions: readonly ServiceQuestion[];
  documentRequirements: readonly DocumentRequirement[];
}

/** Many-to-many relationship pinned to a specific verified PDF version. */
export interface ServiceForm {
  serviceId: string;
  formVersionId: string;
  order: number;
  /** Static values supplied by the service, never trusted from the browser. */
  fixedValues?: Readonly<Record<string, string>>;
  /** Copy an already validated service answer into a semantic PDF field. */
  answerBindings?: Readonly<Record<string, string>>;
  /** Map a validated enumerated answer to reviewed presentation text for a PDF field. */
  answerValueMappings?: Readonly<Record<string, {
    questionId: string;
    values: Readonly<Record<string, string>>;
  }>>;
  /** All conditions must match; absent means unconditional. */
  conditions?: readonly ServiceCondition[];
}

export interface CatalogDefinition {
  fields: readonly FieldDefinition[];
  forms: readonly FormDefinition[];
  versions: readonly FormVersion[];
  mappings: readonly FormMapping[];
  services: readonly ServiceDefinition[];
  serviceForms: readonly ServiceForm[];
}
