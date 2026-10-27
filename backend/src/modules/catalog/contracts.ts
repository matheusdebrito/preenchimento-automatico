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
}

export interface ServiceCondition {
  questionId: string;
  equals: string;
}

export interface DocumentRequirement {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  /** All conditions must match; absent means unconditional. */
  conditions?: readonly ServiceCondition[];
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
