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

const cirSecondCopyReason: ServiceQuestion = {
  id: 'cirSecondCopyReason',
  label: 'Motivo da 2ª via da CIR',
  options: ['dano', 'extravio', 'roubo', 'furto'],
};

const certificateModel: ServiceQuestion = {
  id: 'certificateModel',
  label: 'Modelo do certificado',
  options: ['dpc1031', 'dpc1032', 'dpc1033', 'dpc1034'],
};

const certificateSecondCopyModel: ServiceQuestion = {
  id: 'certificateModel',
  label: 'Modelo do certificado',
  // O Anexo 1-K atual não possui opção DPC-1032.
  options: ['dpc1031', 'dpc1033', 'dpc1034'],
};

const revalidatableCertificateModel: ServiceQuestion = {
  id: 'certificateModel',
  label: 'Modelo do certificado',
  // A NORMAM-101 trata revalidação para DPC-1031, DPC-1032 e DPC-1034.
  options: ['dpc1031', 'dpc1032', 'dpc1034'],
};

const personSexQuestion: ServiceQuestion = {
  id: 'personSex',
  label: 'Sexo',
  options: ['masculino', 'feminino'],
};

const certificateSecondCopyReason: ServiceQuestion = {
  id: 'certificateSecondCopyReason',
  label: 'Motivo da 2ª via do certificado',
  options: ['dano', 'extravio', 'roubo', 'furto'],
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
    id: 'current-cir',
    label: 'Caderneta de Inscrição e Registro (CIR)',
    description: 'Envie a CIR quando o processo utilizar seus dados. Nesta versão ela é mantida como documento de apoio para conferência manual.',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: [],
    },
  },
  {
    id: 'current-certificate',
    label: 'Certificado atual',
    description: 'Envie o certificado quando o processo utilizar seus dados. Nesta versão ele é mantido como documento de apoio para conferência manual.',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: [],
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

export const aquaviarioForms: readonly FormDefinition[] = [
  {
    id: 'requerimento-certificacao-aquaviario',
    name: 'Requerimento de Certificação',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-E.',
  },
  {
    id: 'declaracao-extravio-aquaviario',
    name: 'Declaração de Extravio, Roubo ou Furto',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-K.',
  },
  {
    id: 'declaracao-residencia-aquaviario',
    name: 'Declaração de Residência',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-L.',
  },
];

const sourceUrl = 'https://www.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-101.pdf';

export const aquaviarioVersions: readonly FormVersion[] = [
  {
    id: 'requerimento-certificacao-aquaviario-2026-v1',
    formId: 'requerimento-certificacao-aquaviario',
    revision: 'v1',
    officialRevision: 'NORMAM-101/DPC 2026 - Anexo 1-E',
    regulation: 'NORMAM-101/DPC 2026, Anexo 1-E',
    sourceUrl,
    verifiedAt: '2026-10-30',
    sha256: '536293EABB34EE5624C7D765BF3DE2B97DEEC449B591A7D9905405F86AD84100',
    templatePath: 'backend/templates/requerimento-certificacao-aquaviario/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
  {
    id: 'declaracao-extravio-aquaviario-2026-v1',
    formId: 'declaracao-extravio-aquaviario',
    revision: 'v1',
    officialRevision: 'NORMAM-101/DPC 2026 - Anexo 1-K',
    regulation: 'NORMAM-101/DPC 2026, Anexo 1-K',
    sourceUrl,
    verifiedAt: '2026-10-30',
    sha256: '4D17057BFF256919E8381BE1310449609D86701427331736127A959D8FAD599A',
    templatePath: 'backend/templates/declaracao-extravio-aquaviario/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
  {
    id: 'declaracao-residencia-aquaviario-2026-v1',
    formId: 'declaracao-residencia-aquaviario',
    revision: 'v1',
    officialRevision: 'NORMAM-101/DPC 2026 - Anexo 1-L',
    regulation: 'NORMAM-101/DPC 2026, Anexo 1-L',
    sourceUrl,
    verifiedAt: '2026-10-30',
    sha256: '401109FF4F65F10D1544CDC76D0C748CF5B69824F041D0E3FA8806C713EAD2DF',
    templatePath: 'backend/templates/declaracao-residencia-aquaviario/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
];

const docs = (...ids: string[]): readonly DocumentRequirement[] =>
  commonDocuments.filter((item) => ids.includes(item.id));

const base = (
  id: string,
  title: string,
  description: string,
  questions: readonly ServiceQuestion[] = [],
  documentRequirements: readonly DocumentRequirement[] = docs('applicant-identity', 'residence-proof'),
): ServiceDefinition => ({
  id,
  title,
  description,
  creditCost: 1,
  status: 'AVAILABLE',
  questions,
  documentRequirements,
});

export const aquaviarioServices: readonly ServiceDefinition[] = [
  base('inscricao-inicial-cir-aquaviario', 'Inscrição inicial / emissão da CIR',
    'Prepara a Declaração de Residência do Anexo 1-L. A NORMAM-101 não fornece um modelo único de requerimento para este processo; quando exigido, o requerimento do interessado permanece como documento de protocolo.'),
  base('segunda-via-cir-aquaviario', '2ª via da CIR',
    'Prepara a Declaração de Residência e, em caso de extravio, roubo ou furto, a declaração do Anexo 1-K. O requerimento do interessado permanece como documento de protocolo.',
    [cirSecondCopyReason], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('revalidacao-cir-aquaviario', 'Revalidação da CIR',
    'Prepara a Declaração de Residência do Anexo 1-L. O requerimento do interessado permanece como documento de protocolo.',
    [], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('transferencia-jurisdicao-aquaviario', 'Transferência de jurisdição',
    'Prepara a Declaração de Residência do Anexo 1-L para o processo de transferência de jurisdição. O requerimento do interessado permanece como documento de protocolo.',
    [], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('ascensao-categoria-aquaviario', 'Ascensão de categoria',
    'Prepara a Declaração de Residência do Anexo 1-L. Comprovações de curso e tempo de embarque continuam sendo documentos de protocolo.',
    [], docs('applicant-identity', 'current-cir', 'current-certificate', 'residence-proof')),
  base('transferencia-categoria-grupo-aquaviario', 'Transferência de categoria ou grupo',
    'Prepara a Declaração de Residência do Anexo 1-L. A análise de equivalência e os certificados profissionais permanecem no protocolo.',
    [], docs('applicant-identity', 'current-cir', 'current-certificate', 'residence-proof')),
  base('homologacao-lrm-aquaviario', 'Homologação do LRM',
    'Serviço destinado a mergulhadores. Prepara a Declaração de Residência do Anexo 1-L; CIR e demais documentos são conferidos no protocolo.',
    [], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('emissao-certificado-aquaviario', 'Emissão de certificado',
    'Prepara o Requerimento de Certificação do Anexo 1-E e a Declaração de Residência do Anexo 1-L.',
    [certificateModel, personSexQuestion],
    docs('applicant-identity', 'current-cir', 'current-certificate', 'residence-proof')),
  base('segunda-via-certificado-aquaviario', '2ª via de certificado',
    'Prepara o Requerimento de Certificação, a Declaração de Residência e, quando aplicável, a Declaração de Extravio, Roubo ou Furto.',
    [certificateSecondCopyModel, certificateSecondCopyReason, personSexQuestion],
    docs('applicant-identity', 'current-cir', 'current-certificate', 'residence-proof')),
  base('revalidacao-certificado-aquaviario', 'Revalidação de certificado',
    'Prepara o Requerimento de Certificação do Anexo 1-E e a Declaração de Residência. A comprovação de manutenção da competência permanece no protocolo.',
    [revalidatableCertificateModel, personSexQuestion],
    docs('applicant-identity', 'current-cir', 'current-certificate', 'residence-proof')),
];

const residence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-aquaviario-2026-v1',
  order,
  excludedReviewFieldIds: ['person.fullAddress'],
});

export const aquaviarioServiceForms: readonly ServiceForm[] = [
  residence('inscricao-inicial-cir-aquaviario', 1),
  residence('segunda-via-cir-aquaviario', 1),
  {
    serviceId: 'segunda-via-cir-aquaviario',
    formVersionId: 'declaracao-extravio-aquaviario-2026-v1',
    order: 2,
    conditions: [{ questionId: 'cirSecondCopyReason', oneOf: ['extravio', 'roubo', 'furto'] }],
    fixedValues: { 'process.aquaviarioLostDocumentType': 'cir' },
  },
  residence('revalidacao-cir-aquaviario', 1),
  residence('transferencia-jurisdicao-aquaviario', 1),
  residence('ascensao-categoria-aquaviario', 1),
  residence('transferencia-categoria-grupo-aquaviario', 1),
  residence('homologacao-lrm-aquaviario', 1),
  {
    serviceId: 'emissao-certificado-aquaviario',
    formVersionId: 'requerimento-certificacao-aquaviario-2026-v1',
    order: 1,
    fixedValues: { 'process.aquaviarioCertificationAction': 'emissao' },
    answerBindings: {
      'process.aquaviarioCertificateModel': 'certificateModel',
      'person.sex': 'personSex',
    },
    excludedReviewFieldIds: ['person.fullAddress'],
  },
  residence('emissao-certificado-aquaviario', 2),
  {
    serviceId: 'segunda-via-certificado-aquaviario',
    formVersionId: 'requerimento-certificacao-aquaviario-2026-v1',
    order: 1,
    fixedValues: { 'process.aquaviarioCertificationAction': 'segunda_via' },
    answerBindings: {
      'process.aquaviarioCertificateModel': 'certificateModel',
      'person.sex': 'personSex',
    },
    excludedReviewFieldIds: ['person.fullAddress'],
  },
  residence('segunda-via-certificado-aquaviario', 2),
  {
    serviceId: 'segunda-via-certificado-aquaviario',
    formVersionId: 'declaracao-extravio-aquaviario-2026-v1',
    order: 3,
    conditions: [{ questionId: 'certificateSecondCopyReason', oneOf: ['extravio', 'roubo', 'furto'] }],
    answerBindings: { 'process.aquaviarioLostDocumentType': 'certificateModel' },
  },
  {
    serviceId: 'revalidacao-certificado-aquaviario',
    formVersionId: 'requerimento-certificacao-aquaviario-2026-v1',
    order: 1,
    fixedValues: { 'process.aquaviarioCertificationAction': 'revalidacao' },
    answerBindings: {
      'process.aquaviarioCertificateModel': 'certificateModel',
      'person.sex': 'personSex',
    },
    excludedReviewFieldIds: ['person.fullAddress'],
  },
  residence('revalidacao-certificado-aquaviario', 2),
];
