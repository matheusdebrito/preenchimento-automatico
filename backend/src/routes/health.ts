import type { FastifyInstance } from 'fastify';

const SERVICE_NAME = 'preenchimento-automatico-api';

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

const healthResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'service', 'version', 'uptimeSeconds', 'timestamp'],
  properties: {
    status: { type: 'string', const: 'ok' },
    service: { type: 'string' },
    version: { type: 'string' },
    uptimeSeconds: { type: 'number', minimum: 0 },
    timestamp: { type: 'string', format: 'date-time' },
  },
} as const;

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async (): Promise<HealthResponse> => ({
      status: 'ok',
      service: SERVICE_NAME,
      version: process.env.npm_package_version ?? '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
}
