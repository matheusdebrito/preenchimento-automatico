import { describe, expect, it } from 'vitest';
import type { DocumentObservation } from '../document-understanding/contracts.js';
import { observationText } from './pdf-text-observation.js';

describe('PDF text observation', () => {
  it('mantém texto em ordem sem inventar valores', () => {
    const observation: DocumentObservation = {
      engine: 'pdf-text', engineVersion: 'poppler', model: 'pdftotext-bbox-layout', elapsedMs: 2,
      pages: [{ page: 0, orientation: 0, lines: [
        { id: '0:0', page: 0, text: 'INSCRIÇÃO', confidence: 1, box: [1, 1, 10, 10], polygon: null },
        { id: '0:1', page: 0, text: '12345', confidence: 1, box: [20, 1, 30, 10], polygon: null },
      ] }],
    };
    expect(observationText(observation)).toBe('INSCRIÇÃO\n12345');
  });
});
