import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { publicService as quoteService } from './public-catalog.js';
import type { CatalogDefinition } from './contracts.js';
import { serviceFormValues } from './service-form-values.js';

// Existing package-composition assertions intentionally select the optional 1-L/2-G/1-C.
 // Separate catalog/API regressions assert the new default (no declaration) and both choices.
function publicService(
  definitions: CatalogDefinition,
  id: string,
  answers: Readonly<Record<string, string>> = {},
) {
  return quoteService(definitions, id, definitions === catalog
    ? { includeResidenceDeclaration: 'sim', ...answers }
    : answers);
}

const aquaviarioIds = [
  'inscricao-inicial-cir-aquaviario',
  'segunda-via-cir-aquaviario',
  'revalidacao-cir-aquaviario',
  'ascensao-categoria-aquaviario',
  'emissao-certificado-aquaviario',
  'segunda-via-certificado-aquaviario',
  'revalidacao-certificado-aquaviario',
] as const;

const residenceId = 'declaracao-residencia-aquaviario-2026-v1';
const auxiliaryRequestId = 'requerimento-interessado-aquaviario-2026-v1';
const certificationRequestId = 'requerimento-certificacao-aquaviario-2026-v1';
const lossDeclarationId = 'declaracao-extravio-aquaviario-2026-v1';

