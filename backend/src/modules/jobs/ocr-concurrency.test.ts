import { describe, expect, it } from 'vitest';
import { ocrMaxConcurrent } from './ocr.js';

describe('ocrMaxConcurrent', () => {
  it('escala de forma conservadora conforme CPUs disponíveis', () => {
    expect(ocrMaxConcurrent(2, {})).toBe(2);
    expect(ocrMaxConcurrent(4, {})).toBe(2);
    expect(ocrMaxConcurrent(8, {})).toBe(4);
    expect(ocrMaxConcurrent(12, {})).toBe(6);
    expect(ocrMaxConcurrent(16, {})).toBe(8);
  });

  it('acompanha override manual de workers', () => {
    expect(ocrMaxConcurrent(12, { OCR_WORKERS: '2' })).toBe(4);
  });

  it('permite override explícito do limite da API com teto de segurança', () => {
    expect(ocrMaxConcurrent(4, { OCR_MAX_CONCURRENT: '7' })).toBe(7);
    expect(ocrMaxConcurrent(64, { OCR_MAX_CONCURRENT: '100' })).toBe(32);
  });
});
