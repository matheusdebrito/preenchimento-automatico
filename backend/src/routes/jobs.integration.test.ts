import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { FastifyInstance } from 'fastify';
import type { CatalogDefinition } from '../modules/catalog/contracts.js';
import { catalog } from '../modules/catalog/catalog.js';
import { applyCreditMovement, creditBalance } from '../modules/auth/credits.js';
import { connectDatabase } from '../modules/auth/db.js';
import type { Database } from '../modules/auth/db.js';
import { buildApp } from '../app.js';
import type { AppEnv } from '../config/env.js';

const url = process.env.DATABASE_TEST_URL;
const describePg = url ? describe : describe.skip;
const email = 'test-flow-' + randomUUID() + '@example.invalid';
const password = 'senha-super-forte-12345';

function fixture(): CatalogDefinition {
  const versions = catalog.versions.filter((v) =>
    v.id === 'requerimento-ma-v1' || v.id === 'bdmoto-v1');
  const mappings = catalog.mappings
    .filter((m) => versions.some((v) => v.id === m.formVersionId))
    .map((map) => ({
      ...map,
      placements: map.placements.filter((placement) =>
        ['person.fullName', 'vessel.name', 'person.cpf', 'process.transferOwnership'].includes(placement.fieldId))
        .map((placement) => ({
          ...placement,
          required: placement.fieldId === 'person.fullName',
        })),
      status: 'APPROVED' as const,
      reviewedAt: '2026-10-26', reviewer: 'EXCLUSIVAMENTE TESTE CI (NAO HOMOLOGA)',
      reportPath: 'backend/src/routes/jobs.integration.test.ts',
    }));
  return {
    fields: catalog.fields,
    forms: catalog.forms,
    versions,
    mappings,
    services: [{
      id: 'ci-only-service', title: 'Teste end-to-end', description: 'Não é um serviço real',
      status: 'AVAILABLE', creditCost: 1, questions: [],
      documentRequirements: [{ id: 'source', label: 'Documento fictício', required: true }],
    }],
    serviceForms: versions.map((version, index) => ({
      serviceId: 'ci-only-service', formVersionId: version.id, order: index+1,
      fixedValues: { 'process.transferOwnership': 'X' },
    })),
  };
}
const env: AppEnv = {
  NODE_ENV: 'test', API_HOST: '127.0.0.1', API_PORT: 3000,
  CORS_ORIGINS: ['http://localhost:5173'], LOG_LEVEL: 'silent',
};

