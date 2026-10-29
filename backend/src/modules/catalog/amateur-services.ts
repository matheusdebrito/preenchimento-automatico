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

const motonautaDeclarationQuestion: ServiceQuestion = {
  id: 'motonautaDeclaration',
  label: 'Você declara que conduz ou já conduziu moto aquática?',
  options: ['sim', 'nao'],
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
  {
    id: 'pedido-revisao-prova-capitao',
    name: 'Pedido de Revisão de Prova de Capitão-Amador',
    description: 'NORMAM-211/DPC 2026 - Apêndice I do Anexo 5-A.',
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
    sha256: '06E753608DE9B2C8D29B4380EB2EFF7D81B9E5376B4AE2011AFD5F2AEAAC78BF',
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
    verifiedAt: null,
    sha256: null,
    templatePath: null,
    pdfKind: 'STATIC',
    status: 'IDENTIFIED',
  },
  {
    id: 'pedido-revisao-prova-capitao-2026-v1',
    formId: 'pedido-revisao-prova-capitao',
    revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Apêndice I do Anexo 5-A',
    regulation: 'NORMAM-211/DPC 2026, Apêndice I do Anexo 5-A',
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
    description: 'Preenchimento do requerimento para inscrição no exame de Arrais-Amador, Mestre-Amador ou Capitão-Amador. O 5-H é usado conforme orientação operacional vigente da Marinha. Os uploads são apenas fontes opcionais de dados; a aplicação não valida a documentação exigida para protocolo.',
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
    description: 'Fluxo identificado nas NORMAM-211 e NORMAM-212. Depende da homologação do requerimento 3-A da NORMAM-212 antes da liberação.',
    creditCost: 1,
    status: 'DRAFT',
    questions: [amateurCategoryQuestion, motonautaDeclarationQuestion],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity', 'residence-proof'].includes(item.id)),
  },
  {
    id: 'revisao-prova-capitao-amador',
    title: 'Pedido de revisão de prova de Capitão-Amador',
    description: 'Preenchimento do requerimento 5-H e do Pedido de Revisão de Prova do Apêndice I do Anexo 5-A. Permanece em validação até o PDF específico ser versionado e homologado.',
    creditCost: 1,
    status: 'DRAFT',
    questions: [],
    documentRequirements: commonDocuments.filter((item) =>
      ['applicant-identity'].includes(item.id)),
  },
];

export const amateurServiceForms: readonly ServiceForm[] = [
  {
    serviceId: 'inscricao-exame-amador',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: { 'process.amateurRequest': 'emissao_renovacao' },
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
  {
    serviceId: 'revisao-prova-capitao-amador',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    order: 1,
    fixedValues: {
      'process.amateurRequest': 'revisao_prova_capitao',
      'process.notes': 'Pedido de revisão de prova de Capitão-Amador',
    },
  },
  {
    serviceId: 'revisao-prova-capitao-amador',
    formVersionId: 'pedido-revisao-prova-capitao-2026-v1',
    order: 2,
  },
];
