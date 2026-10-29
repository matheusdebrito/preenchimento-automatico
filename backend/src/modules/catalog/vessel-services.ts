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
  MOTOR_DOCUMENT_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SALE_DOCUMENT_FIELDS,
  SELLER_IDENTITY_FIELDS,
  TIE_FIELDS,
} from './document-field-policies.js';

const vesselTypeQuestion: ServiceQuestion = {
  id: 'vesselType',
  label: 'Tipo de embarcação',
  options: ['embarcacao', 'moto_aquatica'],
  unavailableOptions: ['moto_aquatica'],
};

const vesselBandQuestion: ServiceQuestion = {
  id: 'vesselBand',
  label: 'Comprimento da embarcação',
  options: ['ate_6m', 'maior_6_ate_12m', 'maior_12_menor_24m'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const builtByApplicantQuestion: ServiceQuestion = {
  id: 'builtByApplicant',
  label: 'A embarcação foi construída pelo próprio interessado?',
  options: ['nao', 'sim'],
  unavailableOptions: ['sim'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
};

const tieSituationQuestion: ServiceQuestion = {
  id: 'tieSituation',
  label: 'Situação do TIE/TIEM atual',
  options: ['regular', 'extraviado'],
};

const dataChangedQuestion: ServiceQuestion = {
  id: 'dataChanged',
  label: 'Houve alteração de dados do proprietário ou das características da embarcação?',
  options: ['sim', 'nao'],
};

const commonApplicantDocuments: readonly DocumentRequirement[] = [
  {
    id: 'applicant-identity',
    label: 'Documento de identificação do requerente',
    description: 'RG, CIN ou CNH. O arquivo é opcional e serve para sugerir dados para revisão.',
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

const vesselProof: DocumentRequirement = {
  id: 'vessel-origin-document',
  label: 'Documento de origem/propriedade da embarcação',
  description: 'Nota fiscal, instrumento de compra e venda ou documento equivalente aplicável ao caso.',
  required: false,
  extraction: {
    documentType: 'sale-document',
    subjectRole: 'person',
    allowedFieldIds: SALE_DOCUMENT_FIELDS,
  },
};

const motorProof: DocumentRequirement = {
  id: 'motor-document',
  label: 'Documento comprobatório do motor',
  description: 'Nota fiscal, declaração ou documento equivalente aplicável à alteração do motor.',
  required: false,
  extraction: {
    documentType: 'supporting-document',
    subjectRole: 'vessel',
    allowedFieldIds: MOTOR_DOCUMENT_FIELDS,
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
    verifiedAt: '2026-10-29', sha256: '63B31E5D256B8B178E88D1689AE0087C49ECB89EBB012B9F8B465B095F50F005', templatePath: 'backend/templates/termo-responsabilidade-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
];

function questions(options: {
  band?: boolean;
  tie?: boolean;
  dataChanged?: boolean;
  blockMediumBand?: boolean;
  constructionCase?: boolean;
} = {}): readonly ServiceQuestion[] {
  const baseBandQuestion = options.blockMediumBand
    ? { ...vesselBandQuestion, unavailableOptions: ['maior_12_menor_24m'] }
    : vesselBandQuestion;
  const bandQuestion = options.dataChanged
    ? { ...baseBandQuestion, conditions: [
        { questionId: 'vesselType', equals: 'embarcacao' },
        { questionId: 'dataChanged', equals: 'sim' },
      ] }
    : baseBandQuestion;
  return [
    vesselTypeQuestion,
    ...(options.tie ? [tieSituationQuestion] : []),
    ...(options.dataChanged ? [dataChangedQuestion] : []),
    ...(options.band === false ? [] : [bandQuestion]),
    ...(options.constructionCase ? [builtByApplicantQuestion] : []),
  ];
}

function requirements(options: {
  tie?: boolean;
  seller?: boolean;
  origin?: boolean;
  motor?: boolean;
} = {}): readonly DocumentRequirement[] {
  return [
    ...commonApplicantDocuments,
    ...(options.tie ? [currentTie] : []),
    ...(options.seller ? [sellerIdentity] : []),
    ...(options.origin ? [vesselProof] : []),
    ...(options.motor ? [motorProof] : []),
  ];
}

const scopeNote = 'Serviço liberado para embarcação/barco. Moto aquática permanece em validação, ' +
  'sem protocolo automático e com revisão dos dados pelo usuário.';

export const vesselServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-embarcacao',
    title: 'Inscrição inicial de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ blockMediumBand: true, constructionCase: true }),
    documentRequirements: requirements({ origin: true }),
  },
  {
    id: 'transferencia-propriedade-embarcacao',
    title: 'Transferência de propriedade',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
  },
  {
    id: 'transferencia-jurisdicao-embarcacao',
    title: 'Transferência de jurisdição de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'transferencia-propriedade-jurisdicao-embarcacao',
    title: 'Transferência de propriedade e jurisdição',
    description: scopeNote,
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
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
    questions: questions({ dataChanged: true }),
    documentRequirements: requirements(),
  },
  {
    id: 'alteracao-dados-embarcacao',
    title: 'Alteração de dados ou características da embarcação',
    description: 'Em validação normativa. O Anexo 3-C só se aplica em situações específicas de construção/alteração; não deve ser incluído automaticamente.',
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, origin: true }),
  },
  {
    id: 'alteracao-motor-embarcacao',
    title: 'Troca, instalação ou retirada de motor',
    description: 'Em validação até incorporar o termo de responsabilidade aplicável às alterações.',
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, motor: true }),
  },
  {
    id: 'comunicacao-venda-embarcacao',
    title: 'Comunicação de venda de embarcação',
    description: 'Comunicação do vendedor conforme a NORMAM-211/DPC. Não efetiva por si só a transferência.',
    creditCost: 1, status: 'AVAILABLE',
    questions: questions({ band: false }),
    documentRequirements: requirements({
      tie: true, seller: true, origin: true,
    }),
  },
];

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
export const vesselServiceForms: readonly ServiceForm[] = [
  request('inscricao-embarcacao', 1, 'inscricao'),
  bsade('inscricao-embarcacao', 2, 'inscricao'),
  bade('inscricao-embarcacao', 3),
  residence('inscricao-embarcacao', 4),

  request('transferencia-propriedade-embarcacao', 1, 'transf_prop'),
  bsade('transferencia-propriedade-embarcacao', 2, 'transf_prop'),
  bade('transferencia-propriedade-embarcacao', 3),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 4,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }] },
  residence('transferencia-propriedade-embarcacao', 5),
  lostTie('transferencia-propriedade-embarcacao', 6),

  request('transferencia-jurisdicao-embarcacao', 1, 'transf_jur'),
  bsade('transferencia-jurisdicao-embarcacao', 2, 'transf_jur'),
  bade('transferencia-jurisdicao-embarcacao', 3),
  residence('transferencia-jurisdicao-embarcacao', 4),
  lostTie('transferencia-jurisdicao-embarcacao', 5),

  request('transferencia-propriedade-jurisdicao-embarcacao', 1, 'transf_prop_jur'),
  bsade('transferencia-propriedade-jurisdicao-embarcacao', 2, 'transf_prop_jur'),
  bade('transferencia-propriedade-jurisdicao-embarcacao', 3),
  { serviceId: 'transferencia-propriedade-jurisdicao-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 4,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }] },
  residence('transferencia-propriedade-jurisdicao-embarcacao', 5),
  lostTie('transferencia-propriedade-jurisdicao-embarcacao', 6),

  request('renovacao-tie-embarcacao', 1, 'renovacao'),
  bsade('renovacao-tie-embarcacao', 2, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  bade('renovacao-tie-embarcacao', 3,
    [{ questionId: 'dataChanged', equals: 'sim' }]),
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

  request('alteracao-dados-embarcacao', 1, 'alteracao_dados'),
  bsade('alteracao-dados-embarcacao', 2, 'alteracao_dados'),
  bade('alteracao-dados-embarcacao', 3),
  residence('alteracao-dados-embarcacao', 4), lostTie('alteracao-dados-embarcacao', 5),

  request('alteracao-motor-embarcacao', 1, 'troca_motor'),
  bsade('alteracao-motor-embarcacao', 2, 'troca_motor'),
  bade('alteracao-motor-embarcacao', 3),
  residence('alteracao-motor-embarcacao', 4), lostTie('alteracao-motor-embarcacao', 5),

  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-er-2026-v1', order: 1,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }] },
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 2,
    conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }] },
];

