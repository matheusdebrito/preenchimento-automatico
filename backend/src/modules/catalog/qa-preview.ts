import type { CatalogDefinition } from './contracts.js';
import { catalog } from './catalog.js';
import { pendingMotoAquaticaServiceForms } from './vessel-services.js';

/**
 * Local-only overlay of the REAL pilot service, never a parallel fake service.
 * It reuses the same questions, document requirements and all six original
 * mapping placements. This temporary override is NOT persisted or exported by
 * the official catalog, and every output is watermarked as an unusable sample.
 * NODE_ENV=development + DEV_QA_PREVIEW=true are required at startup.
 */
export const QA_PREVIEW_SERVICE_ID = 'transferencia-propriedade-embarcacao';

export function qaPreviewCatalog(): CatalogDefinition {
  const lastOfficialOrder = Math.max(
    0,
    ...catalog.serviceForms
      .filter((relation) => relation.serviceId === QA_PREVIEW_SERVICE_ID)
      .map((relation) => relation.order),
  );
  const previewServiceForms = pendingMotoAquaticaServiceForms
    .filter((relation) => relation.serviceId === QA_PREVIEW_SERVICE_ID)
    .map((relation) => ({
      ...relation,
      // The validator requires one unique order per service. Boat and moto-aquatica
      // relations are mutually exclusive by vesselType, but the QA overlay still
      // shares the same service ID, so keep the preview orders outside the official range.
      order: lastOfficialOrder + relation.order,
    }));

  return {
    ...catalog,
    mappings: catalog.mappings.map((mapping) => {
      const version = catalog.versions.find((item) => item.id === mapping.formVersionId);
      if (version?.status !== 'VERIFIED') {
        return mapping;
      }
      return {
        ...mapping,
        // Adapter only: the production catalog and human approval remain unchanged.
        // Never promote a mapping whose PDF version is not VERIFIED.
        status: 'APPROVED' as const,
        reviewedAt: '2026-10-27',
        reviewer: 'QA LOCAL SOMENTE - NAO HOMOLOGADO',
        reportPath: 'docs/QA_SYNTHETIC_PREVIEW.md',
      };
    }),
    services: catalog.services.map((service) =>
      service.id === QA_PREVIEW_SERVICE_ID ? {
        ...service,
        title: service.title,
        description: 'Mesmo fluxo, perguntas e formulários do serviço piloto, somente ' +
          'com dados inventados. PDFs marcados como AMOSTRA e não válidos para protocolo.',
        status: 'AVAILABLE' as const,
        creditCost: 0,
        questions: service.questions.map((question) =>
          question.id === 'vesselType'
            ? { ...question, unavailableOptions: [] }
            : question),
      } : service),
    serviceForms: [
      ...catalog.serviceForms,
      ...previewServiceForms,
    ],
  };
}
