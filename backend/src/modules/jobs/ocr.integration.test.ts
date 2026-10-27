import { promisify } from 'node:util';
import { execFile as execCallback } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractText, suggestFields, validateRasterBudget, spatialIdentityName } from './ocr.js';
import { classifyDocument } from './document-validator.js';
import type { StoredDocument } from './job-store.js';

const execFile = promisify(execCallback);
describe('limites de rasterização de OCR', () => {
  const mib = 1024 * 1024;
  it('aceita arquivos rasterizados dentro dos limites por página e totais', () => {
    expect(() => validateRasterBudget([8 * mib, 12 * mib, 16 * mib])).not.toThrow();
  });

  it('rejeita página muito grande, conjunto excessivo e tamanhos inválidos', () => {
    expect(() => validateRasterBudget([16 * mib + 1])).toThrow('Página rasterizada');
    expect(() => validateRasterBudget([12 * mib, 12 * mib, 12 * mib, 12 * mib, 1]))
      .toThrow('Conjunto de páginas');
    expect(() => validateRasterBudget([0])).toThrow('Página rasterizada');
    expect(() => validateRasterBudget([Number.NaN])).toThrow('Página rasterizada');
    expect(() => validateRasterBudget([])).toThrow('Quantidade de páginas');
  });
});


const describeOcr = process.env.DATABASE_TEST_URL ? describe : describe.skip;

describeOcr('OCR real no Linux com ferramentas instaladas', () => {
  it('lê imagem PNG sintética e PDF digitalizado sem camada textual', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mvp-ocr-'));
    try {
      const textDoc = await PDFDocument.create();
      const page = textDoc.addPage([595, 842]);
      const font = await textDoc.embedFont(StandardFonts.Helvetica);
      page.drawText('CPF: 123.456.789-09', { x: 72, y: 690, size: 24, font });
      page.drawText('MOTO AQUATICA DOCUMENTO FICTICIO', { x: 72, y: 635, size: 20, font });
      const source = join(root, 'source.pdf');
      await writeFile(source, await textDoc.save());
      const prefix = join(root, 'image');
      await execFile('pdftoppm',
        ['-f', '1', '-l', '1', '-singlefile', '-r', '160', '-png', source, prefix],
        { timeout: 30_000, maxBuffer: 10_000 });
      const pngPath = prefix + '.png';
      const png = await readFile(pngPath);

      const imageFile: StoredDocument = {
        id: 'scan-image', requirementId: 'test', path: pngPath, kind: 'png', size: png.byteLength,
      };
      const imageText = await extractText(imageFile, root);
      expect(imageText.toUpperCase()).toContain('CPF');
      // OCR may misread digits; candidates are hints only, never trusted values.
      const imageCandidate = suggestFields(imageText, 'teste')['person.cpf'];
      if (imageCandidate) expect(imageCandidate.status).toBe('REVIEW_REQUIRED');

      const scannedDoc = await PDFDocument.create();
      const embedded = await scannedDoc.embedPng(png);
      const scanPage = scannedDoc.addPage([595, 842]);
      scanPage.drawImage(embedded, { x: 0, y: 0, width: 595, height: 842 });
      const scanPath = join(root, 'scanned.pdf');
      const scanData = await scannedDoc.save();
      await writeFile(scanPath, scanData);
      const scanFile: StoredDocument = {
        id: 'scan-pdf', requirementId: 'test', path: scanPath, kind: 'pdf', size: scanData.length,
      };
      const scanText = await extractText(scanFile, root);
      expect(scanText.toUpperCase()).toContain('CPF');
      const pdfCandidate = suggestFields(scanText, 'teste')['person.cpf'];
      if (pdfCandidate) expect(pdfCandidate.status).toBe('REVIEW_REQUIRED');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 90_000);
  it('lê RG fictício em foto com rótulos separados dos valores', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-ocr-rg-'));
    try {
      const card = await PDFDocument.create();
      const page = card.addPage([595, 842]);
      const font = await card.embedFont(StandardFonts.Helvetica);
      const labels = [
        'DOCUMENTO DE IDENTIDADE FICTICIO',
        'NOME',
        'MARIA DE SOUZA',
        'REGISTRO GERAL',
        '12.345.678-9',
        'CPF',
        '123.456.789-09',
      ];
      labels.forEach((line, index) => page.drawText(line, {
        x: 65, y: 730 - index * 75, size: 23, font,
      }));
      const source = join(root, 'synthetic-id.pdf');
      await writeFile(source, await card.save());
      const prefix = join(root, 'synthetic-id-photo');
      await execFile('pdftoppm',
        ['-f', '1', '-l', '1', '-singlefile', '-r', '180', '-jpeg', source, prefix],
        { timeout: 30_000, maxBuffer: 10_000 });
      const file = prefix + '.jpg';
      const bytes = await readFile(file);
      const jpg: StoredDocument = {
        id: 'rg-photo', requirementId: 'buyer-identity',
        path: file, kind: 'jpeg', size: bytes.byteLength,
      };
      const recognized = await extractText(jpg, root);
      const suggestions = suggestFields(recognized, 'buyer-identity');
      expect(suggestions['person.fullName']?.value).toBe('MARIA DE SOUZA');
      expect(suggestions['person.cpf']?.value).toBe('123.456.789-09');
      // Independently confirm the actual Tesseract TSV coordinate format,
      // not just a manually assembled unit-test fixture.
      const {stdout: tsv} = await execFile('tesseract',
        [file, 'stdout', '-l', 'por', '--psm', '11', 'tsv'],
        {timeout: 30_000, maxBuffer: 256 * 1024});
      expect(spatialIdentityName(tsv, 'buyer-identity')).toBe('MARIA DE SOUZA');
      expect(suggestions['seller.fullName']).toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60000);

  it('aceita foto JPEG sintética e extrai nome rotulado sem presumir identidade', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-ocr-jpeg-'));
    try {
      const original = await PDFDocument.create();
      const page = original.addPage([595, 842]);
      const font = await original.embedFont(StandardFonts.Helvetica);
      page.drawText('DOCUMENTO FICTICIO PARA TESTES', { x: 60, y: 700, font, size: 20 });
      page.drawText('NOME: MARIA DE SOUZA', { x: 60, y: 640, font, size: 24 });
      const source = join(root, 'source.pdf');
      await writeFile(source, await original.save());
      const prefix = join(root, 'camera-jpeg');
      await execFile('pdftoppm',
        ['-f', '1', '-l', '1', '-singlefile', '-r', '180', '-jpeg', source, prefix],
        { timeout: 30_000, maxBuffer: 10_000 });
      const file = prefix + '.jpg';
      const bytes = await readFile(file);
      expect(classifyDocument(bytes, 'image/jpeg')).toBe('jpeg');
      const jpeg: StoredDocument = {
        id: 'camera-jpeg', requirementId: 'buyer-identity',
        path: file, kind: 'jpeg', size: bytes.byteLength,
      };
      const extracted = await extractText(jpeg, root);
      const suggestions = suggestFields(extracted, 'buyer-identity');
      expect(suggestions['person.fullName']?.value).toBe('MARIA DE SOUZA');
      expect(suggestions['person.fullName']?.status).toBe('REVIEW_REQUIRED');
      expect(suggestions['seller.fullName']).toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 45000);

});
