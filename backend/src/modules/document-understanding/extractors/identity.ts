import { isValidBrazilianDate, isValidCpf } from '../../catalog/field-validation.js';
import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  ObservationLine,
} from '../contracts.js';
import {
  anchoredCandidates,
  selectUniqueCandidate,
  type ApproximateLabel,
  type CandidateDirection,
  type ExtractedCandidate,
  type SpatialSearchHint,
} from '../extractor-utils.js';

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

const HOLDER_NAME_LABEL =
  /^(?:N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?|NAME\s+AND\s+SURNAME)\b/i;
const FORBIDDEN_NAME_LABEL =
  /^N[O0]M[E3]\s+(?:DA\s+M[ÃA]E|DO\s+PAI|SOCIAL|DA\s+GENITORA|DO\s+GENITOR)\b/i;
const HARD_BARRIER =
  /^(?:FILIACAO|FILIA[CÇ][AÃ]O|CPF|RG|REGISTRO|IDENTIDADE|DATA|NASCIMENTO|NATURALIDADE|ASSINATURA|ORGAO|[ÓO]RG[AÃ]O|EMISSOR)\b/i;

interface NameCandidate {
  value: string;
  confidence: number;
  page: number;
  lineIds: readonly string[];
  method: 'anchor-inline' | 'anchor-right' | 'anchor-below' | 'anchor-sequential';
}

