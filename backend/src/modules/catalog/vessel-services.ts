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
  BUYER_IDENTITY_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SELLER_IDENTITY_FIELDS,
  SELLER_RESIDENCE_PROOF_FIELDS,
  TIE_FIELDS,
} from './document-field-policies.js';

const vesselTypeQuestion: ServiceQuestion = {
  id: 'vesselType',
  label: 'Tipo de embarcação',
  options: ['embarcacao', 'moto_aquatica'],
};

const coOwnerQuestion: ServiceQuestion = {
  id: 'hasCoOwner',
  label: 'A embarcação possui coproprietário?',
  options: ['sim', 'nao'],
};

const vesselBandQuestion: ServiceQuestion = {
  id: 'vesselBand',
  label: 'Comprimento da embarcação',
  options: ['ate_6m', 'maior_6_ate_12m', 'maior_12_menor_24m'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const initialResponsibilityTermQuestion: ServiceQuestion = {
  id: 'initialResponsibilityTerm',
  label: 'Será apresentado o Termo de Responsabilidade de Construção/Alteração (Anexo 3-C)? Se a embarcação foi construída pelo interessado, selecione Sim. Para embarcação de médio porte, selecione Sim quando o termo for usado para dispensa da vistoria inicial.',
  options: ['nao', 'sim'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const tieSituationQuestion: ServiceQuestion = {
  id: 'tieSituation',
  label: 'Situação do TIE/TIEM atual',
  options: ['regular', 'extraviado'],
};

const transferTargetQuestion: ServiceQuestion = {
  id: 'transferTarget',
  label: 'Qual transferência deseja realizar?',
  options: ['propriedade', 'jurisdicao', 'propriedade_jurisdicao'],
};

const dataChangedQuestion: ServiceQuestion = {
  id: 'dataChanged',
  label: 'Houve alteração das características da embarcação (por exemplo, medidas, casco ou motor)?',
  options: ['sim', 'nao'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const motoCharacteristicsChangedQuestion: ServiceQuestion = {
  id: 'motoCharacteristicsChanged',
  label: 'Houve alteração das características da moto aquática (por exemplo, motor, casco ou waterbox)?',
  options: ['sim', 'nao'],
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
};

const tieDocumentFormatQuestion: ServiceQuestion = {
  id: 'tieDocumentFormat',
  label: 'Qual é o formato do TIE/TIEM perdido ou danificado? O TIE digital pode ser reimpresso sem solicitar uma segunda via.',
  options: ['fisico_antigo', 'digital', 'desconhecido'],
  unavailableOptions: ['digital'],
};

const motoTieSecondCopyReasonQuestion: ServiceQuestion = {
  id: 'motoTieSecondCopyReason',
  label: 'Motivo da renovação do TIE da moto aquática',
  options: ['perda', 'roubo', 'extravio'],
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
};

const boatAlterationTargetQuestion: ServiceQuestion = {
  id: 'boatAlterationTarget',
  label: 'O que será alterado?',
  options: ['dados_caracteristicas', 'motor', 'dados_e_motor'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const motoAlterationTargetQuestion: ServiceQuestion = {
  id: 'motoAlterationTarget',
  label: 'O que será alterado?',
  options: [
    'dados_embarcacao',
    'dados_proprietario',
    'ambos',
    'motor',
    'dados_embarcacao_motor',
    'dados_proprietario_motor',
    'ambos_motor',
  ],
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
};

const responsibilityTermCaseQuestion: ServiceQuestion = {
  id: 'responsibilityTermCase',
  label: 'O caso envolve estaleiro comprovadamente extinto ou embarcação de construção artesanal?',
  options: ['nao', 'estaleiro_extinto', 'construcao_artesanal'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const applicantIdentity: DocumentRequirement = {
  id: 'applicant-identity',
  label: 'Documento de identificação do requerente',
  description: 'RG, CIN ou CNH. O arquivo é opcional e serve para sugerir dados para revisão.',
  required: false,
  extraction: {
    documentType: 'identity',
    subjectRole: 'person',
    allowedFieldIds: APPLICANT_IDENTITY_FIELDS,
  },
};

const residenceProof: DocumentRequirement = {
  id: 'residence-proof',
  label: 'Comprovante de residência',
  required: false,
  extraction: {
    documentType: 'residence-proof',
    subjectRole: 'person',
    allowedFieldIds: RESIDENCE_PROOF_FIELDS,
  },
};

const buyerIdentity: DocumentRequirement = {
  id: 'buyer-identity',
  label: 'Documento de identificação do comprador',
  description: 'RG, CIN ou CNH do comprador. O arquivo é opcional e serve para sugerir os dados do comprador para revisão.',
  required: false,
  extraction: {
    documentType: 'identity',
    subjectRole: 'person',
    allowedFieldIds: BUYER_IDENTITY_FIELDS,
  },
};

const buyerResidenceProof: DocumentRequirement = {
  id: 'buyer-residence-proof',
  label: 'Comprovante de residência do comprador',
  required: false,
  extraction: {
    documentType: 'residence-proof',
    subjectRole: 'person',
    allowedFieldIds: RESIDENCE_PROOF_FIELDS,
  },
};

const sellerResidenceProof: DocumentRequirement = {
  id: 'seller-residence-proof',
  label: 'Comprovante de residência do requerente/vendedor',
  required: false,
  extraction: {
    documentType: 'residence-proof',
    subjectRole: 'seller',
    allowedFieldIds: SELLER_RESIDENCE_PROOF_FIELDS,
  },
};

const commonApplicantDocuments: readonly DocumentRequirement[] = [
  applicantIdentity,
  residenceProof,
];

const currentTie: DocumentRequirement = {
  id: 'tie',
  label: 'TIE/TIEM atual',
  description: 'Envie se estiver disponível. O documento sugere somente dados permitidos da embarcação e titular registrado.',
  required: false,
  extraction: {
    documentType: 'tie',
    subjectRole: 'vessel',
    allowedFieldIds: TIE_FIELDS,
  },
};

const sellerIdentity: DocumentRequirement = {
  id: 'seller-identity',
  label: 'Documento de identificação do vendedor',
  required: false,
  extraction: {
    documentType: 'identity',
    subjectRole: 'seller',
    allowedFieldIds: SELLER_IDENTITY_FIELDS,
  },
};

const sellerApplicantIdentity: DocumentRequirement = {
  ...sellerIdentity,
  id: 'seller-applicant-identity',
  label: 'Documento de identificação do requerente/vendedor',
  description: 'Neste serviço, o vendedor é o requerente. Envie RG, CIN ou CNH para sugerir os dados do vendedor para revisão.',
};

export const vesselForms: readonly FormDefinition[] = [
  { id: 'bade-er', name: 'Boletim de Atualização de Embarcações (BADE)',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-A.' },
  { id: 'bsade-er', name: 'Boletim Simplificado de Atualização de Embarcações (BSADE)',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-B.' },
  { id: 'requerimento-embarcacao-er', name: 'Requerimento de Serviços para Regularização de Embarcações',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-C.' },
  { id: 'declaracao-residencia-er', name: 'Declaração de Residência',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-G.' },
  { id: 'declaracao-perda-tie-er', name: 'Declaração de Perda/Extravio de Documento',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-H.' },
  { id: 'comunicacao-transferencia-er', name: 'Comunicação de Transferência de Propriedade',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-I.' },
  { id: 'autorizacao-transferencia-er', name: 'Autorização para Transferência de Propriedade',
    description: 'NORMAM-211/DPC 2026 - Anexo 2-K.' },
  { id: 'termo-responsabilidade-er', name: 'Termo de Responsabilidade de Construção/Alteração',
    description: 'NORMAM-211/DPC 2026 - Anexo 3-C.' },
];

export const vesselVersions: readonly FormVersion[] = [
  {
    id: 'bade-er-2026-v1', formId: 'bade-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-A',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-A',
    sourceUrl: 'https://www.marinha.mil.br/cfpa/sites/www.marinha.mil.br.cfpa/files/2026-02/Anexo%202-A%20%28BADE%29.pdf',
    verifiedAt: '2026-10-29', sha256: 'CCCA17A6C0608B995829A5A4BBDD97953343C3D924E3B74FD00CC0AE76623524', templatePath: 'backend/templates/bade-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'bsade-er-2026-v1', formId: 'bsade-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-B',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-B',
    sourceUrl: 'https://www.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28BSADE%29.pdf',
    verifiedAt: '2026-10-29', sha256: '56F9301CC153FF97C5B4A72BE0C7688BC030F87CED9C861AB6064DD62D012988', templatePath: 'backend/templates/bsade-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'requerimento-embarcacao-er-2026-v1', formId: 'requerimento-embarcacao-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-C',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-C',
    sourceUrl: 'https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28REQUERIMENTO%29_0.pdf',
    verifiedAt: '2026-10-29', sha256: 'DAEDFD1D1F7C48C020D7D3169BFD9D36B4EEA122E75FDCC792EB3CC59E691AFF', templatePath: 'backend/templates/requerimento-embarcacao-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'declaracao-residencia-er-2026-v1', formId: 'declaracao-residencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-G',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-G',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/upload/normam-211-2G.pdf',
    verifiedAt: '2026-10-29', sha256: '392DC41E9E2A95409972156A4460F4DF6E74C2F906D4111CC03B1CE7457C8B38', templatePath: 'backend/templates/declaracao-residencia-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'declaracao-perda-tie-er-2026-v1', formId: 'declaracao-perda-tie-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-H',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-H',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Extravio%20ANEXO%202-H.pdf',
    verifiedAt: '2026-10-29', sha256: 'D67AAB9B1E878F7877A69AC0B9E6197DE932A61D166626B50141FBE119567093', templatePath: 'backend/templates/declaracao-perda-tie-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'comunicacao-transferencia-er-2026-v1', formId: 'comunicacao-transferencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-I',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-I',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/anexo%202-i_0.pdf',
    verifiedAt: '2026-10-29', sha256: '0DF2A7550AF9CBFDCBC27D94128C2BBB0EEFA88BABA6142CB39EDB4FE22EA142', templatePath: 'backend/templates/comunicacao-transferencia-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'autorizacao-transferencia-er-2026-v1', formId: 'autorizacao-transferencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-K',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-K',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Compra%20a%20e%20venda%20ANEXO%202-K.pdf',
    verifiedAt: '2026-10-29', sha256: '52A4CACFFEFD628EF9D95DC84943CCA0CB0FD66A706272380A92F19F4B9EDE5E', templatePath: 'backend/templates/autorizacao-transferencia-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
  {
    id: 'termo-responsabilidade-er-2026-v1', formId: 'termo-responsabilidade-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 3-C',
    regulation: 'NORMAM-211/DPC 2026, Anexo 3-C',
    sourceUrl: 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf',
    verifiedAt: '2026-10-29', sha256: '99C914F82D8C274A6D50AE09364DB4E70754F826D7C11D70B6FBA4875F1D176B', templatePath: 'backend/templates/termo-responsabilidade-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
];

function questions(options: {
  band?: boolean;
  tie?: boolean;
  dataChanged?: boolean;
  bandWhenDataChanged?: boolean;
  constructionCase?: boolean;
  responsibilityTermCase?: boolean;
  motoTieSecondCopyReason?: boolean;
  tieDocumentFormat?: boolean;
  alterationTarget?: boolean;
  transferTarget?: boolean;
} = {}): readonly ServiceQuestion[] {
  const bandQuestion = options.bandWhenDataChanged
    ? { ...vesselBandQuestion, conditions: [
        { questionId: 'vesselType', equals: 'embarcacao' },
        { questionId: 'dataChanged', equals: 'sim' },
      ] }
    : vesselBandQuestion;
  return [
    vesselTypeQuestion,
    coOwnerQuestion,
    ...(options.transferTarget ? [transferTargetQuestion] : []),
    ...(options.tie ? [tieSituationQuestion] : []),
    ...(options.dataChanged ? [dataChangedQuestion, motoCharacteristicsChangedQuestion] : []),
    ...(options.band === false ? [] : [bandQuestion]),
    ...(options.constructionCase ? [initialResponsibilityTermQuestion] : []),
    ...(options.responsibilityTermCase ? [responsibilityTermCaseQuestion] : []),
    ...(options.motoTieSecondCopyReason ? [motoTieSecondCopyReasonQuestion] : []),
    ...(options.tieDocumentFormat ? [tieDocumentFormatQuestion] : []),
    ...(options.alterationTarget
      ? [boatAlterationTargetQuestion, motoAlterationTargetQuestion]
      : []),
  ];
}

function requirements(options: {
  tie?: boolean;
  seller?: boolean;
} = {}): readonly DocumentRequirement[] {
  return [
    ...commonApplicantDocuments,
    ...(options.tie ? [currentTie] : []),
    ...(options.seller ? [sellerIdentity] : []),
  ];
}

const scopeNote = 'Serviço disponível para embarcação/barco e moto aquática, com seleção automática dos formulários aplicáveis conforme a NORMAM-211/DPC e a NORMAM-212/DPC. A ferramenta não protocola o processo e os dados devem ser revisados pelo usuário.';

export const vesselServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-embarcacao',
    title: 'Inscrição inicial de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ constructionCase: true }),
    documentRequirements: requirements(),
  },
  {
    id: 'transferencia-propriedade-embarcacao',
    title: 'Transferência de propriedade e/ou jurisdição',
    description: scopeNote + ' O usuário escolhe no início se deseja transferir propriedade, jurisdição ou ambas.',
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ tie: true, transferTarget: true }),
    documentRequirements: [
      ...requirements({ tie: true }),
      {
        ...sellerIdentity,
        id: 'seller-identity-transfer',
        conditions: [{
          questionId: 'transferTarget',
          oneOf: ['propriedade', 'propriedade_jurisdicao'],
        }],
      },
    ],
  },
  {
    id: 'renovacao-tie-embarcacao',
    title: 'Renovação do TIE/TIEM',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ tie: true, dataChanged: true }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'segunda-via-tie-embarcacao',
    title: 'Renovação do TIE/TIEM por perda, roubo ou extravio',
    description: scopeNote + ' O TIE digital não possui segunda via; perda ou extravio do modelo antigo segue o fluxo de renovação.',
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ dataChanged: true, bandWhenDataChanged: true, motoTieSecondCopyReason: true, tieDocumentFormat: true }),
    documentRequirements: requirements(),
  },
  {
    id: 'alteracao-dados-embarcacao',
    title: 'Alteração de dados, características ou motor',
    description: 'Um único fluxo para atualização de dados/características e troca, instalação ou retirada de motor. A seleção inicial define os campos e anexos oficiais a preencher. Em embarcação/barco, o Anexo 3-C só é gerado nos casos admitidos pelo item 2.12.1 da NORMAM-211/DPC. A extração automática usa apenas RG/CNH/CIN, comprovante de residência e TIE/TIEM.',
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({
      tie: true,
      responsibilityTermCase: true,
      alterationTarget: true,
    }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'comunicacao-venda-embarcacao',
    title: 'Comunicação de venda de embarcação',
    description: 'Comunicação do vendedor conforme a NORMAM-211/DPC ou NORMAM-212/DPC, conforme o tipo de embarcação. Neste serviço, o vendedor é o requerente. Não efetiva por si só a transferência.',
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ band: false }),
    documentRequirements: [
      sellerApplicantIdentity,
      buyerIdentity,
      sellerResidenceProof,
      buyerResidenceProof,
      currentTie,
    ],
  },
];

const SALE_TRANSFER_REVIEW_FIELDS = [
  'sale.invoice',
  'sale.date',
  'sale.place',
  'seller.fullName',
  'seller.cpf',
] as const;

const PROPERTY_TRANSFER_FIELD_CONDITIONS = Object.fromEntries(
  SALE_TRANSFER_REVIEW_FIELDS.map((fieldId) => [fieldId, [{
    questionId: 'transferTarget',
    oneOf: ['propriedade', 'propriedade_jurisdicao'],
  }]]),
) as ServiceForm['reviewFieldConditions'];

const CO_OWNER_REVIEW_FIELDS = [
  'coOwner.fullName',
  'coOwner.cpf',
  'coOwner.identity',
  'coOwner.issuer',
  'coOwner.issuerState',
  'coOwner.address',
  'coOwner.streetNumber',
  'coOwner.apartment',
  'coOwner.postalCode',
  'coOwner.neighborhood',
  'coOwner.city',
  'coOwner.state',
  'coOwner.email',
  'coOwner.nationality',
  'coOwner.phone',
  'coOwner.fax',
] as const;

const CO_OWNER_FIELD_CONDITIONS = Object.fromEntries(
  CO_OWNER_REVIEW_FIELDS.map((fieldId) => [fieldId, [{
    questionId: 'hasCoOwner',
    equals: 'sim',
  }]]),
) as ServiceForm['reviewFieldConditions'];

const bsade = (
  serviceId: string,
  order: number,
  action?: string,
  extraConditions: ServiceForm['conditions'] = [],
): ServiceForm => ({
  serviceId,
  formVersionId: 'bsade-er-2026-v1',
  order,
  conditions: [
    { questionId: 'vesselType', equals: 'embarcacao' },
    { questionId: 'vesselBand', equals: 'ate_6m' },
    ...extraConditions,
  ],
  excludedReviewFieldIds: SALE_TRANSFER_REVIEW_FIELDS,
  ...(action ? { fixedValues: action === 'inscricao'
    ? { 'process.inscription': 'true' }
    : action === 'transf_prop'
      ? { 'process.transferProperty': 'true' }
      : action === 'transf_jur'
        ? { 'process.transferJurisdiction': 'true' }
        : action === 'transf_prop_jur'
          ? { 'process.transferProperty': 'true', 'process.transferJurisdiction': 'true' }
          : { 'process.updateVesselData': 'true' } } : {}),
});
const bade = (
  serviceId: string,
  order: number,
  extraConditions: ServiceForm['conditions'] = [],
): ServiceForm => ({
  serviceId,
  formVersionId: 'bade-er-2026-v1',
  order,
  conditions: [
    { questionId: 'vesselType', equals: 'embarcacao' },
    { questionId: 'vesselBand', oneOf: ['maior_6_ate_12m', 'maior_12_menor_24m'] },
    ...extraConditions,
  ],
  reviewFieldConditions: CO_OWNER_FIELD_CONDITIONS,
});
const request = (serviceId: string, order: number, action: string): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-embarcacao-er-2026-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
  fixedValues: { 'process.vesselAction': action },
});
const residence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-er-2026-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
});
const lostTie = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-perda-tie-er-2026-v1',
  order,
  fixedValues: { 'process.lostTie': 'true' },
  conditions: [
    { questionId: 'vesselType', equals: 'embarcacao' },
    { questionId: 'tieSituation', equals: 'extraviado' },
  ],
});
const boatServiceForms: readonly ServiceForm[] = [
  request('inscricao-embarcacao', 1, 'inscricao'),
  bsade('inscricao-embarcacao', 2, 'inscricao'),
  bade('inscricao-embarcacao', 3),
  residence('inscricao-embarcacao', 4),
  { serviceId: 'inscricao-embarcacao',
    formVersionId: 'termo-responsabilidade-er-2026-v1', order: 5,
    conditions: [
      { questionId: 'vesselType', equals: 'embarcacao' },
      { questionId: 'initialResponsibilityTerm', equals: 'sim' },
    ],
    fixedValues: { 'process.constructionAction': 'construída' } },

  {
    serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'requerimento-embarcacao-er-2026-v1',
    order: 1,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
    answerValueMappings: {
      'process.vesselAction': {
        questionId: 'transferTarget',
        values: {
          propriedade: 'transf_prop',
          jurisdicao: 'transf_jur',
          propriedade_jurisdicao: 'transf_prop_jur',
        },
      },
    },
  },
  {
    serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'bsade-er-2026-v1',
    order: 2,
    conditions: [
      { questionId: 'vesselType', equals: 'embarcacao' },
      { questionId: 'vesselBand', equals: 'ate_6m' },
    ],
    reviewFieldConditions: PROPERTY_TRANSFER_FIELD_CONDITIONS,
    answerValueMappings: {
      'process.transferProperty': {
        questionId: 'transferTarget',
        values: { propriedade: 'true', propriedade_jurisdicao: 'true' },
      },
      'process.transferJurisdiction': {
        questionId: 'transferTarget',
        values: { jurisdicao: 'true', propriedade_jurisdicao: 'true' },
      },
    },
  },
  bade('transferencia-propriedade-embarcacao', 3),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 4,
    conditions: [
      { questionId: 'vesselType', equals: 'embarcacao' },
      { questionId: 'transferTarget', oneOf: ['propriedade', 'propriedade_jurisdicao'] },
    ],
    reviewFieldConditions: CO_OWNER_FIELD_CONDITIONS },
  residence('transferencia-propriedade-embarcacao', 5),
  lostTie('transferencia-propriedade-embarcacao', 6),

  request('renovacao-tie-embarcacao', 1, 'renovacao'),
  bsade('renovacao-tie-embarcacao', 2, 'alteracao_dados'),
  bade('renovacao-tie-embarcacao', 3),
  residence('renovacao-tie-embarcacao', 4),
  lostTie('renovacao-tie-embarcacao', 5),

  request('segunda-via-tie-embarcacao', 1, 'renovacao'),
  { serviceId: 'segunda-via-tie-embarcacao',
    formVersionId: 'declaracao-perda-tie-er-2026-v1', order: 2,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
    fixedValues: { 'process.lostTie': 'true' } },
  bsade('segunda-via-tie-embarcacao', 3, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  bade('segunda-via-tie-embarcacao', 4,
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  residence('segunda-via-tie-embarcacao', 5),

  {
    serviceId: 'alteracao-dados-embarcacao',
    formVersionId: 'requerimento-embarcacao-er-2026-v1',
    order: 1,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
    answerValueMappings: {
      'process.vesselAction': {
        questionId: 'boatAlterationTarget',
        values: {
          dados_caracteristicas: 'alteracao_dados',
          motor: 'troca_motor',
          dados_e_motor: 'alteracao_dados_motor',
        },
      },
    },
  },
  bsade('alteracao-dados-embarcacao', 2, 'alteracao_dados'),
  bade('alteracao-dados-embarcacao', 3),
  residence('alteracao-dados-embarcacao', 4), lostTie('alteracao-dados-embarcacao', 5),
  { serviceId: 'alteracao-dados-embarcacao',
    formVersionId: 'termo-responsabilidade-er-2026-v1', order: 6,
    conditions: [
      { questionId: 'vesselType', equals: 'embarcacao' },
      { questionId: 'responsibilityTermCase',
        oneOf: ['estaleiro_extinto', 'construcao_artesanal'] },
    ],
    fixedValues: { 'process.constructionAction': 'alterada' } },

  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-er-2026-v1', order: 1,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }] },
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 2,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
    reviewFieldConditions: CO_OWNER_FIELD_CONDITIONS },
];

// NORMAM-212 relationships validated against the 2026 forms. Orders use a separate
// range from boat forms because the catalog invariant requires unique order per service.
const motoRequest = (
  serviceId: string,
  order: number,
  action: string | null,
  extraConditions: ServiceForm['conditions'] = [],
  answerBindings: ServiceForm['answerBindings'] = {},
  extraFixedValues: Readonly<Record<string, string>> = {},
): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-ma-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }, ...extraConditions],
  fixedValues: {
    ...(action ? { 'process.vesselAction': action } : {}),
    ...extraFixedValues,
  },
  answerBindings,
});

