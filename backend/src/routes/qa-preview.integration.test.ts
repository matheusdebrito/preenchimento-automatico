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
import { publicService } from '../modules/catalog/public-catalog.js';
import { catalog } from '../modules/catalog/catalog.js';

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

      const answers = {
        vesselType: 'moto_aquatica', tieSituation: 'regular',
        representative: 'nao',
      };
      const created = await app.inject({
        method: 'POST', url: '/api/jobs', headers: { cookie },
        payload: { serviceId: QA_PREVIEW_SERVICE_ID, answers },
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
        method: 'POST', url: '/api/jobs/' + jobId + '/documents/applicant-identity',
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

      const residence = await fakeTextPdf([
        'COMPROVANTE FICTICIO', 'ENDERECO: RUA DAS FLORES', 'CIDADE: NITEROI',
        'BAIRRO: ICARAI', 'CEP: 24230-100',
      ]);
      for (const [requirement, bytes, mime] of [
        ['seller-identity', Buffer.from(await fakeTextPdf([
          'DOCUMENTO FICTICIO', 'NOME: JOAO VENDEDOR', 'RG: 12345678',
        ])), 'application/pdf'],
        ['residence-proof', Buffer.from(residence), 'application/pdf'],
      ] as const) {
        const upload = await app.inject({
          method: 'POST', url: '/api/jobs/' + jobId + '/documents/' + requirement,
          headers: { cookie, 'content-type': mime }, payload: bytes,
        });
        expect(upload.statusCode, upload.body).toBe(201);
      }

      // An input irrelevant to filling PDF fields must be rejected by the
      // server even if a client bypasses the UI.
      for (const photoId of ['photo-stern', 'photo-side']) {
        const rejected = await app.inject({
          method: 'POST', url: '/api/jobs/' + jobId + '/documents/' + photoId,
          headers: { cookie, 'content-type': 'image/png' }, payload: png,
        });
        expect(rejected.statusCode).toBe(400);
        expect(rejected.json()).toEqual({ error: 'invalid_requirement' });
      }

      const extracted = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/extract',
        headers: { cookie }, payload: {},
      });
      expect(extracted.statusCode, extracted.body).toBe(200);
      const fields = extracted.json<{fields:Record<string,string>;reviewRequired:boolean}>();
      expect(fields.reviewRequired).toBe(true);
      expect(fields.fields['person.fullName']).toBe('MARIA DE SOUZA');
      expect(fields.fields['vessel.name']).toBe('MAR TESTE');
      expect(fields.fields['person.city']).toBe('NITEROI');
      expect(fields.fields['person.neighborhood']).toBe('ICARAI');
      expect(fields.fields['person.postalCode']).toBe('24230-100');
      // Seller RG is detected but is not a field in 2-A/2-B; never expose
      // unrelated OCR candidates to the selected package's review.
      expect(fields.fields['seller.identity']).toBeUndefined();
      const diagnostics = extracted.json<{diagnostics:{
        requirementId:string;outcome:string;suggestionCount:number;
      }[]}>().diagnostics;
      expect(diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ requirementId: 'applicant-identity', outcome: 'suggested' }),
        expect.objectContaining({ requirementId: 'tie', outcome: 'suggested' }),
      ]));
      const restored = await app.inject({
        method: 'GET', url: '/api/jobs/' + jobId, headers: { cookie },
      });
      expect(restored.json<{diagnostics:unknown[]}>().diagnostics).toHaveLength(4);

      const incomplete = await app.inject({
        method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
        headers: { cookie },
        payload: { confirmed: true, values: { 'person.fullName': 'MARIA DE SOUZA' } },
      });
      expect(incomplete.statusCode).toBe(422);
      expect(incomplete.json()).toEqual({
        error: 'missing_required_fields', fieldId: 'person.cpf',
      });
      expect(incomplete.body).not.toContain('MARIA DE SOUZA');

      const invalidCpf = await app.inject({
        method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
        headers: { cookie },
        payload: { confirmed: true, values: {
          ...fields.fields, 'person.cpf': '111.111.111-11',
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
          ...fields.fields, 'person.cpf': '123.456.789-09',
          'sale.date': '31/02/2026',
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
          'vessel.name': 'MAR TESTE', 'vessel.registration': 'RJ123456',
          'vessel.hullId': 'BR-TESTE-123456', 'person.cpf': '123.456.789-09',
          'person.address': 'RUA DAS FLORES', 'seller.fullName': 'JOAO VENDEDOR',
          'seller.cpf': '987.654.321-00',
        } },
      });
      expect(reviewed.statusCode, reviewed.body).toBe(200);

      const generated = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/generate',
        headers: { cookie }, payload: {},
      });
      expect(generated.statusCode, generated.body).toBe(200);
      const versions = generated.json<{downloads:string[]}>().downloads;
      expect(versions).toEqual([
        'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
        'declaracao-residencia-ma-v1',
      ]);
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
  }, 150000);
  it('informa separadamente quando um RG é lido mas o campo não pertence ao formulário', async () => {
    const pool = await connectDatabase(databaseUrl!);
    const email = 'qa-excluded-' + randomUUID() + '@example.invalid';
    const password = 'senha-sintetica-teste-12345';
    let app: FastifyInstance | undefined;
    try {
      app = await buildApp({ env, pool, catalogOverride: qaPreviewCatalog(), qaPreview: true });
      const registered = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: { email, password },
      });
      expect(registered.statusCode, registered.body).toBe(201);
      const cookie = String(registered.headers['set-cookie']).split(';')[0]!;
      const created = await app.inject({
        method: 'POST', url: '/api/jobs', headers: { cookie },
        payload: { serviceId: QA_PREVIEW_SERVICE_ID, answers: {
          vesselType: 'moto_aquatica', tieSituation: 'regular',
          representative: 'nao',
        } },
      });
      expect(created.statusCode, created.body).toBe(201);
      const jobId = created.json<{id:string}>().id;
      const seller = Buffer.from(await fakeTextPdf([
        'DOCUMENTO FICTICIO DE IDENTIDADE - AMOSTRA SINTETICA', 'RG: 12345678',
      ]));
      const upload = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/documents/seller-identity',
        headers: { cookie, 'content-type': 'application/pdf' }, payload: seller,
      });
      expect(upload.statusCode, upload.body).toBe(201);
      const extracted = await app.inject({
        method: 'POST', url: '/api/jobs/' + jobId + '/extract',
        headers: { cookie }, payload: {},
      });
      expect(extracted.statusCode, extracted.body).toBe(200);
      expect(extracted.json<{fields:Record<string,string>}>().fields).toEqual({});
      expect(extracted.json<{diagnostics:unknown[]}>().diagnostics).toEqual([{
        requirementId: 'seller-identity',
        outcome: 'no_applicable_fields',
        suggestionCount: 0,
        engine: 'paddleocr',
        nameStage: 'label_not_detected',
      }]);
      expect(extracted.body).not.toContain('12345678');
    } finally {
      await app?.close();
      await pool.query('DELETE FROM app_users WHERE email=$1', [email]);
      await pool.end();
    }
  }, 45000);

  it('permite preencher todos os campos sem anexos ou com apenas um RG fictício', async () => {
    const pool = await connectDatabase(databaseUrl!);
    const email = 'manual-qa-' + randomUUID() + '@example.invalid';
    const password = 'senha-sintetica-teste-12345';
    let app: FastifyInstance | undefined;
    try {
      const qa = qaPreviewCatalog();
      app = await buildApp({ env, pool, catalogOverride: qa, qaPreview: true });
      const registered = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: { email, password },
      });
      expect(registered.statusCode, registered.body).toBe(201);
      const owner = registered.json<{user:{id:string}}>().user.id;
      const cookie = String(registered.headers['set-cookie']).split(';')[0]!;
      const answers = {
        vesselType: 'moto_aquatica', tieSituation: 'regular',
        representative: 'nao',
      };
      const service = publicService(qa, QA_PREVIEW_SERVICE_ID, answers);
      expect(service).not.toBeNull();
      expect(service?.documentRequirements.every((item) => !item.required)).toBe(true);
      // Keep PDF requirements while making SOURCE DOCUMENTS entirely optional.
      const values = Object.fromEntries((service?.reviewFields ?? [])
        .filter((field) => field.required)
        .map((field) => {
          const definition = catalog.fields.find((item) => item.id === field.id);
          const value = field.id.endsWith('.cpf') ? '123.456.789-09'
            : definition?.validationRuleId === 'simNao' ? 'nao'
            : field.valueKind === 'date' ? '15/10/2026'
            : field.valueKind === 'boolean' ? 'true'
            : field.valueKind === 'number' ? '3'
            : field.id === 'person.fullName' ? 'MARIA DE SOUZA'
            : field.id === 'seller.fullName' ? 'JOAO DE SOUZA'
            : field.id === 'vessel.name' ? 'MAR TESTE' : 'X';
          return [field.id, value];
        }));

      for (const withSingleRg of [false, true]) {
        const created = await app.inject({
          method: 'POST', url: '/api/jobs', headers: { cookie },
          payload: { serviceId: QA_PREVIEW_SERVICE_ID, answers },
        });
        expect(created.statusCode, created.body).toBe(201);
        const jobId = created.json<{id:string}>().id;
        if (withSingleRg) {
          const bytes = await fakeTextPdf([
            'DOCUMENTO FICTICIO',
            'NOME: MARIA DE SOUZA',
            'CPF: 123.456.789-09',
          ]);
          const uploaded = await app.inject({
            method: 'POST', url: '/api/jobs/' + jobId + '/documents/applicant-identity',
            headers: { cookie, 'content-type': 'application/pdf' },
            payload: Buffer.from(bytes),
          });
          expect(uploaded.statusCode, uploaded.body).toBe(201);
        }
        const extracted = await app.inject({
          method: 'POST', url: '/api/jobs/' + jobId + '/extract',
          headers: { cookie }, payload: {},
        });
        expect(extracted.statusCode, extracted.body).toBe(200);
        const extraction = extracted.json<{
          status:string;fields:Record<string,string>;diagnostics:unknown[];
        }>();
        expect(extraction.status).toBe('REVIEW');
        if (withSingleRg) {
          expect(extraction.fields['person.fullName']).toBe('MARIA DE SOUZA');
          expect(extraction.diagnostics).toHaveLength(1);
          expect(extraction.fields['seller.fullName']).toBeUndefined();
        } else {
          expect(extraction.fields).toEqual({});
          expect(extraction.diagnostics).toEqual([]);
        }
        const reviewed = await app.inject({
          method: 'PATCH', url: '/api/jobs/' + jobId + '/review',
          headers: { cookie },
          payload: { confirmed: true, values },
        });
        expect(reviewed.statusCode, reviewed.body).toBe(200);
        const generated = await app.inject({
          method: 'POST', url: '/api/jobs/' + jobId + '/generate',
          headers: { cookie }, payload: {},
        });
        expect(generated.statusCode, generated.body).toBe(200);
        expect(generated.json<{downloads:string[]}>().downloads)
          .toEqual([
            'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
            'declaracao-residencia-ma-v1',
          ]);
        expect(await creditBalance(pool, owner)).toBe(0);
      }
    } finally {
      await app?.close();
      await pool.query('DELETE FROM app_users WHERE email=$1', [email]);
      await pool.end();
    }
  }, 90000);

});
