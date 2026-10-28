import { describe, expect, it } from 'vitest';
import { qaPreviewCatalog } from '../catalog/qa-preview.js';
import { publicService } from '../catalog/public-catalog.js';
import { paddleIdentitySuggestions } from './paddle-ocr.js';
import type { PaddleOcrResult } from './paddle-ocr.js';

function identityResult(name: string, cpf: string): PaddleOcrResult {
  return {
    engine: 'paddleocr',
    version: '3.7.0',
    model: 'PP-OCRv6',
    elapsedMs: 12,
    pages: [{
      page: 0,
      orientation: 0,
      lines: [
        { text: 'NOME', confidence: .99, box: [20, 20, 90, 42], polygon: null },
        { text: name, confidence: .97, box: [20, 48, 280, 76], polygon: null },
        { text: 'CPF ' + cpf, confidence: .98, box: [20, 90, 230, 118], polygon: null },
      ],
    }],
  };
}

describe('Transferência de moto aquática com PaddleOCR', () => {
  const service = publicService(qaPreviewCatalog(), 'transferencia-moto-aquatica', {
    tieSituation: 'regular',
    transferAuthorization: 'anexo_2d',
    sellerCommunication: 'sim',
    residenceProof: 'comprovante',
    coOwner: 'nao',
    representative: 'nao',
  });

  it('mantém nome e CPF do comprador disponíveis para a revisão do serviço', () => {
    expect(service).not.toBeNull();
    const reviewable = new Set(service!.reviewFields.map((field) => field.id));
    expect(reviewable.has('person.fullName')).toBe(true);
    expect(reviewable.has('person.cpf')).toBe(true);

    const suggestions = paddleIdentitySuggestions(
      identityResult('MARIA DE SOUZA', '123.456.789-09'),
      'buyer-identity',
    );

    expect(suggestions['person.fullName']?.value).toBe('MARIA DE SOUZA');
    expect(suggestions['person.cpf']?.value).toBe('123.456.789-09');
  });

  it('mantém vendedor e comprador em campos separados', () => {
    expect(service).not.toBeNull();
    const reviewable = new Set(service!.reviewFields.map((field) => field.id));
    expect(reviewable.has('seller.fullName')).toBe(true);
    expect(reviewable.has('seller.cpf')).toBe(true);

    const suggestions = paddleIdentitySuggestions(
      identityResult('JOAO DA SILVA', '529.982.247-25'),
      'seller-identity',
    );

    expect(suggestions['seller.fullName']?.value).toBe('JOAO DA SILVA');
    expect(suggestions['seller.cpf']?.value).toBe('529.982.247-25');
    expect(suggestions['person.fullName']).toBeUndefined();
    expect(suggestions['person.cpf']).toBeUndefined();
  });
});
