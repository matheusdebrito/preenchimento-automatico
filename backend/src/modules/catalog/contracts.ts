/**
 * Contratos de catálogo. Nenhum formulário é liberado em produção sem
 * fonte oficial, versão, mapeamento e validação humana documentados.
 *
 * Estes tipos não contêm dados pessoais de clientes.
 */
export type CatalogStatus =
  | 'IDENTIFIED'
  | 'MAPPED'
  | 'TESTED'
  | 'APPROVED'
  | 'OUTDATED';

export type FieldValueKind = 'text' | 'date' | 'boolean' | 'number';
export type PdfTemplateKind = 'ACROFORM' | 'STATIC' | 'UNKNOWN';

export interface FieldDefinition {
  /** Identificador semântico estável, p.ex. person.cpf. */
  id: string;
  label: string;
  valueKind: FieldValueKind;
  /** Informa a regra de validação sem acoplar os campos ao OCR. */
  validationRuleId?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  /** Versão interna imutável do mapeamento/modelo. */
  version: string;
  regulation: string;
  sourceUrl: string | null;
  verifiedAt: string | null;
  /** SHA-256 do arquivo PDF original, quando disponibilizado. */
  sha256: string | null;
  templatePath: string | null;
  pdfKind: PdfTemplateKind;
  status: CatalogStatus;
  /** IDs dos campos semânticos necessários para preencher este modelo. */
  fieldIds: readonly string[];
}

export interface DocumentRequirement {
  id: string;
  label: string;
  description?: string;
  /** Obrigatório somente se as condições do serviço indicarem. */
  required: boolean;
}

export interface ServiceCondition {
  /** Chave de uma resposta controlada e validada no servidor. */
  questionId: string;
  equals: string | boolean;
}

export interface ServiceForm {
  serviceId: string;
  formTemplateId: string;
  /** Condições devem ser avaliadas no backend, sem código arbitrário. */
  conditions?: readonly ServiceCondition[];
  order: number;
}

export interface ServiceDefinition {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  status: 'DRAFT' | 'AVAILABLE' | 'SUSPENDED';
  documentRequirements: readonly DocumentRequirement[];
  /** O relacionamento é separado do template para permitir muitos-para-muitos. */
  formRelations: readonly ServiceForm[];
}

export interface CatalogDefinition {
  fields: readonly FieldDefinition[];
  templates: readonly FormTemplate[];
  services: readonly ServiceDefinition[];
}
