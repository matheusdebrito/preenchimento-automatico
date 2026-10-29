import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { catalog } from '../modules/catalog/catalog.js';
import type { CatalogDefinition } from '../modules/catalog/contracts.js';
import { publicService, publicServices } from '../modules/catalog/public-catalog.js';
import { validateCatalog } from '../modules/catalog/validate-catalog.js';

export function registerCatalogRoutes(app: FastifyInstance, definitions: CatalogDefinition = catalog): void {
  const issues = validateCatalog(definitions);
  if (issues.length > 0) {
    throw new Error('Catálogo inválido: ' + issues.join('; '));
  }

  app.get('/api/services', async () => ({ services: publicServices(definitions) }));

  app.get<{ Params: { id: string } }>('/api/services/:id', async (request, reply) => {
    const service = publicService(definitions, request.params.id);
    if (!service) {
      return reply.status(404).send({
        error: 'not_found', message: 'Serviço não disponível.',
      });
    }
    return { service };
  });

  app.post<{ Params: { id: string } }>('/api/services/:id/quote', async (request, reply) => {
    const parsed = z.object({ answers: z.record(z.string().max(100), z.string().max(100)) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid' });
    const service = publicService(definitions, request.params.id, parsed.data.answers);
    const relevantQuestions = service?.questions.filter((question) =>
      (question.conditions ?? []).every((condition) =>
        parsed.data.answers[condition.questionId] === condition.equals)) ?? [];
    if (!service || service.formVersionIds.length === 0 ||
      relevantQuestions.some((question) => !parsed.data.answers[question.id])) {
      return reply.status(404).send({ error: 'not_available' });
    }
    return { service };
  });
}
