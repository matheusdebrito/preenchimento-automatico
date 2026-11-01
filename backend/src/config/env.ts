import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().trim().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8080'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  JOB_MAX_OPEN: z.coerce.number().int().min(3).max(500).default(100),
  JOB_MAX_HEAVY: z.coerce.number().int().min(1).max(8).default(2),
  JOB_MAX_UPLOAD_MB: z.coerce.number().int().min(30).max(8192).default(1024),
  DATABASE_URL: z.string().trim().min(1).optional(),
  DEV_GRANT_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().min(24).optional()),
});

export type NodeEnvironment = z.infer<typeof envSchema>['NODE_ENV'];
export type LogLevel = z.infer<typeof envSchema>['LOG_LEVEL'];

export interface AppEnv {
  NODE_ENV: NodeEnvironment;
  API_HOST: string;
  API_PORT: number;
  CORS_ORIGINS: readonly string[];
  LOG_LEVEL: LogLevel;
  JOB_MAX_OPEN: number;
  JOB_MAX_HEAVY: number;
  JOB_MAX_UPLOAD_MB: number;
  DATABASE_URL?: string;
  DEV_GRANT_SECRET?: string;
}

function normalizeOrigin(value: string): string {
  if (value === '*') {
    throw new Error('CORS_ORIGINS não aceita o curinga "*". Informe as origens permitidas.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Origem CORS inválida: "${value}". Use o formato http(s)://host:porta.`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Origem CORS inválida: "${value}". Use apenas http ou https.`);
  }

  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error(`Origem CORS inválida: "${value}". Não inclua caminho, query ou fragmento.`);
  }

  return url.origin;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }

  const origins = Array.from(
    new Set(
      result.data.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
        .map(normalizeOrigin),
    ),
  );

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS deve conter ao menos uma origem permitida.');
  }

  const env: AppEnv = {
    NODE_ENV: result.data.NODE_ENV,
    API_HOST: result.data.API_HOST,
    API_PORT: result.data.API_PORT,
    CORS_ORIGINS: Object.freeze(origins),
    LOG_LEVEL: result.data.LOG_LEVEL,
    JOB_MAX_OPEN: result.data.JOB_MAX_OPEN,
    JOB_MAX_HEAVY: result.data.JOB_MAX_HEAVY,
    JOB_MAX_UPLOAD_MB: result.data.JOB_MAX_UPLOAD_MB,
  };

  if (result.data.DATABASE_URL) {
    env.DATABASE_URL = result.data.DATABASE_URL;
  }
  if (result.data.DEV_GRANT_SECRET && result.data.NODE_ENV !== 'production') {
    env.DEV_GRANT_SECRET = result.data.DEV_GRANT_SECRET;
  }

  return Object.freeze(env);
}
