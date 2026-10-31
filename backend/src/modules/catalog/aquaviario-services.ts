import type {
  DocumentRequirement,
  FormDefinition,
  FormVersion,
  ServiceCondition,
  ServiceDefinition,
  ServiceForm,
  ServiceQuestion,
} from './contracts.js';
import {
  APPLICANT_IDENTITY_FIELDS,
  AQUAVIARIO_CIR_FIELDS,
  RESIDENCE_PROOF_FIELDS,
} from './document-field-policies.js';

const cirSecondCopyReason: ServiceQuestion = {
  id: 'cirSecondCopyReason',
  label: 'Motivo da 2ª via da CIR',
  options: ['dano', 'extravio', 'roubo', 'furto'],
};

const ascensionAquaviarioGroup: ServiceQuestion = {
  id: 'ascensionAquaviarioGroup',
  label: 'Grupo profissional do aquaviário',
  options: ['mergulhadores', 'outros_grupos'],
};

const initialAquaviarioGroup: ServiceQuestion = {
  id: 'initialAquaviarioGroup',
  label: 'Grupo do aquaviário',
  options: ['demais_grupos', 'mergulhadores', 'praticos'],
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
  // A NORMAM-101 não prevê revalidação do DPC-1033 pela AMB.
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

const cirDataSource = (
  id: string,
  label: string,
  description: string,
  conditions?: readonly ServiceCondition[],
): DocumentRequirement => ({
  id, label, description, required: false,
  extraction: {
    documentType: 'cir',
    subjectRole: 'person',
    allowedFieldIds: AQUAVIARIO_CIR_FIELDS,
  },
  ...(conditions ? { conditions } : {}),
});

const commonDocuments: readonly DocumentRequirement[] = [
  {
    id: 'applicant-identity',
    label: 'Documento de identificação',
    description: 'RG, CNH ou CIN. Opcional; usado para extrair dados pessoais e preencher os formulários.',
    required: false,
    extraction: {
      documentType: 'identity',
      subjectRole: 'person',
      allowedFieldIds: APPLICANT_IDENTITY_FIELDS,
    },
  },
  cirDataSource('current-cir', 'Caderneta de Inscrição e Registro (CIR)',
    'Opcional; usada para extrair número da CIR e categoria profissional quando esses campos forem utilizados no formulário.'),
  {
    id: 'residence-proof',
    label: 'Comprovante de residência',
    description: 'Opcional; usado para extrair endereço e preencher a declaração/formulários aplicáveis.',
    required: false,
    extraction: {
      documentType: 'residence-proof',
      subjectRole: 'person',
      allowedFieldIds: RESIDENCE_PROOF_FIELDS,
    },
  },
];

const docs = (...ids: string[]): readonly DocumentRequirement[] =>
  commonDocuments.filter((item) => ids.includes(item.id));

const sourceUrl = 'https://www.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-101.pdf';

export const aquaviarioForms: readonly FormDefinition[] = [
  {
    id: 'requerimento-certificacao-aquaviario',
    name: 'Requerimento de Certificação',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-E (formulário oficial).',
  },
  {
    id: 'declaracao-extravio-aquaviario',
    name: 'Declaração de Extravio, Roubo ou Furto',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-K (formulário oficial).',
  },
  {
    id: 'declaracao-residencia-aquaviario',
    name: 'Declaração de Residência',
    description: 'NORMAM-101/DPC 2026 - Anexo 1-L (formulário oficial).',
  },
  {
    id: 'requerimento-interessado-aquaviario',
    name: 'Requerimento do interessado (modelo auxiliar não oficial)',
    description: 'Modelo auxiliar do produto para serviços em que a NORMAM-101 exige requerimento do interessado, mas não fornece formulário padronizado. Não é anexo oficial da Marinha.',
  },
];

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
  {
    id: 'requerimento-interessado-aquaviario-2026-v1',
    formId: 'requerimento-interessado-aquaviario',
    revision: 'v1',
    officialRevision: null,
    regulation: 'Modelo auxiliar não oficial do produto, estruturado a partir dos requisitos procedimentais da NORMAM-101/DPC 2026. Não é anexo da Marinha.',
    sourceUrl,
    verifiedAt: '2026-10-30',
    sha256: 'C0D7EFD0B476519380D16C284C4F5FFC63E7622AF0ACDB268667B4AFE6A6A32B',
    templatePath: 'backend/templates/requerimento-interessado-aquaviario/v1/original.pdf',
    pdfKind: 'STATIC',
    status: 'VERIFIED',
  },
];

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
    'Gera a Declaração de Residência do Anexo 1-L. Para o 4º Grupo (Mergulhadores) e o 5º Grupo (Práticos), também gera um requerimento auxiliar não oficial. A fotografia prevista na norma é capturada no atendimento da CP/DL/AG.',
    [initialAquaviarioGroup], docs('applicant-identity', 'residence-proof')),
  base('segunda-via-cir-aquaviario', '2ª via da CIR',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. Para extravio, roubo ou furto, também gera a Declaração do Anexo 1-K. A fotografia é capturada no atendimento.',
    [cirSecondCopyReason], [
      ...docs('applicant-identity', 'residence-proof'),
      cirDataSource('current-cir-damage', 'CIR atual',
        'Opcional; usada para sugerir número e categoria da CIR quando o motivo for dano.',
        [{ questionId: 'cirSecondCopyReason', equals: 'dano' }]),
    ]),
  base('revalidacao-cir-aquaviario', 'Revalidação da CIR',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. A fotografia só é necessária quando a revalidação ocorrer por término do espaço de anotações.',
    [], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('ascensao-categoria-aquaviario', 'Ascensão de categoria',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. Informe a categoria atual e a categoria pretendida na finalidade do requerimento.',
    [ascensionAquaviarioGroup], docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('emissao-certificado-aquaviario', 'Emissão de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E e a Declaração de Residência do Anexo 1-L. A fotografia prevista na norma é capturada no atendimento. A Parte III (documentos anexados) do Anexo 1-E ainda deve ser conferida e preenchida manualmente após o download.',
    [certificateModel, personSexQuestion], [
      ...docs('applicant-identity', 'residence-proof'),
      cirDataSource('current-cir-certification', 'CIR',
        'Opcional; usada para sugerir número e categoria quando o modelo de certificado utiliza esses campos.',
        [{ questionId: 'certificateModel', oneOf: ['dpc1031', 'dpc1034'] }]),
    ]),
  base('segunda-via-certificado-aquaviario', '2ª via de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E, a Declaração de Residência do Anexo 1-L e, para extravio, roubo ou furto, a Declaração do Anexo 1-K. A fotografia prevista na norma é capturada no atendimento. A Parte III (documentos anexados) do Anexo 1-E ainda deve ser conferida e preenchida manualmente após o download.',
    [certificateSecondCopyModel, certificateSecondCopyReason, personSexQuestion],
    docs('applicant-identity', 'current-cir', 'residence-proof')),
  base('revalidacao-certificado-aquaviario', 'Revalidação de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E e a Declaração de Residência do Anexo 1-L. A Parte III (documentos anexados) do Anexo 1-E ainda deve ser conferida e preenchida manualmente após o download. A NORMAM-101 não prevê revalidação do DPC-1033 pela Autoridade Marítima Brasileira.',
    [revalidatableCertificateModel, personSexQuestion],
    docs('applicant-identity', 'current-cir', 'residence-proof')),
];

const residence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-aquaviario-2026-v1',
  order,
  excludedReviewFieldIds: ['person.fullAddress'],
});

