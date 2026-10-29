import type {
  DocumentRequirement,
  FormDefinition,
  FormVersion,
  ServiceDefinition,
  ServiceForm,
  ServiceQuestion,
} from './contracts.js';

const vesselBandQuestion: ServiceQuestion = {
  id: 'vesselBand',
  label: 'Comprimento da embarcação',
  options: ['ate_12m', 'maior_12_ate_24m'],
};

const residenceQuestion: ServiceQuestion = {
  id: 'residenceProof',
  label: 'Comprovação de residência',
  options: ['comprovante', 'declaracao_2g'],
};

const representativeQuestion: ServiceQuestion = {
  id: 'representative',
  label: 'O processo será feito por procurador?',
  options: ['sim', 'nao'],
};

const tieSituationQuestion: ServiceQuestion = {
  id: 'tieSituation',
  label: 'Situação do TIE/TIEM atual',
  options: ['regular', 'extraviado'],
};

const commonApplicantDocuments: readonly DocumentRequirement[] = [
  {
    id: 'applicant-identity',
    label: 'Documento de identificação do requerente',
    description: 'RG, CIN ou CNH. O arquivo é opcional e serve para sugerir dados para revisão.',
    required: false,
    extraction: { documentType: 'identity', subjectRole: 'person' },
  },
  {
    id: 'residence-proof',
    label: 'Comprovante de residência',
    required: false,
    extraction: { documentType: 'residence-proof', subjectRole: 'person' },
    conditions: [{ questionId: 'residenceProof', equals: 'comprovante' }],
  },
  {
    id: 'power-of-attorney',
    label: 'Procuração e identificação do representante',
    required: false,
    extraction: { documentType: 'supporting-document', subjectRole: 'representative' },
    conditions: [{ questionId: 'representative', equals: 'sim' }],
  },
  {
    id: 'gru-receipt',
    label: 'Comprovante de pagamento da GRU',
    description: 'Documento de apoio. O sistema não emite nem quita a GRU.',
    required: false,
    extraction: { documentType: 'supporting-document', subjectRole: 'person' },
  },
];

const currentTie: DocumentRequirement = {
  id: 'tie',
  label: 'TIE/TIEM atual',
  description: 'Envie se estiver disponível. O OCR usa o documento para sugerir dados da embarcação.',
  required: false,
  extraction: { documentType: 'tie', subjectRole: 'vessel' },
};

const vesselProof: DocumentRequirement = {
  id: 'vessel-origin-document',
  label: 'Documento de origem/propriedade da embarcação',
  description: 'Nota fiscal, instrumento de compra e venda ou documento equivalente aplicável ao caso.',
  required: false,
  extraction: { documentType: 'sale-document', subjectRole: 'person' },
};

const vesselPhotos: DocumentRequirement = {
  id: 'vessel-photos',
  label: 'Fotos da embarcação, quando exigidas no processo',
  description: 'Fotos também passam pela leitura OCR, mas podem não conter texto útil.',
  required: false,
  extraction: { documentType: 'supporting-document', subjectRole: 'vessel' },
};

const motorProof: DocumentRequirement = {
  id: 'motor-document',
  label: 'Documento comprobatório do motor',
  description: 'Nota fiscal, declaração ou documento equivalente aplicável à alteração do motor.',
  required: false,
  extraction: { documentType: 'supporting-document', subjectRole: 'vessel' },
};