describePg('PDF pipeline: test-only service with synthetic documents', () => {
  let app: FastifyInstance;
  let pool: Database;
  let userId: string;
  let cookie: string;
  beforeAll(async () => {
    pool = await connectDatabase(url!);
    app = await buildApp({ env, pool, catalogOverride: fixture() });
    const registered = await app.inject({method:'POST',url:'/api/auth/register',
      payload:{email,password}});
    expect(registered.statusCode).toBe(201);
    userId = registered.json<{user:{id:string}}>().user.id;
    cookie = String(registered.headers['set-cookie']).split(';')[0]!;
    await applyCreditMovement(pool,userId,'test_grant',3,'e2e_grant_01');
  });
  afterAll(async () => {
    await app?.close();
    await pool?.query('DELETE FROM app_users WHERE email=$1',[email]);
    await pool?.end();
  });

  it('uploads -> text extraction -> review -> two official template PDFs -> one debit', async () => {
    const created = await app.inject({method:'POST',url:'/api/jobs',
      headers:{cookie}, payload:{serviceId:'ci-only-service',answers:{}}});
    expect(created.statusCode,created.body).toBe(201);
    const jobId = created.json<{id:string}>().id;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595,842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText('DOCUMENTO FICTICIO CPF 000.000.000-00', {x:50,y:750,size:14,font});
    page.drawText('HIN BR-TESTE-123456 - apenas para testes tecnicos', {x:50,y:720,size:14,font});
    const data=await pdf.save();

    const upload = await app.inject({method:'POST',
      url:'/api/jobs/'+jobId+'/documents/source',
      headers:{cookie,'content-type':'application/pdf'},payload:Buffer.from(data)});
    expect(upload.statusCode,upload.body).toBe(201);
    const overview = await app.inject({
      method:'GET',url:'/api/jobs/'+jobId,headers:{cookie},
    });
    expect(overview.statusCode).toBe(200);
    expect(overview.json<{uploadedRequirementIds:string[]}>().uploadedRequirementIds)
      .toEqual(['source']);
    const duplicate = await app.inject({method:'POST',
      url:'/api/jobs/'+jobId+'/documents/source',
      headers:{cookie,'content-type':'application/pdf'},payload:Buffer.from(data)});
    expect(duplicate.statusCode).toBe(400);

    const scanned=await app.inject({method:'POST',url:'/api/jobs/'+jobId+'/extract',
      headers:{cookie},payload:{}});
    expect(scanned.statusCode,scanned.body).toBe(200);
    expect(scanned.json<{reviewRequired:boolean}>().reviewRequired).toBe(true);

    const beforeReview=await app.inject({method:'POST',url:'/api/jobs/'+jobId+'/generate',
      headers:{cookie},payload:{}});
    expect(beforeReview.statusCode).toBe(409);
    const incomplete = await app.inject({method:'PATCH',url:'/api/jobs/'+jobId+'/review',
      headers:{cookie},payload:{confirmed:true,values:{'person.cpf':'000.000.000-00'}}});
    expect(incomplete.statusCode).toBe(422);

    const unexpectedField = await app.inject({method:'PATCH',url:'/api/jobs/'+jobId+'/review',
      headers:{cookie},payload:{confirmed:true,values:{
        'person.fullName':'MARIA TESTE', 'seller.fullName':'CAMPO OCULTO',
      }}});
    expect(unexpectedField.statusCode).toBe(400);

    const review = await app.inject({method:'PATCH',url:'/api/jobs/'+jobId+'/review',
      headers:{cookie},payload:{confirmed:true, values:{
        'person.fullName':'MARIA TESTE','vessel.name':'MA TESTE',
        'person.cpf':'000.000.000-00',
      }}});
    expect(review.statusCode,review.body).toBe(200);
    const generate=await app.inject({method:'POST',url:'/api/jobs/'+jobId+'/generate',
      headers:{cookie},payload:{}});
    expect(generate.statusCode,generate.body).toBe(200);
    expect(generate.json<{downloads:string[]}>().downloads).toHaveLength(2);
    expect(await creditBalance(pool,userId)).toBe(2);
    const again=await app.inject({method:'POST',url:'/api/jobs/'+jobId+'/generate',
      headers:{cookie},payload:{}});
    expect(again.statusCode).toBe(200);
    expect(again.json<{reused:boolean}>().reused).toBe(true);
    expect(await creditBalance(pool,userId)).toBe(2);

    const download=await app.inject({method:'GET',
      url:'/api/jobs/'+jobId+'/download/requerimento-ma-v1',headers:{cookie}});
    expect(download.statusCode,download.body.slice(0,100)).toBe(200);
    expect(download.body.startsWith('%PDF-')).toBe(true);
    const noAuth=await app.inject({method:'GET',
      url:'/api/jobs/'+jobId+'/download/requerimento-ma-v1'});
    expect(noAuth.statusCode).toBe(401);
    // A download stream may still be closing its file descriptor after the
    // injected HTTP response is complete; deletion must be blocked until then.
    let deletedStatus = 409;
    for (let attempt = 0; attempt < 12; attempt++) {
      const result = await app.inject({method:'DELETE',url:'/api/jobs/'+jobId,headers:{cookie}});
      deletedStatus = result.statusCode;
      if (deletedStatus === 200) break;
      expect(deletedStatus).toBe(409);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(deletedStatus).toBe(200);
    const notFound=await app.inject({method:'GET',url:'/api/jobs/'+jobId,headers:{cookie}});
    expect(notFound.statusCode).toBe(404);
  });
});
