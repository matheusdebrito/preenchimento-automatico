import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import type { AppEnv } from './config/env.js';

const testEnv: AppEnv = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 3000,
  CORS_ORIGINS: Object.freeze(['http://localhost:5173']),
  LOG_LEVEL: 'silent',
};

describe('API foundation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ env: testEnv });

    app.get('/boom', async () => {
      throw new Error('detalhe-interno-secreto');
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('expõe um healthcheck real e sem dados sensíveis', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['cache-control']).toBe('no-store');

    const body = response.json<{
      status: string;
      service: string;
      version: string;
      uptimeSeconds: number;
      timestamp: string;
    }>();

    expect(body.status).toBe('ok');
    expect(body.service).toBe('preenchimento-automatico-api');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(Object.keys(body).sort()).toEqual([
      'service',
      'status',
      'timestamp',
      'uptimeSeconds',
      'version',
    ]);
  });

  it('responde 404 em JSON para rotas desconhecidas', async () => {
    const response = await app.inject({ method: 'GET', url: '/rota-inexistente' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'not_found',
      message: 'Recurso não encontrado.',
    });
  });

  it('não vaza detalhes internos em erro 500', async () => {
    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('detalhe-interno-secreto');
    expect(response.json()).toEqual({
      error: 'internal_error',
      message: 'Não foi possível concluir a solicitação.',
    });
  });

  it('libera somente as origens CORS configuradas', async () => {
    const allowed = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    });
    const blocked = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://origem-nao-permitida.example' },
    });

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
