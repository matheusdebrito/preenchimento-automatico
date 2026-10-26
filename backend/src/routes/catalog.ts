import type { FastifyInstance } from 'fastify';
import { catalog } from '../modules/catalog/catalog.js';
import { publicService, publicServices } from '../modules/catalog/public-catalog.js';
import { validateCatalog } from '../modules/catalog/validate-catalog.js';

export function registerCatalogRoutes(app: FastifyInstance): void {
  const issues = validateCatalog(catalog);
  if (issues.length > 0) {
    throw new Error('Catálogo inválido: ' + issues.join('; '));
  }

  app.get('/api/services', async () => ({ services: publicServices(catalog) }));

  app.get<{ Params: { id: string } }>('/api/services/:id', async (request, reply) => {
    const service = publicService(catalog, request.params.id);
    if (!service) {
      return reply.status(404).send({
        error: 'not_found', message: 'Serviço não disponível.',
      });
    }
    return { service };
  });
}
