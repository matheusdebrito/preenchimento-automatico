import { describe, expect, it } from 'vitest';
import { identityDocumentExtractor } from './identity.js';
import type { DocumentObservation, ExtractionContext } from '../contracts.js';

const context: ExtractionContext = {
  documentId: 'doc-1',
  sourceId: 'buyer-identity',
  documentType: 'identity',
  subjectRole: 'person',
};

const observation = (label = 'NOME'): DocumentObservation => ({
  engine: 'paddleocr',
  engineVersion: '3.7.0',
  model: 'PP-OCRv6',
  elapsedMs: 10,
  pages: [{
    page: 0,
    orientation: 0,
    lines: [
      { id: '0:0', page: 0, text: label, confidence: .99, box: [10, 10, 80, 30], polygon: null },
      { id: '0:1', page: 0, text: 'MARIA DE SOUZA', confidence: .97, box: [10, 36, 220, 62], polygon: null },
      { id: '0:2', page: 0, text: 'CPF 123.456.789-09', confidence: .98, box: [10, 70, 230, 96], polygon: null },
    ],
  }],
});

describe('identityDocumentExtractor', () => {
  it('produz evidências canônicas sem conhecer serviço ou formulário', () => {
    const evidence = identityDocumentExtractor.extract(observation(), context);
    expect(evidence.find((item) => item.fieldId === 'person.fullName')?.value)
      .toBe('MARIA DE SOUZA');
    expect(evidence.find((item) => item.fieldId === 'person.cpf')?.value)
      .toBe('123.456.789-09');
    expect(evidence.every((item) => item.documentId === 'doc-1')).toBe(true);
  });

  it('usa o papel semântico para separar comprador e vendedor', () => {
    const evidence = identityDocumentExtractor.extract(observation(), {
      ...context, subjectRole: 'seller', sourceId: 'seller-identity',
    });
    expect(evidence.some((item) => item.fieldId === 'seller.fullName')).toBe(true);
    expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
  });

  it('rejeita nome de filiação e nome social', () => {
    for (const label of ['NOME DA MAE', 'NOME DO PAI', 'NOME SOCIAL']) {
      const evidence = identityDocumentExtractor.extract(observation(label), context);
      expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
    }
  });
});
