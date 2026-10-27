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
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==',
      'base64',
    );
    png.writeUInt32BE(100_000, 16);
    png.writeUInt32BE(100_000, 20);
    expect(() => classifyDocument(png, 'image/png')).toThrow('grande');
  });
  it('aceita PNG válido e rejeita CRC adulterado ou PNG incompleto', () => {
    const valid = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==', 'base64');
    expect(classifyDocument(valid, 'image/png')).toBe('png');
    const tampered = Buffer.from(valid);
    tampered[55] = tampered[55]! ^ 0x01;
    expect(() => classifyDocument(tampered, 'image/png')).toThrow('Checksum');
    const fake = Buffer.alloc(40);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(fake);
    fake.write('IHDR', 12);
    fake.writeUInt32BE(2, 16);
    fake.writeUInt32BE(2, 20);
    expect(() => classifyDocument(fake, 'image/png')).toThrow();
  });

  it('aceita PDF sintético com assinatura e fim de arquivo', () => {
    expect(classifyDocument(Buffer.from('%PDF-1.7\n1 0 obj\nendobj\n%%EOF'), 'application/pdf')).toBe('pdf');
  });
});

describe('candidatos OCR conservadores', () => {
  it('distingue CPF de comprador e vendedor sem sobrescrever campos', () => {
    const buyer = suggestFields('CPF 123.456.789-09', 'buyer-identity');
    const seller = suggestFields('CPF 529.982.247-25', 'seller-identity');
    expect(buyer['person.cpf']?.value).toBe('123.456.789-09');
    expect(buyer['seller.cpf']).toBeUndefined();
    expect(seller['seller.cpf']?.value).toBe('529.982.247-25');
    expect(seller['person.cpf']).toBeUndefined();
  });

  it('não sugere CPF com dígito verificador inválido nem múltiplos números conflitantes', () => {
    expect(suggestFields('CPF: 111.111.111-11', 'buyer-identity')['person.cpf']).toBeUndefined();
    expect(suggestFields('CPF 123.456.789-09 CPF 529.982.247-25',
      'buyer-identity')['person.cpf']).toBeUndefined();
  });

  it('extrai nomes apenas de rótulos inequívocos em documentos de identidade', () => {
    expect(suggestFields('NOME: MARIA DE SOUZA', 'buyer-identity')['person.fullName']?.value)
      .toBe('MARIA DE SOUZA');
    expect(suggestFields('NOME: JOAO DA SILVA', 'seller-identity')['seller.fullName']?.value)
      .toBe('JOAO DA SILVA');
    expect(suggestFields('NOME: MARIA DE SOUZA', 'other')['person.fullName'])
      .toBeUndefined();
  });

  it('retorna somente CPF e casco encontrados, sempre para revisão', () => {
    const found = suggestFields('CPF 123.456.789-09\nHIN BR-ABC-123456', 'documento de teste');
    expect(found['person.cpf']?.status).toBe('REVIEW_REQUIRED');
    expect(found['vessel.hullId']?.value).toBe('BR-ABC-123456');
    expect(found['person.fullName']).toBeUndefined();
  });
});