function editDistanceAtMostOne(value: string, target: string): boolean {
  if (value === target) return true;
  if (Math.abs(value.length - target.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < value.length && j < target.length) {
    if (value[i] === target[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (value.length > target.length) i++;
    else if (target.length > value.length) j++;
    else {
      i++;
      j++;
    }
  }
  if (i < value.length || j < target.length) edits++;
  return edits <= 1;
}

function isHolderNameLabel(value: string): boolean {
  const upper = normalize(value);
  if (FORBIDDEN_NAME_LABEL.test(upper)) return false;
  if (HOLDER_NAME_LABEL.test(upper)) return true;
  const first = upper.split(/[\s:/\-–]+/)[0]?.replace(/[^A-Z0-9]/g, '') ?? '';
  return first.length >= 3 && first.length <= 5 &&
    editDistanceAtMostOne(first.replaceAll('0', 'O').replaceAll('3', 'E'), 'NOME');
}

function validName(value: string): boolean {
  const text = clean(value);
  const upper = normalize(text);
  if (text.length < 6 || text.length > 100 || text.split(/\s+/).length < 2) return false;
  if (!/^[A-ZÀ-Ý][A-ZÀ-Ý' .-]+$/i.test(text)) return false;
  return !/^(?:DATA|FILIACAO|NASCIMENTO|DOCUMENTO|REPUBLICA|CPF|RG|REGISTRO|NATURALIDADE|VALIDA|CARTEIRA|SECRETARIA|ESTADO)\b/
    .test(upper);
}

function inlineName(anchor: ObservationLine): NameCandidate | null {
  if (FORBIDDEN_NAME_LABEL.test(normalize(anchor.text))) return null;
  const stripped = anchor.text.replace(
    /^\s*(?:N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?|NAME\s+AND\s+SURNAME)\s*[:\-–]?\s*/i,
    '',
  );
  if (!validName(stripped)) return null;
  return {
    value: clean(stripped),
    confidence: anchor.confidence,
    page: anchor.page,
    lineIds: [anchor.id],
    method: 'anchor-inline',
  };
}

const boxHeight = (line: ObservationLine): number =>
  line.box ? Math.max(1, line.box[3] - line.box[1]) : 1;

function nameRight(anchor: ObservationLine, lines: readonly ObservationLine[]): NameCandidate | null {
  if (!anchor.box) return null;
  const height = boxHeight(anchor);
  const centerY = (anchor.box[1] + anchor.box[3]) / 2;
  const candidates = lines.filter((line) => {
    if (line === anchor || !line.box || line.confidence < 0.45 || !validName(line.text)) return false;
    const center = (line.box[1] + line.box[3]) / 2;
    return line.box[0] >= anchor.box![2] - height * 0.5 &&
      line.box[0] - anchor.box![2] <= height * 12 &&
      Math.abs(center - centerY) <= height * 1.25;
  }).sort((a, b) => a.box![0] - b.box![0] || b.confidence - a.confidence);
  const line = candidates[0];
  return line ? {
    value: clean(line.text),
    confidence: Math.min(anchor.confidence, line.confidence),
    page: anchor.page,
    lineIds: [anchor.id, line.id],
    method: 'anchor-right',
  } : null;
}

function horizontalOverlap(a: ObservationLine, b: ObservationLine): number {
  if (!a.box || !b.box) return 0;
  return Math.max(0, Math.min(a.box[2], b.box[2]) - Math.max(a.box[0], b.box[0]));
}

function nameBelow(anchor: ObservationLine, lines: readonly ObservationLine[]): NameCandidate | null {
  if (!anchor.box) return null;
  const height = boxHeight(anchor);
  const width = Math.max(1, anchor.box[2] - anchor.box[0]);
  const below = lines.filter((line) => {
    if (line === anchor || !line.box || line.confidence < 0.45) return false;
    const dy = Math.max(0, line.box[1] - anchor.box![3]);
    if (dy > height * 8) return false;
    const xDelta = Math.abs(line.box[0] - anchor.box![0]);
    return horizontalOverlap(anchor, line) > 0 || xDelta <= Math.max(width * 1.5, height * 5);
  }).sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);

  const selected: ObservationLine[] = [];
  let lastBottom = anchor.box[3];
  for (const line of below) {
    const text = clean(line.text);
    const upper = normalize(text);
    if (HARD_BARRIER.test(upper) || FORBIDDEN_NAME_LABEL.test(upper)) break;
    if (line.box![1] - lastBottom > height * 2.8) break;
    if (!/^[A-ZÀ-Ý][A-ZÀ-Ý' .-]+$/i.test(text)) {
      if (selected.length) break;
      continue;
    }
    selected.push(line);
    lastBottom = line.box![3];
    if (selected.length >= 3) break;
  }
  const value = clean(selected.map((line) => line.text).join(' '));
  if (!validName(value)) return null;
  return {
    value,
    confidence: Math.min(anchor.confidence, ...selected.map((line) => line.confidence)),
    page: anchor.page,
    lineIds: [anchor.id, ...selected.map((line) => line.id)],
    method: 'anchor-below',
  };
}

function sequentialName(
  anchor: ObservationLine,
  lines: readonly ObservationLine[],
  index: number,
): NameCandidate | null {
  const selected: ObservationLine[] = [];
  for (let offset = 1; offset <= 3; offset++) {
    const line = lines[index + offset];
    if (!line) break;
    const upper = normalize(line.text);
    if (HARD_BARRIER.test(upper) || FORBIDDEN_NAME_LABEL.test(upper)) break;
    const text = clean(line.text);
    if (!/^[A-ZÀ-Ý][A-ZÀ-Ý' .-]+$/i.test(text)) {
      if (selected.length) break;
      continue;
    }
    selected.push(line);
    const value = clean(selected.map((item) => item.text).join(' '));
    if (validName(value) && value.split(/\s+/).length >= 3) {
      return {
        value,
        confidence: Math.min(anchor.confidence, ...selected.map((item) => item.confidence)),
        page: anchor.page,
        lineIds: [anchor.id, ...selected.map((item) => item.id)],
        method: 'anchor-sequential',
      };
    }
  }
  const value = clean(selected.map((item) => item.text).join(' '));
  return validName(value) ? {
    value,
    confidence: Math.min(anchor.confidence, ...selected.map((item) => item.confidence)),
    page: anchor.page,
    lineIds: [anchor.id, ...selected.map((item) => item.id)],
    method: 'anchor-sequential',
  } : null;
}

function findName(observation: DocumentObservation): NameCandidate | null {
  const found: NameCandidate[] = [];
  for (const page of observation.pages) {
    const lines = [...page.lines];
    const positioned = lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);
    for (let index = 0; index < lines.length; index++) {
      const anchor = lines[index]!;
      if (!isHolderNameLabel(anchor.text)) continue;
      const preferBelow = /(?:NOME\s*\/\s*NAME|NAME\s+AND\s+SURNAME)/i.test(anchor.text);
      const candidate = inlineName(anchor) ??
        (preferBelow
          ? nameBelow(anchor, positioned) ?? nameRight(anchor, positioned)
          : nameRight(anchor, positioned) ?? nameBelow(anchor, positioned)) ??
        sequentialName(anchor, lines, index);
      if (candidate) found.push(candidate);
    }
  }
  const unique = new Map<string, NameCandidate>();
  for (const candidate of found) {
    const key = normalize(candidate.value);
    const prior = unique.get(key);
    if (!prior || candidate.confidence > prior.confidence) unique.set(key, candidate);
  }
  return unique.size === 1 ? [...unique.values()][0]! : null;
}


const IDENTITY_SPATIAL_HINT: SpatialSearchHint = {
  minConfidence: 0.45,
  maxRightDistanceHeights: 10,
  sameRowToleranceHeights: 1.25,
  maxBelowDistanceHeights: 4,
  maxBelowHorizontalOffsetHeights: 5,
  maxSequentialLines: 2,
  minSelectionScoreGap: 0.12,
};

function validIdentityNumber(value: string): boolean {
  const text = clean(value);
  if (text.length < 4 || text.length > 24) return false;
  if (!/[0-9]/.test(text)) return false;
  if (!/^[A-Z0-9./-]+$/i.test(text)) return false;
  const digits = text.replace(/\D/g, '');
  if (digits.length === 11 && isValidCpf(digits)) return false;
  if (/^\d{2}[./-]\d{2}[./-]\d{2,4}$/.test(text)) return false;
  return true;
}

function validIssuer(value: string): boolean {
  const text = clean(value);
  if (text.length < 2 || text.length > 24) return false;
  if (!/[A-ZÀ-Ý]/i.test(text)) return false;
  if (!/^[A-ZÀ-Ý0-9 ./-]+$/i.test(text)) return false;
  if (/^(?:CPF|RG|NOME|DATA|NASCIMENTO|NATURALIDADE|FILIACAO)$/i.test(normalize(text))) return false;
  return true;
}

function validIdentityText(value: string): boolean {
  const text = clean(value);
  const upper = normalize(text);
  if (text.length < 2 || text.length > 80 || !/[A-ZÀ-Ý]/i.test(text)) return false;
  return !/^(?:NOME|CPF|RG|DATA|NASCIMENTO|NACIONALIDADE|NATURALIDADE|FILIACAO|VALIDADE|LOCAL)\b/
    .test(upper);
}

function labelledValue(
  observation: DocumentObservation,
  label: RegExp,
  anchorName: string,
  isValid: (value: string) => boolean,
  preferredDirections: readonly CandidateDirection[] = [],
  spatialHint: SpatialSearchHint = IDENTITY_SPATIAL_HINT,
  approximateLabels: readonly ApproximateLabel[] = [],
): ExtractedCandidate | null {
  return selectUniqueCandidate(
    anchoredCandidates(
      observation,
      [label],
      anchorName,
      isValid,
      preferredDirections,
      () => false,
      true,
      false,
      approximateLabels,
      spatialHint,
    ),
    spatialHint.minSelectionScoreGap,
  );
}

function labelledEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
  fieldId: string,
  label: RegExp,
  anchor: string,
  validator: (value: string) => boolean,
  preferredDirections: readonly CandidateDirection[] = [],
  spatialHint: SpatialSearchHint = IDENTITY_SPATIAL_HINT,
  approximateLabels: readonly ApproximateLabel[] = [],
): FieldEvidence | null {
  const candidate = labelledValue(
    observation,
    label,
    anchor,
    validator,
    preferredDirections,
    spatialHint,
    approximateLabels,
  );
  if (!candidate) return null;
  return {
    fieldId,
    value: candidate.value,
    confidence: candidate.confidence,
    documentId: context.documentId,
    sourceId: context.sourceId,
    page: candidate.page,
    method: candidate.method,
    ...(candidate.anchor ? { anchor: candidate.anchor } : {}),
    lineIds: candidate.lineIds,
    status: 'REVIEW_REQUIRED',
  };
}

function parentageEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
  prefix: string,
): FieldEvidence[] {
  const found: ObservationLine[] = [];
  for (const page of observation.pages) {
    const positioned = page.lines.filter((line) => line.box)
      .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0]);
    const anchors = page.lines.filter((line) =>
      /^\s*FILIA[CÇ][AÃ]O\s*$/i.test(line.text.trim()));

    for (const anchor of anchors) {
      if (anchor.box) {
        const height = boxHeight(anchor);
        const candidates = positioned.filter((line) => {
          if (line === anchor || !line.box || line.confidence < 0.45) return false;
          const dy = line.box[1] - anchor.box![3];
          if (dy < -height * 0.25 || dy > height * 10) return false;
          if (/^(?:NATURALIDADE|DATA\s+DE\s+NASCIMENTO|DOC\.?\s*ORIGEM|CPF)\b/i
            .test(normalize(line.text))) return false;
          return validName(line.text) &&
            (horizontalOverlap(anchor, line) > 0 ||
              Math.abs(line.box[0] - anchor.box![0]) <= height * 8);
        });
        found.push(...candidates.slice(0, 2));
      } else {
        const index = page.lines.indexOf(anchor);
        for (let offset = 1; offset <= 4 && found.length < 2; offset++) {
          const line = page.lines[index + offset];
          if (!line) break;
          if (/^(?:NATURALIDADE|DATA\s+DE\s+NASCIMENTO|DOC\.?\s*ORIGEM|CPF)\b/i
            .test(normalize(line.text))) break;
          if (validName(line.text)) found.push(line);
        }
      }
    }
  }

  const unique = [...new Map(found.map((line) => [normalize(line.text), line])).values()].slice(0, 2);
  return unique.map((line, index) => ({
    fieldId: prefix + '.parent' + (index + 1) + 'Name',
    value: clean(line.text),
    confidence: line.confidence,
    documentId: context.documentId,
    sourceId: context.sourceId,
    page: line.page,
    method: 'anchor-below',
    anchor: 'FILIACAO',
    lineIds: [line.id],
    status: 'REVIEW_REQUIRED' as const,
  }));
}

function documentOriginEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
  fieldId: string,
): FieldEvidence | null {
  for (const page of observation.pages) {
    const anchors = page.lines.filter((line) =>
      /^\s*DOC\.?\s*ORIGEM\s*$/i.test(line.text.trim()));

    for (const anchor of anchors) {
      let selected: ObservationLine[] = [];

      if (anchor.box) {
        const height = boxHeight(anchor);
        const cpfBoundaryY = page.lines
          .filter((line) => line.box && line.box[1] > anchor.box![3] &&
            /^\s*CPF\b/i.test(line.text))
          .map((line) => line.box![1])
          .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY;
        const maxY = Math.min(cpfBoundaryY, anchor.box[3] + height * 8);

        selected = page.lines
          .filter((line) => {
            if (line === anchor || !line.box || line.confidence < 0.4) return false;
            if (line.box[1] < anchor.box![3] - height * 0.2 || line.box[1] >= maxY) return false;
            if (/^\s*(?:CPF|NATURALIDADE|DATA\s+DE\s+NASCIMENTO)\b/i.test(line.text)) {
              return false;
            }
            const value = clean(line.text);
            if (value.length < 2 || value.length > 100 || !/[A-Z0-9]/i.test(value)) return false;
            return horizontalOverlap(anchor, line) > 0 ||
              Math.abs(line.box[0] - anchor.box![0]) <= height * 8;
          })
          .sort((a, b) => a.box![1] - b.box![1] || a.box![0] - b.box![0])
          .slice(0, 3);
      } else {
        const anchorIndex = page.lines.indexOf(anchor);
        for (let offset = 1; offset <= 3; offset++) {
          const line = page.lines[anchorIndex + offset];
          if (!line || /^\s*CPF\b/i.test(line.text)) break;
          const value = clean(line.text);
          if (value.length < 2 || value.length > 100 || !/[A-Z0-9]/i.test(value)) continue;
          selected.push(line);
        }
      }

      const value = clean(selected.map((line) => line.text).join(' '));
      if (!value || value.length > 180) continue;
      return {
        fieldId,
        value,
        confidence: Math.min(anchor.confidence, ...selected.map((line) => line.confidence)),
        documentId: context.documentId,
        sourceId: context.sourceId,
        page: anchor.page,
        method: anchor.box ? 'anchor-below-grouped' : 'anchor-sequential',
        anchor: 'DOC ORIGEM',
        lineIds: [anchor.id, ...selected.map((line) => line.id)],
        status: 'REVIEW_REQUIRED',
      };
    }
  }
  return null;
}