const motoBdmoto = (
  serviceId: string,
  order: number,
  action: 'inscricao' | 'transf_prop' | 'transf_jur' | 'transf_prop_jur' | 'alteracao_dados',
  extraConditions: ServiceForm['conditions'] = [],
): ServiceForm => ({
  serviceId,
  formVersionId: 'bdmoto-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }, ...extraConditions],
  excludedReviewFieldIds: SALE_TRANSFER_REVIEW_FIELDS,
  fixedValues: action === 'inscricao'
    ? { 'process.inscription': 'true' }
    : action === 'transf_prop'
      ? { 'process.transferProperty': 'true' }
      : action === 'transf_jur'
        ? { 'process.transferJurisdiction': 'true' }
        : action === 'transf_prop_jur'
          ? { 'process.transferProperty': 'true', 'process.transferJurisdiction': 'true' }
          : { 'process.updateVesselData': 'true' },
});

const motoResidence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-ma-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
});

const motoLostTie = (
  serviceId: string,
  order: number,
  conditional = true,
): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-perda-tie-ma-v1',
  order,
  fixedValues: { 'process.lostTie': 'true' },
  conditions: conditional
    ? [
        { questionId: 'vesselType', equals: 'moto_aquatica' },
        { questionId: 'tieSituation', equals: 'extraviado' },
      ]
    : [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
});

