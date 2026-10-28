import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractTextWithEngine } from './ocr.js';
import {
  assessDocumentFields,
  extractDocumentEvidence,
} from '../document-understanding/registry.js';
import type { DocumentTypeId, DocumentSubjectRole } from '../document-understanding/contracts.js';
import {
  anchoredCandidates,
  matchesApproximateLabel,
  withSpatialPhrases,
} from '../document-understanding/extractor-utils.js';
import { tieFieldConcepts } from '../document-understanding/extractors/tie.js';
import type { StoredDocument } from './job-store.js';

const enabled = process.env.REFERENCE_DOCUMENT_OCR === '1';

async function inspect(
  relativePath: string,
  requirementId: string,
  documentType: DocumentTypeId,
  subjectRole: DocumentSubjectRole,
): Promise<Set<string>> {
  const path = resolve(process.cwd(), '..', relativePath);
  const info = await stat(path);
  const doc: StoredDocument = {
    id: 'reference-' + requirementId,
    requirementId,
    path,
    kind: 'pdf',
    size: info.size,
  };

  const extraction = await extractTextWithEngine(doc, process.cwd());
  const context = {
    documentId: doc.id,
    sourceId: requirementId,
    documentType,
    subjectRole,
  } as const;
  const evidence = extractDocumentEvidence(extraction.observation, context);
  const assessments = assessDocumentFields(extraction.observation, context);
  const fields = new Set(evidence.map((item) => item.fieldId));
  const motorDiagnostics = evidence
    .filter((item) => item.fieldId === 'vessel.motorSerial' ||
      item.fieldId === 'vessel.motorManufacturerBrandModel')
    .map((item) => {
      const normalized = item.value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
      return {
        fieldId: item.fieldId,
        method: item.method,
        lineIds: item.lineIds,
        length: normalized.length,
        letters: /[A-Z]/.test(normalized),
        digits: /\d/.test(normalized),
        digitsOnly: /^\d+$/.test(normalized),
        looksYear: /^(?:19|20)\d{2}$/.test(normalized),
        looksDate: /^\d{2}[./-]\d{2}[./-]\d{2,4}$/.test(normalized),
        motorMarker: /^(?:MOTOR|ENGINE)\s*\d/.test(normalized),
      };
    });
  if (motorDiagnostics.length) {
    console.log('[REFERENCE_MOTOR_DIAG]', JSON.stringify({
      file: relativePath.split('/').at(-1),
      candidates: motorDiagnostics,
    }));
  }
  if (documentType === 'tie') {
    const target = new Set([
      'vessel.name', 'vessel.motorPower', 'vessel.motorSerial', 'vessel.motorBrand',
    ]);
    const source = withSpatialPhrases(extraction.observation);
    const targetConcepts = tieFieldConcepts.filter((concept) => target.has(concept.fieldId));
    console.log('[REFERENCE_FIELD_STATUS]', JSON.stringify({
      file: relativePath.split('/').at(-1),
      fields: assessments.filter((item) => target.has(item.fieldId)).map((item) => {
        const concept = targetConcepts.find((candidate) => candidate.fieldId === item.fieldId);
        const originalLabelMatches = extraction.observation.pages.flatMap((page) => page.lines)
          .filter((line) => concept?.labels.some((pattern) => pattern.test(line.text))).length;
        const sourceLabelMatches = source.pages.flatMap((page) => page.lines)
          .filter((line) => concept?.labels.some((pattern) => pattern.test(line.text))).length;
        const isKnownTieLabel = (value: string): boolean =>
          tieFieldConcepts.some((known) =>
            known.labels.some((pattern) => pattern.test(value)) ||
            matchesApproximateLabel(value, known.approximateLabels ?? []));
        const diagnosticCandidates = concept ? anchoredCandidates(
          source,
          concept.labels,
          concept.anchor,
          concept.validate,
          concept.preferredDirections,
          (value) => isKnownTieLabel(value) ||
            Boolean(concept.boundaries?.some((pattern) => pattern.test(value))),
          concept.allowSequentialWithGeometry ?? true,
          concept.firstOccurrenceOnly ?? false,
          concept.approximateLabels ?? [],
        ) : [];
        return {
          fieldId: item.fieldId,
          status: item.status,
          method: item.method ?? null,
          anchor: item.anchor ?? null,
          originalLabelMatches,
          sourceLabelMatches,
          candidateCount: diagnosticCandidates.length,
          candidateMethods: diagnosticCandidates.map((candidate) => candidate.method),
          candidateLineIds: diagnosticCandidates.map((candidate) => candidate.lineIds),
        };
      }),
    }));
  }
  if (relativePath.includes('TIEM antigo')) {
    const rawLines = extraction.observation.pages.flatMap((page) => page.lines);
    const motorIndexes = rawLines.flatMap((line, index) =>
      /MOTOR|FABRICANTE/i.test(line.text) ? [index] : []);
    const neighborhood = [...new Set(motorIndexes.flatMap((index) =>
      [index - 2, index - 1, index, index + 1, index + 2]
        .filter((candidate) => candidate >= 0 && candidate < rawLines.length)))]
      .sort((a, b) => a - b)
      .map((index) => ({
        id: rawLines[index]!.id,
        text: rawLines[index]!.text.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
          .replace(/\b(?=[A-Z0-9./-]*\d)[A-Z0-9./-]{4,}\b/g, '[VALUE]'),
      }));
    console.log('[REFERENCE_MOTOR_NEIGHBORHOOD]', JSON.stringify({ neighborhood }));
  }

  const lineCount = extraction.observation.pages.reduce(
    (sum, page) => sum + page.lines.length, 0);
  const structuralLabels = extraction.observation.pages.flatMap((page) =>
    page.lines
      .map((line) => line.text.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toUpperCase().trim())
      .filter((text) => /(?:NOME|EMBARC|MOTOR|POT|FABRIC|SERIE|INSCRI|CASCO|ATIVIDADE|TRIPUL|PASSAGE)/.test(text))
      .map((text) => text.replace(/\b(?=[A-Z0-9./-]*\d)[A-Z0-9./-]{4,}\b/g, '[VALUE]')));
  if (structuralLabels.length) {
    console.log('[REFERENCE_LABEL_DIAG]', JSON.stringify({
      file: relativePath.split('/').at(-1),
      labels: structuralLabels,
    }));
  }

  // Privacy-safe diagnostic: never print OCR values; structural labels are sanitized above.
  console.log('[REFERENCE_OCR]', JSON.stringify({
    file: relativePath.split('/').at(-1),
    engine: extraction.engine,
    elapsedMs: extraction.observation.elapsedMs,
    pages: extraction.observation.pages.length,
    lineCount,
    fieldIds: [...fields].sort(),
  }));
  return fields;
}

