import type { StoredDocument } from './job-store.js';
import { isValidCpf, isValidBrazilianDate } from '../catalog/field-validation.js';
import { extractPaddleDocument } from './paddle-ocr.js';
import type { PaddleOcrResult } from './paddle-ocr.js';
import { paddleToObservation } from '../document-understanding/paddle-observation.js';
import type { DocumentObservation } from '../document-understanding/contracts.js';
import { extractPdfTextObservation, observationText } from './pdf-text-observation.js';
import { extractPdfPagesWithPaddle } from './pdf-paddle-pages.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';

let active = 0;
const MAX_CONCURRENT = 2;

export function fastObservationIsSufficient(
  doc: StoredDocument,
  observation: DocumentObservation,
): boolean {
  if (doc.requirementId === 'tie') {
    const fields = new Set(extractDocumentEvidence(observation, {
      documentId: doc.id,
      sourceId: doc.requirementId,
      documentType: 'tie',
      subjectRole: 'vessel',
    }).map((item) => item.fieldId));
    return ['vessel.registration', 'vessel.name', 'vessel.hullId']
      .every((fieldId) => fields.has(fieldId));
  }
  if (doc.requirementId === 'residence-proof') {
    const fields = new Set(extractDocumentEvidence(observation, {
      documentId: doc.id,
      sourceId: doc.requirementId,
      documentType: 'residence-proof',
      subjectRole: 'person',
    }).map((item) => item.fieldId));
    return fields.has('person.postalCode') && fields.has('person.address');
  }
  return false;
}

export type OcrEngine = 'paddleocr' | 'pdf-text';

export interface OcrExtraction {
  text: string;
  engine: OcrEngine;
  observation: DocumentObservation;
  paddle?: PaddleOcrResult;
}

/** Plain-text compatibility helper used by legacy parser tests only. */
export function shouldRetryIdentityLayout(text: string, source: string): boolean {
  const fields = suggestFields(text, source);
  const nameId = source === 'seller-identity' ? 'seller.fullName' : 'person.fullName';
  return !fields[nameId] || Object.keys(fields).length < 2;
}

/** Plain-text compatibility helper used by legacy parser tests only. */
export function chooseIdentityLayout(primary: string, alternative: string, source: string): string {
  const first = suggestFields(primary, source);
  const second = suggestFields(alternative, source);
  const nameId = source === 'seller-identity' ? 'seller.fullName' : 'person.fullName';
  if (Boolean(first[nameId]) !== Boolean(second[nameId])) {
    return second[nameId] ? alternative : primary;
  }
  return Object.keys(second).length > Object.keys(first).length ? alternative : primary;
}

export async function extractTextWithEngine(
  doc: StoredDocument,
  tempDir: string,
): Promise<OcrExtraction> {
  if (active >= MAX_CONCURRENT) throw new Error('OCR ocupado. Tente novamente.');
  if (!process.env.PADDLE_OCR_URL) {
    throw new Error('PaddleOCR não configurado.');
  }
  active++;
  try {
    const fast = await extractPdfTextObservation(doc);
    if (fast && fastObservationIsSufficient(doc, fast)) {
      return {
        text: observationText(fast),
        engine: 'pdf-text',
        observation: fast,
      };
    }

    if (doc.kind === 'pdf' &&
      (doc.requirementId === 'tie' || doc.requirementId === 'residence-proof')) {
      const observation = await extractPdfPagesWithPaddle(doc, tempDir, fast);
      return {
        text: observationText(observation),
        engine: 'paddleocr',
        observation,
      };
    }

    const extracted = await extractPaddleDocument(doc);
    return {
      text: extracted.text.slice(0, 50_000),
      engine: 'paddleocr',
      paddle: extracted.result,
      observation: paddleToObservation(extracted.result),
    };
  } finally {
    active--;
  }
}

export async function extractText(doc: StoredDocument, tempDir: string): Promise<string> {
  return (await extractTextWithEngine(doc, tempDir)).text;
}

/**
 * Only source documents with known, role-specific semantic fields need OCR.
 * Inspection photos of the vessel are not accepted by this form-filling
 * service. Other supporting uploads are excluded from OCR until they have
 * explicit, reviewable semantic extraction rules.
 */
const SEMANTIC_SOURCES = new Set([
  'buyer-identity', 'seller-identity', 'tie', 'residence-proof', 'sale-document',
  'source', // CI-only synthetic source; not present in the real service.
]);
export function shouldExtractDocument(requirementId: string): boolean {
  return SEMANTIC_SOURCES.has(requirementId);
}

export interface ExtractionCandidate {
  value: string;
  source: string;
  status: 'REVIEW_REQUIRED';
}

/**
 * Return a candidate only when the document has exactly one unambiguous
 * labelled value. No arbitrary "first row" or inferred associations.
 */
