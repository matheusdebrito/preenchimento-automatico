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
    expect(body.services).toHaveLength(21);
    expect(body.services.map((service) => service.id)).toEqual(expect.arrayContaining([
      'inscricao-embarcacao',
      'alteracao-dados-embarcacao',
      'inscricao-exame-amador',
      'renovacao-cha-agregacao-mta',
    ]));
    expect(result.body).not.toContain('backend/templates');
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