// NORMAM-212 relationships are kept explicit even while Moto Aquática remains blocked.
// They are not part of the active catalog until every corresponding PDF mapping is approved.
const motoRequest = (
  serviceId: string,
  order: number,
  action: string,
  extraConditions: ServiceForm['conditions'] = [],
): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-ma-v1',
  order,
  conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }, ...extraConditions],
  fixedValues: { 'process.vesselAction': action },
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

export const pendingMotoAquaticaServiceForms: readonly ServiceForm[] = [
  motoRequest('inscricao-embarcacao', 1, 'inscricao'),
  motoBdmoto('inscricao-embarcacao', 2, 'inscricao'),
  motoResidence('inscricao-embarcacao', 3),

  motoRequest('transferencia-propriedade-embarcacao', 1, 'transf_prop'),
  motoBdmoto('transferencia-propriedade-embarcacao', 2, 'transf_prop'),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 3,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }] },
  motoResidence('transferencia-propriedade-embarcacao', 4),
  motoLostTie('transferencia-propriedade-embarcacao', 5),

  motoRequest('transferencia-jurisdicao-embarcacao', 1, 'transf_jur'),
  motoBdmoto('transferencia-jurisdicao-embarcacao', 2, 'transf_jur'),
  motoResidence('transferencia-jurisdicao-embarcacao', 3),
  motoLostTie('transferencia-jurisdicao-embarcacao', 4),

  motoRequest('transferencia-propriedade-jurisdicao-embarcacao', 1, 'transf_prop_jur'),
  motoBdmoto('transferencia-propriedade-jurisdicao-embarcacao', 2, 'transf_prop_jur'),
  { serviceId: 'transferencia-propriedade-jurisdicao-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 3,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }] },
  motoResidence('transferencia-propriedade-jurisdicao-embarcacao', 4),
  motoLostTie('transferencia-propriedade-jurisdicao-embarcacao', 5),

  // NORMAM-212 2.2: BDMOTO is required on renewal only when characteristics changed.
  motoRequest('renovacao-tie-embarcacao', 1, 'renovacao'),
  motoBdmoto('renovacao-tie-embarcacao', 2, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  motoResidence('renovacao-tie-embarcacao', 3),
  motoLostTie('renovacao-tie-embarcacao', 4),

  // Old/non-digital TIE loss follows renewal; declaration substitutes the missing original.
  motoRequest('segunda-via-tie-embarcacao', 1, 'segunda_via'),
  motoLostTie('segunda-via-tie-embarcacao', 2, false),
  motoBdmoto('segunda-via-tie-embarcacao', 3, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  motoResidence('segunda-via-tie-embarcacao', 4),

  motoRequest('alteracao-dados-embarcacao', 1, 'alteracao_dados'),
  motoBdmoto('alteracao-dados-embarcacao', 2, 'alteracao_dados'),
  motoResidence('alteracao-dados-embarcacao', 3),
  motoLostTie('alteracao-dados-embarcacao', 4),

  motoRequest('alteracao-motor-embarcacao', 1, 'alteracao_dados'),
  motoBdmoto('alteracao-motor-embarcacao', 2, 'alteracao_dados'),
  motoResidence('alteracao-motor-embarcacao', 3),
  motoLostTie('alteracao-motor-embarcacao', 4),

  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-ma-v1', order: 1,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }] },
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 2,
    conditions: [{ questionId: 'vesselType', equals: 'moto_aquatica' }] },
];

export const vesselServiceIds = vesselServices.map((service) => service.id);