export const motoAquaticaServiceForms: readonly ServiceForm[] = [
  motoRequest('inscricao-embarcacao', 21, 'inscricao'),
  motoBdmoto('inscricao-embarcacao', 22, 'inscricao'),
  motoResidence('inscricao-embarcacao', 23),

  {
    serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'requerimento-ma-v1',
    order: 21,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
    answerValueMappings: {
      'process.vesselAction': {
        questionId: 'transferTarget',
        values: {
          propriedade: 'transf_prop',
          jurisdicao: 'transf_jur',
          propriedade_jurisdicao: 'transf_prop_jur',
        },
      },
    },
  },
  {
    serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'bdmoto-v1',
    order: 22,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
    reviewFieldConditions: PROPERTY_TRANSFER_FIELD_CONDITIONS,
    answerValueMappings: {
      'process.transferProperty': {
        questionId: 'transferTarget',
        values: { propriedade: 'true', propriedade_jurisdicao: 'true' },
      },
      'process.transferJurisdiction': {
        questionId: 'transferTarget',
        values: { jurisdicao: 'true', propriedade_jurisdicao: 'true' },
      },
    },
  },
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 23,
    conditions: [
      { questionId: 'vesselType', equals: 'moto_aquatica' },
      { questionId: 'transferTarget', oneOf: ['propriedade', 'propriedade_jurisdicao'] },
    ],
    reviewFieldConditions: CO_OWNER_FIELD_CONDITIONS },
  motoResidence('transferencia-propriedade-embarcacao', 24),
  motoLostTie('transferencia-propriedade-embarcacao', 25),

  // NORMAM-212 2.2: BDMOTO is required on renewal only when characteristics changed.
  motoRequest('renovacao-tie-embarcacao', 21, 'renovacao', [], {
    'process.renewalCharacteristicsChanged': 'motoCharacteristicsChanged',
  }),
  motoBdmoto('renovacao-tie-embarcacao', 22, 'alteracao_dados',
    [{ questionId: 'motoCharacteristicsChanged', equals: 'sim' }]),
  motoResidence('renovacao-tie-embarcacao', 23),
  motoLostTie('renovacao-tie-embarcacao', 24),

  // Old/non-digital TIE loss follows renewal; declaration substitutes the missing original.
  motoRequest('segunda-via-tie-embarcacao', 21, 'segunda_via', [], {
    'process.tieSecondCopyReason': 'motoTieSecondCopyReason',
  }),
  motoLostTie('segunda-via-tie-embarcacao', 22, false),
  motoBdmoto('segunda-via-tie-embarcacao', 23, 'alteracao_dados',
    [{ questionId: 'motoCharacteristicsChanged', equals: 'sim' }]),
  motoResidence('segunda-via-tie-embarcacao', 24),

  {
    serviceId: 'alteracao-dados-embarcacao',
    formVersionId: 'requerimento-ma-v1',
    order: 21,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
    answerValueMappings: {
      'process.dataChangeTarget': {
        questionId: 'motoAlterationTarget',
        values: {
          dados_embarcacao: 'dados_embarcacao',
          dados_proprietario: 'dados_proprietario',
          ambos: 'ambos',
          motor: 'dados_embarcacao',
          dados_embarcacao_motor: 'dados_embarcacao',
          dados_proprietario_motor: 'dados_proprietario',
          ambos_motor: 'ambos',
        },
      },
    },
  },
  motoBdmoto('alteracao-dados-embarcacao', 22, 'alteracao_dados'),
  motoResidence('alteracao-dados-embarcacao', 23),
  motoLostTie('alteracao-dados-embarcacao', 24),

  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-ma-v1', order: 21,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }] },
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 22,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }],
    reviewFieldConditions: CO_OWNER_FIELD_CONDITIONS },
];

export const vesselServiceForms: readonly ServiceForm[] = [
  ...boatServiceForms,
  ...motoAquaticaServiceForms,
];

export const vesselServiceIds = vesselServices.map((service) => service.id);
