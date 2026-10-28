import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
} from '../contracts.js';
import { anchoredValue, normalizeText, toEvidence, uniqueLineValue, withSpatialPhrases } from '../extractor-utils.js';

const labelLike = (value: string): boolean =>
  /^(?:NOME|INSCRI|REGISTRO|COMPRIMENTO|LOTA|CAPACIDADE|ANO|CASCO|HIN|CIN|MOTOR|MARCA|POT|S[EÉ]RIE|CP\/DL\/AG|AUTORIDADE)\b/
    .test(normalizeText(value));

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
const power = (value: string): boolean =>
  /^\d{1,4}(?:[.,]\d{1,2})?\s*(?:HP|CV|KW)?$/i.test(value.trim());
const serial = (value: string): boolean =>
  /^[A-Z0-9./-]{4,50}$/i.test(value.trim()) && /\d/.test(value);

function push(evidence: FieldEvidence[], item: FieldEvidence | null): void {
  if (item) evidence.push(item);
}

function field(
  observation: DocumentObservation,
  context: ExtractionContext,
  fieldId: string,
  labels: readonly RegExp[],
  anchor: string,
  validate: (value: string) => boolean,
): FieldEvidence | null {
  return toEvidence(anchoredValue(observation, labels, anchor, validate), context, fieldId);
}

export const tieDocumentExtractor: DocumentExtractor = {
  documentType: 'tie',
  extract(observation, context) {
    const source = withSpatialPhrases(observation);
    const evidence: FieldEvidence[] = [];

    push(evidence, field(source, context, 'vessel.registration', [
      /^\s*(?:(?:N[ÚU]MERO|N[ºO.]?)\s+(?:DE|DA)\s+)?INSCRI[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*N[ºO.]?\s*INSCRI[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*REGISTRO\s+DA\s+EMBARCA[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'INSCRICAO', registration));

    push(evidence, field(source, context, 'vessel.name', [
      /^\s*NOME(?:\s*\/\s*NAME)?\s+(?:DA\s+)?(?:EMBARCA[CÇ][AÃ]O|EMBARCA[CÇ][AÃ]O\s*\/\s*VESSEL|MOTO\s+AQU[AÁ]TICA)\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*NOME\s+(?:DO\s+)?BARCO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'NOME DA EMBARCACAO', (value) => textValue(value, 2, 100)));

    push(evidence, field(source, context, 'vessel.hullId', [
      /^\s*(?:HIN|CIN|N[ºO.]?\s*(?:DO\s+)?CASCO|IDENTIFICA[CÇ][AÃ]O\s+(?:DO\s+)?CASCO)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'IDENTIFICACAO DO CASCO', hull));

    push(evidence, field(source, context, 'vessel.year', [
      /^\s*ANO\s+(?:DE\s+)?CONSTRU[CÇ][AÃ]O\s*(?:[:#\-–]\s*)?(.*)$/i,
      /^\s*ANO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'ANO DE CONSTRUCAO', year));

    push(evidence, field(source, context, 'vessel.length', [
      /^\s*COMPRIMENTO(?:\s+TOTAL)?(?:\s*\(M\))?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'COMPRIMENTO', length));

    push(evidence, field(source, context, 'vessel.capacity', [
      /^\s*(?:LOTA[CÇ][AÃ]O|CAPACIDADE(?:\s+DE\s+PESSOAS)?)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'LOTACAO', capacity));

    push(evidence, field(source, context, 'vessel.motorBrand', [
      /^\s*(?:MOTOR\s*\/\s*MARCA|MARCA\s+(?:DO\s+)?MOTOR|MARCA\s*\/\s*MODELO\s+(?:DO\s+)?MOTOR)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'MOTOR/MARCA', (value) => textValue(value, 2, 60)));

    push(evidence, field(source, context, 'vessel.motorPower', [
      /^\s*POT[EÊ]NCIA(?:\s+(?:DO\s+)?MOTOR)?\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'POTENCIA DO MOTOR', power));

    push(evidence, field(source, context, 'vessel.motorSerial', [
      /^\s*(?:N[ÚU]MERO\s+(?:DE\s+)?S[EÉ]RIE(?:\s+(?:DO\s+)?MOTOR)?|S[EÉ]RIE\s+(?:DO\s+)?MOTOR)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'SERIE DO MOTOR', serial));

    push(evidence, field(source, context, 'vessel.authority', [
      /^\s*(?:CP\s*\/\s*DL\s*\/\s*AG|CAPITANIA\s*\/\s*DELEGACIA\s*\/\s*AG[EÊ]NCIA|AUTORIDADE\s+MAR[IÍ]TIMA)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'CP/DL/AG', (value) => textValue(value, 2, 50)));

    // Some TIE variants print HIN/CIN inline without a separate label.
    if (!evidence.some((item) => item.fieldId === 'vessel.hullId')) {
      push(evidence, toEvidence(uniqueLineValue(
        source,
        /\b((?:BR[- ]?)?[A-Z0-9]{8,20})\b/gi,
        (value) => hull(value) && /[A-Z]/i.test(value),
        'unique-hull-pattern',
      ), context, 'vessel.hullId'));
    }

    return evidence;
  },
};
