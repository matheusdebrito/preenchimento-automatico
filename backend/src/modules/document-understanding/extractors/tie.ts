import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  FieldExtractionAssessment,
} from '../contracts.js';
import { normalizeText, toEvidence, uniqueLineValue, withSpatialPhrases } from '../extractor-utils.js';
import {
  extractSemanticConcepts,
  type SemanticFieldConcept,
} from '../semantic-concepts.js';

const motorSectionHeader =
  /^\s*MOTOR\s*([1-4])\s*(?:\/|-)?\s*ENGINE\s*\1\s*$/i;
const motorSectionFragment = /^\s*(?:MOTOR|ENGINE)\s*[1-4]\s*$/i;
const motorStructuralMarker = (value: string): boolean =>
  motorSectionHeader.test(value) || motorSectionFragment.test(value);

const labelLike = (value: string): boolean => {
  const normalized = normalizeText(value);
  return motorStructuralMarker(normalized) ||
    /^(?:NOME|NAME|VESSEL|INSCRI|REGISTRO|COMPRIMENTO|LOTA|CAPACIDADE|ANO|CASCO|HIN|CIN|MOTOR|ENGINE|FABRICANTE|MANUFACTURER|MARCA|BRAND|MODELO|MODEL|POT|S[EÉ]RIE|SERIAL|CP\/DL\/AG|AUTORIDADE|AB|GT|BOCA|BREADTH|ATIVIDADE|USO|ACTIVITY|QTD|TRIPULANTES|CREW|PASSAGEIROS|PASSAGERS|PASSENGERS|FORMATO|TIPO|TYPE|AREA|NAVEGACAO|NAVIGATION|PONTAL|DEPTH|MATERIAL|PROPULSAO|PROPULSION)\b/
      .test(normalized);
};

const textValue = (value: string, min = 2, max = 100): boolean => {
  const text = value.trim();
  return text.length >= min && text.length <= max && /[A-ZÀ-Ý0-9]/i.test(text) && !labelLike(text);
};

const compactIdentifier = (value: string): string => value.replace(/\s+/g, '').trim();

const strongHullIdentifier = (value: string): boolean => {
  const text = compactIdentifier(value);
  return /^BR[A-Z0-9./-]{8,30}$/i.test(text) && /[A-Z]/i.test(text) && /\d/.test(text);
};

const registration = (value: string): boolean => {
  const text = compactIdentifier(value);
  return /^[A-Z0-9./-]{4,30}$/i.test(text) && /\d/.test(text) &&
    !strongHullIdentifier(text);
};
const hull = (value: string): boolean => {
  const text = compactIdentifier(value);
  return /^[A-Z0-9./-]{5,50}$/i.test(text) && /[A-Z]/i.test(text) && /\d/.test(text);
};
const year = (value: string): boolean => /^(?:19|20)\d{2}$/.test(value.trim());
const length = (value: string): boolean => /^\d{1,2}(?:[.,]\d{1,2})?\s*(?:M|METROS?)?$/i.test(value.trim());
const capacity = (value: string): boolean => /^\d{1,3}$/.test(value.trim());
const decimalMeasure = (value: string): boolean =>
  /^\d{1,4}(?:[.,]\d{1,3})?\s*(?:M|METROS?)?$/i.test(value.trim());
const grossTonnage = (value: string): boolean =>
  /^\d{1,5}(?:[.,]\d{1,3})?$/.test(value.trim());
const count = (value: string): boolean => /^\d{1,4}$/.test(value.trim());
const power = (value: string): boolean =>
  /^\d{1,4}(?:[.,]\d{1,2})?\s*(?:HP|CV|KW)?$/i.test(value.trim());
