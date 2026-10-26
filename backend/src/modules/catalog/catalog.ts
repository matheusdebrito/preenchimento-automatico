import type { CatalogDefinition } from './contracts.js';

/**
 * This is configuration, not evidence of applicable official forms.
 * Keep the pilot in DRAFT until all required PDF versions are verified,
 * mapped, visually reviewed and associated with the service.
 * Frontend demo data remains separate; no document is generated here.
 */
export const catalog: CatalogDefinition = {
  fields: [
    { id: 'person.fullName', label: 'Nome completo', valueKind: 'text' },
    { id: 'person.cpf', label: 'CPF', valueKind: 'text', validationRuleId: 'cpf' },
    { id: 'person.address', label: 'Endereço', valueKind: 'text' },
    { id: 'vessel.hullId', label: 'Identificação do casco', valueKind: 'text' },
  ],
  forms: [],
  versions: [],
  mappings: [],
  services: [
    {
      id: 'transferencia-moto-aquatica',
      title: 'Transferência de moto aquática',
      description: 'Piloto dependente de validação normativa e formulários oficiais.',
      creditCost: 1,
      status: 'DRAFT',
      questions: [],
      documentRequirements: [],
    },
  ],
  serviceForms: [],
};
