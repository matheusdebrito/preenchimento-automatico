import type { CoordinatePlacement, FormMapping } from './contracts.js';

const PAGE_HEIGHT = 842;
function top(
  fieldId: string,
  x: number,
  topBaseline: number,
  maxWidth: number,
  fontSize = 7,
  pageIndex = 0,
  required = false,
  markWhen?: string,
  valueTransform?: CoordinatePlacement['valueTransform'],
): CoordinatePlacement {
  return {
    kind: 'COORDINATES', fieldId, required, pageIndex,
    x, y: PAGE_HEIGHT - topBaseline, maxWidth, fontSize,
    ...(markWhen === undefined ? {} : { markWhen }),
    ...(valueTransform === undefined ? {} : { valueTransform }),
  };
}

const certification: readonly CoordinatePlacement[] = [
  top('person.fullName', 72, 282, 500, 7),
  top('person.birthDate', 78, 313, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('person.birthDate', 116, 313, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('person.birthDate', 154, 313, 32, 7, 0, false, undefined, 'DATE_YEAR'),
  top('person.nationality', 210, 322, 75, 7),
  top('person.birthplace', 300, 322, 80, 7),
  top('person.sex', 466, 296, 9, 9, 0, false, 'masculino'),
  top('person.sex', 557, 296, 9, 9, 0, false, 'feminino'),
  top('person.phone', 395, 326, 175, 7),
  top('aquaviario.cirNumber', 120, 348, 105, 7),
  top('aquaviario.category', 285, 348, 90, 7),
  top('person.fullAddress', 72, 376, 500, 6.5),
  top('aquaviario.observations', 72, 401, 500, 6.5),
  top('process.aquaviarioCertificationAction', 228, 447, 9, 9, 0, false, 'emissao'),
  top('process.aquaviarioCertificationAction', 396, 447, 9, 9, 0, false, 'revalidacao'),
  top('process.aquaviarioCertificationAction', 567, 447, 9, 9, 0, false, 'segunda_via'),
  top('process.aquaviarioCertificateModel', 161, 474, 9, 9, 0, false, 'dpc1031'),
  top('process.aquaviarioCertificateModel', 283, 474, 9, 9, 0, false, 'dpc1032'),
  top('process.aquaviarioCertificateModel', 398, 474, 9, 9, 0, false, 'dpc1033'),
  top('process.aquaviarioCertificateModel', 566, 474, 9, 9, 0, false, 'dpc1034'),
  top('process.place', 72, 659, 55, 6.2),
  top('process.date', 132, 659, 58, 6.2),
];

const loss: readonly CoordinatePlacement[] = [
  top('person.fullName', 112, 177, 265, 7),
  top('person.identity', 180, 201, 115, 7),
  top('person.issuer', 255, 201, 65, 6.5),
  top('person.issueDate', 398, 201, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('person.issueDate', 426, 201, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('person.issueDate', 455, 201, 30, 7, 0, false, undefined, 'DATE_YEAR'),
  // No 1-K, o campo CPF impresso é curto; evitar sobreposição com "CPF n.".
  top('person.cpf', 527, 201, 62, 6.2),
  top('person.address', 210, 233, 230, 6.5),
  top('person.streetNumber', 465, 233, 32, 6.5),
  top('person.apartment', 505, 233, 65, 6.5),
  top('person.neighborhood', 92, 260, 90, 6.5),
  top('person.postalCode', 205, 260, 70, 6.5),
  // Cidade/UF termina antes do rotulo "telefones"; telefone ocupa sua
  // propria linha impressa, antes de "Declaro que".
  top('person.city', 280, 260, 65, 6.0),
  top('person.state', 349, 260, 16, 6.0),
  top('person.phone', 375, 260, 100, 6.2),
  top('process.aquaviarioLostDocumentType', 73, 319, 9, 9, 0, false, 'dpc1031'),
  top('process.aquaviarioLostDocumentType', 73, 339, 9, 9, 0, false, 'dpc1033'),
  top('process.aquaviarioLostDocumentType', 73, 359, 9, 9, 0, false, 'dpc1034'),
  top('process.aquaviarioLostDocumentType', 73, 379, 9, 9, 0, false, 'cir'),
  top('aquaviario.documentNumber', 155, 379, 75, 7),
  top('aquaviario.lossEventDate', 145, 414, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('aquaviario.lossEventDate', 174, 414, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('aquaviario.lossEventDate', 195, 414, 30, 7, 0, false, undefined, 'DATE_YEAR'),
  { ...top('aquaviario.lossDescription', 370, 414, 175, 6.2),
    minFontSize: 5.5,
    continuationLines: [{ x: 100, y: PAGE_HEIGHT - 434, maxWidth: 445 }],
  },
  top('aquaviario.authorityName', 250, 516, 95, 6.2),
  top('process.date', 372, 516, 18, 6.5, 0, false, undefined, 'DATE_DAY'),
  top('process.date', 414, 516, 65, 6.5, 0, false, undefined, 'DATE_MONTH_NAME_PT_BR'),
  top('process.date', 500, 516, 35, 6.5, 0, false, undefined, 'DATE_YEAR'),
];

const residence: readonly CoordinatePlacement[] = [
  top('aquaviario.authorityName', 332, 168, 200, 7),
  top('person.fullName', 108, 215, 465, 7),
  top('person.cpf', 122, 237, 100, 7),
  top('person.nationality', 300, 237, 95, 7),
  top('person.birthplace', 475, 237, 95, 7),
  top('person.phone', 205, 258, 155, 7),
  top('person.mobile', 405, 258, 165, 7),
  top('person.email', 125, 279, 445, 7),
  // A linha oficial de endereco e continua: imprimir um valor unico em
  // ordem de leitura, sem espalhar fragmentos em celulas independentes.
  { ...top('person.fullAddress', 92, 360, 475, 7),
    minFontSize: 5.5,
  },
  // A linha sob a data e o local e reservada para assinatura; cidade fica acima do rotulo (Cidade).
  top('process.place', 345, 598, 85, 6.2),
  top('process.date', 408, 615, 22, 7, 0, false, undefined, 'DATE_DAY'),
  top('process.date', 464, 615, 22, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('process.date', 502, 615, 35, 7, 0, false, undefined, 'DATE_YEAR'),
];

const auxiliaryRequest: readonly CoordinatePlacement[] = [
  // Modelo regional da CPRJ/EPM, uma página A4. Coordenadas medidas no
  // PDF anexado; as assinaturas continuam reservadas para preenchimento manual.
  top('process.requestSubject', 132, 150, 411, 7.5),
  { ...top('process.requestPurpose', 63, 177, 485, 7.4),
    minFontSize: 6,
    continuationLines: [{ x: 63, y: PAGE_HEIGHT - 205, maxWidth: 485 }],
  },
  top('person.fullName', 64, 256, 485, 8, 0, true),
  top('person.cpf', 65, 291, 157, 7),
  top('person.birthDate', 207, 289, 20, 7, 0, false, undefined, 'DATE_DAY'),
  top('person.birthDate', 241, 289, 19, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('person.birthDate', 272, 289, 36, 7, 0, false, undefined, 'DATE_YEAR'),
  top('person.birthplace', 323, 290, 135, 7),
  top('person.nationality', 473, 290, 83, 7),
  top('aquaviario.cirNumber', 64, 334, 180, 7),
  top('aquaviario.category', 258, 334, 103, 7),
  top('aquaviario.height', 374, 334, 87, 7),
  top('aquaviario.eyeColor', 478, 334, 77, 7),
  top('person.identity', 64, 374, 174, 7),
  top('person.issuer', 257, 374, 159, 7),
  top('person.issueDate', 458, 374, 93, 7),
  // Sexo é marcado somente na opção informada, sem inferir o sexo de alguém.
  top('person.sex', 81, 417, 8, 7, 0, false, 'masculino'),
  top('person.sex', 104, 417, 8, 7, 0, false, 'feminino'),
  top('person.phone', 165, 418, 83, 6.8),
  top('person.mobile', 303, 418, 68, 6.8),
  top('person.email', 428, 418, 124, 6.8),
  top('person.motherName', 64, 455, 487, 7.2),
  top('person.address', 64, 497, 486, 7.2),
  top('person.streetNumber', 65, 518, 165, 7),
  top('person.apartment', 258, 518, 290, 7),
  top('person.neighborhood', 65, 539, 243, 7),
  top('person.city', 326, 539, 222, 7),
  top('person.state', 65, 561, 344, 7),
  top('person.postalCode', 431, 561, 116, 7),
  // "Rio de Janeiro" e o prefixo do ano "20" já são impressos no arquivo.
  top('process.date', 343, 610, 22, 7, 0, false, undefined, 'DATE_DAY'),
  top('process.date', 410, 610, 90, 7, 0, false, undefined, 'DATE_MONTH_NAME_PT_BR'),
  top('process.date', 536, 610, 18, 7, 0, false, undefined, 'DATE_YEAR_2'),
  // Dados do representante são opcionais. Nunca preencher assinaturas.
  top('representative.fullName', 100, 701, 446, 7.2),
  top('representative.cpf', 97, 724, 191, 7),
  top('representative.phone', 326, 724, 222, 7),
  top('representative.email', 102, 744, 446, 7),
];

export const aquaviarioMappings: readonly FormMapping[] = [
  {
    id: 'requerimento-certificacao-aquaviario-map-v1',
    formVersionId: 'requerimento-certificacao-aquaviario-2026-v1',
    revision: 'v1',
    status: 'APPROVED',
    placements: certification,
    reviewedAt: '2026-10-30',
    reviewer: 'OpenAI visual QA from NORMAM-101/DPC pages 165-166',
    reportPath: 'docs/mapping-reports/normam101-aquaviarios-2026-technical-qa.md',
  },
  {
    id: 'declaracao-extravio-aquaviario-map-v1',
    formVersionId: 'declaracao-extravio-aquaviario-2026-v1',
    revision: 'v1',
    status: 'APPROVED',
    placements: loss,
    reviewedAt: '2026-10-30',
    reviewer: 'OpenAI visual QA from NORMAM-101/DPC page 179',
    reportPath: 'docs/mapping-reports/normam101-aquaviarios-2026-technical-qa.md',
  },
  {
    id: 'declaracao-residencia-aquaviario-map-v1',
    formVersionId: 'declaracao-residencia-aquaviario-2026-v1',
    revision: 'v1',
    status: 'APPROVED',
    placements: residence,
    reviewedAt: '2026-10-30',
    reviewer: 'OpenAI visual QA from NORMAM-101/DPC page 181',
    reportPath: 'docs/mapping-reports/normam101-aquaviarios-2026-technical-qa.md',
  },
  {
    id: 'requerimento-interessado-aquaviario-map-v1',
    formVersionId: 'requerimento-interessado-aquaviario-2026-v2',
    revision: 'v2',
    status: 'APPROVED',
    placements: auxiliaryRequest,
    reviewedAt: '2026-10-30',
    reviewer: 'Mapeamento das células do requerimento regional EPM/CPRJ fornecido pelo usuário',
    reportPath: 'docs/mapping-reports/normam101-aquaviarios-2026-technical-qa.md',
  },
];
