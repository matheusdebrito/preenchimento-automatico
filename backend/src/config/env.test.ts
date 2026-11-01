import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('aplica padrões seguros de desenvolvimento', () => {
    const env = loadEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.API_HOST).toBe('0.0.0.0');
    expect(env.API_PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'http://localhost:8080',
    ]);
  });

  it('configura limites de admissão e processamento com valores seguros', () => {
    const defaults = loadEnv({});
    expect(defaults.JOB_MAX_OPEN).toBe(100);
    expect(defaults.JOB_MAX_HEAVY).toBe(2);
    expect(defaults.JOB_MAX_UPLOAD_MB).toBe(1024);
    const selected = loadEnv({
      JOB_MAX_OPEN: '40', JOB_MAX_HEAVY: '2', JOB_MAX_UPLOAD_MB: '512',
    });
    expect(selected.JOB_MAX_OPEN).toBe(40);
    expect(selected.JOB_MAX_HEAVY).toBe(2);
    expect(selected.JOB_MAX_UPLOAD_MB).toBe(512);
    expect(() => loadEnv({JOB_MAX_OPEN: '0'})).toThrow('JOB_MAX_OPEN');
    expect(() => loadEnv({JOB_MAX_HEAVY: '100'})).toThrow('JOB_MAX_HEAVY');
    expect(() => loadEnv({JOB_MAX_UPLOAD_MB: '3'})).toThrow('JOB_MAX_UPLOAD_MB');
  });

  it('normaliza e deduplica origens CORS', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      API_PORT: '8080',
      CORS_ORIGINS:
        'https://app.example.com/, https://app.example.com,https://admin.example.com',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.API_PORT).toBe(8080);
    expect(env.CORS_ORIGINS).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('mantém a URL do banco quando informada', () => {
    const databaseUrl = 'postgresql://usuario:senha@localhost:5432/preenchimento';
    const env = loadEnv({ DATABASE_URL: databaseUrl });

    expect(env.DATABASE_URL).toBe(databaseUrl);
  });

  it('ignora segredo opcional vazio sem permitir valores curtos', () => {
    expect(loadEnv({ DEV_GRANT_SECRET: '' }).DEV_GRANT_SECRET).toBeUndefined();
    expect(() => loadEnv({ DEV_GRANT_SECRET: 'curto' })).toThrow('DEV_GRANT_SECRET');
    expect(loadEnv({ NODE_ENV: 'production', DEV_GRANT_SECRET: 'a'.repeat(32) }).DEV_GRANT_SECRET).toBeUndefined();
  });

  it('rejeita curinga de CORS', () => {
    expect(() => loadEnv({ CORS_ORIGINS: '*' })).toThrow(/curinga/);
  });

  it('rejeita origem CORS com caminho', () => {
    expect(() => loadEnv({ CORS_ORIGINS: 'https://app.example.com/entrar' })).toThrow(
      /Origem CORS inválida/,
    );
  });

  it('rejeita lista de CORS vazia', () => {
    expect(() => loadEnv({ CORS_ORIGINS: ' , ' })).toThrow(/ao menos uma origem/);
  });

  it('rejeita porta inválida', () => {
    expect(() => loadEnv({ API_PORT: 'abc' })).toThrow(/API_PORT/);
    expect(() => loadEnv({ API_PORT: '70000' })).toThrow(/API_PORT/);
  });

  it('rejeita nível de log desconhecido', () => {
    expect(() => loadEnv({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });
});
