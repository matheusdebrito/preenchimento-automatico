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
      { id: '0:3', page: 0, text: 'REGISTRO GERAL', confidence: .98, box: [10, 105, 150, 128], polygon: null },
      { id: '0:4', page: 0, text: '12.345.678-9', confidence: .96, box: [10, 132, 150, 156], polygon: null },
      { id: '0:5', page: 0, text: 'ÓRGÃO EXPEDIDOR', confidence: .97, box: [180, 105, 330, 128], polygon: null },
      { id: '0:6', page: 0, text: 'SSP/RJ', confidence: .95, box: [180, 132, 260, 156], polygon: null },
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
    expect(evidence.find((item) => item.fieldId === 'person.identity')?.value)
      .toBe('12.345.678-9');
    expect(evidence.find((item) => item.fieldId === 'person.issuer')?.value)
      .toBe('SSP/RJ');
    expect(evidence.every((item) => item.documentId === 'doc-1')).toBe(true);
  });

  it('usa o papel semântico para separar comprador e vendedor', () => {
    const evidence = identityDocumentExtractor.extract(observation(), {
      ...context, subjectRole: 'seller', sourceId: 'seller-identity',
    });
    expect(evidence.some((item) => item.fieldId === 'seller.fullName')).toBe(true);
    expect(evidence.find((item) => item.fieldId === 'seller.identity')?.value)
      .toBe('12.345.678-9');
    expect(evidence.find((item) => item.fieldId === 'seller.issuer')?.value)
      .toBe('SSP/RJ');
    expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
  });

  it('rejeita nome de filiação e nome social', () => {
    for (const label of ['NOME DA MAE', 'NOME DO PAI', 'NOME SOCIAL']) {
      const evidence = identityDocumentExtractor.extract(observation(label), context);
      expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
    }
  });

  it('aceita número e órgão emissor na mesma linha do rótulo', () => {
    const inline: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'RG: 45.678.901-2', confidence: .97,
            box: [10, 10, 180, 34], polygon: null },
          { id: '0:1', page: 0, text: 'ÓRGÃO EMISSOR: DETRAN-RJ', confidence: .96,
            box: [10, 40, 280, 66], polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(inline, context);
    expect(evidence.find((item) => item.fieldId === 'person.identity')?.value)
      .toBe('45.678.901-2');
    expect(evidence.find((item) => item.fieldId === 'person.issuer')?.value)
      .toBe('DETRAN-RJ');
  });

  it('não confunde CPF ou data com número da identidade', () => {
    const unsafe: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'RG', confidence: .99, box: null, polygon: null },
          { id: '0:1', page: 0, text: '123.456.789-09', confidence: .98, box: null, polygon: null },
          { id: '0:2', page: 0, text: '01/02/2000', confidence: .98, box: null, polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(unsafe, context);
    expect(evidence.some((item) => item.fieldId === 'person.identity')).toBe(false);
  });

  it('não escolhe órgão emissor quando há dois valores diferentes', () => {
    const ambiguous: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'ÓRGÃO EMISSOR: SSP/RJ', confidence: .98,
            box: null, polygon: null },
          { id: '0:1', page: 0, text: 'EMISSOR: DETRAN/RJ', confidence: .98,
            box: null, polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(ambiguous, context);
    expect(evidence.some((item) => item.fieldId === 'person.issuer')).toBe(false);
  });

});
