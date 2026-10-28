import { describe, expect, it } from 'vitest';
import { paddleTextForSource } from './paddle-ocr.js';
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

describe('Paddle OCR spatial text adapter', () => {
  it('preserva texto e ancora o nome do titular para as regras existentes', () => {
    const text = paddleTextForSource(result, 'buyer-identity');
    expect(text).toContain('MARIA DE SOUZA');
    expect(text).toContain('NOME: MARIA DE SOUZA');
    expect(text).toContain('123.456.789-09');
  });

  it('não injeta nome de filiação', () => {
    const parental: PaddleOcrResult = {
      ...result,
      pages: [{ ...result.pages[0]!, lines: [
        { text: 'NOME DA MAE', confidence: .99, box: [10, 10, 120, 30], polygon: null },
        { text: 'MARIA DE SOUZA', confidence: .97, box: [10, 36, 220, 62], polygon: null },
      ] }],
    };
    expect(paddleTextForSource(parental, 'buyer-identity')).not.toContain('NOME: MARIA DE SOUZA');
  });
});
