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
  RESIDENCE_PROOF_FIELDS,
} from './document-field-policies.js';

const cirSecondCopyReason: ServiceQuestion = {
  id: 'cirSecondCopyReason',
  label: 'Motivo da 2ª via da CIR',
  options: ['dano', 'extravio', 'roubo', 'furto'],
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

const supporting = (
  id: string,
  label: string,
  description: string,
  conditions?: readonly ServiceCondition[],
): DocumentRequirement => ({
  id,
  label,
  description,
  required: false,
  extraction: {
    documentType: 'supporting-document',
    subjectRole: 'person',
    allowedFieldIds: [],
  },
  ...(conditions ? { conditions } : {}),
});

const commonDocuments: readonly DocumentRequirement[] = [
  {
    id: 'applicant-identity',
    label: 'Documento oficial de identificação',
    description: 'RG, CIN, CNH ou documento migratório aplicável. O arquivo é opcional e pode sugerir dados para revisão.',
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
    description: 'Envie a folha de rosto e, quando o processo exigir, as folhas de registros de embarque. Documento de apoio para conferência.',
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
    description: 'Envie o certificado atual quando o processo exigir sua apresentação ou substituição. Documento de apoio para conferência.',
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
    description: 'Com CEP, emitido nos últimos 90 dias e em nome do interessado. A Declaração de Residência do Anexo 1-L é gerada pela aplicação.',
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
    [initialAquaviarioGroup], [
      ...docs('applicant-identity', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie o CPF separadamente se o número não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'Emitido há menos de um ano, conforme os padrões de saúde física, mental, visual e auditiva previstos na norma.'),
      supporting('professional-qualification', 'Certificado de habilitação profissional ou conclusão do curso', 'Comprovação de habilitação profissional ou conclusão de curso reconhecido pela DPC.'),
      supporting('diving-course', 'Certificado do curso de mergulho profissional raso', 'Exigido especificamente para o 4º Grupo - Mergulhadores.', [
        { questionId: 'initialAquaviarioGroup', equals: 'mergulhadores' },
      ]),
    ]),
  base('segunda-via-cir-aquaviario', '2ª via da CIR',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. Para extravio, roubo ou furto, também gera a Declaração do Anexo 1-K. A fotografia é capturada no atendimento.',
    [cirSecondCopyReason], [
      ...docs('applicant-identity', 'residence-proof'),
      supporting('current-cir-damage', 'CIR danificada', 'Apresente a CIR original para conferência quando o motivo for dano.', [
        { questionId: 'cirSecondCopyReason', equals: 'dano' },
      ]),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'A NORMAM-101 exige atestado de saúde quando a CIR tiver sido emitida há mais de dois anos.'),
      supporting('occurrence-report', 'Registro de Ocorrência (RO)', 'Alternativa à declaração do Anexo 1-K nos casos de extravio, roubo ou furto.', [
        { questionId: 'cirSecondCopyReason', oneOf: ['extravio', 'roubo', 'furto'] },
      ]),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante de pagamento do emolumento da segunda via.'),
    ]),
  base('revalidacao-cir-aquaviario', 'Revalidação da CIR',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. A fotografia só é necessária quando a revalidação ocorrer por término do espaço de anotações.',
    [], [
      ...docs('applicant-identity', 'current-cir', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'Emitido há menos de um ano, conforme os padrões de saúde física, mental, visual e auditiva.'),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante do emolumento de revalidação.'),
      supporting('professional-qualification', 'Comprovantes de habilitação', 'Podem ser solicitados pela CP/DL/AG quando houver divergência entre a CIR e o SISAQUA.'),
    ]),
  base('transferencia-jurisdicao-aquaviario', 'Transferência de jurisdição',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L, além de reunir a documentação de identificação e da CIR.',
    [], [
      ...docs('applicant-identity', 'current-cir', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
    ]),
  base('ascensao-categoria-aquaviario', 'Ascensão de categoria',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. Comprovantes de curso, tempo de embarque e habilitação continuam sendo documentos de apoio ao protocolo. A validade do atestado de saúde é de seis meses para mergulhadores e um ano para os demais aquaviários.',
    [], [
      ...docs('applicant-identity', 'current-cir', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'Emitido há menos de seis meses para mergulhadores ou um ano para os demais aquaviários.'),
      supporting('sea-service-proof', 'Comprovação do tempo de embarque', 'Registros de embarque na CIR e documentos do Anexo 1-S, conforme o caso.'),
      supporting('foreign-sea-service', 'Comprovação de embarque no exterior (Anexo 1-G)', 'Quando aplicável a embarques em navios de bandeira estrangeira.'),
      supporting('course-certificates', 'Certificados de cursos e estágios', 'Comprovantes de conclusão dos cursos e estágios que atendem aos requisitos da categoria pretendida.'),
      supporting('competency-certificates', 'Certificado de Competência', 'Quando houver alteração de Regras ou retirada de limitações.'),
      supporting('education-proof', 'Comprovante de escolaridade', 'Quando exigido pelo Quadro Geral de Certificações (Anexo 2-A).'),
      supporting('diving-experience', 'Comprovação de experiência como MGE', 'Somente para o 4º Grupo: dois anos de exercício como MGE e pelo menos 150 horas de mergulho, comprovados pelo LRM e documentos complementares.'),
      supporting('diving-course', 'Certificado do C-Exp-MGSAT ou equivalente', 'Somente para o 4º Grupo - Mergulhadores. Curso realizado no CIAMA ou em entidade credenciada pela DPC.'),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante do emolumento aplicável à ascensão.'),
    ]),
  base('transferencia-categoria-grupo-aquaviario', 'Transferência de categoria ou grupo',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. A transferência entre grupos/seções é excepcional e depende de avaliação de competência pela Autoridade Marítima.',
    [], [
      ...docs('applicant-identity', 'current-cir', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('course-certificates', 'Certificados de cursos do EPM', 'Cursos correspondentes à categoria atual e cursos pré-requisitos da categoria pretendida.'),
      supporting('education-proof', 'Comprovante de escolaridade', 'Emitido por instituição reconhecida pelo Ministério da Educação e compatível com a categoria pretendida.'),
    ]),
  base('homologacao-lrm-aquaviario', 'Homologação do LRM',
    'Gera o requerimento auxiliar não oficial e a Declaração de Residência do Anexo 1-L. O LRM é adquirido na EMGEPRON e apresentado à CP/DL/AG para homologação após a inscrição do mergulhador no SISAQUA.',
    [], [
      ...docs('applicant-identity', 'current-cir', 'residence-proof'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('lrm-book', 'Livro de Registro do Mergulhador (LRM)', 'Livro modelo DPC-2212 adquirido na EMGEPRON para homologação pela CP/DL/AG.'),
    ]),
  base('emissao-certificado-aquaviario', 'Emissão de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E e a Declaração de Residência do Anexo 1-L. Os documentos de apoio variam conforme o modelo de certificado.',
    [certificateModel, personSexQuestion], [
      ...docs('applicant-identity', 'residence-proof'),
      supporting('current-cir-certification', 'CIR', 'Folha de rosto e, quando aplicável, folhas de registros de embarque. Exigida para DPC-1031 e DPC-1034.', [
        { questionId: 'certificateModel', oneOf: ['dpc1031', 'dpc1034'] },
      ]),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.', [
        { questionId: 'certificateModel', oneOf: ['dpc1031', 'dpc1033', 'dpc1034'] },
      ]),
      supporting('medical-certificate', 'Atestado de Saúde', 'Atestado emitido há menos de um ano, conforme os padrões de saúde previstos na norma.', [
        { questionId: 'certificateModel', oneOf: ['dpc1031', 'dpc1033', 'dpc1034'] },
      ]),
      supporting('competency-certificates', 'Certificados de competência', 'Comprovam habilitações específicas a serem registradas no DPC-1031.', [
        { questionId: 'certificateModel', equals: 'dpc1031' },
      ]),
      supporting('course-certificates', 'Certificados de cursos e habilitações', 'Comprovantes das qualificações necessárias para o certificado DPC-1034.', [
        { questionId: 'certificateModel', equals: 'dpc1034' },
      ]),
      supporting('source-country-certificate', 'Certificado de competência do país de origem', 'Exigido para reconhecimento e inscrição inicial no modelo DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('seaman-record-book', 'Seaman’s Record Book', 'Caderneta de inscrição e registro emitida pelo país de origem, para DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('migration-documents', 'CRNM e DPRNM', 'Documentos migratórios dentro da validade, exigidos no processo DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('work-record', 'Carteira de Trabalho e Previdência Social (CTPS)', 'Exigida para estrangeiro no processo DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('education-proof', 'Comprovante de escolaridade', 'Exigido no processo de reconhecimento DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('school-history', 'Histórico escolar', 'Disciplinas cursadas e respectivas cargas horárias, para DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('embarked-training', 'Comprovante de estágio embarcado', 'Comprovação do estágio previsto na Convenção STCW-78 para DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante do emolumento aplicável ao reconhecimento DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
    ]),
  base('segunda-via-certificado-aquaviario', '2ª via de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E, a Declaração de Residência do Anexo 1-L e, para extravio, roubo ou furto, a Declaração do Anexo 1-K.',
    [certificateSecondCopyModel, certificateSecondCopyReason, personSexQuestion], [
      ...docs('applicant-identity', 'residence-proof'),
      supporting('current-cir-certification', 'CIR', 'Folha de rosto da CIR, conforme o modelo de certificado solicitado.'),
      supporting('current-certificate-damage', 'Certificado original danificado', 'Apresente o original quando a segunda via for solicitada por dano.', [
        { questionId: 'certificateSecondCopyReason', equals: 'dano' },
      ]),
      supporting('occurrence-report', 'Registro de Ocorrência (RO)', 'Alternativa à declaração do Anexo 1-K nos casos de extravio, roubo ou furto.', [
        { questionId: 'certificateSecondCopyReason', oneOf: ['extravio', 'roubo', 'furto'] },
      ]),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'Atestado emitido há menos de um ano, conforme os padrões previstos na norma.'),
      supporting('competency-certificates', 'Certificados de competência', 'Habilitações específicas a serem registradas, conforme o caso.', [
        { questionId: 'certificateModel', equals: 'dpc1031' },
      ]),
      supporting('source-country-certificate', 'Certificado de competência do país de origem', 'Exigido para segunda via do DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('migration-documents', 'CRNM e DPRNM', 'Documentos migratórios dentro da validade, exigidos para DPC-1033.', [
        { questionId: 'certificateModel', equals: 'dpc1033' },
      ]),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante do emolumento da segunda via.'),
    ]),
  base('revalidacao-certificado-aquaviario', 'Revalidação de certificado',
    'Gera o Requerimento de Certificação oficial do Anexo 1-E e a Declaração de Residência do Anexo 1-L. A NORMAM-101 não prevê revalidação do DPC-1033 pela Autoridade Marítima Brasileira.',
    [revalidatableCertificateModel, personSexQuestion], [
      ...docs('applicant-identity', 'residence-proof'),
      supporting('current-cir-certification', 'CIR e folhas de registro de embarque', 'Apresente a folha de rosto e as folhas de registros de embarque.'),
      supporting('current-certificate', 'Certificado a revalidar', 'Cópia do certificado atual.'),
      supporting('cpf-document', 'CPF', 'Envie separadamente se o CPF não constar do documento de identificação.'),
      supporting('medical-certificate', 'Atestado de Saúde', 'Emitido há menos de um ano, conforme os padrões de saúde previstos na norma.'),
      supporting('sea-service-proof', 'Comprovação do tempo de embarque', 'Registros de embarque e documentos do Anexo 1-S, conforme os requisitos da Seção A-I/11 da Convenção STCW-78.'),
      supporting('foreign-sea-service', 'Comprovação de embarque no exterior (Anexo 1-G)', 'Quando aplicável a embarques em navios de bandeira estrangeira.'),
      supporting('competency-certificates', 'Certificados de competência e habilitações', 'Documentos que comprovem as habilitações específicas a serem registradas no novo certificado.'),
      supporting('training-evidence', 'Comprovantes de treinamentos de segurança e proficiência', 'Quando aplicável, conforme o artigo 1.22.4 e as Regras VI/1, VI/2 e VI/3 da Convenção STCW-78.'),
      supporting('gru-payment', 'GRU e comprovante de pagamento', 'Comprovante do emolumento de revalidação.'),
    ]),
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
    'process.requestPurpose': purpose,
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
  residence('transferencia-jurisdicao-aquaviario', 1),
  auxiliaryRequest(
    'transferencia-jurisdicao-aquaviario',
    2,
    'Transferência de jurisdição',
    'a transferência da minha jurisdição de aquaviário para a CP/DL/AG destinatária.',
  ),
  residence('ascensao-categoria-aquaviario', 1),
  auxiliaryRequest(
    'ascensao-categoria-aquaviario',
    2,
    'Ascensão de categoria',
    'o registro da minha ascensão à categoria pretendida, conforme a NORMAM-101/DPC.',
  ),
  residence('transferencia-categoria-grupo-aquaviario', 1),
  auxiliaryRequest(
    'transferencia-categoria-grupo-aquaviario',
    2,
    'Transferência de categoria ou grupo',
    'a transferência excepcional de categoria ou grupo, conforme a NORMAM-101/DPC.',
  ),
  residence('homologacao-lrm-aquaviario', 1),
  auxiliaryRequest(
    'homologacao-lrm-aquaviario',
    2,
    'Homologação do Livro de Registro do Mergulhador',
    'a homologação do meu Livro de Registro do Mergulhador (LRM), modelo DPC-2212.',
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
