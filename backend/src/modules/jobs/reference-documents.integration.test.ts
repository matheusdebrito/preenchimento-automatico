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
  const evidence = extractDocumentEvidence(extraction.observation, {
    documentId: doc.id,
    sourceId: requirementId,
    documentType,
    subjectRole,
  });
  const fields = new Set(evidence.map((item) => item.fieldId));
  const lineCount = extraction.observation.pages.reduce(
    (sum, page) => sum + page.lines.length, 0);

  // Privacy-safe diagnostic: never print OCR text or extracted values.
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
    expect(digital.has('vessel.motorManufacturerBrandModel')).toBe(true);
    expect(digital.has('vessel.motorSerial')).toBe(true);
    expect(digital.has('vessel.passengerCount')).toBe(true);

    const legacy = await inspect(
      'documentos/tie/TIEM antigo.pdf', 'tie', 'tie', 'vessel');
    expect(legacy.has('vessel.registration')).toBe(true);
    expect(legacy.has('vessel.hullId')).toBe(true);
    expect(legacy.has('vessel.length')).toBe(true);
    expect(legacy.has('vessel.year')).toBe(true);
  }, 180_000);

  it.skip('lê o comprovante e preserva CEP/logradouro sem usar nome do titular', async () => {
    const file = 'documentos/comprovante de residencia/comprovante de residencia.pdf';
    const fields = await inspect(file, 'residence-proof', 'residence-proof', 'person');
    expect(fields.has('person.postalCode')).toBe(true);
    expect(fields.has('person.address')).toBe(true);
    expect(fields.has('person.fullName')).toBe(false);
  }, 120_000);
});
