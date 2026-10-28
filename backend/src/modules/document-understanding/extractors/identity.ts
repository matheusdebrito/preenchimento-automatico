import { isValidCpf } from '../../catalog/field-validation.js';
import type {
  DocumentExtractor,
  DocumentObservation,
  ExtractionContext,
  FieldEvidence,
  ObservationLine,
} from '../contracts.js';

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

const HOLDER_NAME_LABEL =
  /^N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\b/i;
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
    /^\s*N[O0]M[E3](?:\s*\/\s*NAME|\s+(?:COMPLETO|CIVIL|DO\s+TITULAR|E\s+SOBRENOME))?\s*[:\-–]?\s*/i,
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
      const candidate = inlineName(anchor) ??
        nameRight(anchor, positioned) ??
        nameBelow(anchor, positioned) ??
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
    return evidence;
  },
};
