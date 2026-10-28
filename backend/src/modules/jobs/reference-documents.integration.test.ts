import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfTextObservation } from './pdf-text-observation.js';
import { runPaddleOcrBuffer } from './paddle-ocr.js';
import { paddleToObservation } from '../document-understanding/paddle-observation.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';
import type { DocumentTypeId, DocumentSubjectRole } from '../document-understanding/contracts.js';
import type { StoredDocument } from './job-store.js';

const enabled = Boolean(process.env.PADDLE_OCR_URL);

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

  const fast = await extractPdfTextObservation(doc);
  const observation = fast ?? paddleToObservation(
    await runPaddleOcrBuffer(await readFile(path), 'pdf'),
  );
  const evidence = extractDocumentEvidence(observation, {
    documentId: doc.id,
    sourceId: requirementId,
    documentType,
    subjectRole,
  });
  const fieldIds = [...new Set(evidence.map((item) => item.fieldId))].sort();
  const lineCount = observation.pages.reduce((sum, page) => sum + page.lines.length, 0);
  // Privacy-safe regression diagnostic: never print OCR text or extracted values.
  console.log('[REFERENCE_OCR]', JSON.stringify({
    file: relativePath.split('/').at(-1),
    engine: observation.engine,
    elapsedMs: observation.elapsedMs,
    pages: observation.pages.length,
    lineCount,
    fieldIds,
  }));
  return new Set(fieldIds);
}

describe.skipIf(!enabled)('documentos de referência do repositório', () => {
  it('lê os dois modelos de TIE e encontra os identificadores centrais da embarcação', async () => {
    for (const file of [
      'documentos/tie/TIE digital modelo.pdf',
      'documentos/tie/TIEM antigo.pdf',
    ]) {
      const fields = await inspect(file, 'tie', 'tie', 'vessel');
      expect(fields.has('vessel.registration'), file).toBe(true);
      expect(fields.has('vessel.name'), file).toBe(true);
      expect(fields.has('vessel.hullId'), file).toBe(true);
    }
  }, 150_000);

  it('lê o comprovante e encontra CEP e logradouro sem usar nome do titular', async () => {
    const fields = await inspect(
      'documentos/comprovante de residencia/comprovante de residencia.pdf',
      'residence-proof',
      'residence-proof',
      'person',
    );
    expect(fields.has('person.postalCode')).toBe(true);
    expect(fields.has('person.address')).toBe(true);
    expect(fields.has('person.fullName')).toBe(false);
  }, 120_000);
});