function cpfEvidence(
  observation: DocumentObservation,
  context: ExtractionContext,
  fieldId: string,
): FieldEvidence | null {
  const candidates: { value: string; line: ObservationLine }[] = [];
  for (const page of observation.pages) {
    for (const line of page.lines) {
      for (const match of line.text.matchAll(/(?:^|\D)(\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2})(?!\d)/g)) {
        const value = match[1]!.trim();
        if (isValidCpf(value)) candidates.push({ value, line });
      }
    }
  }
  const unique = new Map(candidates.map((item) => [item.value.replace(/\D/g, ''), item]));
  if (unique.size !== 1) return null;
  const candidate = [...unique.values()][0]!;
  return {
    fieldId,
    value: candidate.value,
    confidence: candidate.line.confidence,
    documentId: context.documentId,
    sourceId: context.sourceId,
    page: candidate.line.page,
    method: 'validated-cpf',
    lineIds: [candidate.line.id],
    status: 'REVIEW_REQUIRED',
  };
}

export const identityDocumentExtractor: DocumentExtractor = {
  documentType: 'identity',
  extract(observation, context) {
    if (context.subjectRole !== 'person' && context.subjectRole !== 'seller') return [];
    const prefix = context.subjectRole;
    const evidence: FieldEvidence[] = [];
    const name = findName(observation);
    if (name) {
      evidence.push({
        fieldId: prefix + '.fullName',
        value: name.value,
        confidence: name.confidence,
        documentId: context.documentId,
        sourceId: context.sourceId,
        page: name.page,
        method: name.method,
        anchor: 'NOME',
        lineIds: name.lineIds,
        status: 'REVIEW_REQUIRED',
      });
    }
    const cpf = cpfEvidence(observation, context, prefix + '.cpf');
    if (cpf) evidence.push(cpf);

    evidence.push(...parentageEvidence(observation, context, prefix));
    const documentOrigin = documentOriginEvidence(
      observation, context, prefix + '.documentOrigin');
    if (documentOrigin) evidence.push(documentOrigin);

    const identity = labelledEvidence(
      observation,
      context,
      prefix + '.identity',
      /^\s*(?:REGISTRO\s+GERAL|REG\.?\s*GERAL|N[ÚU]MERO\s+DA\s+IDENTIDADE|N[ÚU]MERO\s+DE\s+IDENTIDADE|IDENTIDADE|RG)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'IDENTIDADE',
      validIdentityNumber,
      ['right', 'below'],
      IDENTITY_SPATIAL_HINT,
      [
        { text: 'REGISTRO GERAL', maxDistance: 2 },
        { text: 'NUMERO DA IDENTIDADE', maxDistance: 2 },
      ],
    );
    if (identity) evidence.push(identity);

    const issuer = labelledEvidence(
      observation,
      context,
      prefix + '.issuer',
      /^\s*(?:[ÓO]RG[AÃ]O\s+(?:EMISSOR|EXPEDIDOR)(?:\s*\/\s*CARD\s+ISSUER)?|[ÓO]RG[AÃ]O|EMISSOR|EXPEDIDOR)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'ORGAO EMISSOR',
      validIssuer,
      ['below', 'right'],
      IDENTITY_SPATIAL_HINT,
      [
        { text: 'ORGAO EXPEDIDOR', maxDistance: 2 },
        { text: 'ORGAO EMISSOR', maxDistance: 2 },
      ],
    );
    if (issuer) evidence.push(issuer);

    const issueDate = labelledEvidence(
      observation,
      context,
      prefix + '.issueDate',
      /^\s*(?:DATA\s+(?:DE\s+)?(?:EMISS[AÃ]O|EXPEDI[CÇ][AÃ]O)|ISSUING\s+DATE)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'DATA DE EMISSAO',
      isValidBrazilianDate,
      ['right', 'below'],
      IDENTITY_SPATIAL_HINT,
      [
        { text: 'DATA DE EXPEDICAO', maxDistance: 2 },
        { text: 'DATA DE EMISSAO', maxDistance: 2 },
      ],
    );
    if (issueDate) evidence.push(issueDate);

    const birthDate = labelledEvidence(
      observation,
      context,
      prefix + '.birthDate',
      /^\s*(?:DATA\s+(?:DE\s+)?NASCIMENTO|NASCIMENTO|DATE\s+OF\s+BIRTH)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'DATA DE NASCIMENTO',
      isValidBrazilianDate,
      ['below', 'right'],
      IDENTITY_SPATIAL_HINT,
      [{ text: 'DATA DE NASCIMENTO', maxDistance: 2 }],
    );
    if (birthDate) evidence.push(birthDate);

    const nationality = labelledEvidence(
      observation,
      context,
      prefix + '.nationality',
      /^\s*(?:NACIONALIDADE(?:\s*\/\s*NATIONALITY)?|NATIONALITY)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'NACIONALIDADE',
      validIdentityText,
      ['below', 'right'],
      IDENTITY_SPATIAL_HINT,
      [{ text: 'NACIONALIDADE', maxDistance: 2 }],
    );
    if (nationality) evidence.push(nationality);

    const birthplace = labelledEvidence(
      observation,
      context,
      prefix + '.birthplace',
      /^\s*(?:NATURALIDADE(?:\s*\/\s*PLACE\s+OF\s+BIRTH)?|NATURAL\s+DE|PLACE\s+OF\s+BIRTH)\s*(?:[:#\-–]\s*)?(.*)$/i,
      'NATURALIDADE',
      validIdentityText,
      ['below', 'right'],
      IDENTITY_SPATIAL_HINT,
      [{ text: 'NATURALIDADE', maxDistance: 2 }],
    );
    if (birthplace) evidence.push(birthplace);

    return evidence;
  },
  assess(observation, context) {
    if (context.subjectRole !== 'person' && context.subjectRole !== 'seller') return [];
    const prefix = context.subjectRole;
    const evidence = identityDocumentExtractor.extract(observation, context);
    const byField = new Map(evidence.map((item) => [item.fieldId, item]));
    return ['fullName', 'cpf', 'identity', 'issuer', 'issueDate', 'birthDate', 'nationality', 'birthplace',
      'parent1Name', 'parent2Name', 'documentOrigin']
      .map((name) => {
      const fieldId = prefix + '.' + name;
      const item = byField.get(fieldId);
      return item ? {
        fieldId,
        status: 'FOUND' as const,
        confidence: item.confidence,
        method: item.method,
        ...(item.anchor ? { anchor: item.anchor } : {}),
      } : {
        fieldId,
        status: 'NOT_FOUND' as const,
        confidence: null,
      };
    });
  },
};
