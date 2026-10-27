import type { CatalogDefinition, FieldPlacement, FormMapping } from './contracts.js';
import { catalog } from './catalog.js';

/**
 * Local-development quality-assurance catalog. It NEVER mutates the official
 * DRAFT mappings or makes the real transfer service AVAILABLE.
 * The temporary APPROVED status only unblocks the existing technical PDF
 * engine for synthetic regression checks; every resulting PDF is watermarked.
 */
export const QA_PREVIEW_SERVICE_ID = 'qa-synthetic-moto';

const FORM_VERSIONS = ['requerimento-ma-v1', 'bdmoto-v1'];
const QA_FIELDS = new Set([
  'person.fullName', 'person.cpf', 'person.address',
  'vessel.name', 'vessel.registration', 'vessel.hullId',
  'sale.invoice', 'sale.date', 'sale.price', 'process.transferOwnership',
]);

export function qaPreviewCatalog(): CatalogDefinition {
  const mappings: FormMapping[] = catalog.mappings.map((mapping) => {
    if (!FORM_VERSIONS.includes(mapping.formVersionId)) return mapping;
    const placements: FieldPlacement[] = mapping.placements
      .filter((placement) => QA_FIELDS.has(placement.fieldId))
      .map((placement) => ({
        ...placement,
        required: placement.fieldId === 'person.fullName' ||
          placement.fieldId === 'vessel.name',
      }));
    return {
      ...mapping,
      placements,
      status: 'APPROVED',
      reviewer: 'QA INTERNO COM DADOS FICTICIOS - NAO HOMOLOGADO',
      reviewedAt: '2026-10-26',
      reportPath: 'docs/QA_SYNTHETIC_PREVIEW.md',
    };
  });

  return {
    ...catalog,
    mappings,
    services: [
      ...catalog.services,
      {
        id: QA_PREVIEW_SERVICE_ID,
        title: 'Simulação técnica — moto aquática (dados fictícios)',
        description: 'Somente para testes locais com fotos/documentos inventados. ' +
          'Gera dois formulários com marca d\'água de AMOSTRA. ' +
          'Não é serviço homologado, não serve para protocolo.',
        status: 'AVAILABLE',
        creditCost: 0,
        questions: [],
        documentRequirements: [
          { id: 'buyer-identity', label: 'Identidade fictícia do comprador', required: true },
          { id: 'tie', label: 'Título fictício da moto aquática', required: true },
          { id: 'residence-proof', label: 'Comprovante fictício de residência', required: false },
          { id: 'sale-document', label: 'Comprovante fictício da venda', required: false },
        ],
      },
    ],
    serviceForms: [
      ...catalog.serviceForms,
      ...FORM_VERSIONS.map((formVersionId, order) => ({
        serviceId: QA_PREVIEW_SERVICE_ID,
        formVersionId,
        order: order + 1,
        fixedValues: { 'process.transferOwnership': 'X' },
      })),
    ],
  };
}
