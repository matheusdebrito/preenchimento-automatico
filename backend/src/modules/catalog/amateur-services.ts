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

const motonautaDeclarationQuestion: ServiceQuestion = {
  id: 'motonautaDeclaration',
  label: 'Você declara que conduz ou já conduziu moto aquática?',
  options: ['sim', 'nao'],
};

const commonDocuments: readonly DocumentRequirement[] = [
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
];

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
  {
    id: 'requerimento-motonauta',
    name: 'Requerimento de Motonauta',
    description: 'NORMAM-212/DPC 2026 - Anexo 3-A.',
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
    verifiedAt: '2026-10-29',
    sha256: 'E8E988F19C5E09C3307201003DD81ACF7932C964E25E4CD8B4262AC9369A1D9F',
    templatePath: 'backend/templates/requerimento-cha-amador/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
  {
    id: 'declaracao-extravio-cha-amador-2026-v1',
    formId: 'declaracao-extravio-cha-amador',
    revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 5-D',
    regulation: 'NORMAM-211/DPC 2026, Anexo 5-D',
    sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf',
    verifiedAt: '2026-10-29',
    sha256: '53DD1F6576B3B9C6C4D1B056B18F4333DBCC24C3DE8FB18047B32B6AEBE9850E',
    templatePath: 'backend/templates/declaracao-extravio-cha-amador/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
  {
    id: 'requerimento-motonauta-2026-v1',
    formId: 'requerimento-motonauta',
    revision: 'v1',
    officialRevision: 'NORMAM-212/DPC 2026 - Anexo 3-A',
    regulation: 'NORMAM-212/DPC 2026, Anexo 3-A',
    sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf',
    verifiedAt: '2026-10-29',
    sha256: '43288872ACFFA54A36A2292A21ED3029E33809CD4B444741A3A0C2C1DCAFEF52',
    templatePath: 'backend/templates/requerimento-motonauta/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
];

export const amateurServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-exame-amador',
    title: 'Inscrição para exame de amador',
    description: 'Preenchimento do Anexo 5-H para inscrição nos exames de Arrais-Amador, Mestre-Amador ou Capitão-Amador. A aplicação prepara o requerimento; documentos de treinamento, habilitação anterior, GRU e requisitos médicos continuam sendo conferidos no protocolo pela CP/DL/AG.',
    creditCost: 1,
    status: 'AVAILABLE',
    questions: [amateurCategoryQuestion],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
  {
    id: 'renovacao-cha-amador',
    title: 'Renovação da CHA',
    description: 'Preenchimento dos formulários de renovação da CHA para Arrais-Amador, Mestre-Amador ou Capitão-Amador. Perda, roubo, furto ou dano da cédula também usa este fluxo. Os uploads são apenas fontes opcionais de dados; a aplicação não valida os documentos exigidos para protocolo na Marinha.',
    creditCost: 1,
    status: 'AVAILABLE',
    questions: [amateurCategoryQuestion, chaSituationQuestion],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
  {
    id: 'emissao-cha-veleiro',
    title: 'Emissão de CHA de Veleiro',
    description: 'Preenchimento do requerimento 5-H para emissão da CHA de Veleiro. A declaração 5-G é emitida e assinada pela entidade de treinamento e não é gerada pela aplicação.',
    creditCost: 1,
    status: 'AVAILABLE',
    questions: [],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
  {
    id: 'concessao-cha-equivalencia',
    title: 'Concessão de CHA por equivalência profissional',
    description: 'Preenchimento do requerimento 5-H para concessão de CHA por correspondência/equivalência profissional nas categorias Arrais, Mestre ou Capitão.',
    creditCost: 1,
    status: 'AVAILABLE',
    questions: [amateurCategoryQuestion],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
  {
    id: 'renovacao-cha-agregacao-mta',
    title: 'Renovação da CHA com agregação de Motonauta',
    description: 'Preenchimento do requerimento 5-H e do Anexo 3-A da NORMAM-212 para renovação da CHA de Arrais, Mestre ou Capitão com agregação da categoria Motonauta.',
    creditCost: 1,
    status: 'AVAILABLE',
    questions: [amateurCategoryQuestion, motonautaDeclarationQuestion],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
];

export const amateurServiceForms: readonly ServiceForm[] = [
  {
    serviceId: 'inscricao-exame-amador',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    // The current 5-H has no dedicated "inscrição para exame" checkbox.
    // Operational CP/DL/AG pages require 5-H for exam enrollment, so record
    // the exact request in "Descrição do pedido" instead of marking
    // "Emissão/Renovação" by inference.
    answerValueMappings: {
      'process.notes': {
        questionId: 'amateurCategory',
        values: {
          arrais: 'Inscrição para exame de Arrais-Amador',
          mestre: 'Inscrição para exame de Mestre-Amador',
          capitao: 'Inscrição para exame de Capitão-Amador',
        },
      },
    },
  },
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
    answerBindings: { 'process.chaLossReason': 'chaSituation' },
  },
  {
    serviceId: 'emissao-cha-veleiro',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: {
      'process.amateurRequest': 'emissao_renovacao',
      'process.notes': 'Emissão de CHA de Veleiro',
    },
  },
  {
    serviceId: 'concessao-cha-equivalencia',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: { 'process.amateurRequest': 'equivalencia_profissional' },
    answerValueMappings: {
      'process.notes': {
        questionId: 'amateurCategory',
        values: {
          arrais: 'Concessão de CHA de Arrais-Amador por equivalência profissional',
          mestre: 'Concessão de CHA de Mestre-Amador por equivalência profissional',
          capitao: 'Concessão de CHA de Capitão-Amador por equivalência profissional',
        },
      },
    },
  },
  {
    serviceId: 'renovacao-cha-agregacao-mta',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: { 'process.amateurRequest': 'renovacao_agregacao_mta' },
  },
  {
    serviceId: 'renovacao-cha-agregacao-mta',
    formVersionId: 'requerimento-motonauta-2026-v1',
    order: 2,
    fixedValues: { 'process.motonautaRequest': 'renovacao_agregacao_mta' },
    answerBindings: { 'process.motonautaDeclaration': 'motonautaDeclaration' },
  },
];
