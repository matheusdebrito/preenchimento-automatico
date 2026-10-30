import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { publicService } from './public-catalog.js';

const aquaviarioIds = [
  'inscricao-inicial-cir-aquaviario',
  'segunda-via-cir-aquaviario',
  'revalidacao-cir-aquaviario',
  'transferencia-jurisdicao-aquaviario',
  'ascensao-categoria-aquaviario',
  'transferencia-categoria-grupo-aquaviario',
  'homologacao-lrm-aquaviario',
  'emissao-certificado-aquaviario',
  'segunda-via-certificado-aquaviario',
  'revalidacao-certificado-aquaviario',
] as const;

describe('serviços de aquaviários - NORMAM-101', () => {
  it('publica os dez serviços homologados', () => {
    for (const id of aquaviarioIds) {
      expect(publicService(catalog, id), id).not.toBeNull();
    }
  });

  it('gera o Anexo 1-K na segunda via da CIR somente para extravio, roubo ou furto', () => {
    expect(publicService(catalog, 'segunda-via-cir-aquaviario', {
      cirSecondCopyReason: 'dano',
    })?.formVersionIds).toEqual([
      'declaracao-residencia-aquaviario-2026-v1',
    ]);

    for (const reason of ['extravio', 'roubo', 'furto'] as const) {
      expect(publicService(catalog, 'segunda-via-cir-aquaviario', {
        cirSecondCopyReason: reason,
      })?.formVersionIds).toEqual([
        'declaracao-residencia-aquaviario-2026-v1',
        'declaracao-extravio-aquaviario-2026-v1',
      ]);
    }
  });

  it('usa o Anexo 1-E somente nos serviços de certificação', () => {
    const certificationIds = new Set([
      'emissao-certificado-aquaviario',
      'segunda-via-certificado-aquaviario',
      'revalidacao-certificado-aquaviario',
    ]);
    for (const id of aquaviarioIds) {
      const service = catalog.serviceForms.filter((relation) => relation.serviceId === id);
      const hasCertificationRequest = service.some((relation) =>
        relation.formVersionId === 'requerimento-certificacao-aquaviario-2026-v1');
      expect(hasCertificationRequest, id).toBe(certificationIds.has(id));
    }
  });

  it('compõe emissão e revalidação de certificado com 1-E + 1-L', () => {
    expect(publicService(catalog, 'emissao-certificado-aquaviario', {
      certificateModel: 'dpc1031',
    })?.formVersionIds).toEqual([
      'requerimento-certificacao-aquaviario-2026-v1',
      'declaracao-residencia-aquaviario-2026-v1',
    ]);

    expect(publicService(catalog, 'revalidacao-certificado-aquaviario', {
      certificateModel: 'dpc1034',
    })?.formVersionIds).toEqual([
      'requerimento-certificacao-aquaviario-2026-v1',
      'declaracao-residencia-aquaviario-2026-v1',
    ]);
  });

  it('não oferece DPC-1033 para revalidação nem DPC-1032 no Anexo 1-K', () => {
    const revalidation = catalog.services.find((service) =>
      service.id === 'revalidacao-certificado-aquaviario');
    expect(revalidation?.questions.find((question) =>
      question.id === 'certificateModel')?.options).toEqual([
      'dpc1031', 'dpc1032', 'dpc1034',
    ]);

    const secondCopy = catalog.services.find((service) =>
      service.id === 'segunda-via-certificado-aquaviario');
    expect(secondCopy?.questions.find((question) =>
      question.id === 'certificateModel')?.options).toEqual([
      'dpc1031', 'dpc1033', 'dpc1034',
    ]);
  });

  it('gera o Anexo 1-K na segunda via de certificado apenas quando há perda material', () => {
    expect(publicService(catalog, 'segunda-via-certificado-aquaviario', {
      certificateModel: 'dpc1031',
      certificateSecondCopyReason: 'dano',
    })?.formVersionIds).toEqual([
      'requerimento-certificacao-aquaviario-2026-v1',
      'declaracao-residencia-aquaviario-2026-v1',
    ]);

    expect(publicService(catalog, 'segunda-via-certificado-aquaviario', {
      certificateModel: 'dpc1033',
      certificateSecondCopyReason: 'roubo',
    })?.formVersionIds).toEqual([
      'requerimento-certificacao-aquaviario-2026-v1',
      'declaracao-residencia-aquaviario-2026-v1',
      'declaracao-extravio-aquaviario-2026-v1',
    ]);
  });

  it('mantém endereço editável no 1-L e usa endereço derivado somente no 1-E', () => {
    const service = publicService(catalog, 'emissao-certificado-aquaviario', {
      certificateModel: 'dpc1031',
      personSex: 'masculino',
    });
    const residenceFields = service?.reviewForms.find((form) =>
      form.formVersionId === 'declaracao-residencia-aquaviario-2026-v1')
      ?.fields.map((field) => field.id) ?? [];
    expect(residenceFields).toContain('person.address');
    expect(residenceFields).toContain('person.postalCode');

    const certificationFields = service?.reviewForms.find((form) =>
      form.formVersionId === 'requerimento-certificacao-aquaviario-2026-v1')
      ?.fields.map((field) => field.id) ?? [];
    expect(certificationFields).not.toContain('person.fullAddress');
    expect(certificationFields).not.toContain('person.sex');
  });

  it('mantém todos os uploads como fontes opcionais', () => {
    for (const id of aquaviarioIds) {
      const service = publicService(catalog, id);
      expect(service?.documentRequirements.every((item) => item.required === false), id)
        .toBe(true);
    }
  });
});
