import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { qaPreviewCatalog, QA_PREVIEW_SERVICE_ID } from './qa-preview.js';
import { validateCatalog } from './validate-catalog.js';
import { publicService, publicServices } from './public-catalog.js';

describe('catálogo isolado de QA sintético', () => {
  it('preserva todos os mapeamentos e serviço oficiais como DRAFT', () => {
    const sandbox = qaPreviewCatalog();
    expect(catalog.mappings.every((item) => item.status === 'DRAFT')).toBe(true);
    expect(catalog.services.find((item) => item.id === 'transferencia-moto-aquatica')?.status)
      .toBe('DRAFT');
    expect(catalog.serviceForms).toHaveLength(0);
    expect(sandbox.services.find((item) => item.id === 'transferencia-moto-aquatica')?.status)
      .toBe('DRAFT');
    expect(publicService(sandbox, 'transferencia-moto-aquatica')).toBeNull();
    expect(publicServices(catalog)).toHaveLength(0);
  });

  it('libera apenas dois formulários para simulação com zero créditos', () => {
    const sandbox = qaPreviewCatalog();
    expect(validateCatalog(sandbox)).toEqual([]);
    const preview = publicService(sandbox, QA_PREVIEW_SERVICE_ID);
    expect(preview).not.toBeNull();
    expect(preview?.creditCost).toBe(0);
    expect(preview?.formVersionIds).toEqual(['requerimento-ma-v1', 'bdmoto-v1']);
    expect(preview?.reviewFields.some((field) => field.id === 'person.fullName' && field.required))
      .toBe(true);
    expect(preview?.reviewFields.some((field) => field.id === 'vessel.name' && field.required))
      .toBe(true);
    expect(preview?.documentRequirements.some((item) => item.id === 'buyer-identity' && item.required))
      .toBe(true);
    expect(sandbox.mappings.filter((item) => item.status === 'APPROVED')).toHaveLength(2);
    expect(publicServices(sandbox).map((service) => service.id)).toEqual([QA_PREVIEW_SERVICE_ID]);
  });
});