const navigationArea = (value: string): boolean => {
  const text = value.trim();
  const normalized = normalizeText(text);
  return text.length >= 2 && text.length <= 80 && /[A-ZÀ-Ý]/i.test(text) &&
    !/^(?:AREA\s+DE\s+NAVEGACAO|NAVIGATION\s+AREA)$/.test(normalized);
};
const propulsion = (value: string): boolean => {
  const text = value.trim();
  const normalized = normalizeText(text);
  return text.length >= 2 && text.length <= 80 && /[A-ZÀ-Ý]/i.test(text) &&
    !/^(?:TIPO\s+DE\s+PROPULSAO|TYPE\s+OF\s+PROPULSION|PROPULSAO)$/.test(normalized);
};
const serial = (value: string): boolean => {
  const text = value.trim();
  const normalized = normalizeText(text);
  if (/S[EÉ]RIE\s+DO\s+MOTOR|ENGINE\s+SERIAL\s+NUMBER/i.test(normalized) ||
    motorStructuralMarker(normalized)) return false;
  return /^[A-Z0-9./-]{4,50}$/i.test(text) && /\d/.test(text);
};

const dateValue = (value: string): boolean =>
  /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim());
const yesNo = (value: string): boolean =>
  /^(?:SIM|NAO|NÃO|YES|NO)$/i.test(value.trim());
const issuePlace = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 80 &&
  /[A-ZÀ-Ý]/i.test(value) && !labelLike(value);

const tightTableCell = {
  minConfidence: 0.35,
  maxRightDistanceHeights: 10,
  sameRowToleranceHeights: 1.15,
  maxBelowDistanceHeights: 3.2,
  maxBelowHorizontalOffsetHeights: 5,
  maxSequentialLines: 1,
} as const;

const compactTableCell = {
  ...tightTableCell,
  maxRightDistanceHeights: 7,
  maxBelowDistanceHeights: 2.6,
  maxBelowHorizontalOffsetHeights: 4,
} as const;


export type TieDocumentVariant = 'digital' | 'legacy' | 'unknown';

const digitalVariantMarkers: readonly RegExp[] = [
  /\bREGISTRATION\s+NUMBER\b/,
  /\bTYPE\s+OF\s+VESSEL\b/,
  /\bENGINE\s+SERIAL\s+NUMBER\b/,
  /\bNUMBER\s+OF\s+CREW\b/,
  /\bBREADTH\b/,
  /\bAB\s*\/\s*GT\b/,
];

const legacyVariantMarkers: readonly RegExp[] = [
  /\bEMBARCACAO\s+MIUDA\b/,
  /\bPOTENCIA\s*\(?\s*HP\s*\)?\b/,
  /\bNOME\s+(?:DO\s+)?FABRICANTE\b/,
  /\bCARACTERISTICAS\s+DO\s+CASCO\b/,
  /\bCREDOR\s+HIPOTECARIO\b/,
  /\bMOTOR\s*\/?\s*SERIE\b|\bMOTORSERIE\b/,
];

function markerScore(lines: readonly string[], markers: readonly RegExp[]): number {
  return markers.reduce((score, marker) =>
    score + (lines.some((line) => marker.test(line)) ? 1 : 0), 0);
}

export function classifyTieVariant(observation: DocumentObservation): TieDocumentVariant {
  const lines = observation.pages.flatMap((page) =>
    page.lines.map((line) => normalizeText(line.text)));
  const digital = markerScore(lines, digitalVariantMarkers);
  const legacy = markerScore(lines, legacyVariantMarkers);

  if (digital >= 2 && digital > legacy) return 'digital';
  if (legacy >= 2 && legacy > digital) return 'legacy';
  return 'unknown';
}

const digitalOnlyFields = new Set([
  'vessel.grossTonnage',
  'vessel.breadth',
  'vessel.motorManufacturerBrandModel',
  'vessel.engineCount',
  'vessel.issuePlace',
  'vessel.issueDate',
]);

const legacyOnlyFields = new Set([
  'vessel.motorBrand',
  'vessel.motorPower',
  'vessel.registrationDate',
]);

function conceptsForVariant(variant: TieDocumentVariant): readonly SemanticFieldConcept[] {
  if (variant === 'digital') {
    return tieFieldConcepts.filter((concept) => !legacyOnlyFields.has(concept.fieldId));
  }
  if (variant === 'legacy') {
    return tieFieldConcepts.filter((concept) => !digitalOnlyFields.has(concept.fieldId));
  }
  return tieFieldConcepts;
}

