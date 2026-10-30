import { describe, expect, it } from 'vitest';
import { catalog } from '../catalog/catalog.js';
import { publicService } from '../catalog/public-catalog.js';
import { paddleToObservation } from '../document-understanding/paddle-observation.js';
import { extractDocumentEvidence } from '../document-understanding/registry.js';
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

describe('Transferência com document-understanding', () => {
  const service = publicService(catalog, 'transferencia-propriedade-embarcacao', {
    vesselType: 'moto_aquatica',
    tieSituation: 'regular',
  });

  it('deriva campos dos formulários e extrai identidade sem regra de serviço', () => {
    expect(service).not.toBeNull();
    const reviewable = new Set(service!.reviewFields.map((field) => field.id));
    expect(reviewable.has('person.fullName')).toBe(true);
    expect(reviewable.has('person.cpf')).toBe(true);

    const evidence = extractDocumentEvidence(
      paddleToObservation(identityResult('MARIA DE SOUZA', '123.456.789-09')),
      {
        documentId: 'doc-buyer',
        sourceId: 'buyer-identity',
        documentType: 'identity',
        subjectRole: 'person',
      },
    );

    expect(evidence.find((item) => item.fieldId === 'person.fullName')?.value)
      .toBe('MARIA DE SOUZA');
    expect(evidence.find((item) => item.fieldId === 'person.cpf')?.value)
      .toBe('123.456.789-09');
  });

  it('reutiliza o extractor para vendedor sem misturar papéis', () => {
    const evidence = extractDocumentEvidence(
      paddleToObservation(identityResult('JOAO DA SILVA', '529.982.247-25')),
      {
        documentId: 'doc-seller',
        sourceId: 'seller-identity',
        documentType: 'identity',
        subjectRole: 'seller',
      },
    );

    expect(evidence.find((item) => item.fieldId === 'seller.fullName')?.value)
      .toBe('JOAO DA SILVA');
    expect(evidence.find((item) => item.fieldId === 'seller.cpf')?.value)
      .toBe('529.982.247-25');
    expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
  });
});
