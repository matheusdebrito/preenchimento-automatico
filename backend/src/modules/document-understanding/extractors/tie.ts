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
    /^(?:NOME|NAME|VESSEL|INSCRI|REGISTRO|COMPRIMENTO|LOTA|CAPACIDADE|ANO|CASCO|HIN|CIN|MOTOR|ENGINE|FABRICANTE|MANUFACTURER|MARCA|BRAND|MODELO|MODEL|POT|S[EÉ]RIE|SERIAL|CP\/DL\/AG|AUTORIDADE|AB|GT|BOCA|BREADTH|ATIVIDADE|USO|ACTIVITY|QTD|TRIPULANTES|CREW|PASSAGEIROS|PASSAGERS|PASSENGERS|FORMATO)\b/
      .test(normalized);
};

const textValue = (value: string, min = 2, max = 100): boolean => {
  const text = value.trim();
  return text.length >= min && text.length <= max && /[A-ZÀ-Ý0-9]/i.test(text) && !labelLike(text);
};

const registration = (value: string): boolean =>
  /^[A-Z0-9./-]{4,30}$/i.test(value.trim()) && /\d/.test(value);
const hull = (value: string): boolean =>
  /^[A-Z0-9./-]{5,50}$/i.test(value.trim()) && /[A-Z]/i.test(value) && /\d/.test(value);
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
const serial = (value: string): boolean => {
  const text = value.trim();
  const normalized = normalizeText(text);
  if (/S[EÉ]RIE\s+DO\s+MOTOR|ENGINE\s+SERIAL\s+NUMBER/i.test(normalized) ||
    motorStructuralMarker(normalized)) return false;
  return /^[A-Z0-9./-]{4,50}$/i.test(text) && /\d/.test(text);
};

export const tieFieldConcepts: readonly SemanticFieldConcept[] = [
  {
    fieldId: 'vessel.registration',
    anchor: 'INSCRICAO',
    labels: [
      /^\s*(?:(?:N[ÚU]MERO|N[ºO.]?)\s+(?:DE|DA)\s+)?INSCRI[CÇ][AÃ]O(?:\s*\/\s*REGISTRATION\s+NUMBER)?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N[ºO.]?\s*INSCRI[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*REGISTRO\s+DA\s+EMBARCA[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    validate: registration,
  },
  {
    fieldId: 'vessel.name',
    anchor: 'NOME DA EMBARCACAO',
    labels: [
      /^\s*NOME\s+(?:DA\s+)?EMBARCA[CÇ][AÃ]O(?:\s*\/\s*NAME\s+OF\s+VESSEL)?\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*NOME(?:\s*\/\s*NAME)?\s+(?:DA\s+)?MOTO\s+AQU[AÁ]TICA\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*NOME\s+(?:DO\s+)?BARCO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    validate: (value) => textValue(value, 2, 100),
  },
  {
    fieldId: 'vessel.hullId',
    anchor: 'IDENTIFICACAO DO CASCO',
    labels: [
      /^\s*(?:HIN|CIN|N[ºO.]?\s*(?:DO\s+)?CASCO(?:\s*\/\s*HULL\s+NUMBER)?|IDENTIFICA[CÇ][AÃ]O\s+(?:DO\s+)?CASCO|FORMATO\s+DE\s+S[EÉ]RIE\s+DO\s+CASCO(?:\s*\/\s*FORMA)?|N[ÚU]MERO\s+DE\s+S[EÉ]RIE\s+DO\s+CASCO\s*\/\s*CHASSIS)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
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
    validate: year,
  },
  {
    fieldId: 'vessel.length',
    anchor: 'COMPRIMENTO',
    labels: [
      /^\s*COMPRIMENTO(?:\s+TOTAL)?(?:\s*\/\s*LENGTH)?(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
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
    validate: grossTonnage,
  },
  {
    fieldId: 'vessel.breadth',
    anchor: 'BOCA / BREADTH',
    labels: [
      /^\s*(?:BOCA\s*\/\s*BREADTH|BOCA|BREADTH)(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    validate: decimalMeasure,
  },
  {
    fieldId: 'vessel.activity',
    anchor: 'ATIVIDADE',
    labels: [
      /^\s*(?:ATIVIDADE\s*\/\s*ACTIVITY|ATIVIDADE\s*\/\s*USO|ATIVIDADE\s*\/\s*SERVI[CÇ]O|ATIVIDADE|ACTIVITY)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
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
      /^\s*(?:MOTOR\s*\/\s*MARCA|MARCA\s+(?:DO\s+)?MOTOR|MARCA\s*\/\s*MODELO\s+(?:DO\s+)?MOTOR|NOME\s+FABRICANTE)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    validate: (value) => textValue(value, 2, 60),
  },
  {
    fieldId: 'vessel.motorPower',
    anchor: 'POTENCIA DO MOTOR',
    labels: [
      /^\s*POT[EÊ]NCIA(?:\s+(?:DO\s+)?MOTOR)?(?:\s*\(HP\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    validate: power,
  },
  {
    fieldId: 'vessel.motorSerial',
    anchor: 'SERIE DO MOTOR',
    labels: [
      /^\s*(?:(?:N[ÚU]MERO|N[°ºO.]?)\s+(?:DE\s+)?S[EÉ]RIE\s+(?:DO\s+)?MOTOR(?:\s*\/\s*ENGINE\s+SERIAL\s+NUMBER)?|ENGINE\s+SERIAL\s+NUMBER|S[EÉ]RIE\s+(?:DO\s+)?MOTOR|N[°ºO.]?\s+DO\s+1[°ºO.]?\s+MOTOR\s*\/\s*S[EÉ]RIE)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
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
      /^\s*(?:N[ÚU]MERO\s+DE\s+TRIPULANTES\s*\/\s*NUMBER\s+OF\s+CREW\s+MEMBER(?:S)?|N[ÚU]MERO\s+DE\s+TRIPULANTES|QTD\.?\s+DE\s+TRIPULANTES|NUMBER\s+OF\s+CREW\s+MEMBER(?:S)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    validate: count,
  },
  {
    fieldId: 'vessel.passengerCount',
    anchor: 'PASSAGEIROS',
    labels: [
      /^\s*(?:N[ÚU]MERO\s+DE\s+PASSAGEIROS\s*\/\s*NUMBER\s+OF\s+PASSAGERS|N[ÚU]MERO\s+DE\s+PASSAGEIROS|QTD\.?\s+DE\s+PASSAGEIROS|NUMBER\s+OF\s+PASSAGERS|NUMBER\s+OF\s+PASSENGERS)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ],
    preferredDirections: ['below', 'right'],
    validate: count,
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
  const semantic = extractSemanticConcepts(observation, context, tieFieldConcepts);
  const evidence = [...semantic.evidence];
  const assessments = [...semantic.assessments];

  // Some TIE variants expose a unique HIN/CIN without a stable label.
  if (!evidence.some((item) => item.fieldId === 'vessel.hullId')) {
    const source = withSpatialPhrases(observation);
    const fallback = toEvidence(uniqueLineValue(
      source,
      /\b((?:BR[- ]?)?[A-Z0-9]{8,20})\b/gi,
      (value) => hull(value) && /[A-Z]/i.test(value),
      'unique-hull-pattern',
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
