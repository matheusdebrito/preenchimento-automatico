import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { qaPreviewCatalog, QA_PREVIEW_SERVICE_ID } from './qa-preview.js';
import { validateCatalog } from './validate-catalog.js';
import { publicService, publicServices } from './public-catalog.js';

const answers = {
  tieSituation: 'regular',
  transferAuthorization: 'consta_tie',
  sellerCommunication: 'nao',
  residenceProof: 'comprovante',
  coOwner: 'nao',
  representative: 'nao',
};

describe('prévia local do MESMO serviço de transferência', () => {
  it('nunca altera status ou campos oficiais do catálogo compartilhado', () => {
    const qa = qaPreviewCatalog();
    expect(catalog.mappings.every((mapping) => mapping.status === 'DRAFT')).toBe(true);
    expect(catalog.services.find((service) => service.id === QA_PREVIEW_SERVICE_ID)?.status).toBe('DRAFT');
    expect(catalog.serviceForms).toHaveLength(0);
    expect(publicService(catalog, QA_PREVIEW_SERVICE_ID)).toBeNull();
    expect(publicServices(catalog)).toHaveLength(0);
    expect(qa.services).toHaveLength(catalog.services.length);
    expect(qa.services[0]?.id).toBe(QA_PREVIEW_SERVICE_ID);
  });

  it('usa perguntas, requisitos e todas as posições reais com amostras sem créditos', () => {
    const qa = qaPreviewCatalog();
    expect(validateCatalog(qa)).toEqual([]);
    const preview = publicService(qa, QA_PREVIEW_SERVICE_ID, answers);
    expect(preview?.creditCost).toBe(0);
    expect(preview?.formVersionIds).toEqual(['requerimento-ma-v1', 'bdmoto-v1']);
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
      ...answers, tieSituation: 'extraviado', transferAuthorization: 'anexo_2d',
      sellerCommunication: 'sim', residenceProof: 'declaracao_1c',
    });
    expect(selected?.formVersionIds).toEqual([
      'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
      'comunicacao-transferencia-ma-v1', 'declaracao-perda-tie-ma-v1',
      'declaracao-residencia-ma-v1',
    ]);
  });
});
