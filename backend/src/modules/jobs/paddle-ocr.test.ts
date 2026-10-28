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

describe('Paddle OCR adapter', () => {
  it('preserva texto reconhecido sem aplicar semântica do documento', () => {
    const text = paddleTextForSource(result, 'buyer-identity');
    expect(text).toContain('NOME');
    expect(text).toContain('MARIA DE SOUZA');
    expect(text).toContain('CPF 123.456.789-09');
    expect(text).not.toContain('NOME: MARIA DE SOUZA');
  });
});
