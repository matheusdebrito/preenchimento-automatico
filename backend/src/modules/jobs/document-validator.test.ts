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


  it('rejeita IHDR PNG com cor/profundidade incompatíveis, sem PLTE ou chunk crítico desconhecido', () => {
    const valid = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==',
      'base64',
    );
    const incompatible = Buffer.from(valid);
    incompatible[24] = 1; // 1-bit RGB is invalid per PNG Third Edition 11.2.1.
    expect(() => classifyDocument(incompatible, 'image/png')).toThrow('IHDR PNG inválido');

    const indexedWithoutPalette = Buffer.from(valid);
    indexedWithoutPalette[25] = 3; // Indexed color must have PLTE before IDAT.
    expect(() => classifyDocument(indexedWithoutPalette, 'image/png')).toThrow('PLTE ausente');

    const critical = Buffer.from(valid);
    critical.write('ABCD', 37); // Replace IDAT with an unsupported critical chunk.
    expect(() => classifyDocument(critical, 'image/png')).toThrow('crítico PNG');
  });

  it('rejeita JPEG com dimensão zero declarada no segmento SOF', () => {
    const zeroHeight = Buffer.from([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x00,
      0x00, 0x02, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
    ]);
    expect(() => classifyDocument(zeroHeight, 'image/jpeg')).toThrow('Imagem inválida');
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

  it('extrai somente os valores identificados por rótulos no TIE', () => {
    const fields = suggestFields(
      'NOME DA EMBARCAÇÃO: MARÉ TESTE\nINSCRIÇÃO: RJ123456\nHIN: BR-ABC-12345\nCPF: 123.456.789-09',
      'tie',
    );
    expect(fields['vessel.name']?.value).toBe('MARÉ TESTE');
    expect(fields['vessel.registration']?.value).toBe('RJ123456');
    expect(fields['vessel.hullId']?.value).toBe('BR-ABC-12345');
    expect(fields['person.cpf']).toBeUndefined(); // Owner of TIE may not be purchaser.
    expect(fields['vessel.name']?.status).toBe('REVIEW_REQUIRED');
  });

  it('recusa números de inscrição ambíguos e TIE sem rótulo da embarcação', () => {
    const fields = suggestFields(
      'INSCRIÇÃO: RJ123456\nINSCRIÇÃO: RJ987654\nNOME: MARIA TESTE',
      'tie',
    );
    expect(fields['vessel.registration']).toBeUndefined();
    expect(fields['vessel.name']).toBeUndefined();
  });

  it('identifica RG e órgão emissor somente para o titular correto', () => {
    const fields = suggestFields('RG: 12345678\nÓRGÃO EMISSOR: SSP-RJ', 'seller-identity');
    expect(fields['seller.identity']?.value).toBe('12345678');
    expect(fields['seller.issuer']?.value).toBe('SSP-RJ');
    expect(fields['person.identity']).toBeUndefined();
  });

  it('sugere endereço e CEP somente com rótulos explícitos em comprovante', () => {
    const fields = suggestFields('ENDEREÇO: RUA SÃO JOSÉ 100\nCEP: 22000-000',
      'residence-proof');
    expect(fields['person.address']?.value).toBe('RUA SÃO JOSÉ 100');
    expect(fields['person.postalCode']?.value).toBe('22000-000');
    expect(fields['person.fullName']).toBeUndefined();
    const ambiguous = suggestFields('CEP: 22000-000\nCEP: 24000-000', 'residence-proof');
    expect(ambiguous['person.postalCode']).toBeUndefined();
  });

  it('retorna somente CPF e casco encontrados, sempre para revisão', () => {
    const found = suggestFields('CPF 123.456.789-09\nHIN BR-ABC-123456', 'buyer-identity');
    const tie = suggestFields('HIN BR-ABC-123456', 'tie');
    expect(found['person.cpf']?.status).toBe('REVIEW_REQUIRED');
    expect(found['vessel.hullId']).toBeUndefined();
    expect(tie['vessel.hullId']?.value).toBe('BR-ABC-123456');
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

  it('recusa PDF cujo tamanho perigoso ocorre somente na segunda página', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-pdf-page2-'));
    try {
      const pdf = await PDFDocument.create();
      pdf.addPage([595, 842]);
      pdf.addPage([3500, 3500]);
      const file = join(root, 'mixed-page-sizes.pdf');
      await writeFile(file, await pdf.save());
      await expect(validatePdfPages(file)).rejects.toThrow('página 2');
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
