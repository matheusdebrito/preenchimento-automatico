import type {
  DocumentRequirement,
  FormDefinition,
  FormVersion,
  ServiceDefinition,
  ServiceForm,
  ServiceQuestion,
} from './contracts.js';
import {
  APPLICANT_IDENTITY_FIELDS,
  NO_AUTOMATIC_FIELDS,
  RESIDENCE_PROOF_FIELDS,
} from './document-field-policies.js';

const amateurCategoryQuestion: ServiceQuestion = {
  id: 'amateurCategory',
  label: 'Categoria de amador',
  options: ['arrais', 'mestre', 'capitao'],
};

const chaSituationQuestion: ServiceQuestion = {
  id: 'chaSituation',
  label: 'Situação da CHA',
  options: ['regular', 'extraviada', 'roubada', 'furtada', 'danificada'],
};

const commonDocuments: readonly DocumentRequirement[] = [
  {
    id: 'training-certificate-arrais',
    label: 'Atestado de Treinamento Náutico para Arrais-Amador',
    description: 'Anexo 5-E. Aplicável à inscrição inicial para Arrais-Amador.',
    required: false,
    conditions: [{ questionId: 'amateurCategory', equals: 'arrais' }],
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
  {
    id: 'current-cha-prerequisite',
    label: 'CHA atual da categoria anterior',
    description: 'Arrais válido para Mestre; Mestre válido para Capitão.',
    required: false,
    conditions: [{ questionId: 'amateurCategory', oneOf: ['mestre', 'capitao'] }],
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
  {
    id: 'applicant-identity',
    label: 'Documento oficial de identificação',
    description: 'RG, CIN ou CNH. O arquivo é opcional e pode sugerir dados para revisão.',
    required: false,
    extraction: {
      documentType: 'identity',
      subjectRole: 'person',
      allowedFieldIds: APPLICANT_IDENTITY_FIELDS,
    },
  },

  {
    id: 'residence-proof',
    label: 'Comprovante de residência',
    required: false,
    extraction: {
      documentType: 'residence-proof',
      subjectRole: 'person',
      allowedFieldIds: RESIDENCE_PROOF_FIELDS,
    },
  },
  {
    id: 'medical-or-cnh',
    label: 'Atestado médico ou CNH válida',
    description: 'A NORMAM permite dispensar o atestado médico quando apresentada CNH válida.',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
  {
    id: 'gru-receipt',
    label: 'Comprovante de pagamento da GRU',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
];

const renewalCurrentCha: DocumentRequirement = {
  id: 'current-cha',
  label: 'Carteira de Habilitação de Amador (CHA) atual',
  description: 'Para modelos em cédula, a NORMAM prevê apresentação da CHA original quando disponível.',
  required: false,
  extraction: {
    documentType: 'supporting-document',
    subjectRole: 'person',
    allowedFieldIds: NO_AUTOMATIC_FIELDS,
  },
};

export const amateurForms: readonly FormDefinition[] = [
  {
    id: 'requerimento-cha-amador',
    name: 'Requerimento de serviços de amadores',
    description: 'NORMAM-211/DPC 2026 - Anexo 5-H.',
  },
  {
    id: 'declaracao-extravio-cha-amador',
    name: 'Declaração de extravio, furto, roubo ou dano da CHA',
    description: 'NORMAM-211/DPC 2026 - Anexo 5-D.',
  },
];

export const amateurVersions: readonly FormVersion[] = [
  {
    id: 'requerimento-cha-amador-2026-v1',
    formId: 'requerimento-cha-amador',
    revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 5-H',
    regulation: 'NORMAM-211/DPC 2026, Anexo 5-H',
    sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf',
    verifiedAt: null,
    sha256: null,
    templatePath: null,
    pdfKind: 'STATIC',
    status: 'IDENTIFIED',
  },
  {
    id: 'declaracao-extravio-cha-amador-2026-v1',
    formId: 'declaracao-extravio-cha-amador',
    revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 5-D',
    regulation: 'NORMAM-211/DPC 2026, Anexo 5-D',
    sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf',
    verifiedAt: null,
    sha256: null,
    templatePath: null,
    pdfKind: 'STATIC',
    status: 'IDENTIFIED',
  },
];

export const amateurServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-exame-amador',
    title: 'Inscrição para exame de amador',
    description: 'Inscrição para exame de Arrais, Mestre ou Capitão conforme o art. 5.4.1. A norma lista a documentação exigida, mas não vincula este procedimento ao Anexo 5-H; por isso nenhum formulário é inventado.',
    creditCost: 1,
    status: 'DRAFT',
    questions: [amateurCategoryQuestion],
    documentRequirements: commonDocuments,
  },
  {
    id: 'renovacao-cha-amador',
    title: 'Renovação da CHA',
    description: 'Renovação de Arrais-Amador, Mestre-Amador ou Capitão-Amador. Perda, roubo, furto ou dano da cédula também segue renovação; não há segunda via separada.',
    creditCost: 1,
    status: 'DRAFT',
    questions: [amateurCategoryQuestion, chaSituationQuestion],
    documentRequirements: [renewalCurrentCha, ...commonDocuments.filter((item) =>
      !['training-certificate-arrais', 'current-cha-prerequisite'].includes(item.id))],
  },
];

export const amateurServiceForms: readonly ServiceForm[] = [
  {
    serviceId: 'renovacao-cha-amador',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: { 'process.amateurRequest': 'emissao_renovacao' },
  },
  {
    serviceId: 'renovacao-cha-amador',
    formVersionId: 'declaracao-extravio-cha-amador-2026-v1',
    order: 2,
    conditions: [{ questionId: 'chaSituation', oneOf: ['extraviada', 'roubada', 'furtada', 'danificada'] }],
  },
];
