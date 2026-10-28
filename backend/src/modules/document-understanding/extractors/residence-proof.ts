import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
} from '../contracts.js';
import { anchoredValue, cleanText, normalizeText, toEvidence, uniqueLineValue } from '../extractor-utils.js';

const streetPrefix = /^(?:RUA|R\.|AVENIDA|AV\.|AV |ESTRADA|EST\.|RODOVIA|ROD\.|TRAVESSA|TV\.|ALAMEDA|AL\.|PRA[CÇ]A|PRACA|LARGO|VIELA|BECO)\b/i;
const labelLike = (value: string): boolean =>
  /^(?:CEP|ENDERECO|LOGRADOURO|CIDADE|MUNICIPIO|BAIRRO|DISTRITO|UF|ESTADO|NUMERO|COMPLEMENTO)\b/
    .test(normalizeText(value));

const textValue = (value: string, min = 2, max = 120): boolean => {
  const text = cleanText(value);
  return text.length >= min && text.length <= max && /[A-ZÀ-Ý]/i.test(text) && !labelLike(text);
};
const cepValue = (value: string): boolean => /^\d{5}-?\d{3}$/.test(value.trim());
const stateValue = (value: string): boolean => /^[A-Z]{2}$/i.test(value.trim());
const numberValue = (value: string): boolean => /^\d{1,6}[A-Z]?(?:[-/]\d{1,6})?$/i.test(value.trim());

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

function normalizedCep(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 8 ? digits.slice(0, 5) + '-' + digits.slice(5) : value;
}

export const residenceProofDocumentExtractor: DocumentExtractor = {
  documentType: 'residence-proof',
  extract(observation, context) {
    if (context.subjectRole !== 'person') return [];
    const evidence: FieldEvidence[] = [];

    const cep = field(observation, context, 'person.postalCode', [
      /^\s*(?:CEP|C[ÓO]DIGO\s+POSTAL)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'CEP', cepValue) ?? toEvidence(uniqueLineValue(
      observation, /\b(\d{5}-?\d{3})\b/g, cepValue, 'unique-cep-pattern',
    ), context, 'person.postalCode');
    if (cep) {
      evidence.push({ ...cep, value: normalizedCep(cep.value) });
    }

    push(evidence, field(observation, context, 'person.address', [
      /^\s*(?:ENDERE[CÇ]O|LOGRADOURO)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'ENDERECO', (value) => textValue(value, 4, 120)));

    push(evidence, field(observation, context, 'person.streetNumber', [
      /^\s*(?:N[ÚU]MERO|N[ºO.]?\s+DO\s+ENDERE[CÇ]O)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'NUMERO', numberValue));

    push(evidence, field(observation, context, 'person.apartment', [
      /^\s*COMPLEMENTO\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'COMPLEMENTO', (value) => textValue(value, 1, 60)));

    push(evidence, field(observation, context, 'person.neighborhood', [
      /^\s*(?:BAIRRO|DISTRITO)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'BAIRRO', (value) => textValue(value, 2, 80)));

    push(evidence, field(observation, context, 'person.city', [
      /^\s*(?:CIDADE|MUNIC[IÍ]PIO)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'CIDADE', (value) => textValue(value, 2, 80)));

    push(evidence, field(observation, context, 'person.state', [
      /^\s*(?:UF|ESTADO)\s*(?:[:#\-–]\s*)?(.*)$/i,
    ], 'UF', stateValue));

    // Utility bills often use a recipient block rather than explicit labels.
    // Only use this fallback when the document has exactly one CEP and one
    // plausible street line, keeping the result review-required.
    if (!evidence.some((item) => item.fieldId === 'person.address')) {
      const streets = observation.pages.flatMap((page) => page.lines)
        .filter((line) => streetPrefix.test(cleanText(line.text)))
        .filter((line) => cleanText(line.text).length <= 120);
      const unique = new Map(streets.map((line) => [normalizeText(line.text), line]));
      if (unique.size === 1) {
        const line = [...unique.values()][0]!;
        const raw = cleanText(line.text);
        const split = raw.match(/^(.*?)[, ]+N?[ºO.]?\s*(\d{1,6}[A-Z]?)(?:\s*[-–,]\s*(.*))?$/i);
        const address = cleanText(split?.[1] ?? raw);
        if (textValue(address, 4, 120)) {
          evidence.push({
            fieldId: 'person.address', value: address, confidence: line.confidence,
            documentId: context.documentId, sourceId: context.sourceId, page: line.page,
            method: 'unique-recipient-street-line', lineIds: [line.id], status: 'REVIEW_REQUIRED',
          });
        }
        if (split?.[2] && numberValue(split[2]) &&
          !evidence.some((item) => item.fieldId === 'person.streetNumber')) {
          evidence.push({
            fieldId: 'person.streetNumber', value: split[2], confidence: line.confidence,
            documentId: context.documentId, sourceId: context.sourceId, page: line.page,
            method: 'street-line-number', lineIds: [line.id], status: 'REVIEW_REQUIRED',
          });
        }
      }
    }

    return evidence;
  },
};
