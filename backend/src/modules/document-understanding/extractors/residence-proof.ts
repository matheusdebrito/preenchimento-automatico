import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
} from '../contracts.js';
import { anchoredValue, cleanText, normalizeText, toEvidence, uniqueLineValue } from '../extractor-utils.js';

const streetPrefix = /^(?:RUA|R\.|R |AVENIDA|AV\.|AV |ESTRADA|EST\.|EST |RODOVIA|ROD\.|ROD |TRAVESSA|TV\.|TV |ALAMEDA|AL\.|AL |PRA[CÇ]A|PRACA|LARGO|VIELA|BECO)\b/i;
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
    // Prefer the street line spatially closest to the unique CEP. This is more
    // precise than choosing any address printed elsewhere on a multi-page bill.
    if (!evidence.some((item) => item.fieldId === 'person.address')) {
      const cepEvidence = evidence.find((item) => item.fieldId === 'person.postalCode');
      const allLines = observation.pages.flatMap((page) => page.lines);
      const cepLine = cepEvidence?.lineIds.length === 1
        ? allLines.find((line) => line.id === cepEvidence.lineIds[0])
        : undefined;
      const streets = allLines
        .filter((line) => line.page === (cepLine?.page ?? line.page))
        .filter((line) => streetPrefix.test(cleanText(line.text)))
        .filter((line) => cleanText(line.text).length <= 120);

      let selected = null as (typeof streets)[number] | null;
      if (cepLine?.box) {
        const nearby = streets
          .filter((line) => line.box)
          .map((line) => ({
            line,
            distance: Math.abs(((line.box![1] + line.box![3]) / 2) -
              ((cepLine.box![1] + cepLine.box![3]) / 2)),
          }))
          .filter((item) => item.distance <= 220)
          .sort((a, b) => a.distance - b.distance);
        if (nearby[0] && (!nearby[1] || nearby[1].distance - nearby[0].distance > 8)) {
          selected = nearby[0].line;
        }
      }
      if (!selected) {
        const unique = new Map(streets.map((line) => [normalizeText(line.text), line]));
        if (unique.size === 1) selected = [...unique.values()][0]!;
      }

      if (selected) {
        const raw = cleanText(selected.text);
        const split = raw.match(/^(.*?)[, ]+N?[ºO.]?\s*(\d{1,6}[A-Z]?)(?:\s*[-–,]\s*(.*))?$/i);
        const address = cleanText(split?.[1] ?? raw);
        if (textValue(address, 4, 120)) {
          evidence.push({
            fieldId: 'person.address', value: address, confidence: selected.confidence,
            documentId: context.documentId, sourceId: context.sourceId, page: selected.page,
            method: cepLine ? 'street-near-unique-cep' : 'unique-recipient-street-line',
            lineIds: cepLine ? [selected.id, cepLine.id] : [selected.id],
            status: 'REVIEW_REQUIRED',
          });
        }
        if (split?.[2] && numberValue(split[2]) &&
          !evidence.some((item) => item.fieldId === 'person.streetNumber')) {
          evidence.push({
            fieldId: 'person.streetNumber', value: split[2], confidence: selected.confidence,
            documentId: context.documentId, sourceId: context.sourceId, page: selected.page,
            method: 'street-line-number', lineIds: [selected.id], status: 'REVIEW_REQUIRED',
          });
        }
      }

      if (cepLine && !evidence.some((item) => item.fieldId === 'person.city')) {
        const locationCandidates = allLines
          .filter((line) => line.page === cepLine.page)
          .filter((line) => !line.box || !cepLine.box ||
            Math.abs(((line.box[1] + line.box[3]) / 2) -
              ((cepLine.box[1] + cepLine.box[3]) / 2)) <= 160)
          .map((line) => ({
            line,
            match: cleanText(line.text).match(/^([A-ZÀ-Ý][A-ZÀ-Ý '.-]{1,79})\s*[-/]\s*([A-Z]{2})$/i),
          }))
          .filter((item): item is typeof item & { match: RegExpMatchArray } => Boolean(item.match));

        const uniqueLocations = new Map(locationCandidates.map((item) => [
          normalizeText(item.match[1]! + '/' + item.match[2]!), item,
        ]));
        if (uniqueLocations.size === 1) {
          const item = [...uniqueLocations.values()][0]!;
          const city = cleanText(item.match[1]!);
          const state = item.match[2]!.toUpperCase();
          if (textValue(city, 2, 80)) {
            evidence.push({
              fieldId: 'person.city', value: city, confidence: item.line.confidence,
              documentId: context.documentId, sourceId: context.sourceId, page: item.line.page,
              method: 'city-state-near-cep', lineIds: [item.line.id, cepLine.id],
              status: 'REVIEW_REQUIRED',
            });
          }
          if (!evidence.some((existing) => existing.fieldId === 'person.state') &&
            stateValue(state)) {
            evidence.push({
              fieldId: 'person.state', value: state, confidence: item.line.confidence,
              documentId: context.documentId, sourceId: context.sourceId, page: item.line.page,
              method: 'city-state-near-cep', lineIds: [item.line.id, cepLine.id],
              status: 'REVIEW_REQUIRED',
            });
          }
        }
      }
    }

    return evidence;
  },
};
