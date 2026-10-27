import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { classifyDocument, validatePdfPages } from './document-validator.js';
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
    const unrelated = suggestFields('CPF 123.456.789-09', 'residence-proof');
    expect(unrelated['person.cpf']).toBeUndefined();
    expect(unrelated['seller.cpf']).toBeUndefined();
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

const describePoppler = process.env.DATABASE_TEST_URL ? describe : describe.skip;

describePoppler('preflight PDF com Poppler', () => {
  it('rejeita páginas sintéticas de dimensões excessivas', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-pdf-dimensions-'));
    try {
      const pdf = await PDFDocument.create();
      pdf.addPage([3000, 3000]);
      const file = join(root, 'oversized.pdf');
      await writeFile(file, await pdf.save());
      await expect(validatePdfPages(file)).rejects.toThrow('Dimensões');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('aceita PDF sintético com página A4 e recusa mais de cinco páginas', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-pdf-pages-'));
    try {
      const valid = await PDFDocument.create();
      valid.addPage([595, 842]);
      const validFile = join(root, 'valid.pdf');
      await writeFile(validFile, await valid.save());
      expect(await validatePdfPages(validFile)).toBe(1);

      const tooMany = await PDFDocument.create();
      for (let i = 0; i < 6; i++) tooMany.addPage([595, 842]);
      const invalidFile = join(root, 'too-many.pdf');
      await writeFile(invalidFile, await tooMany.save());
      await expect(validatePdfPages(invalidFile)).rejects.toThrow('entre 1 e 5');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