describe('serviços de aquaviários - NORMAM-101', () => {
  it('publica exatamente os sete serviços selecionados', () => {
    const publishedIds = catalog.services
      .filter((service) => service.id.endsWith('-aquaviario'))
      .map((service) => service.id)
      .sort();
    expect(publishedIds).toEqual([...aquaviarioIds].sort());

    for (const id of aquaviarioIds) {
      expect(publicService(catalog, id), id).not.toBeNull();
    }
  });

  it('não publica os três serviços retirados do escopo de Aquaviários', () => {
    const removedIds = [
      'transferencia-jurisdicao-aquaviario',
      'transferencia-categoria-grupo-aquaviario',
      'homologacao-lrm-aquaviario',
    ];
    for (const id of removedIds) {
      expect(catalog.services.some((service) => service.id === id), id).toBe(false);
      expect(catalog.serviceForms.some((relation) => relation.serviceId === id), id).toBe(false);
      expect(publicService(catalog, id), id).toBeNull();
    }
  });

  it('gera requerimento auxiliar apenas para inscrição inicial de mergulhadores e práticos', () => {
    expect(publicService(catalog, 'inscricao-inicial-cir-aquaviario')?.formVersionIds)
      .toEqual([residenceId]);

    expect(publicService(catalog, 'inscricao-inicial-cir-aquaviario', {
      initialAquaviarioGroup: 'demais_grupos',
    })?.formVersionIds).toEqual([residenceId]);

    for (const group of ['mergulhadores', 'praticos'] as const) {
      expect(publicService(catalog, 'inscricao-inicial-cir-aquaviario', {
        initialAquaviarioGroup: group,
      })?.formVersionIds).toEqual([residenceId, auxiliaryRequestId]);
    }
  });

  it('gera requerimento auxiliar nos serviços em que a NORMAM exige requerimento do interessado', () => {
    const cases = [
      ['segunda-via-cir-aquaviario', { cirSecondCopyReason: 'dano' }],
      ['revalidacao-cir-aquaviario', {}],
      ['ascensao-categoria-aquaviario', {}],
    ] as const;

    for (const [serviceId, answers] of cases) {
      expect(publicService(catalog, serviceId, answers)?.formVersionIds, serviceId)
        .toEqual([residenceId, auxiliaryRequestId]);
    }
  });

  it('gera o Anexo 1-K na segunda via da CIR somente para extravio, roubo ou furto', () => {
    expect(publicService(catalog, 'segunda-via-cir-aquaviario', {
      cirSecondCopyReason: 'dano',
    })?.formVersionIds).toEqual([residenceId, auxiliaryRequestId]);

    for (const reason of ['extravio', 'roubo', 'furto'] as const) {
      expect(publicService(catalog, 'segunda-via-cir-aquaviario', {
        cirSecondCopyReason: reason,
      })?.formVersionIds).toEqual([
        residenceId,
        auxiliaryRequestId,
        lossDeclarationId,
      ]);
    }
  });

  it('usa o Anexo 1-E oficial nos serviços de certificação, sem duplicar com o modelo auxiliar', () => {
    const certificationIds = [
      'emissao-certificado-aquaviario',
      'segunda-via-certificado-aquaviario',
      'revalidacao-certificado-aquaviario',
    ];
    for (const id of aquaviarioIds) {
      const service = publicService(catalog, id, id === 'segunda-via-cir-aquaviario'
        ? { cirSecondCopyReason: 'dano' }
        : id === 'inscricao-inicial-cir-aquaviario'
          ? { initialAquaviarioGroup: 'demais_grupos' }
          : {});
      expect(service?.formVersionIds.includes(certificationRequestId), id)
        .toBe(certificationIds.includes(id));
      if (certificationIds.includes(id)) {
        expect(service?.formVersionIds, id).not.toContain(auxiliaryRequestId);
      }
    }
  });

  it('compõe emissão e revalidação de certificado com 1-E oficial + 1-L', () => {
    expect(publicService(catalog, 'emissao-certificado-aquaviario', {
      certificateModel: 'dpc1031',
    })?.formVersionIds).toEqual([certificationRequestId, residenceId]);

    expect(publicService(catalog, 'revalidacao-certificado-aquaviario', {
      certificateModel: 'dpc1034',
    })?.formVersionIds).toEqual([certificationRequestId, residenceId]);
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
    })?.formVersionIds).toEqual([certificationRequestId, residenceId]);

    expect(publicService(catalog, 'segunda-via-certificado-aquaviario', {
      certificateModel: 'dpc1033',
      certificateSecondCopyReason: 'roubo',
    })?.formVersionIds).toEqual([
      certificationRequestId,
      residenceId,
      lossDeclarationId,
    ]);
  });

  it('mantém endereço editável no 1-L e usa endereço derivado somente no 1-E', () => {
    const service = publicService(catalog, 'emissao-certificado-aquaviario', {
      certificateModel: 'dpc1031',
      personSex: 'masculino',
    });
    const residenceFields = service?.reviewForms.find((form) =>
      form.formVersionId === residenceId)?.fields.map((field) => field.id) ?? [];
    expect(residenceFields).toContain('person.address');
    expect(residenceFields).toContain('person.postalCode');

    const certificationFields = service?.reviewForms.find((form) =>
      form.formVersionId === certificationRequestId)?.fields.map((field) => field.id) ?? [];
    expect(certificationFields).not.toContain('person.fullAddress');
    expect(certificationFields).not.toContain('person.sex');
  });

  it('expõe os campos editáveis do requerimento auxiliar e mantém assunto/finalidade controlados pelo catálogo', () => {
    const service = publicService(catalog, 'revalidacao-cir-aquaviario');
    const request = service?.reviewForms.find((form) =>
      form.formVersionId === auxiliaryRequestId);
    const ids = request?.fields.map((field) => field.id) ?? [];
    expect(ids).toContain('process.requestAuthority');
    expect(ids).toContain('person.fullName');
    expect(ids).toContain('person.cpf');
    expect(ids).toContain('person.identity');
    expect(ids).toContain('person.fullAddress');
    expect(ids).toContain('process.place');
    expect(ids).toContain('process.date');
    expect(ids).not.toContain('process.requestSubject');
    expect(ids).not.toContain('process.requestPurpose');

    const relation = catalog.serviceForms.find((item) =>
      item.serviceId === 'revalidacao-cir-aquaviario' &&
      item.formVersionId === auxiliaryRequestId);
    const values = serviceFormValues(relation, {}, {
      'person.fullName': 'MARIA TESTE',
      'person.cpf': '123.456.789-09',
    });
    expect(values['process.requestSubject']).toBe('Revalidação da CIR');
    expect(values['process.requestPurpose']).toContain('revalidação da minha Caderneta de Inscrição e Registro');
  });

  it('solicita categoria de ascensão e exibe finalidade editável com categoria atual e pretendida', () => {
    const service = publicService(catalog, 'ascensao-categoria-aquaviario', {
      ascensionAquaviarioGroup: 'outros_grupos',
    });
    expect(service?.questions.find((item) => item.id === 'ascensionAquaviarioGroup'))
      .toBeDefined();
    const request = service?.reviewForms.find((item) => item.formVersionId === auxiliaryRequestId);
    expect(request?.fields.map((field) => field.id)).toContain('process.requestPurpose');
    expect(request?.fields.find((field) => field.id === 'process.requestPurpose')?.label)
      .toContain('categoria atual');
    expect(service?.documentRequirements.map((item) => item.id)).toEqual([
      'applicant-identity', 'current-cir', 'residence-proof',
    ]);

    const diver = publicService(catalog, 'ascensao-categoria-aquaviario', {
      ascensionAquaviarioGroup: 'mergulhadores',
    });
    expect(diver?.documentRequirements.map((item) => item.id)).toEqual([
      'applicant-identity', 'current-cir', 'residence-proof',
    ]);

    const relation = catalog.serviceForms.find((item) =>
      item.serviceId === 'ascensao-categoria-aquaviario' &&
      item.formVersionId === auxiliaryRequestId);
    const values = serviceFormValues(relation, { ascensionAquaviarioGroup: 'mergulhadores' },
      { 'process.requestPurpose': 'da categoria MGE para MGS' });
    expect(values['process.requestPurpose']).toBe('da categoria MGE para MGS');
  });

  it('oferece somente identidade, comprovante de residência e CIR como fontes de entrada', () => {
    for (const id of aquaviarioIds) {
      const service = publicService(catalog, id, {
        ...(id === 'ascensao-categoria-aquaviario' ?
          { ascensionAquaviarioGroup: 'outros_grupos' } : {}),
        ...(id === 'segunda-via-cir-aquaviario' ? { cirSecondCopyReason: 'dano' } : {}),
        ...(id === 'emissao-certificado-aquaviario' ?
          { certificateModel: 'dpc1031', personSex: 'masculino' } : {}),
        ...(id === 'segunda-via-certificado-aquaviario' ?
          { certificateModel: 'dpc1031', certificateSecondCopyReason: 'dano', personSex: 'masculino' } : {}),
        ...(id === 'revalidacao-certificado-aquaviario' ?
          { certificateModel: 'dpc1031', personSex: 'masculino' } : {}),
      });
      for (const doc of service?.documentRequirements ?? []) {
        expect(['identity', 'residence-proof', 'cir']).toContain(doc.extraction?.documentType);
        expect(doc.extraction?.allowedFieldIds.length).toBeGreaterThan(0);
      }
      expect(service && 'protocolDocuments' in service, id).toBe(false);
    }

    const certification = publicService(catalog, 'emissao-certificado-aquaviario', {
      certificateModel: 'dpc1031', personSex: 'masculino',
    });
    const cir = certification?.documentRequirements.find((doc) =>
      doc.id === 'current-cir-certification');
    expect(cir?.extraction?.documentType).toBe('cir');
    expect(cir?.extraction?.allowedFieldIds).toContain('aquaviario.cirNumber');
    expect(cir?.extraction?.allowedFieldIds).toContain('aquaviario.category');
  });

  it('não publica listas de documentos protocolares nem uploads fora das fontes permitidas', () => {
    for (const id of aquaviarioIds) {
      const service = publicService(catalog, id, {
        ...(id === 'inscricao-inicial-cir-aquaviario' ?
          { initialAquaviarioGroup: 'mergulhadores' } : {}),
        ...(id === 'segunda-via-cir-aquaviario' ? { cirSecondCopyReason: 'dano' } : {}),
        ...(id === 'ascensao-categoria-aquaviario' ?
          { ascensionAquaviarioGroup: 'mergulhadores' } : {}),
      });
      expect(service && 'protocolDocuments' in service, id).toBe(false);
      expect(service?.documentRequirements.every((item) =>
        ['identity', 'residence-proof', 'cir'].includes(item.extraction?.documentType ?? '') &&
        item.extraction!.allowedFieldIds.length > 0), id).toBe(true);
    }
  });

  it('mantém todos os uploads como fontes opcionais', () => {
    for (const id of aquaviarioIds) {
      const service = publicService(catalog, id);
      expect(service?.documentRequirements.every((item) => item.required === false), id)
        .toBe(true);
    }
  });
});
