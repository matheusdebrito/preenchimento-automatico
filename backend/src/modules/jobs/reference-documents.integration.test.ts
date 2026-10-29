import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractTextWithEngine } from './ocr.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';
import type { DocumentTypeId, DocumentSubjectRole } from '../document-understanding/contracts.js';
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
  it('lê o modelo público de TIE digital sem promover campos mascarados', async () => {
    const digital = await inspect(
      'documentos/tie/TIE digital modelo.pdf', 'tie', 'tie', 'vessel');

    expect.soft(digital.has('vessel.registration')).toBe(true);
    expect.soft(digital.has('vessel.name')).toBe(true);
    // The public digital model masks/omits hull, AB/GT and breadth values.
    // Nearby registration/year/length values must not be promoted into them.
    expect.soft(digital.has('vessel.hullId')).toBe(false);
    expect.soft(digital.has('vessel.grossTonnage')).toBe(false);
    expect.soft(digital.has('vessel.breadth')).toBe(false);
    expect.soft(digital.has('vessel.activity')).toBe(true);
    // The public model masks motor manufacturer/model and serial with asterisks.
    expect.soft(digital.has('vessel.motorManufacturerBrandModel')).toBe(false);
    expect.soft(digital.has('vessel.motorSerial')).toBe(false);
    expect.soft(digital.has('vessel.passengerCount')).toBe(true);
  }, 120_000);

  it('lê o TIE digital atual respeitando campos presentes e ausentes', async () => {
    const currentDigital = await inspect(
      'documentos/tie/tie digital 2.pdf', 'tie-current', 'tie', 'vessel');

    expect.soft(currentDigital.has('vessel.registration')).toBe(true);
    expect.soft(currentDigital.has('vessel.name')).toBe(true);
    expect.soft(currentDigital.has('vessel.type')).toBe(true);
    expect.soft(currentDigital.has('vessel.navigationArea')).toBe(true);
    expect.soft(currentDigital.has('vessel.depth')).toBe(false);
    expect.soft(currentDigital.has('vessel.hullMaterial')).toBe(true);
    expect.soft(currentDigital.has('vessel.activity')).toBe(true);
    expect.soft(currentDigital.has('vessel.crewCount')).toBe(true);
    // The low-resolution public reference preserves the label, but PaddleOCR
    // does not return a trustworthy passenger-count value. Do not fabricate it.
    expect.soft(currentDigital.has('vessel.passengerCount')).toBe(false);
    expect.soft(currentDigital.has('vessel.expirationDate')).toBe(true);
    expect.soft(currentDigital.has('vessel.issueDate')).toBe(true);
    expect.soft(currentDigital.has('vessel.issuePlace')).toBe(true);
    // Preserve the registered owner as document evidence; do not assign a service role here.
    expect.soft(currentDigital.has('registeredOwner.fullName')).toBe(true);
    // The low-resolution reference exposes the motor-count label, but
    // PaddleOCR does not return a trustworthy standalone count value.
    // The semantic extractor behavior is covered by deterministic regressions.
    expect.soft(currentDigital.has('vessel.motorCount')).toBe(false);
    expect.soft(currentDigital.has('vessel.motorManufacturerBrandModel')).toBe(true);
    expect.soft(currentDigital.has('vessel.motorSerial')).toBe(true);
    // The public reference does not expose a trustworthy creditor value.
    expect.soft(currentDigital.has('vessel.mortgageCreditor')).toBe(false);
  }, 120_000);

  it('lê o TIEM antigo sem confundir inscrição com casco', async () => {
    const legacy = await inspect(
      'documentos/tie/TIEM antigo.pdf', 'tie', 'tie', 'vessel');

    expect.soft(legacy.has('vessel.registration')).toBe(true);
    expect.soft(legacy.has('vessel.name')).toBe(true);
    // The public legacy scan masks the hull/chassis serial. Its registration
    // must not be reused as a hull identifier when the real value is absent.
    expect.soft(legacy.has('vessel.hullId')).toBe(false);
    expect.soft(legacy.has('vessel.length')).toBe(true);
    expect.soft(legacy.has('vessel.year')).toBe(true);
    // This scanned public reference does not yield a trustworthy power/serial
    // token in PaddleOCR. Those fields are covered by deterministic regressions.
    expect.soft(legacy.has('vessel.motorBrand')).toBe(true);
    expect.soft(legacy.has('vessel.activity')).toBe(true);
    expect.soft(legacy.has('vessel.crewCount')).toBe(true);
    expect.soft(legacy.has('vessel.passengerCount')).toBe(true);
    // Masked owner/hull-color values in the public TIEM must remain absent.
    expect.soft(legacy.has('registeredOwner.fullName')).toBe(false);
    expect.soft(legacy.has('registeredOwner.neighborhood')).toBe(false);
    expect.soft(legacy.has('coOwner.fullName')).toBe(false);
    expect.soft(legacy.has('coOwner.neighborhood')).toBe(false);
    expect.soft(legacy.has('vessel.hullColor')).toBe(false);
  }, 120_000);

  it.skip('lê o comprovante e preserva CEP/logradouro sem usar nome do titular', async () => {
    const file = 'documentos/comprovante de residencia/comprovante de residencia.pdf';
    const fields = await inspect(file, 'residence-proof', 'residence-proof', 'person');
    expect.soft(fields.has('person.postalCode')).toBe(true);
    expect.soft(fields.has('person.address')).toBe(true);
    expect.soft(fields.has('person.fullName')).toBe(false);
  }, 120_000);
});
