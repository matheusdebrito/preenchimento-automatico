import type { CatalogDefinition } from './contracts.js';

/**
 * Catálogo inicial intencionalmente conservador.
 * A listagem ilustrativa do frontend continua isolada como demonstração.
 * Não publicar serviços/formulários sem conferência normativa e PDF oficial.
 */
export const catalog: CatalogDefinition = {
  fields: [
    { id: 'person.fullName', label: 'Nome completo', valueKind: 'text' },
    { id: 'person.cpf', label: 'CPF', valueKind: 'text', validationRuleId: 'cpf' },
    { id: 'person.address', label: 'Endereço', valueKind: 'text' },
    { id: 'vessel.hullId', label: 'Identificação do casco', valueKind: 'text' },
  ],
  templates: [],
  services: [
    {
      id: 'transferencia-moto-aquatica',
      title: 'Transferência de moto aquática',
      description: 'Piloto sujeito à confirmação dos formulários e requisitos oficiais.',
      creditCost: 1,
      status: 'DRAFT',
      documentRequirements: [],
      formRelations: [],
    },
  ],
};
