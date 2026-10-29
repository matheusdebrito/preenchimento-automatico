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
    kind: 'COORDINATES',
    fieldId,
    required,
    pageIndex,
    x,
    y: PAGE_HEIGHT - topBaseline,
    maxWidth,
    fontSize,
    ...(markWhen === undefined ? {} : { markWhen }),
    ...(valueTransform === undefined ? {} : { valueTransform }),
  };
}

const requestPlacements: readonly CoordinatePlacement[] = [
  top('person.fullName', 105, 202, 420, 7, 0, true),
  top('person.cpf', 115, 228, 120, 7, 0, true),
  top('person.identity', 313, 228, 90, 7),
  top('person.issuer', 472, 228, 55, 6),
  top('person.address', 130, 243, 390, 7),
  top('person.streetNumber', 102, 272, 28, 7),
  top('person.apartment', 210, 272, 58, 7),
  top('person.neighborhood', 315, 272, 82, 7),
  top('person.city', 450, 272, 80, 7),
  top('person.state', 108, 287, 45, 7),
  top('person.postalCode', 195, 287, 110, 7),
  top('person.phone', 365, 287, 160, 7),
  top('person.mobile', 156, 302, 135, 7),
  top('person.email', 340, 302, 185, 7),
  top('process.amateurRequest', 89, 370, 10, 9, 0, false, 'emissao_renovacao'),
  top('process.notes', 210, 96, 315, 7, 1),
  top('process.place', 92, 301, 140, 7, 1),
  top('process.date', 315, 301, 20, 7, 1, false, undefined, 'DATE_DAY'),
  top('process.date', 355, 301, 20, 7, 1, false, undefined, 'DATE_MONTH_NUMBER'),
  top('process.date', 400, 301, 35, 7, 1, false, undefined, 'DATE_YEAR'),
  top('person.cpf', 95, 345, 140, 7, 1),
];

const lossPlacements: readonly CoordinatePlacement[] = [
  top('person.fullName', 112, 177, 305, 7, 0, true),
  top('person.identity', 180, 199, 115, 7),
  top('person.issuer', 308, 199, 65, 7),
  top('person.issueDate', 459, 199, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('person.issueDate', 489, 199, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('person.issueDate', 519, 199, 28, 7, 0, false, undefined, 'DATE_YEAR'),
  top('person.cpf', 125, 221, 140, 7, 0, true),
  top('person.address', 338, 221, 195, 7),
  top('person.streetNumber', 92, 243, 120, 7),
  top('person.neighborhood', 235, 243, 140, 7),
  top('person.postalCode', 400, 243, 130, 7),
  top('person.city', 92, 265, 125, 7),
  top('person.phone', 283, 265, 125, 7),
  top('amateur.chaNumber', 325, 287, 145, 7, 0, true),
  top('amateur.chaIssueDate', 90, 309, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('amateur.chaIssueDate', 119, 309, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('amateur.chaIssueDate', 146, 309, 30, 7, 0, false, undefined, 'DATE_YEAR'),
  top('amateur.category', 255, 309, 165, 7, 0, true),
  top('process.chaLossReason', 88, 348, 10, 9, 0, false, 'extraviada'),
  top('process.chaLossReason', 88, 370, 10, 9, 0, false, 'roubada'),
  top('process.chaLossReason', 88, 392, 10, 9, 0, false, 'furtada'),
  top('process.chaLossReason', 88, 414, 10, 9, 0, false, 'danificada'),
  top('process.date', 164, 606, 18, 7, 0, false, undefined, 'DATE_DAY'),
  top('process.date', 194, 606, 18, 7, 0, false, undefined, 'DATE_MONTH_NUMBER'),
  top('process.date', 225, 606, 32, 7, 0, false, undefined, 'DATE_YEAR'),
];

export const amateurMappings: readonly FormMapping[] = [
  {
    id: 'requerimento-cha-amador-map-v1',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    revision: 'v1',
    status: 'TESTED',
    placements: requestPlacements,
    reviewedAt: '2026-10-29',
    reviewer: 'OpenAI local synthetic visual QA',
    reportPath: 'docs/mapping-reports/normam211-amadores-2026-technical-qa.md',
  },
  {
    id: 'declaracao-extravio-cha-amador-map-v1',
    formVersionId: 'declaracao-extravio-cha-amador-2026-v1',
    revision: 'v1',
    status: 'TESTED',
    placements: lossPlacements,
    reviewedAt: '2026-10-29',
    reviewer: 'OpenAI local synthetic visual QA',
    reportPath: 'docs/mapping-reports/normam211-amadores-2026-technical-qa.md',
  },
];