const sellerIdentity: DocumentRequirement = {
  id: 'seller-identity',
  label: 'Documento de identificação do vendedor',
  required: false,
  extraction: { documentType: 'identity', subjectRole: 'seller' },
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
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'bsade-er-2026-v1', formId: 'bsade-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-B',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-B',
    sourceUrl: 'https://www.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28BSADE%29.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'requerimento-embarcacao-er-2026-v1', formId: 'requerimento-embarcacao-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-C',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-C',
    sourceUrl: 'https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28REQUERIMENTO%29_0.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'declaracao-residencia-er-2026-v1', formId: 'declaracao-residencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-G',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-G',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/upload/normam-211-2G.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'declaracao-perda-tie-er-2026-v1', formId: 'declaracao-perda-tie-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-H',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-H',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Extravio%20ANEXO%202-H.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'comunicacao-transferencia-er-2026-v1', formId: 'comunicacao-transferencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-I',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-I',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/anexo%202-i_0.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'autorizacao-transferencia-er-2026-v1', formId: 'autorizacao-transferencia-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 2-K',
    regulation: 'NORMAM-211/DPC 2026, Anexo 2-K',
    sourceUrl: 'https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Compra%20a%20e%20venda%20ANEXO%202-K.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
  {
    id: 'termo-responsabilidade-er-2026-v1', formId: 'termo-responsabilidade-er', revision: 'v1',
    officialRevision: 'NORMAM-211/DPC 2026 - Anexo 3-C',
    regulation: 'NORMAM-211/DPC 2026, Anexo 3-C',
    sourceUrl: 'https://www.marinha.mil.br/cfpa/sites/www.marinha.mil.br.cfpa/files/2026-02/ANEXO%203-C%20%28TERMO%20DE%20RESPONSABILIDADE%29.pdf',
    verifiedAt: null, sha256: null, templatePath: null, pdfKind: 'UNKNOWN', status: 'IDENTIFIED',
  },
];

function questions(options: {
  band?: boolean;
  tie?: boolean;
  residence?: boolean;
  representative?: boolean;
} = {}): readonly ServiceQuestion[] {
  return [
    ...(options.band === false ? [] : [vesselBandQuestion]),
    ...(options.tie ? [tieSituationQuestion] : []),
    ...(options.residence === false ? [] : [residenceQuestion]),
    ...(options.representative === false ? [] : [representativeQuestion]),
  ];
}

function requirements(options: {
  tie?: boolean;
  seller?: boolean;
  origin?: boolean;
  photos?: boolean;
  motor?: boolean;
  residence?: boolean;
  representative?: boolean;
} = {}): readonly DocumentRequirement[] {
  const base = commonApplicantDocuments.filter((item) => {
    if (item.id === 'residence-proof' && options.residence === false) return false;
    if (item.id === 'power-of-attorney' && options.representative === false) return false;
    return true;
  });
  return [
    ...base,
    ...(options.tie ? [currentTie] : []),
    ...(options.seller ? [sellerIdentity] : []),
    ...(options.origin ? [vesselProof] : []),
    ...(options.photos ? [vesselPhotos] : []),
    ...(options.motor ? [motorProof] : []),
  ];
}

const scopeNote = 'Primeira expansão para embarcações de esporte e recreio de até 24 m, ' +
  'sem protocolo automático e com revisão humana obrigatória.';

export const vesselServices: readonly ServiceDefinition[] = [
  {
    id: 'inscricao-embarcacao',
    title: 'Inscrição inicial de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions(),
    documentRequirements: requirements({ origin: true, photos: true }),
  },
  {
    id: 'transferencia-propriedade-embarcacao',
    title: 'Transferência de propriedade de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
  },
  {
    id: 'transferencia-jurisdicao-embarcacao',
    title: 'Transferência de jurisdição de embarcação',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'transferencia-propriedade-jurisdicao-embarcacao',
    title: 'Transferência de propriedade e jurisdição',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, seller: true, origin: true }),
  },
  {
    id: 'renovacao-tie-embarcacao',
    title: 'Renovação do TIE/TIEM',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true }),
  },
  {
    id: 'segunda-via-tie-embarcacao',
    title: '2ª via do TIE/TIEM por perda, roubo ou extravio',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ band: false }),
    documentRequirements: requirements(),
  },
  {
    id: 'alteracao-dados-embarcacao',
    title: 'Alteração de dados ou características da embarcação',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, origin: true }),
  },
  {
    id: 'alteracao-motor-embarcacao',
    title: 'Troca, instalação ou retirada de motor',
    description: scopeNote,
    creditCost: 1, status: 'DRAFT',
    questions: questions({ tie: true }),
    documentRequirements: requirements({ tie: true, motor: true }),
  },
  {
    id: 'comunicacao-venda-embarcacao',
    title: 'Comunicação de venda de embarcação',
    description: 'Comunicação do vendedor conforme a NORMAM-211/DPC. Não efetiva por si só a transferência.',
    creditCost: 1, status: 'DRAFT',
    questions: questions({ band: false, residence: false }),
    documentRequirements: requirements({
      tie: true, seller: true, origin: true, residence: false,
    }),
  },
];

