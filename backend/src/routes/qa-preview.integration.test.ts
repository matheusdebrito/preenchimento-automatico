import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import type { AppEnv } from '../config/env.js';
import { connectDatabase } from '../modules/auth/db.js';
import { creditBalance } from '../modules/auth/credits.js';
import { qaPreviewCatalog, QA_PREVIEW_SERVICE_ID } from '../modules/catalog/qa-preview.js';
import { classifyDocument } from '../modules/jobs/document-validator.js';

const execFile = promisify(execFileCallback);
const databaseUrl = process.env.DATABASE_TEST_URL;
const describePg = databaseUrl ? describe : describe.skip;
const env: AppEnv = {
  NODE_ENV: 'test', API_HOST: '127.0.0.1', API_PORT: 3000,
  CORS_ORIGINS: ['http://localhost:5173'], LOG_LEVEL: 'silent',
};

async function fakeTextPdf(lines: readonly string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  lines.forEach((line, i) => page.drawText(line, {
    x: 60, y: 720 - 70 * i, size: 24, font,
  }));
  return pdf.save();
}

describePg('QA local: foto fictícia -> OCR -> conferência -> PDFs AMOSTRA', () => {
  it('gera amostras com dados sintéticos sem liberar o serviço real nem consumir crédito', async () => {
    const pool = await connectDatabase(databaseUrl!);
    const root = await mkdtemp(join(tmpdir(), 'pa-qa-photo-'));
    const email = 'qa-preview-' + randomUUID() + '@example.invalid';
    const password = 'senha-sintetica-teste-12345';
    let app: FastifyInstance | undefined;
    try {
      app = await buildApp({
        env, pool, catalogOverride: qaPreviewCatalog(), qaPreview: true,
      });
      const publicResponse = await app.inject({ method: 'GET', url: '/api/services' });
      expect(publicResponse.statusCode).toBe(200);
      const listed = publicResponse.json<{services:{id:string}[]}>().services;
      expect(listed.map((service) => service.id)).toEqual([QA_PREVIEW_SERVICE_ID]);

      const registered = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: { email, password },
      });
      expect(registered.statusCode).toBe(201);
      const owner = registered.json<{user:{id:string}}>().user.id;
      const cookie = String(registered.headers['set-cookie']).split(';')[0]!;

      const created = await app.inject({
        method: 'POST', url: '/api/jobs', headers: { cookie },
        payload: { serviceId: QA_PREVIEW_SERVICE_ID, answers: {} },
      });
      expect(created.statusCode, created.body).toBe(201);
      const jobId = created.json<{id:string}>().id;

      // Generate a legible photo fixture by rasterizing a wholly fictional PDF.
      const buyer = join(root, 'buyer.pdf');
      await writeFile(buyer, await fakeTextPdf([
        'DOCUMENTO FICTICIO PARA TESTES',
        'NOME: MARIA DE SOUZA',
        'CPF: 123.456.789-09',
      ]));
      const prefix = join(root, 'buyer-photo');
      await execFile('pdftoppm', [
        '-f', '1', '-l', '1', '-singlefile', '-r', '180', '-png', buyer, prefix,
      ], { timeout: 30_000, maxBuffer: 64_000 });
      const png = await readFile(prefix + '.png');
      expect(classifyDocument(png, 'image/png')).toBe('png');
      const buyerUpload = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/documents/buyer-identity',
        headers: { cookie, 'content-type': 'image/png' }, payload: png,
      });
      expect(buyerUpload.statusCode, buyerUpload.body).toBe(201);

      const tie = await fakeTextPdf([
        'TITULO FICTICIO PARA TESTES',
        'NOME DA EMBARCACAO: MAR TESTE',
        'INSCRICAO: RJ123456',
        'HIN: BR-TESTE-123456',
      ]);
      const tieUpload = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/documents/tie',
        headers: { cookie, 'content-type': 'application/pdf' },
        payload: Buffer.from(tie),
      });
      expect(tieUpload.statusCode, tieUpload.body).toBe(201);

      const extracted = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/extract',
        headers: { cookie }, payload: {},
      });
      expect(extracted.statusCode, extracted.body).toBe(200);
      const fields = extracted.json<{fields:Record<string,string>;reviewRequired:boolean}>();
      expect(fields.reviewRequired).toBe(true);
      expect(fields.fields['person.fullName']).toBe('MARIA DE SOUZA');
      expect(fields.fields['vessel.name']).toBe('MAR TESTE');

      const invalidCpf = await app.inject({
        method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
        headers: { cookie },
        payload: { confirmed: true, values: {
          'person.fullName': 'MARIA DE SOUZA',
          'vessel.name': 'MAR TESTE', 'person.cpf': '111.111.111-11',
        } },
      });
      expect(invalidCpf.statusCode).toBe(422);
      expect(invalidCpf.json<{error:string;fieldId:string}>()).toEqual({
        error: 'invalid_field_value', fieldId: 'person.cpf',
      });
      const invalidDate = await app.inject({
        method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
        headers: { cookie },
        payload: { confirmed: true, values: {
          'person.fullName': 'MARIA DE SOUZA',
          'vessel.name': 'MAR TESTE', 'sale.date': '31/02/2026',
        } },
      });
      expect(invalidDate.statusCode).toBe(422);
      expect(invalidDate.json<{error:string;fieldId:string}>()).toEqual({
        error: 'invalid_field_value', fieldId: 'sale.date',
      });

      const reviewed = await app.inject({
        method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
        headers: { cookie },
        payload: { confirmed: true, values: {
          ...fields.fields, 'person.fullName': 'MARIA DE SOUZA',
          'vessel.name': 'MAR TESTE', 'person.cpf': '123.456.789-09',
        } },
      });
      expect(reviewed.statusCode, reviewed.body).toBe(200);

      const generated = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/generate',
        headers: { cookie }, payload: {},
      });
      expect(generated.statusCode, generated.body).toBe(200);
      const versions = generated.json<{downloads:string[]}>().downloads;
      expect(versions).toEqual(['requerimento-ma-v1', 'bdmoto-v1']);
      expect(await creditBalance(pool, owner)).toBe(0);

      // Check BOTH PDF files, every page watermark, and actual filled semantic
      // values. Merely receiving HTTP 200 is not evidence of successful filling.
      for (const versionId of versions) {
        const pdfResponse = await app.inject({
          method: 'GET', url: '/api/jobs/' + jobId + '/download/' + versionId,
          headers: { cookie },
        });
        expect(pdfResponse.statusCode, pdfResponse.body.slice(0, 100)).toBe(200);
        expect(pdfResponse.headers['content-type']).toContain('application/pdf');
        const output = join(root, versionId + '.pdf');
        await writeFile(output, pdfResponse.rawPayload);
        const document = await PDFDocument.load(pdfResponse.rawPayload);
        const { stdout } = await execFile('pdftotext', [output, '-'], {
          timeout: 15_000, maxBuffer: 128_000,
        });
        // One watermark footer is embedded per page and no credit is charged.
        const markers = stdout.match(/AMOSTRA - DADOS FICTICIOS - NAO UTILIZAR/g) ?? [];
        expect(markers.length).toBeGreaterThanOrEqual(document.getPageCount());
        expect(stdout).toContain('MARIA DE SOUZA');
        expect(stdout).toContain('MAR TESTE');
      }
      expect(await creditBalance(pool, owner)).toBe(0);
    } finally {
      await app?.close();
      await pool.query('DELETE FROM app_users WHERE email=$1', [email]);
      await pool.end();
      await rm(root, { recursive: true, force: true });
    }
  }, 90000);
});
