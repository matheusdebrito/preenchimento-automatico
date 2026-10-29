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

  it('usa a dica espacial para rejeitar um valor plausível porém distante da âncora', () => {
    const source: DocumentObservation = {
      ...observation([]),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'NÚMERO DE INSCRIÇÃO', confidence: .99,
            box: [10, 10, 180, 30], polygon: null },
          { id: '0:1', page: 0, text: '3810056831', confidence: .99,
            box: [10, 180, 140, 202], polygon: null },
        ],
      }],
    };
    const localConcepts: readonly SemanticFieldConcept[] = [{
      fieldId: 'vessel.registration',
      anchor: 'INSCRICAO',
      labels: [/^\s*N[ÚU]MERO\s+DE\s+INSCRI[CÇ][AÃ]O\s*(?:[:-]\s*)?(.*)$/i],
      preferredDirections: ['below'],
      allowSequentialWithGeometry: false,
      spatialHint: {
        maxBelowDistanceHeights: 3,
        maxBelowHorizontalOffsetHeights: 4,
      },
      validate: (value) => /^\d{8,12}$/.test(value.trim()),
    }];

    const result = extractSemanticConcepts(source, context, localConcepts);
    expect(result.evidence).toEqual([]);
    expect(result.assessments[0]).toEqual(
      expect.objectContaining({ fieldId: 'vessel.registration', status: 'NOT_FOUND' }),
    );
  });

  it('permite controlar fallback sequencial por conceito sem afetar os demais', () => {
    const source: DocumentObservation = {
      ...observation([]),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'AB / GT', confidence: .99,
            box: [300, 10, 380, 30], polygon: null },
          { id: '0:1', page: 0, text: '2,35', confidence: .98,
            box: [10, 200, 60, 220], polygon: null },
          { id: '0:2', page: 0, text: 'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
            confidence: .99, box: [300, 260, 640, 282], polygon: null },
          { id: '0:3', page: 0, text: '2022', confidence: .98,
            box: [10, 300, 60, 322], polygon: null },
        ],
      }],
    };
    const localConcepts: readonly SemanticFieldConcept[] = [
      {
        fieldId: 'vessel.grossTonnage',
        anchor: 'AB / GT',
        labels: [/^\s*AB\s*\/\s*GT\s*(?:[:-]\s*)?(.*)$/i],
        validate: (value) => /^\d+(?:[.,]\d+)?$/.test(value.trim()),
      },
      {
        fieldId: 'vessel.motorSerial',
        anchor: 'SERIE',
        labels: [
          /^\s*N[°ºO.]?\s+DE\s+S[EÉ]RIE\s+DO\s+MOTOR\s*\/\s*ENGINE\s+SERIAL\s+NUMBER\s*(?:[:-]\s*)?(.*)$/i,
        ],
        allowSequentialWithGeometry: false,
        validate: (value) => /^[A-Z0-9./-]{4,50}$/i.test(value.trim()) && /\d/.test(value),
      },
    ];

    const result = extractSemanticConcepts(source, context, localConcepts);
    expect(result.evidence.find((item) => item.fieldId === 'vessel.grossTonnage')?.value)
      .toBe('2,35');
    expect(result.evidence.some((item) => item.fieldId === 'vessel.motorSerial')).toBe(false);
  });

});
