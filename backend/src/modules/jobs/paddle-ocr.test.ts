import { describe, expect, it } from 'vitest';
import { paddleIdentityName, paddleIdentitySuggestions, paddleTextForSource } from './paddle-ocr.js';
import type { PaddleOcrResult } from './paddle-ocr.js';

const result: PaddleOcrResult = {
  engine: 'paddleocr', version: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
  pages: [{
    page: 0, orientation: 0,
    lines: [
      { text: 'NOME', confidence: .99, box: [10, 10, 80, 30], polygon: null },
      { text: 'MARIA DE SOUZA', confidence: .97, box: [10, 36, 220, 62], polygon: null },
      { text: 'CPF 123.456.789-09', confidence: .98, box: [10, 70, 230, 96], polygon: null },
    ],
  }],
};

describe('Paddle OCR structured identity extraction', () => {
  it('mapeia nome e CPF diretamente do resultado estruturado', () => {
    const fields = paddleIdentitySuggestions(result, 'buyer-identity');
    expect(fields['person.fullName']?.value).toBe('MARIA DE SOUZA');
    expect(fields['person.cpf']?.value).toBe('123.456.789-09');
    expect(fields['seller.fullName']).toBeUndefined();
  });

  it('preserva texto apenas como compatibilidade para regras não espaciais', () => {
    const text = paddleTextForSource(result, 'buyer-identity');
    expect(text).toContain('MARIA DE SOUZA');
    expect(text).toContain('NOME: MARIA DE SOUZA');
  });

  it('reconstrói nome quebrado em duas linhas', () => {
    const fragmented: PaddleOcrResult = {
      ...result,
      pages: [{ ...result.pages[0]!, lines: [
        { text: 'NOME', confidence: .99, box: [10, 10, 80, 30], polygon: null },
        { text: 'MARIA DE', confidence: .96, box: [10, 36, 130, 58], polygon: null },
        { text: 'SOUZA', confidence: .95, box: [10, 59, 95, 82], polygon: null },
        { text: 'CPF', confidence: .99, box: [10, 90, 70, 110], polygon: null },
      ] }],
    };
    expect(paddleIdentityName(fragmented)).toBe('MARIA DE SOUZA');
  });

  it('usa a ordem das linhas quando caixas não vierem disponíveis', () => {
    const withoutBoxes: PaddleOcrResult = {
      ...result,
      pages: [{ ...result.pages[0]!, lines: [
        { text: 'NOME', confidence: .99, box: null, polygon: null },
        { text: 'MARIA DE SOUZA', confidence: .96, box: null, polygon: null },
        { text: 'CPF', confidence: .99, box: null, polygon: null },
      ] }],
    };
    expect(paddleIdentityName(withoutBoxes)).toBe('MARIA DE SOUZA');
  });

  it('tolera uma pequena falha OCR no rótulo NOME', () => {
    const typo: PaddleOcrResult = {
      ...result,
      pages: [{ ...result.pages[0]!, lines: [
        { text: 'N0MF', confidence: .75, box: [10, 10, 80, 30], polygon: null },
        { text: 'MARIA DE SOUZA', confidence: .95, box: [10, 36, 220, 62], polygon: null },
      ] }],
    };
    expect(paddleIdentityName(typo)).toBe('MARIA DE SOUZA');
  });

  it('não injeta nome de filiação ou nome social', () => {
    for (const label of ['NOME DA MAE', 'NOME DO PAI', 'NOME SOCIAL']) {
      const parental: PaddleOcrResult = {
        ...result,
        pages: [{ ...result.pages[0]!, lines: [
          { text: label, confidence: .99, box: [10, 10, 140, 30], polygon: null },
          { text: 'MARIA DE SOUZA', confidence: .97, box: [10, 36, 220, 62], polygon: null },
        ] }],
      };
      expect(paddleIdentitySuggestions(parental, 'buyer-identity')['person.fullName'])
        .toBeUndefined();
    }
  });
});
