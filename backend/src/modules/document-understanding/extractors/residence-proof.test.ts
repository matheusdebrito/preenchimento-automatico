import { describe, expect, it } from 'vitest';
import { residenceProofDocumentExtractor } from './residence-proof.js';
import type { DocumentObservation, ExtractionContext } from '../contracts.js';

const context: ExtractionContext = {
  documentId: 'res-doc', sourceId: 'residence-proof',
  documentType: 'residence-proof', subjectRole: 'person',
};

function observation(lines: readonly string[]): DocumentObservation {
  return {
    engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
    pages: [{
      page: 0, orientation: 0,
      lines: lines.map((text, index) => ({
        id: '0:' + index, page: 0, text, confidence: .96,
        box: [10, 10 + index * 30, 420, 30 + index * 30], polygon: null,
      })),
    }],
  };
}

describe('residenceProofDocumentExtractor', () => {
  it('extrai campos explicitamente rotulados', () => {
    const evidence = residenceProofDocumentExtractor.extract(observation([
      'ENDEREÇO: RUA TESTE',
      'NÚMERO: 123',
      'COMPLEMENTO: APTO 201',
      'BAIRRO: CENTRO',
      'CIDADE: NITEROI',
      'UF: RJ',
      'CEP: 24000-000',
    ]), context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['person.address']).toBe('RUA TESTE');
    expect(values['person.streetNumber']).toBe('123');
    expect(values['person.apartment']).toBe('APTO 201');
    expect(values['person.neighborhood']).toBe('CENTRO');
    expect(values['person.city']).toBe('NITEROI');
    expect(values['person.state']).toBe('RJ');
    expect(values['person.postalCode']).toBe('24000-000');
  });

  it('usa fallback conservador para uma única linha de logradouro e CEP', () => {
    const evidence = residenceProofDocumentExtractor.extract(observation([
      'RUA EXEMPLO, 321',
      '24000-000',
    ]), context);
    expect(evidence.find((item) => item.fieldId === 'person.address')?.value)
      .toBe('RUA EXEMPLO');
    expect(evidence.find((item) => item.fieldId === 'person.streetNumber')?.value)
      .toBe('321');
    expect(evidence.find((item) => item.fieldId === 'person.postalCode')?.value)
      .toBe('24000-000');
  });

  it('não usa nome do titular da conta como nome da pessoa', () => {
    const evidence = residenceProofDocumentExtractor.extract(observation([
      'NOME: MARIA DE SOUZA',
      'ENDEREÇO: RUA TESTE',
      'CEP: 24000-000',
    ]), context);
    expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
  });
});
