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
  DPEM_DOCUMENT_FIELDS,
  MOTOR_DOCUMENT_FIELDS,
  NO_AUTOMATIC_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SALE_DOCUMENT_FIELDS,
  SELLER_IDENTITY_FIELDS,
  TIE_FIELDS,
} from './document-field-policies.js';

const vesselTypeQuestion: ServiceQuestion = {
  id: 'vesselType',
  label: 'Tipo de embarcação',
  options: ['moto_aquatica', 'embarcacao'],
};

const vesselBandQuestion: ServiceQuestion = {
  id: 'vesselBand',
  label: 'Comprimento da embarcação',
  options: ['ate_12m', 'maior_12_ate_24m'],
  conditions: [{ questionId: 'vesselType', equals: 'embarcacao' }],
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
  {
    id: 'power-of-attorney',
    label: 'Procuração e identificação do representante (se houver)',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'representative',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
  {
    id: 'gru-receipt',
    label: 'Comprovante de pagamento da GRU',
    description: 'Documento de apoio. O sistema não emite nem quita a GRU.',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'person',
      allowedFieldIds: NO_AUTOMATIC_FIELDS,
    },
  },
  {
    id: 'dpem-proof',
    label: 'Comprovante/seguro DPEM, quando aplicável',
    required: false,
    extraction: {
      documentType: 'supporting-document',
      subjectRole: 'vessel',
      allowedFieldIds: DPEM_DOCUMENT_FIELDS,
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
  { id: 'termo-responsabilidade-er', name: 'Termo de Responsabilidade para Inscrição/Transferência',
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
    sourceUrl: 'https://www.marinha.mil.br/cfpa/sites/www.marinha.mil.br.cfpa/files/2026-02/ANEXO%203-C%20%28TERMO%20DE%20RESPONSABILIDADE%29.pdf',
    verifiedAt: '2026-10-29', sha256: '706D23CA1BA72F596AC3C959A2D64363C596877355B9F3A637EE371873E15AA0', templatePath: 'backend/templates/termo-responsabilidade-er/v1/original.pdf', pdfKind: 'STATIC', status: 'VERIFIED',
  },
];

function questions(options: {
  band?: boolean;
  dataChanged?: boolean;
} = {}): readonly ServiceQuestion[] {
  return [
    vesselTypeQuestion,
    ...(options.band === false ? [] : [vesselBandQuestion]),
    ...(options.dataChanged ? [dataChangedQuestion] : []),
  ];
}

function requirements(options: {
  tie?: boolean;
  seller?: boolean;
  origin?: boolean;
  motor?: boolean;
  residence?: boolean;
} = {}): readonly DocumentRequirement[] {
  const base = options.residence === false
    ? commonApplicantDocuments.filter((item) => item.id !== 'residence-proof')
    : commonApplicantDocuments;
  return [
    ...base,
    ...(options.tie ? [currentTie] : []),
    ...(options.seller ? [sellerIdentity] : []),
    ...(options.origin ? [vesselProof] : []),
    ...(options.motor ? [motorProof] : []),
  ];
}

const scopeNote = 'Serviço para moto aquática (NORMAM-212) ou embarcação de esporte/recreio ' +
  'de até 24 m (NORMAM-211), sem protocolo automático e com revisão humana obrigatória.';

export const vesselServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-embarcacao',
    title: 'Inscrição inicial',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ origin: true }),
  },
  {
    id: 'transferencia-propriedade-embarcacao',
    title: 'Transferência de propriedade',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
  },
  {
    id: 'transferencia-jurisdicao-embarcacao',
    title: 'Transferência de jurisdição',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'transferencia-propriedade-jurisdicao-embarcacao',
    title: 'Transferência de propriedade e jurisdição',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
  },
  {
    id: 'renovacao-tie-embarcacao',
    title: 'Renovação do TIE/TIEM',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ dataChanged: true }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'segunda-via-tie-embarcacao',
    title: '2ª via do TIE/TIEM por perda, roubo ou extravio',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ dataChanged: true }),
    documentRequirements: requirements(),
  },
  {
    id: 'alteracao-dados-embarcacao',
    title: 'Alteração de dados ou características',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ tie: true, origin: true }),
  },
  {
    id: 'alteracao-motor-embarcacao',
    title: 'Troca, instalação ou retirada de motor',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ tie: true, motor: true }),
  },
  {
    id: 'comunicacao-venda-embarcacao',
    title: 'Comunicação de venda',
    description: 'Comunicação do vendedor. O formulário é selecionado conforme o tipo informado.',
    creditCost: 1, status: 'DRAFT',
    questions: questions({ band: false }),
    documentRequirements: requirements({
      tie: true, seller: true, origin: true, residence: false,
    }),
  },
];

