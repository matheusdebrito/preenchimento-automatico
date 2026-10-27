import { promisify } from 'node:util';
import { execFile as execCallback } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractText, suggestFields } from './ocr.js';
import type { StoredDocument } from './job-store.js';

const execFile = promisify(execCallback);
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
});
