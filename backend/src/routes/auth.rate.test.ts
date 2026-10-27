import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { AppEnv } from '../config/env.js';

const env: AppEnv = {
  NODE_ENV: 'test', API_HOST: '127.0.0.1', API_PORT: 3000,
  LOG_LEVEL: 'silent', CORS_ORIGINS: ['http://localhost:5173'],
};

describe('auth rate limiting', () => {
  it('limita cadastro por origem e não expõe informações da conta', async () => {
    const app = await buildApp({ env });
    try {
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await app.inject({ method: 'POST', url: '/api/auth/register', payload: {} });
        expect(result.statusCode).toBe(503);
      }
      const blocked = await app.inject({ method: 'POST', url: '/api/auth/register', payload: {} });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.headers['retry-after']).toBeTruthy();
      expect(blocked.body).not.toContain('senha');
    } finally {
      await app.close();
    }
  });

  it('bloqueia tentativas repetidas de login por IP de origem', async () => {
    const app = await buildApp({ env });
    try {
      for (let attempt = 0; attempt < 30; attempt++) {
        const result = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {} });
        expect(result.statusCode).toBe(503);
      }
      const blocked = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {} });
      expect(blocked.statusCode).toBe(429);
    } finally {
      await app.close();
    }
  });
});
