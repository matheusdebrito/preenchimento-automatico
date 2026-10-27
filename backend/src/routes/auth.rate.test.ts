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

describe('proteção de origem com o proxy na mesma origem', () => {
  const dev: AppEnv = {
    ...env, NODE_ENV: 'development',
    // 127.0.0.1:8080 intentionally absent from this CORS dev allow-list
    CORS_ORIGINS: ['http://localhost:5173'],
  };

  it('permite POST do próprio domínio do frontend sem autorizar domínios de terceiros', async () => {
    const app = await buildApp({ env: dev });
    try {
      const local = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: {},
        headers: { host: '127.0.0.1:8080', origin: 'http://127.0.0.1:8080' },
      });
      expect(local.statusCode).toBe(503); // DB not connected; origin accepted.

      const crossSite = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: {},
        headers: { host: '127.0.0.1:8080', origin: 'https://malicious.example' },
      });
      expect(crossSite.statusCode).toBe(403);

      const forgedSimilar = await app.inject({
        method: 'POST', url: '/api/auth/register', payload: {},
        headers: { host: '127.0.0.1:8080', origin: 'http://127.0.0.1:8080.attacker.example' },
      });
      expect(forgedSimilar.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it('permite dev frontend explicitamente autorizado e recusa Origin nulo', async () => {
    const app = await buildApp({ env: dev });
    try {
      const devFrontend = await app.inject({
        method: 'POST', url: '/api/auth/login', payload: {},
        headers: { host: 'localhost:3000', origin: 'http://localhost:5173' },
      });
      expect(devFrontend.statusCode).toBe(503);

      const nullOrigin = await app.inject({
        method: 'POST', url: '/api/auth/login', payload: {},
        headers: { host: 'localhost:3000', origin: 'null' },
      });
      expect(nullOrigin.statusCode).toBe(403);

      const browserFetch = await app.inject({
        method: 'POST', url: '/api/auth/login', payload: {},
        headers: { host: 'localhost:3000', 'sec-fetch-site': 'same-origin' },
      });
      expect(browserFetch.statusCode).toBe(503);
    } finally {
      await app.close();
    }
  });
});