function singleLabelled(text: string, pattern: RegExp, maxLength: number): string | null {
  const candidates = [...text.matchAll(pattern)]
    .map((match) => match[1]?.trim().replace(/\s+/g, ' ') ?? '');
  if (candidates.length === 0 || candidates.some((value) =>
    value.length === 0 || value.length > maxLength)) return null;
  const unique = [...new Set(candidates.map((value) => value.normalize('NFC').toUpperCase()))];
  return unique.length === 1 ? candidates[0]! : null;
}

/**
 * RG/CNH photographs often show the LABEL on one line and the VALUE below,
 * without a colon. Only accept a known, whole-line identity label and a
 * structurally valid candidate directly next to it. Never scan arbitrary
 * unlabelled lines for a person's identity.
 */
function identityLabelledValue(
  text: string,
  label: RegExp,
  isCandidate: (value: string) => boolean,
): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const found: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = label.exec(lines[i]!);
    if (!match) continue;
    const candidate = (match[1]?.trim() || lines[i + 1] || '').replace(/\s+/g, ' ').trim();
    if (isCandidate(candidate)) found.push(candidate);
  }
  const unique = [...new Set(found.map((value) => value.normalize('NFC').toUpperCase()))];
  return unique.length === 1 ? found[0]! : null;
}

/**
 * QA-only, privacy-preserving identity-name diagnostic.
 * Reports neither the recognised words nor the person's name; it only helps
 * distinguish OCR label detection from semantic candidate rejection.
 * A missing label does not prove the printed name was absent or unreadable.
 */
export function identityNameStage(
  text: string,
  source: string,
  suggested: Readonly<Record<string, ExtractionCandidate>>,
  mappedFields: ReadonlySet<string>,
): 'name_recognized' | 'name_not_mapped' | 'label_seen_name_rejected' | 'label_not_detected' {
  const fieldId = source === 'buyer-identity' ? 'person.fullName'
    : source === 'seller-identity' ? 'seller.fullName' : '';
  if (!fieldId) return 'label_not_detected';
  if (suggested[fieldId]) {
    return mappedFields.has(fieldId) ? 'name_recognized' : 'name_not_mapped';
  }
  // A tolerant pattern is diagnostic only; it never creates an OCR candidate.
  // Exclude parental and social name labels so they cannot imply a holder name.
  const labelLike = text.split(/\r?\n/).some((line) =>
    /^\s*N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\s*(?::|[-–]|$|\s+(?!DA\s+M[ÃA]E|DO\s+PAI|SOCIAL|DA\s+GENITORA|DO\s+GENITOR))/i
      .test(line));
  return labelLike ? 'label_seen_name_rejected' : 'label_not_detected';
}

