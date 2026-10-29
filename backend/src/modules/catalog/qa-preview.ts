import type { CatalogDefinition } from './contracts.js';
import { catalog } from './catalog.js';

/**
 * Local-only overlay of the REAL pilot service, never a parallel fake service.
 * It reuses the same questions, document requirements and all six original
 * mapping placements. This temporary override is NOT persisted or exported by
 * the official catalog, and every output is watermarked as an unusable sample.
 * NODE_ENV=development + DEV_QA_PREVIEW=true are required at startup.
 */
export const QA_PREVIEW_SERVICE_ID = 'transferencia-propriedade-embarcacao';

export function qaPreviewCatalog(): CatalogDefinition {
  return {
    ...catalog,
    mappings: catalog.mappings.map((mapping) => ({
      ...mapping,
      // Adapter only: the production catalog and human approval remain DRAFT.
      status: 'APPROVED' as const,
      reviewedAt: '2026-10-27',
      reviewer: 'QA LOCAL SOMENTE - NAO HOMOLOGADO',
      reportPath: 'docs/QA_SYNTHETIC_PREVIEW.md',
    })),
    services: catalog.services.map((service) =>
      service.id === QA_PREVIEW_SERVICE_ID ? {
        ...service,
        title: service.title,
        description: 'Mesmo fluxo, perguntas e formulários do serviço piloto, somente ' +
          'com dados inventados. PDFs marcados como AMOSTRA e não válidos para protocolo.',
        status: 'AVAILABLE' as const,
        creditCost: 0,
      } : service),
  };
}