export const tieFieldConcepts: readonly SemanticFieldConcept[] = [
  {
    fieldId: 'vessel.registration',
    anchor: 'INSCRICAO',
    labels: [
      /^\s*(?:(?:N[ÚU]MERO|N\s*[°ºO.]?)\s*(?:(?:DE|DA)\s*)?)?INSCRI[CÇ][AÃ]O(?:\s*\/\s*REGISTRATION\s+NUMBER)?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N\s*[°ºO.]?\s*INSCRI[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*REGISTRO\s+DA\s+EMBARCA[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    // Real-reference regression: PaddleOCR may degrade this bilingual label to
    // "MOMCIO DE INSCRICAO / REGISTRATION NUMSER". Keep fuzzy matching scoped
    // to this long label; geometry and the registration validator remain strict.
    approximateLabels: [
      { text: 'NUMERO DE INSCRICAO / REGISTRATION NUMBER', maxDistance: 5 },
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: registration,
  },
  {
    fieldId: 'vessel.registrationDate',
    anchor: 'DATA DE INSCRICAO',
    labels: [
      /^\s*DATA\s+(?:DE\s+)?INSCRI[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
    spatialHint: compactTableCell,
    validate: dateValue,
  },
  {
    fieldId: 'vessel.expirationDate',
    anchor: 'VALIDADE',
    labels: [
      /^\s*(?:DATA\s+DE\s+VALIDADE(?:\s*\/\s*EXPIRATION\s+DATE)?|VALIDADE)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
    spatialHint: compactTableCell,
    validate: dateValue,
  },
  {
    fieldId: 'vessel.name',
    anchor: 'NOME DA EMBARCACAO',
    labels: [
      /^\s*NOME\s+(?:DA\s+)?EMBARCA[CÇ][AÃ]O(?:\s*\/\s*NAME\s+OF\s+VESSEL)?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N[O0]M[E3]\s+D[A4]\s+EMBARC[A-ZÀ-Ý0-9]{3,}\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*NOME(?:\s*\/\s*NAME)?\s+(?:DA\s+)?MOTO\s+AQU[AÁ]TICA\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*NOME\s+(?:DO\s+)?BARCO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    approximateLabels: [
      { text: 'NOME DA EMBARCACAO', maxDistance: 3 },
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: tightTableCell,
    validate: (value) => textValue(value, 2, 100),
  },
  {
    fieldId: 'vessel.hullId',
    anchor: 'IDENTIFICACAO DO CASCO',
    labels: [
      /^\s*(?:HIN|CIN|N\s*[°ºO.]?\s*(?:DO\s+)?CASCO(?:\s*\/\s*HULL\s+NUMBER)?|IDENTIFICA[CÇ][AÃ]O\s+(?:DO\s+)?CASCO|FORMATO\s+DE\s+S[EÉ]RIE\s+DO\s+CASCO(?:\s*\/\s*FORMA)?|N[ÚU]MERO\s+DE\s+S[EÉ]RIE\s+DO\s+CASCO\s*\/\s*CHASSIS)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: hull,
  },
  {
    fieldId: 'vessel.year',
    anchor: 'ANO DE CONSTRUCAO',
    labels: [
      /^\s*ANO\s+(?:DE\s+)?CONSTRU[CÇ][AÃ]O(?:\s*\/\s*YEAR\s+OF\s+BUILD)?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*ANO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: compactTableCell,
    validate: year,
  },
  {
    fieldId: 'vessel.length',
    anchor: 'COMPRIMENTO',
    labels: [
      /^\s*COMPRIMENTO(?:\s+TOTAL)?(?:\s*\/\s*LENGTH)?(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: compactTableCell,
    validate: length,
  },
  {
    fieldId: 'vessel.capacity',
    anchor: 'LOTACAO',
    labels: [
      /^\s*(?:LOTA[CÇ][AÃ]O|CAPACIDADE(?:\s+DE\s+PESSOAS)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    validate: capacity,
  },
  {
    fieldId: 'vessel.grossTonnage',
    anchor: 'AB / GT',
    labels: [
      /^\s*(?:AB\s*\/\s*GT|ARQUEA[CÇ][AÃ]O\s+BRUTA(?:\s*\/\s*GROSS\s+TONNAGE)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: compactTableCell,
    validate: grossTonnage,
  },
  {
    fieldId: 'vessel.breadth',
    anchor: 'BOCA / BREADTH',
    labels: [
      /^\s*(?:BOCA\s*\/\s*BREADTH|BOCA|BREADTH)(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: compactTableCell,
    validate: decimalMeasure,
  },
  {
    fieldId: 'vessel.type',
    anchor: 'TIPO DA EMBARCACAO',
    labels: [
      /^\s*(?:TIPO\s+(?:DA\s+)?EMBARCA[CÇ][AÃ]O(?:\s*\/\s*TYPE\s+OF\s+VESSEL)?|TYPE\s+OF\s+VESSEL)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: (value) => textValue(value, 2, 80),
  },
  {
    fieldId: 'vessel.navigationArea',
    anchor: 'AREA DE NAVEGACAO',
    labels: [
      /^\s*(?:[ÁA]REA\s+DE\s+NAVEGA[CÇ][AÃ]O(?:\s*\/\s*NAVIGATION\s+AREA)?|NAVIGATION\s+AREA)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: navigationArea,
  },
  {
    fieldId: 'vessel.depth',
    anchor: 'PONTAL / DEPTH',
    labels: [
      /^\s*(?:PONTAL(?:\s*\/\s*DEPTH)?|DEPTH)(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
    validate: decimalMeasure,
  },
  {
    fieldId: 'vessel.hullMaterial',
    anchor: 'MATERIAL DO CASCO',
    labels: [
      /^\s*(?:MAT\.?\s*CONSTRU[CÇ][AÃ]O\s+CASCO|MATERIAL\s+(?:DE\s+CONSTRU[CÇ][AÃ]O\s+)?(?:DO\s+)?CASCO(?:\s*\/\s*HULL\s+MATERIAL)?|HULL\s+MATERIAL)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: (value) => textValue(value, 2, 80),
  },
  {
    fieldId: 'vessel.propulsionType',
    anchor: 'TIPO DE PROPULSAO',
    labels: [
      /^\s*(?:TIPO\s+DE\s+PROPULS[AÃ]O(?:\s*\/\s*TYPE\s+OF\s+PROPULSION)?|TYPE\s+OF\s+PROPULSION)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
        spatialHint: tightTableCell,
    validate: propulsion,
  },
  {
    fieldId: 'vessel.activity',
    anchor: 'ATIVIDADE',
    labels: [
      /^\s*(?:ATIVIDADE\s*[/|-]\s*ACTIVITY|ATIVIDADE\s*[/|-]\s*USO|ATIVIDADE\s*[/|-]\s*SERVI[CÇ]O|ATIVIDADE|ACTIVITY)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: tightTableCell,
    validate: (value) => textValue(value, 2, 80),
  },
  {
    fieldId: 'vessel.motorManufacturerBrandModel',
    anchor: 'FABRICANTE-MARCA-MODELO DO MOTOR',
    labels: [
      /^\s*MOTOR\s*1\s*\/\s*ENGINE\s*1\s+(?:FABRICANTE\s*[-–/]\s*MARCA\s*[-–/]\s*MODELO\s*\/\s*MANUFACTURER\s*[-–/]\s*BRAND\s*[-–/]\s*MODEL)\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*(?:FABRICANTE\s*[-–/]\s*MARCA\s*[-–/]\s*MODELO\s*\/\s*MANUFACTURER\s*[-–/]\s*BRAND\s*[-–/]\s*MODEL)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    boundaries: [
      /^\s*(?:MOTOR|ENGINE)\s*[2-4]\s*$/i,
      /^\s*MOTOR\s*[2-4]\s*(?:\/|-)?\s*ENGINE\s*[2-4]\s*$/i,
    ],
    allowSequentialWithGeometry: false,
    validate: (value) => textValue(value, 2, 100),
  },
  {
    fieldId: 'vessel.motorBrand',
    anchor: 'MARCA DO MOTOR',
    labels: [
      /^\s*(?:MOTOR\s*\/\s*MARCA|MARCA\s+(?:DO\s+)?MOTOR|MARCA\s*\/\s*MODELO\s+(?:DO\s+)?MOTOR|NOME\s+(?:DO\s+)?FABRICANTE)\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N[O0]M[E3]\s+(?:D[O0]\s+)?FABR[I1]CANTE\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    firstOccurrenceOnly: true,
    allowSequentialWithGeometry: false,
    validate: (value) => textValue(value, 2, 60),
  },
  {
    fieldId: 'vessel.motorPower',
    anchor: 'POTENCIA DO MOTOR',
    labels: [
      /^\s*POT[EÊ]NCIA(?:\s+(?:DO\s+)?MOTOR)?(?:\s*\(HP\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*P[O0]T[EÊÉ3]NC[I1]A(?:\s*\(?\s*H[P8]\s*\)?)?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    approximateLabels: [
      { text: 'POTENCIA HP', maxDistance: 2 },
      { text: 'POTENCIA', maxDistance: 2 },
    ],
    preferredDirections: ['below', 'right'],
    firstOccurrenceOnly: true,
    allowSequentialWithGeometry: false,
    validate: power,
  },
  {
    fieldId: 'vessel.motorSerial',
    anchor: 'SERIE DO MOTOR',
    labels: [
      /^\s*(?:(?:N[ÚU]MERO|N[°ºO.]?)\s+(?:DE\s+)?S[EÉ]RIE\s+(?:DO\s+)?MOTOR(?:\s*\/\s*ENGINE\s+SERIAL\s+NUMBER)?|ENGINE\s+SERIAL\s+NUMBER|S[EÉ]RIE\s+(?:DO\s+)?MOTOR|N[°ºO.]?\s+DO\s+1[°ºO.]?\s+MOTOR\s*\/\s*S[EÉ]RIE)\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*(?:N\s*[°ºO.]?\s*)?D[O0]\s+1\s*[°ºO.]?\s+M[O0]T[O0]R\s*[-/]?\s*S[EÉ3]R[I1]E\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    approximateLabels: [
      { text: 'N DO 1 MOTOR SERIE', maxDistance: 3 },
      { text: '1 MOTOR SERIE', maxDistance: 2 },
    ],
    preferredDirections: ['below', 'right'],
    firstOccurrenceOnly: true,
    boundaries: [
      /^\s*(?:MOTOR|ENGINE)\s*[2-4]\s*$/i,
      /^\s*MOTOR\s*[2-4]\s*(?:\/|-)?\s*ENGINE\s*[2-4]\s*$/i,
    ],
    allowSequentialWithGeometry: false,
    validate: serial,
  },
  {
    fieldId: 'vessel.crewCount',
    anchor: 'TRIPULANTES',
    labels: [
      /^\s*(?:N[ÚU]MERO\s+DE\s+TRIPULANTES\s*\/\s*NUMBER\s+OF\s+CREW\s+MEMBER(?:S)?|N[ÚU]MERO\s+DE\s+TRIPULANTES|QTD(?:ADE)?\.?\s+DE\s+TRIPULANTES|NUMBER\s+OF\s+CREW\s+MEMBER(?:S)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: compactTableCell,
    validate: count,
  },
  {
    fieldId: 'vessel.passengerCount',
    anchor: 'PASSAGEIROS',
    labels: [
      /^\s*(?:N[ÚU]MERO\s+DE\s+PASSAGEIROS\s*\/\s*NUMBER\s+OF\s+PASSAGERS|N[ÚU]MERO\s+DE\s+PASSAGEIROS|QTD(?:ADE)?\.?\s+DE\s+PASSAGEIROS|NUMBER\s+OF\s+PASSAGERS|NUMBER\s+OF\s+PASSENGERS)\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N[ÚU]MERO\s+DE\s+PASSAGEIROS\s*\/\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
        spatialHint: compactTableCell,
    validate: count,
  },
  {
    fieldId: 'vessel.engineCount',
    anchor: 'QUANTIDADE DE MOTORES',
    labels: [
      /^\s*(?:QUANTIDADE\s+DE\s+MOTORES(?:\s*\/\s*QUANTITY\s+OF\s+ENGINES)?|QUANTITY\s+OF\s+ENGINES)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    allowSequentialWithGeometry: false,
    spatialHint: compactTableCell,
    validate: count,
  },
  {
    fieldId: 'vessel.mortgaged',
    anchor: 'HIPOTECA / ALIENACAO',
    labels: [
      /^\s*(?:HIPOTECAD[AO]\??|ALIENA[CÇ][AÃ]O\s+FIDUCI[AÁ]RIA(?:\s*\/\s*CHATTEL\s+MORTGAGE)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    spatialHint: tightTableCell,
    validate: yesNo,
  },
  {
    fieldId: 'vessel.mortgageCreditor',
    anchor: 'CREDOR HIPOTECARIO',
    labels: [
      /^\s*CREDOR\s+HIPOTEC[AÁ]RIO(?:\s*\/\s*MORTGAGE\s+CREDITOR)?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    spatialHint: tightTableCell,
    validate: (value) => textValue(value, 2, 100),
  },
  {
    fieldId: 'vessel.issuePlace',
    anchor: 'LOCAL DE EMISSAO',
    labels: [
      /^\s*LOCAL\s+DE\s+EMISS[AÃ]O(?:\s*\/\s*PLACE\s+OF\s+ISSUE)?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    spatialHint: tightTableCell,
    validate: issuePlace,
  },
  {
    fieldId: 'vessel.issueDate',
    anchor: 'DATA DE EMISSAO',
    labels: [
      /^\s*DATA\s+DE\s+EMISS[AÃ]O(?:\s*\/\s*DATE\s+OF\s+ISSUE)?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    spatialHint: compactTableCell,
    validate: dateValue,
  },
  {
    fieldId: 'vessel.authority',
    anchor: 'CP/DL/AG',
    labels: [
      /^\s*(?:CP\s*\/\s*DL\s*\/\s*AG|CAPITANIA\s*\/\s*DELEGACIA\s*\/\s*AG[EÊ]NCIA|AUTORIDADE\s+MAR[IÍ]TIMA)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    validate: (value) => textValue(value, 2, 50),
  },
];

function runTieExtraction(
  observation: DocumentObservation,
  context: ExtractionContext,
): { evidence: FieldEvidence[]; assessments: FieldExtractionAssessment[] } {
  const variant = classifyTieVariant(observation);
  const concepts = conceptsForVariant(variant);
  const semantic = extractSemanticConcepts(observation, context, concepts);
  const evidence = [...semantic.evidence];
  const byAssessment = new Map(semantic.assessments.map((item) => [item.fieldId, item]));
  const assessments = tieFieldConcepts.map((concept) =>
    byAssessment.get(concept.fieldId) ?? {
      fieldId: concept.fieldId,
      status: 'NOT_FOUND' as const,
      confidence: null,
    });

  // A hull fallback is intentionally strict: only identifiers with a strong
  // Brazilian hull/HIN shape are eligible. Generic alphanumeric identifiers
  // can be vessel registrations and must never be promoted to hullId.
  if (!evidence.some((item) => item.fieldId === 'vessel.hullId')) {
    const source = withSpatialPhrases(observation);
    const fallback = toEvidence(uniqueLineValue(
      source,
      /\b(BR[A-Z0-9./-]{8,30})\b/gi,
      strongHullIdentifier,
      'unique-strong-hull-pattern',
    ), context, 'vessel.hullId');
    if (fallback) {
      evidence.push(fallback);
      const index = assessments.findIndex((item) => item.fieldId === 'vessel.hullId');
      if (index >= 0) {
        assessments[index] = {
          fieldId: 'vessel.hullId',
          status: 'FOUND',
          confidence: fallback.confidence,
          method: fallback.method,
        };
      }
    }
  }

  return { evidence, assessments };
}

export const tieDocumentExtractor: DocumentExtractor = {
  documentType: 'tie',
  supportedFields: tieFieldConcepts.map((concept) => concept.fieldId),
  extract(observation, context) {
    return runTieExtraction(observation, context).evidence;
  },
  assess(observation, context) {
    return runTieExtraction(observation, context).assessments;
  },
};
