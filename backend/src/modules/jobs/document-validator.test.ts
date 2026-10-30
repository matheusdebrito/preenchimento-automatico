import { describe, expect, it } from 'vitest';
import { crc32 } from 'node:zlib';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { classifyDocument, validatePdfPages } from './document-validator.js';

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
    const changeIhdr = (offset: number, value: number): Buffer => {
      const modified = Buffer.from(valid);
      modified[offset] = value;
      // A malformed header with a bad CRC would test only checksum rejection.
      modified.writeUInt32BE(crc32(modified.subarray(12, 29)), 29);
      return modified;
    };
    const incompatible = changeIhdr(24, 1); // 1-bit RGB is invalid per PNG Third Edition 11.2.1.
    expect(() => classifyDocument(incompatible, 'image/png')).toThrow('IHDR PNG inválido');

    const indexedWithoutPalette = changeIhdr(25, 3); // Indexed color requires PLTE before IDAT.
    expect(() => classifyDocument(indexedWithoutPalette, 'image/png')).toThrow('PLTE ausente');

    const critical = Buffer.from(valid);
    critical.write('ABCD', 37); // Replace IDAT with an unsupported critical chunk.
    const payloadLength = critical.readUInt32BE(33);
    critical.writeUInt32BE(crc32(critical.subarray(37, 41 + payloadLength)), 41 + payloadLength);
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