const boatCondition = { questionId: 'vesselType', equals: 'embarcacao' } as const;
const motoCondition = { questionId: 'vesselType', equals: 'moto_aquatica' } as const;

function boatConditions(
  extra: ServiceForm['conditions'] = [],
): NonNullable<ServiceForm['conditions']> {
  return [boatCondition, ...extra];
}

function motoConditions(
  extra: ServiceForm['conditions'] = [],
): NonNullable<ServiceForm['conditions']> {
  return [motoCondition, ...extra];
}

const bsade = (
  serviceId: string,
  order: number,
  action?: string,
  extraConditions: ServiceForm['conditions'] = [],
): ServiceForm => ({
  serviceId,
  formVersionId: 'bsade-er-2026-v1',
  order,
  conditions: boatConditions([
    { questionId: 'vesselBand', equals: 'ate_12m' },
    ...extraConditions,
  ]),
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
  conditions: boatConditions([
    { questionId: 'vesselBand', equals: 'maior_12_ate_24m' },
    ...extraConditions,
  ]),
});

const boatRequest = (serviceId: string, order: number, action: string): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-embarcacao-er-2026-v1',
  order,
  conditions: boatConditions(),
  fixedValues: {
    'process.vesselAction': action,
    ...(action === 'segunda_via'
      ? { 'process.otherServiceDescription': '2ª via do TIE/TIEM' } : {}),
  },
});

const boatResidence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-er-2026-v1',
  order,
  conditions: boatConditions(),
});

const responsibility = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'termo-responsabilidade-er-2026-v1',
  order,
  conditions: boatConditions([
    { questionId: 'vesselBand', equals: 'maior_12_ate_24m' },
  ]),
});

const motoRequest = (
  serviceId: string,
  order: number,
  transferOwnership = false,
): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-ma-v1',
  order,
  conditions: motoConditions(),
  ...(transferOwnership
    ? { fixedValues: { 'process.transferOwnership': 'true' } }
    : {}),
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
  conditions: motoConditions(extraConditions),
  fixedValues: action === 'inscricao'
    ? { 'process.inscription': 'true' }
    : action === 'transf_prop'
      ? { 'process.transferOwnership': 'true' }
      : action === 'transf_jur'
        ? { 'process.transferJurisdiction': 'true' }
        : action === 'transf_prop_jur'
          ? { 'process.transferOwnership': 'true', 'process.transferJurisdiction': 'true' }
          : { 'process.updateVesselData': 'true' },
});

const motoResidence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-ma-v1',
  order,
  conditions: motoConditions(),
});

