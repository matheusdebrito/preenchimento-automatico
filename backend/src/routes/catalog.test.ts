import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import type { AppEnv } from '../config/env.js';

const env: AppEnv = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 3000,
  CORS_ORIGINS: ['http://localhost:5173'],
  LOG_LEVEL: 'silent',
};

describe('API catalog', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ env }); });
  afterAll(async () => { await app.close(); });

  it('publica somente os serviços homologados sem expor caminhos internos', async () => {
    const result = await app.inject({ method: 'GET', url: '/api/services' });
    expect(result.statusCode).toBe(200);
    const body = result.json<{ services: Array<{ id: string }> }>();
    expect(body.services).toHaveLength(18);
    expect(body.services.map((service) => service.id)).toEqual(expect.arrayContaining([
      'inscricao-embarcacao',
      'alteracao-dados-embarcacao',
      'inscricao-exame-amador',
      'renovacao-cha-agregacao-mta',
    ]));
    expect(result.body).not.toContain('backend/templates');
  });

  it('só inclui a declaração de residência quando solicitada, inclusive em amadores', async () => {
    const cases = [
      {
        id: 'inscricao-exame-amador',
        answers: { amateurCategory: 'arrais' },
        version: 'declaracao-residencia-er-2026-v1',
      },
      {
        id: 'segunda-via-cir-aquaviario',
        answers: { cirSecondCopyReason: 'extravio' },
        version: 'declaracao-residencia-aquaviario-2026-v1',
      },
      {
        id: 'comunicacao-venda-embarcacao',
        answers: { vesselType: 'moto_aquatica', hasCoOwner: 'nao' },
        version: 'declaracao-residencia-ma-v1',
      },
    ];
    for (const entry of cases) {
      const request = async (choice: 'sim' | 'nao') => app.inject({
        method: 'POST', url: '/api/services/' + entry.id + '/quote',
        payload: { answers: { ...entry.answers, includeResidenceDeclaration: choice } },
      });
      const yes = await request('sim');
      const no = await request('nao');
      expect(yes.statusCode, entry.id).toBe(200);
      expect(no.statusCode, entry.id).toBe(200);
      const yesIds = yes.json<{service:{formVersionIds:string[]}}>().service.formVersionIds;
      const noIds = no.json<{service:{formVersionIds:string[]}}>().service.formVersionIds;
      expect(yesIds).toContain(entry.version);
      expect(noIds).not.toContain(entry.version);
      expect(yesIds.filter((id) => id !== entry.version)).toEqual(noIds);
    }
  });

  it('explica a ausência de anexos quando a declaração seria o único formulário', async () => {
    const result = await app.inject({
      method: 'POST', url: '/api/services/inscricao-inicial-cir-aquaviario/quote',
      payload: { answers: {
        includeResidenceDeclaration: 'nao',
        initialAquaviarioGroup: 'demais_grupos',
      } },
    });
    expect(result.statusCode).toBe(422);
    expect(result.json()).toEqual({ error: 'no_forms_selected' });
  });

  it('não publica nem permite cotação dos três serviços Aquaviários fora do escopo', async () => {
    const removedIds = [
      'transferencia-jurisdicao-aquaviario',
      'transferencia-categoria-grupo-aquaviario',
      'homologacao-lrm-aquaviario',
    ];
    const result = await app.inject({ method: 'GET', url: '/api/services' });
    const body = result.json<{ services: Array<{ id: string }> }>();
    for (const id of removedIds) {
      expect(body.services.some((service) => service.id === id), id).toBe(false);
      const detail = await app.inject({ method: 'GET', url: '/api/services/' + id });
      expect(detail.statusCode, id).toBe(404);
      const quote = await app.inject({
        method: 'POST',
        url: '/api/services/' + id + '/quote',
        payload: { answers: {} },
      });
      expect(quote.statusCode, id).toBe(404);
    }
  });

  it('não disponibiliza cotações para serviço não homologado', async () => {
    const result = await app.inject({method:'POST',url:'/api/services/transferencia-moto-aquatica/quote',payload:{answers:{}}});
    expect(result.statusCode).toBe(404);
  });

  it('não publica o piloto como disponível', async () => {
    const result = await app.inject({ method: 'GET', url: '/api/services/transferencia-moto-aquatica' });
    expect(result.statusCode).toBe(404);
    expect(result.body).not.toContain('backend/templates');
  });
});