const auxiliaryRequest = (
  serviceId: string,
  order: number,
  subject: string,
  purpose: string,
  conditions?: readonly ServiceCondition[],
): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-interessado-aquaviario-2026-v1',
  order,
  fixedValues: {
    'process.requestSubject': subject,
    ...(purpose ? { 'process.requestPurpose': purpose } : {}),
  },
  ...(conditions ? { conditions } : {}),
});

export const aquaviarioServiceForms: readonly ServiceForm[] = [
  residence('inscricao-inicial-cir-aquaviario', 1),
  auxiliaryRequest(
    'inscricao-inicial-cir-aquaviario',
    2,
    'Inscrição inicial como aquaviário',
    'a minha inscrição inicial como aquaviário e a emissão da CIR.',
    [{ questionId: 'initialAquaviarioGroup', oneOf: ['mergulhadores', 'praticos'] }],
  ),
  residence('segunda-via-cir-aquaviario', 1),
  auxiliaryRequest(
    'segunda-via-cir-aquaviario',
    2,
    'Segunda via da CIR',
    'a emissão da segunda via da minha Caderneta de Inscrição e Registro (CIR).',
  ),
  {
    serviceId: 'segunda-via-cir-aquaviario',
    formVersionId: 'declaracao-extravio-aquaviario-2026-v1',
    order: 3,
    conditions: [{ questionId: 'cirSecondCopyReason', oneOf: ['extravio', 'roubo', 'furto'] }],
    fixedValues: { 'process.aquaviarioLostDocumentType': 'cir' },
  },
  residence('revalidacao-cir-aquaviario', 1),
  auxiliaryRequest(
    'revalidacao-cir-aquaviario',
    2,
    'Revalidação da CIR',
    'a revalidação da minha Caderneta de Inscrição e Registro (CIR).',
  ),
  residence('ascensao-categoria-aquaviario', 1),
  auxiliaryRequest(
    'ascensao-categoria-aquaviario',
    2,
    'Ascensão de categoria',
    '', // Finalidade editável: o usuário informa explicitamente categoria atual e pretendida.
  ),
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