describe.skipIf(!enabled)('documentos de referência do repositório', () => {
  it('lê os dois modelos de TIE e preserva identificadores compatíveis com cada layout', async () => {
    const digital = await inspect(
      'documentos/tie/TIE digital modelo.pdf', 'tie', 'tie', 'vessel');
    expect(digital.has('vessel.registration')).toBe(true);
    expect(digital.has('vessel.name')).toBe(true);
    expect(digital.has('vessel.hullId')).toBe(true);
    expect(digital.has('vessel.grossTonnage')).toBe(true);
    expect(digital.has('vessel.activity')).toBe(true);
    // The public model masks motor manufacturer/model and serial with asterisks.
    // A label or a neighboring field must never be promoted as the missing value.
    expect(digital.has('vessel.motorManufacturerBrandModel')).toBe(false);
    expect(digital.has('vessel.motorSerial')).toBe(false);
    expect(digital.has('vessel.passengerCount')).toBe(true);

    const legacy = await inspect(
      'documentos/tie/TIEM antigo.pdf', 'tie', 'tie', 'vessel');
    expect(legacy.has('vessel.registration')).toBe(true);
    expect(legacy.has('vessel.name')).toBe(true);
    expect(legacy.has('vessel.hullId')).toBe(true);
    expect(legacy.has('vessel.length')).toBe(true);
    expect(legacy.has('vessel.year')).toBe(true);
    expect(legacy.has('vessel.motorPower')).toBe(true);
    expect(legacy.has('vessel.motorSerial')).toBe(true);
    expect(legacy.has('vessel.motorBrand')).toBe(true);
    expect(legacy.has('vessel.activity')).toBe(true);
    expect(legacy.has('vessel.crewCount')).toBe(true);
    expect(legacy.has('vessel.passengerCount')).toBe(true);
  }, 180_000);

  it.skip('lê o comprovante e preserva CEP/logradouro sem usar nome do titular', async () => {
    const file = 'documentos/comprovante de residencia/comprovante de residencia.pdf';
    const fields = await inspect(file, 'residence-proof', 'residence-proof', 'person');
    expect(fields.has('person.postalCode')).toBe(true);
    expect(fields.has('person.address')).toBe(true);
    expect(fields.has('person.fullName')).toBe(false);
  }, 120_000);
});