/** Label-anchored hints only: all results require explicit human review. */
export function suggestFields(text: string, source: string): Record<string, ExtractionCandidate> {
  const result: Record<string, ExtractionCandidate> = {};
  const seller = source === 'seller-identity';
  const buyer = source === 'buyer-identity';
  // Never assign a seller's CPF to the buyer, even if both documents are uploaded.
  const cpfs = [...text.matchAll(/(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/gm)]
    .map((match) => match[1]!).filter(isValidCpf);
  const uniqueCpf = [...new Set(cpfs.map((cpf) => cpf.replace(/\D/g, '')))];
  if (uniqueCpf.length === 1 && (seller || buyer)) {
    const id = seller ? 'seller.cpf' : 'person.cpf';
    result[id] = { value: cpfs[0]!, source, status: 'REVIEW_REQUIRED' };
  }
  if (buyer || seller) {
    // Reject labels for parents and social name: these must never fill the
    // applicant's legal name. RG layouts often separate label from value.
    const name = identityLabelledValue(text,
      /^NOME\b(?:\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME)|\s*\/\s*NAME)?(?!\s+(?:DA\s+M[ÃA]E|DO\s+PAI|SOCIAL|DA\s+GENITORA|DO\s+GENITOR))\s*(?:[:\-–]\s*)?(.*)$/i,
      (value) => /^[A-ZÀ-Ý][A-ZÀ-Ý' .-]{5,99}$/i.test(value) &&
        value.split(/\s+/).length >= 2 &&
        !/^(?:DATA|FILIA[CÇ][AÃ]O|NASCIMENTO|DOCUMENTO|REP[ÚU]BLICA|CPF|RG)\b/i.test(value),
    );
    if (name) {
      result[seller ? 'seller.fullName' : 'person.fullName'] = {
        value: name, source, status: 'REVIEW_REQUIRED',
      };
    }
  }
  if (buyer || seller) {
    const role = seller ? 'seller' : 'person';
    const identity = identityLabelledValue(text,
      /^(?:RG|REG(?:ISTRO)?[. ]+GERAL|N[ºO.]?\s*DA\s*IDENTIDADE|IDENTIDADE)\s*(?:[:\-–]\s*)?(.*)$/i,
      (value) => /^[A-Z0-9./-]{5,24}$/i.test(value) && /\d/.test(value));
    if (identity) result[role + '.identity'] = { value: identity, source, status: 'REVIEW_REQUIRED' };

    const issuer = identityLabelledValue(text,
      /^(?:[ÓO]RG[AÃ]O\s+(?:EMISSOR|EXPEDIDOR)|EMISSOR)\s*(?:[:\-–]\s*)?(.*)$/i,
      (value) => /^[A-ZÀ-Ý0-9 ./-]{2,32}$/i.test(value));
    if (issuer) result[role + '.issuer'] = { value: issuer, source, status: 'REVIEW_REQUIRED' };

    const issueDate = identityLabelledValue(text,
      /^DATA\s+(?:DE\s+)?(?:EMISS[AÃ]O|EXPEDI[CÇ][AÃ]O)(?:\s+DA\s+IDENTIDADE)?\s*(?:[:\-–]\s*)?(.*)$/i,
      (value) => isValidBrazilianDate(value));
    if (issueDate && isValidBrazilianDate(issueDate)) result[role + '.issueDate'] = {
      value: issueDate, source, status: 'REVIEW_REQUIRED',
    };
  }

  if (source === 'tie') {
    const registration = singleLabelled(text,
      /^\s*(?:(?:N[ÚU]MERO|N[ºO.])\s+(?:DE|DA)\s+)?INSCRI[CÇ][AÃ]O\s*[:-]\s*([A-Z0-9./-]{4,30})\s*$/gim, 30);
    if (registration) {
      result['vessel.registration'] = { value: registration, source, status: 'REVIEW_REQUIRED' };
    }

    const vesselName = singleLabelled(text,
      /^\s*NOME\s+DA\s+(?:EMBARCA[CÇ][AÃ]O|MOTO\s+AQU[AÁ]TICA)\s*[:-]\s*([A-ZÀ-Ý0-9' .-]{4,100})\s*$/gim, 100);
    if (vesselName) {
      result['vessel.name'] = { value: vesselName, source, status: 'REVIEW_REQUIRED' };
    }

    // Only explicitly labelled TIE attributes; do not infer specifications
    // from arbitrary OCR numbers or from the current owner's identity.
    const year = singleLabelled(text,
      /^\s*ANO\s+(?:DE\s+)?CONSTRU[CÇ][AÃ]O\s*[:-]\s*((?:19|20)\d{2})\s*$/gim, 4);
    if (year) result['vessel.year'] = { value: year, source, status: 'REVIEW_REQUIRED' };

    const length = singleLabelled(text,
      /^\s*COMPRIMENTO\s*(?:TOTAL\s*)?(?:\(M\)\s*)?[:-]\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:M|METROS?)?\s*$/gim, 5);
    if (length) result['vessel.length'] = { value: length, source, status: 'REVIEW_REQUIRED' };

    const capacity = singleLabelled(text,
      /^\s*(?:LOTA[CÇ][AÃ]O|CAPACIDADE\s+DE\s+PESSOAS)\s*[:-]\s*(\d{1,2})\s*$/gim, 2);
    if (capacity) result['vessel.capacity'] = { value: capacity, source, status: 'REVIEW_REQUIRED' };

    // No inference from the vessel manufacturer: motor values are only used
    // when their own unambiguous labels appear in the source.
    const motorBrand = singleLabelled(text,
      /^\s*(?:MARCA\s+DO\s+MOTOR|MOTOR\s*\/\s*MARCA)\s*[:-]\s*([A-ZÀ-Ý0-9 .-]{2,60})\s*$/gim, 60);
    if (motorBrand) result['vessel.motorBrand'] = {
      value: motorBrand, source, status: 'REVIEW_REQUIRED',
    };
    const motorPower = singleLabelled(text,
      /^\s*POT[EÊ]NCIA\s+(?:DO\s+)?MOTOR\s*[:-]\s*([0-9., ]{1,16}(?:HP|CV)?)\s*$/gim, 18);
    if (motorPower) result['vessel.motorPower'] = {
      value: motorPower, source, status: 'REVIEW_REQUIRED',
    };
    const motorSerial = singleLabelled(text,
      /^\s*(?:N[ÚU]MERO\s+DE\s+S[EÉ]RIE\s+DO\s+MOTOR|S[EÉ]RIE\s+DO\s+MOTOR)\s*[:-]\s*([A-Z0-9./-]{4,40})\s*$/gim, 40);
    if (motorSerial) result['vessel.motorSerial'] = {
      value: motorSerial, source, status: 'REVIEW_REQUIRED',
    };
  }

  if (source === 'sale-document') {
    // Invoice and sale details are candidates, not legal proof of transfer.
    // Use narrowly anchored labels so an unrelated date or price never fills the sale.
    const invoice = singleLabelled(text,
      /^\s*(?:NOTA\s+FISCAL(?:\s*N[ºO.]?)?|N[ÚU]MERO\s+DA\s+NOTA\s+FISCAL)\s*[:-]\s*([A-Z0-9./-]{3,32})\s*$/gim, 32);
    if (invoice) result['sale.invoice'] = { value: invoice, source, status: 'REVIEW_REQUIRED' };

    const date = singleLabelled(text,
      /^\s*DATA\s+(?:DA\s+VENDA|DA\s+TRANSFER[EÊ]NCIA)\s*[:-]\s*(\d{2}\/\d{2}\/\d{4})\s*$/gim, 10);
    if (date && isValidBrazilianDate(date)) {
      result['sale.date'] = { value: date, source, status: 'REVIEW_REQUIRED' };
    }

    const price = singleLabelled(text,
      /^\s*(?:VALOR\s+(?:DA\s+VENDA|TOTAL\s+DA\s+VENDA)|PRE[CÇ]O\s+DA\s+VENDA)\s*[:-]\s*((?:R\$\s*)?[\d.]+,\d{2})\s*$/gim, 32);
    if (price) result['sale.price'] = { value: price, source, status: 'REVIEW_REQUIRED' };

    const place = singleLabelled(text,
      /^\s*LOCAL\s+DA\s+VENDA\s*[:-]\s*([A-ZÀ-Ý][A-ZÀ-Ý '.-]{2,79})\s*$/gim, 80);
    if (place) result['sale.place'] = { value: place, source, status: 'REVIEW_REQUIRED' };
  }

  if (source === 'residence-proof') {
    // Extract independently named BDMOTO fields instead of copying a complete
    // address into City/Bairro/CEP. Never guess administrative boundaries.
    const postal = singleLabelled(text,
      /^\s*(?:CEP|C[ÓO]DIGO\s+POSTAL)\s*[:-]\s*(\d{5}-?\d{3})\s*$/gim, 9);
    if (postal) result['person.postalCode'] = {
      value: postal.length === 8 ? postal.slice(0, 5) + '-' + postal.slice(5) : postal,
      source, status: 'REVIEW_REQUIRED',
    };

    const address = singleLabelled(text,
      /^\s*(?:ENDERE[CÇ]O|LOGRADOURO)\s*[:-]\s*(\S.{3,119})\s*$/gim, 120);
    if (address) result['person.address'] = { value: address, source, status: 'REVIEW_REQUIRED' };

    const city = singleLabelled(text,
      /^\s*(?:CIDADE|MUNIC[IÍ]PIO)\s*[:-]\s*([A-ZÀ-Ý][A-ZÀ-Ý '.-]{2,79})\s*$/gim, 80);
    if (city) result['person.city'] = { value: city, source, status: 'REVIEW_REQUIRED' };

    const district = singleLabelled(text,
      /^\s*(?:BAIRRO|DISTRITO)\s*[:-]\s*([A-ZÀ-Ý][A-ZÀ-Ý '.-]{2,79})\s*$/gim, 80);
    if (district) result['person.neighborhood'] = {
      value: district, source, status: 'REVIEW_REQUIRED',
    };

    const state = singleLabelled(text,
      /^\s*(?:UF|ESTADO)\s*[:-]\s*([A-Z]{2})\s*$/gim, 2);
    if (state) result['person.state'] = { value: state, source, status: 'REVIEW_REQUIRED' };

    const number = singleLabelled(text,
      /^\s*(?:N[ÚU]MERO|N[ºO.]?\s+DO\s+ENDERE[CÇ]O)\s*[:-]\s*(\d{1,6}[A-Z]?)\s*$/gim, 7);
    if (number) result['person.streetNumber'] = {
      value: number, source, status: 'REVIEW_REQUIRED',
    };

    const complement = singleLabelled(text,
      /^\s*COMPLEMENTO\s*[:-]\s*([A-ZÀ-Ý0-9 .,/-]{1,60})\s*$/gim, 60);
    if (complement) result['person.apartment'] = {
      value: complement, source, status: 'REVIEW_REQUIRED',
    };
  }

  if (source === 'tie' || source === 'source') {
    const hull = singleLabelled(text,
      /(?:HIN|CIN|N[ºo.]?\s*do\s*casco)\s*[:-]?\s*([A-Z0-9-]{6,30})/gim, 30);
    if (hull) result['vessel.hullId'] = { value: hull, source, status: 'REVIEW_REQUIRED' };
  }
  return result;
}
