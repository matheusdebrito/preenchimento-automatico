import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { qaPreviewCatalog, QA_PREVIEW_SERVICE_ID } from './qa-preview.js';
import { validateCatalog } from './validate-catalog.js';
import { publicService, publicServices } from './public-catalog.js';

const answers = {
  vesselType: 'moto_aquatica',
  tieSituation: 'regular',
};

describe('prévia local do MESMO serviço de transferência', () => {
  it('nunca altera status ou campos oficiais do catálogo compartilhado', () => {
    const originalStatuses = new Map(catalog.mappings.map((mapping) =>
      [mapping.id, mapping.status]));
    const originalServiceStatus = catalog.services.find((service) =>
      service.id === QA_PREVIEW_SERVICE_ID)?.status;

    const qa = qaPreviewCatalog();

    for (const mapping of catalog.mappings) {
      expect(mapping.status).toBe(originalStatuses.get(mapping.id));
    }
    expect([...originalStatuses.values()].filter((status) => status === 'TESTED'))
      .toHaveLength(8);
    expect(catalog.services.find((service) => service.id === QA_PREVIEW_SERVICE_ID)?.status)
      .toBe(originalServiceStatus);
    expect(catalog.services.find((service) => service.id === QA_PREVIEW_SERVICE_ID)?.status)
      .toBe('DRAFT');
    expect(catalog.serviceForms.some((relation) =>
      relation.serviceId === QA_PREVIEW_SERVICE_ID)).toBe(true);
    expect(publicService(catalog, QA_PREVIEW_SERVICE_ID)).toBeNull();
    expect(publicServices(catalog)).toHaveLength(0);

    // The QA catalog is an isolated clone. It may promote mappings internally
    // so the local preview can exercise the real forms without publishing them.
    expect(qa.mappings.every((mapping) => mapping.status === 'APPROVED')).toBe(true);
    expect(qa.services).toHaveLength(catalog.services.length);
    expect(qa.services.find((service) => service.id === QA_PREVIEW_SERVICE_ID)?.id)
      .toBe(QA_PREVIEW_SERVICE_ID);
  });

  it('usa perguntas, requisitos e todas as posições reais com amostras sem créditos', () => {
    const qa = qaPreviewCatalog();
    expect(validateCatalog(qa)).toEqual([]);
    const preview = publicService(qa, QA_PREVIEW_SERVICE_ID, answers);
    expect(preview?.creditCost).toBe(0);
    expect(preview?.formVersionIds).toEqual([
      'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
      'declaracao-residencia-ma-v1',
    ]);
    expect(preview?.questions).toEqual(catalog.services[0]?.questions);
    expect(preview?.documentRequirements).toContainEqual(expect.objectContaining({
      id: 'seller-identity', required: false,
    }));
    // Photos may be relevant to official filing, but not to filling form fields.
    expect(preview?.documentRequirements.some((document) =>
      document.id === 'photo-stern' || document.id === 'photo-side')).toBe(false);
    expect(catalog.services[0]?.documentRequirements.some((document) =>
      document.id === 'photo-stern' || document.id === 'photo-side')).toBe(false);

    expect(preview?.documentRequirements.every((document) => document.required === false))
      .toBe(true);
    expect(preview?.reviewFields.some((field) => field.id === 'person.city')).toBe(true);
    expect(preview?.reviewFields.some((field) => field.id === 'person.neighborhood')).toBe(true);
    expect(preview?.reviewFields.some((field) => field.id === 'person.postalCode')).toBe(true);
    for (const mapping of catalog.mappings) {
      expect(qa.mappings.find((item) => item.id === mapping.id)?.placements)
        .toEqual(mapping.placements);
    }
    expect(publicServices(qa).map((service) => service.id)).toEqual([QA_PREVIEW_SERVICE_ID]);
  });

  it('inclui os anexos condicionais reais quando selecionados', () => {
    const qa = qaPreviewCatalog();
    const selected = publicService(qa, QA_PREVIEW_SERVICE_ID, {
      ...answers, tieSituation: 'extraviado',
    });
    expect(selected?.formVersionIds).toEqual([
      'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
      'declaracao-residencia-ma-v1', 'declaracao-perda-tie-ma-v1',
    ]);
  });
});