const bsade = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'bsade-er-2026-v1',
  order,
  conditions: [{ questionId: 'vesselBand', equals: 'ate_12m' }],
});
const bade = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'bade-er-2026-v1',
  order,
  conditions: [{ questionId: 'vesselBand', equals: 'maior_12_ate_24m' }],
});
const request = (serviceId: string, order: number, action: string): ServiceForm => ({
  serviceId,
  formVersionId: 'requerimento-embarcacao-er-2026-v1',
  order,
  fixedValues: { 'process.vesselAction': action },
});
const residence = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-residencia-er-2026-v1',
  order,
  conditions: [{ questionId: 'residenceProof', equals: 'declaracao_2g' }],
});
const lostTie = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'declaracao-perda-tie-er-2026-v1',
  order,
  conditions: [{ questionId: 'tieSituation', equals: 'extraviado' }],
});
const responsibility = (serviceId: string, order: number): ServiceForm => ({
  serviceId,
  formVersionId: 'termo-responsabilidade-er-2026-v1',
  order,
  conditions: [{ questionId: 'vesselBand', equals: 'maior_12_ate_24m' }],
});

export const vesselServiceForms: readonly ServiceForm[] = [
  request('inscricao-embarcacao', 1, 'inscricao'),
  bsade('inscricao-embarcacao', 2), bade('inscricao-embarcacao', 3),
  residence('inscricao-embarcacao', 4), responsibility('inscricao-embarcacao', 5),

  request('transferencia-propriedade-embarcacao', 1, 'transf_prop'),
  bsade('transferencia-propriedade-embarcacao', 2), bade('transferencia-propriedade-embarcacao', 3),
  { serviceId: 'transferencia-propriedade-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 4 },
  residence('transferencia-propriedade-embarcacao', 5),
  lostTie('transferencia-propriedade-embarcacao', 6),
  responsibility('transferencia-propriedade-embarcacao', 7),

  request('transferencia-jurisdicao-embarcacao', 1, 'transf_jur'),
  bsade('transferencia-jurisdicao-embarcacao', 2), bade('transferencia-jurisdicao-embarcacao', 3),
  residence('transferencia-jurisdicao-embarcacao', 4),
  lostTie('transferencia-jurisdicao-embarcacao', 5),

  request('transferencia-propriedade-jurisdicao-embarcacao', 1, 'transf_prop_jur'),
  bsade('transferencia-propriedade-jurisdicao-embarcacao', 2),
  bade('transferencia-propriedade-jurisdicao-embarcacao', 3),
  { serviceId: 'transferencia-propriedade-jurisdicao-embarcacao',
    formVersionId: 'autorizacao-transferencia-er-2026-v1', order: 4 },
  residence('transferencia-propriedade-jurisdicao-embarcacao', 5),
  lostTie('transferencia-propriedade-jurisdicao-embarcacao', 6),
  responsibility('transferencia-propriedade-jurisdicao-embarcacao', 7),

  request('renovacao-tie-embarcacao', 1, 'renovacao'),
  bsade('renovacao-tie-embarcacao', 2), bade('renovacao-tie-embarcacao', 3),
  residence('renovacao-tie-embarcacao', 4),
  lostTie('renovacao-tie-embarcacao', 5),
  responsibility('renovacao-tie-embarcacao', 6),

  request('segunda-via-tie-embarcacao', 1, 'segunda_via'),
  { serviceId: 'segunda-via-tie-embarcacao',
    formVersionId: 'declaracao-perda-tie-er-2026-v1', order: 2 },
  residence('segunda-via-tie-embarcacao', 3),

  request('alteracao-dados-embarcacao', 1, 'alteracao_dados'),
  bsade('alteracao-dados-embarcacao', 2), bade('alteracao-dados-embarcacao', 3),
  residence('alteracao-dados-embarcacao', 4), lostTie('alteracao-dados-embarcacao', 5),

  request('alteracao-motor-embarcacao', 1, 'troca_motor'),
  bsade('alteracao-motor-embarcacao', 2), bade('alteracao-motor-embarcacao', 3),
  residence('alteracao-motor-embarcacao', 4), lostTie('alteracao-motor-embarcacao', 5),

  { serviceId: 'comunicacao-venda-embarcacao',
    formVersionId: 'comunicacao-transferencia-er-2026-v1', order: 1 },
];

export const vesselServiceIds = vesselServices.map((service) => service.id);
