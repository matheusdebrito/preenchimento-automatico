import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { extractPdfTextObservation } from './pdf-text-observation.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';
import type { DocumentTypeId, DocumentSubjectRole } from '../document-understanding/contracts.js';
import type { StoredDocument } from './job-store.js';

const enabled = process.env.REFERENCE_DOCUMENT_FAST === '1';

async function inspectFast(
  relativePath: string,
  requirementId: string,
  documentType: DocumentTypeId,
  subjectRole: DocumentSubjectRole,
): Promise<void> {
  const path = resolve(process.cwd(), '..', relativePath);
  const info = await stat(path);
  const doc: StoredDocument = {
    id: 'fast-' + requirementId, requirementId, path, kind: 'pdf', size: info.size,
  };
  const observation = await extractPdfTextObservation(doc);
  const fields = observation
    ? extractDocumentEvidence(observation, {
        documentId: doc.id, sourceId: requirementId, documentType, subjectRole,
      }).map((item) => item.fieldId)
    : [];

  // Never print OCR text or extracted values from repository reference files.
  console.log('[REFERENCE_PDF_FAST]', JSON.stringify({
    file: relativePath.split('/').at(-1),
    available: Boolean(observation),
    elapsedMs: observation?.elapsedMs ?? null,
    pages: observation?.pages.length ?? null,
    lineCount: observation?.pages.reduce((sum, page) => sum + page.lines.length, 0) ?? null,
    fieldIds: [...new Set(fields)].sort(),
  }));
}

describe.skipIf(!enabled)('camada textual dos PDFs de referência', () => {
  it('inspeciona somente estrutura e IDs canônicos', async () => {
    await inspectFast('documentos/tie/TIE digital modelo.pdf', 'tie', 'tie', 'vessel');
    await inspectFast('documentos/tie/TIEM antigo.pdf', 'tie', 'tie', 'vessel');
    await inspectFast(
      'documentos/comprovante de residencia/comprovante de residencia.pdf',
      'residence-proof', 'residence-proof', 'person',
    );
  });
});
