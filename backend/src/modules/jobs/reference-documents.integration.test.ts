import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfTextObservation } from './pdf-text-observation.js';
import { runPaddleOcrBuffer } from './paddle-ocr.js';
import { paddleToObservation } from '../document-understanding/paddle-observation.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';
import type {
  DocumentObservation,
  DocumentTypeId,
  DocumentSubjectRole,
} from '../document-understanding/contracts.js';
import type { StoredDocument } from './job-store.js';

const enabled = Boolean(process.env.PADDLE_OCR_URL);

interface Inspection {
  selectedFields: Set<string>;
  fastFields: Set<string> | null;
  paddleFields: Set<string>;
}

function fieldIds(
  observation: DocumentObservation,
  doc: StoredDocument,
  documentType: DocumentTypeId,
  subjectRole: DocumentSubjectRole,
): Set<string> {
  return new Set(extractDocumentEvidence(observation, {
    documentId: doc.id,
    sourceId: doc.requirementId,
    documentType,
    subjectRole,
  }).map((item) => item.fieldId));
}

async function inspect(
  relativePath: string,
  requirementId: string,
  documentType: DocumentTypeId,
  subjectRole: DocumentSubjectRole,
): Promise<Inspection> {
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
  const fastFields = fast ? fieldIds(fast, doc, documentType, subjectRole) : null;

  // Benchmark against the existing Paddle route. We intentionally do this
  // only in integration tests; production does not double-process a PDF.
  const paddle = paddleToObservation(await runPaddleOcrBuffer(await readFile(path), 'pdf'));
  const paddleFields = fieldIds(paddle, doc, documentType, subjectRole);

  const selected = fast ?? paddle;
  const selectedFields = fastFields ?? paddleFields;
  const lineCount = selected.pages.reduce((sum, page) => sum + page.lines.length, 0);

  // Privacy-safe regression diagnostic: never print OCR text or extracted values.
  console.log('[REFERENCE_OCR]', JSON.stringify({
    file: relativePath.split('/').at(-1),
    selectedEngine: selected.engine,
    selectedElapsedMs: selected.elapsedMs,
    fastElapsedMs: fast?.elapsedMs ?? null,
    paddleElapsedMs: paddle.elapsedMs,
    pages: selected.pages.length,
    lineCount,
    selectedFieldIds: [...selectedFields].sort(),
    fastFieldIds: fastFields ? [...fastFields].sort() : null,
    paddleFieldIds: [...paddleFields].sort(),
  }));

  return { selectedFields, fastFields, paddleFields };
}

function expectCorePreserved(
  inspection: Inspection,
  required: readonly string[],
  file: string,
): void {
  for (const field of required) {
    expect(inspection.selectedFields.has(field), file + ': ' + field).toBe(true);
  }
  // If the fast path is selected, it must not lose a required field that
  // Paddle can extract from the same reference document.
  if (inspection.fastFields) {
    for (const field of required) {
      if (inspection.paddleFields.has(field)) {
        expect(inspection.fastFields.has(field), file + ' fast-path lost ' + field).toBe(true);
      }
    }
  }
}

describe.skipIf(!enabled)('documentos de referência do repositório', () => {
  it('lê os dois modelos de TIE e preserva os identificadores centrais', async () => {
    for (const file of [
      'documentos/tie/TIE digital modelo.pdf',
      'documentos/tie/TIEM antigo.pdf',
    ]) {
      const inspection = await inspect(file, 'tie', 'tie', 'vessel');
      expectCorePreserved(inspection, [
        'vessel.registration', 'vessel.name', 'vessel.hullId',
      ], file);
    }
  }, 240_000);

  it('lê o comprovante e preserva CEP/logradouro sem usar nome do titular', async () => {
    const file = 'documentos/comprovante de residencia/comprovante de residencia.pdf';
    const inspection = await inspect(file, 'residence-proof', 'residence-proof', 'person');
    expectCorePreserved(inspection, ['person.postalCode', 'person.address'], file);
    expect(inspection.selectedFields.has('person.fullName')).toBe(false);
  }, 180_000);
});
