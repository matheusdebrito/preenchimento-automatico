import type { CatalogDefinition } from './contracts.js';
import { catalog } from './catalog.js';

/**
 * Local-only overlay of the REAL unified transfer service.
 * It enables the same catalog entry used for boat/jet-ski routing while keeping
 * production metadata DRAFT. Every generated output remains watermarked as an
 * unusable sample. NODE_ENV=development + DEV_QA_PREVIEW=true are required.
 */
export const QA_PREVIEW_SERVICE_ID = 'transferencia-propriedade-embarcacao';

export function qaPreviewCatalog(): CatalogDefinition {
  return {
    ...catalog,
    mappings: catalog.mappings.map((mapping) => ({
      ...mapping,
      // Adapter only: the production catalog and human approval remain DRAFT/TESTED.
      status: 'APPROVED' as const,
      reviewedAt: '2026-10-27',
      reviewer: 'QA LOCAL SOMENTE - NAO HOMOLOGADO',
      reportPath: 'docs/QA_SYNTHETIC_PREVIEW.md',
    })),
    services: catalog.services.map((service) =>
      service.id === QA_PREVIEW_SERVICE_ID ? {
        ...service,
        description: 'Mesmo fluxo unificado de transferência, somente com dados inventados. ' +
          'Escolha Moto aquática ou Embarcação; PDFs são marcados como AMOSTRA e não valem para protocolo.',
        status: 'AVAILABLE' as const,
        creditCost: 0,
      } : service),
  };
}