export const vesselServiceForms: readonly ServiceForm[] = [
  // Inscrição
  boatRequest('inscricao-embarcacao', 10, 'inscricao'),
  bsade('inscricao-embarcacao', 20, 'inscricao'),
  bade('inscricao-embarcacao', 30),
  boatResidence('inscricao-embarcacao', 40),
  responsibility('inscricao-embarcacao', 50),
  motoRequest('inscricao-embarcacao', 110),
  motoBdmoto('inscricao-embarcacao', 120, 'inscricao'),
  motoResidence('inscricao-embarcacao', 130),

  // Transferência de propriedade
  boatRequest('transferencia-propriedade-embarcacao', 10, 'transf_prop'),
  bsade('transferencia-propriedade-embarcacao', 20, 'transf_prop'),
  bade('transferencia-propriedade-embarcacao', 30),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 40,
    conditions: boatConditions() },
  boatResidence('transferencia-propriedade-embarcacao', 50),
  responsibility('transferencia-propriedade-embarcacao', 60),
  motoRequest('transferencia-propriedade-embarcacao', 110, true),
  motoBdmoto('transferencia-propriedade-embarcacao', 120, 'transf_prop'),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 130,
    conditions: motoConditions() },
  motoResidence('transferencia-propriedade-embarcacao', 140),

  // Transferência de jurisdição
  boatRequest('transferencia-jurisdicao-embarcacao', 10, 'transf_jur'),
  bsade('transferencia-jurisdicao-embarcacao', 20, 'transf_jur'),
  bade('transferencia-jurisdicao-embarcacao', 30),
  boatResidence('transferencia-jurisdicao-embarcacao', 40),
  motoRequest('transferencia-jurisdicao-embarcacao', 110),
  motoBdmoto('transferencia-jurisdicao-embarcacao', 120, 'transf_jur'),
  motoResidence('transferencia-jurisdicao-embarcacao', 130),

  // Transferência de propriedade e jurisdição
  boatRequest('transferencia-propriedade-jurisdicao-embarcacao', 10, 'transf_prop_jur'),
  bsade('transferencia-propriedade-jurisdicao-embarcacao', 20, 'transf_prop_jur'),
  bade('transferencia-propriedade-jurisdicao-embarcacao', 30),
  { serviceId: 'transferencia-propriedade-jurisdicao-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 40,
    conditions: boatConditions() },
  boatResidence('transferencia-propriedade-jurisdicao-embarcacao', 50),
  responsibility('transferencia-propriedade-jurisdicao-embarcacao', 60),
  motoRequest('transferencia-propriedade-jurisdicao-embarcacao', 110, true),
  motoBdmoto('transferencia-propriedade-jurisdicao-embarcacao', 120, 'transf_prop_jur'),
  { serviceId: 'transferencia-propriedade-jurisdicao-embarcacao',
    formVersionId: 'autorizacao-transferencia-ma-v1', order: 130,
    conditions: motoConditions() },
  motoResidence('transferencia-propriedade-jurisdicao-embarcacao', 140),

  // Renovação. BDMOTO/BADE/BSADE só entra quando houve alteração de dados.
  boatRequest('renovacao-tie-embarcacao', 10, 'renovacao'),
  bsade('renovacao-tie-embarcacao', 20, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  bade('renovacao-tie-embarcacao', 30,
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  boatResidence('renovacao-tie-embarcacao', 40),
  motoRequest('renovacao-tie-embarcacao', 110),
  motoBdmoto('renovacao-tie-embarcacao', 120, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  motoResidence('renovacao-tie-embarcacao', 130),

  // Segunda via
  boatRequest('segunda-via-tie-embarcacao', 10, 'segunda_via'),
  { serviceId: 'segunda-via-tie-embarcacao',
    formVersionId: 'declaracao-perda-tie-er-2026-v1', order: 20,
    conditions: boatConditions(),
    fixedValues: { 'process.lostTie': 'true' } },
  bsade('segunda-via-tie-embarcacao', 30, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  bade('segunda-via-tie-embarcacao', 40,
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  boatResidence('segunda-via-tie-embarcacao', 50),
  motoRequest('segunda-via-tie-embarcacao', 110),
  { serviceId: 'segunda-via-tie-embarcacao',
    formVersionId: 'declaracao-perda-tie-ma-v1', order: 120,
    conditions: motoConditions() },
  motoBdmoto('segunda-via-tie-embarcacao', 130, 'alteracao_dados',
    [{ questionId: 'dataChanged', equals: 'sim' }]),
  motoResidence('segunda-via-tie-embarcacao', 140),

  // Alteração de dados
  boatRequest('alteracao-dados-embarcacao', 10, 'alteracao_dados'),
  bsade('alteracao-dados-embarcacao', 20, 'alteracao_dados'),
  bade('alteracao-dados-embarcacao', 30),
  boatResidence('alteracao-dados-embarcacao', 40),
  motoRequest('alteracao-dados-embarcacao', 110),
  motoBdmoto('alteracao-dados-embarcacao', 120, 'alteracao_dados'),
  motoResidence('alteracao-dados-embarcacao', 130),

  // Alteração de motor é atualização de dados no BDMOTO.
  boatRequest('alteracao-motor-embarcacao', 10, 'troca_motor'),
  bsade('alteracao-motor-embarcacao', 20, 'troca_motor'),
  bade('alteracao-motor-embarcacao', 30),
  boatResidence('alteracao-motor-embarcacao', 40),
  motoRequest('alteracao-motor-embarcacao', 110),
  motoBdmoto('alteracao-motor-embarcacao', 120, 'alteracao_dados'),
  motoResidence('alteracao-motor-embarcacao', 130),

  // Comunicação de venda é um serviço próprio e não entra no fluxo de transferência.
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-er-2026-v1', order: 10,
    conditions: boatConditions() },
  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-ma-v1', order: 110,
    conditions: motoConditions() },
];

export const vesselServiceIds = vesselServices.map((service) => service.id);
