import { describe, expect, it } from 'vitest';
import type { DocumentObservation, ExtractionContext } from './contracts.js';
import { extractSemanticConcepts, type SemanticFieldConcept } from './semantic-concepts.js';

const context: ExtractionContext = {
  documentId: 'doc', sourceId: 'source', documentType: 'tie', subjectRole: 'vessel',
};

function observation(lines: readonly string[]): DocumentObservation {
  return {
    engine: 'paddleocr',
    engineVersion: '3.7.0',
    model: 'PP-OCRv6',
    elapsedMs: 1,
    pages: [{
      page: 0,
      orientation: 0,
      lines: lines.map((text, index) => ({
        id: '0:' + index,
        page: 0,
        text,
        confidence: .95,
        box: [10, 10 + index * 30, 320, 30 + index * 30],
        polygon: null,
      })),
    }],
  };
}

const concepts: readonly SemanticFieldConcept[] = [{
  fieldId: 'vessel.activity',
  anchor: 'ATIVIDADE',
  labels: [
    /^\s*ATIVIDADE\s*\/\s*ACTIVITY\s*(?:[:-]\s*)?(.*)$/i,
    /^\s*ATIVIDADE\s*\/\s*USO\s*(?:[:-]\s*)?(.*)$/i,
  ],
  validate: (value) => /^[A-ZÀ-Ý ]{3,60}$/i.test(value.trim()) &&
    !/^ATIVIDADE\b/i.test(value.trim()),
}];

describe('extractSemanticConcepts', () => {
  it('extrai o mesmo conceito de aliases de layouts diferentes', () => {
    for (const label of ['ATIVIDADE / ACTIVITY', 'ATIVIDADE/USO']) {
      const result = extractSemanticConcepts(
        observation([label, 'ESPORTE E RECREIO']), context, concepts);
      expect(result.evidence[0]?.value).toBe('ESPORTE E RECREIO');
      expect(result.assessments).toEqual([
        expect.objectContaining({ fieldId: 'vessel.activity', status: 'FOUND' }),
      ]);
    }
  });

  it('marca valores divergentes como ambíguos em vez de escolher silenciosamente', () => {
    const result = extractSemanticConcepts(observation([
      'ATIVIDADE/USO: ESPORTE E RECREIO',
      'ATIVIDADE / ACTIVITY: PASSAGEIROS',
    ]), context, concepts);

    expect(result.evidence).toEqual([]);
    expect(result.assessments).toEqual([{
      fieldId: 'vessel.activity',
      status: 'AMBIGUOUS',
      confidence: null,
    }]);
  });

  it('diferencia ausência de campo de ambiguidade', () => {
    const result = extractSemanticConcepts(
      observation(['DOCUMENTO SEM O CAMPO']), context, concepts);
    expect(result.evidence).toEqual([]);
    expect(result.assessments).toEqual([{
      fieldId: 'vessel.activity',
      status: 'NOT_FOUND',
      confidence: null,
    }]);
  });
  it('não atravessa o rótulo do próximo conceito quando o valor atual é inválido', () => {
    const localConcepts: readonly SemanticFieldConcept[] = [
      {
        fieldId: 'vessel.motorManufacturerBrandModel',
        anchor: 'FABRICANTE',
        labels: [
          /^\s*FABRICANTE\s*-\s*MARCA\s*-\s*MODELO\s*\/\s*MANUFACTURER\s*-\s*BRAND\s*-\s*MODEL\s*(?:[:-]\s*)?(.*)$/i,
        ],
        preferredDirections: ['below'],
        validate: (value) => /[A-Z0-9]/i.test(value) && !/^\*+$/.test(value.trim()),
      },
      {
        fieldId: 'vessel.motorSerial',
        anchor: 'SERIE',
        labels: [
          /^\s*N[°ºO.]?\s+DE\s+S[EÉ]RIE\s+DO\s+MOTOR\s*\/\s*ENGINE\s+SERIAL\s+NUMBER\s*(?:[:-]\s*)?(.*)$/i,
        ],
        preferredDirections: ['below'],
        validate: (value) => /^[A-Z0-9./-]{4,50}$/i.test(value.trim()) && /\d/.test(value),
      },
    ];

    const result = extractSemanticConcepts(observation([
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      '**********',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '6AN123456',
    ]), context, localConcepts);

    expect(result.evidence.some((item) =>
      item.fieldId === 'vessel.motorManufacturerBrandModel')).toBe(false);
    expect(result.evidence.find((item) =>
      item.fieldId === 'vessel.motorSerial')?.value).toBe('6AN123456');
  });

});
