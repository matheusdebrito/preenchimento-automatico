import { describe, expect, it } from 'vitest';
import { classifyDocument } from './document-validator.js';
import { suggestFields } from './ocr.js';

describe('validação de assinatura do documento', () => {
  it('rejeita PDF falso, MIME incorreto e arquivo vazio', () => {
    expect(() => classifyDocument(Buffer.from('not pdf'), 'application/pdf')).toThrow();
    expect(() => classifyDocument(Buffer.from('%PDF-1.7\n%%EOF'), 'text/html')).toThrow();
    expect(() => classifyDocument(Buffer.alloc(0), 'image/png')).toThrow();
  });
  it('impede imagem-bomba a partir do IHDR', () => {
    const png = Buffer.alloc(40);
    Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
    png.write('IHDR', 12);
    png.writeUInt32BE(100_000, 16);
    png.writeUInt32BE(100_000, 20);
    expect(() => classifyDocument(png, 'image/png')).toThrow('grande');
  });
  it('aceita PDF sintético com assinatura e fim de arquivo', () => {
    expect(classifyDocument(Buffer.from('%PDF-1.7\n1 0 obj\nendobj\n%%EOF'), 'application/pdf')).toBe('pdf');
  });
});

describe('candidatos OCR conservadores', () => {
  it('retorna somente CPF e casco encontrados, sempre para revisão', () => {
    const found = suggestFields('CPF 123.456.789-09\nHIN BR-ABC-123456', 'documento de teste');
    expect(found['person.cpf']?.status).toBe('REVIEW_REQUIRED');
    expect(found['vessel.hullId']?.value).toBe('BR-ABC-123456');
    expect(found['person.fullName']).toBeUndefined();
  });
});
