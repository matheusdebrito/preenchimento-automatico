import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { publicService, publicServices } from './public-catalog.js';
import type { CatalogDefinition } from './contracts.js';

function fixture(): CatalogDefinition {
  return {
    fields: [{ id: 'person.fullName', label: 'Nome', valueKind: 'text' }],
    forms: [{ id: 'form', name: 'Teste' }],
    versions: [{
      id: 'form-v1', formId: 'form', revision: 'v1', officialRevision: null,
      regulation: 'Teste', sourceUrl: 'https://example.org/a.pdf',
      verifiedAt: '2026-10-26', sha256: 'a'.repeat(64),
      templatePath: 'backend/templates/form/v1/original.pdf',
      pdfKind: 'STATIC', status: 'VERIFIED',
    }],
    mappings: [{
      id: 'map-v1', formVersionId: 'form-v1', revision: 'v1',
      status: 'APPROVED', reviewedAt: '2026-10-26', reviewer: 'Fixture',
      reportPath: 'docs/fixture.md',
      placements: [{ kind: 'COORDINATES', fieldId: 'person.fullName',
        required: true, pageIndex: 0, x: 10, y: 10, fontSize: 10, maxWidth: 200 }],
    }],
    services: [{
      id: 's', title: 'Serviço', description: 'Apenas teste', status: 'AVAILABLE',
      creditCost: 1, questions: [{ id: 'extra', label: 'Extra?', options: ['yes', 'no'] }],
      documentRequirements: [{
        id: 'id', label: 'Identidade', required: true,
      }, {
        id: 'extra-document', label: 'Documento extra', required: true,
        conditions: [{ questionId: 'extra', equals: 'yes' }],
      }],
    }],
    serviceForms: [{ serviceId: 's', formVersionId: 'form-v1', order: 1 }],
  };
}

describe('projeção pública do catálogo', () => {
  it('publica sete serviços de barco e bloqueia moto aquática', () => {
    expect(publicServices(catalog)).toHaveLength(8);
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao')).not.toBeNull();
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
    })).toBeNull();
  });

  it('publica renovação da CHA com uploads opcionais e pacote condicional 5-D', () => {
    const regular = publicService(catalog, 'renovacao-cha-amador', {
      amateurCategory: 'arrais',
      chaSituation: 'regular',
    });
    expect(regular).not.toBeNull();
    expect(regular?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);
    expect(regular?.documentRequirements.map((item) => item.id))
      .toEqual(['applicant-identity', 'residence-proof']);
    expect(regular?.documentRequirements.every((item) => item.required === false)).toBe(true);

    const lost = publicService(catalog, 'renovacao-cha-amador', {
      amateurCategory: 'mestre',
      chaSituation: 'furtada',
    });
    expect(lost?.formVersionIds).toEqual([
      'requerimento-cha-amador-2026-v1',
      'declaracao-extravio-cha-amador-2026-v1',
    ]);
  });

  it('compõe corretamente os pacotes homologados para embarcação/barco', () => {
    const cases = [
      {
        id: 'inscricao-embarcacao',
        answers: { vesselType: 'embarcacao', vesselBand: 'ate_6m' },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: { vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular' },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'autorizacao-transferencia-er-2026-v1', 'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'transferencia-jurisdicao-embarcacao',
        answers: { vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular' },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'transferencia-propriedade-jurisdicao-embarcacao',
        answers: { vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular' },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'autorizacao-transferencia-er-2026-v1', 'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'renovacao-tie-embarcacao',
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m',
          tieSituation: 'regular', dataChanged: 'nao',
        },
        forms: ['requerimento-embarcacao-er-2026-v1', 'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'segunda-via-tie-embarcacao',
        answers: { vesselType: 'embarcacao', vesselBand: 'ate_6m', dataChanged: 'nao' },
        forms: ['requerimento-embarcacao-er-2026-v1', 'declaracao-perda-tie-er-2026-v1',
          'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'comunicacao-venda-embarcacao',
        answers: { vesselType: 'embarcacao' },
        forms: ['comunicacao-transferencia-er-2026-v1', 'autorizacao-transferencia-er-2026-v1'],
      },
    ] as const;

    for (const item of cases) {
      expect(publicService(catalog, item.id, item.answers)?.formVersionIds)
        .toEqual(item.forms);
    }
  });

  it('seleciona BSADE até 6 m e BADE acima de 6 m conforme a NORMAM-211', () => {
    expect(publicService(catalog, 'transferencia-jurisdicao-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
    })?.formVersionIds).toContain('bsade-er-2026-v1');

    const small = publicService(catalog, 'transferencia-jurisdicao-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'maior_6_ate_12m', tieSituation: 'regular',
    })?.formVersionIds;
    expect(small).toContain('bade-er-2026-v1');
    expect(small).not.toContain('bsade-er-2026-v1');

    const medium = publicService(catalog, 'transferencia-jurisdicao-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'maior_12_menor_24m', tieSituation: 'regular',
    })?.formVersionIds;
    expect(medium).toContain('bade-er-2026-v1');
  });

  it('bloqueia cenários ainda dependentes do anexo 3-C', () => {
    expect(publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_12_menor_24m',
    })).toBeNull();
    expect(publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
    })).toBeNull();
    expect(publicService(catalog, 'alteracao-motor-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
    })).toBeNull();
  });

  it('filtra requisitos condicionais e não revela caminhos privados', () => {
    const data = fixture();
    expect(publicService(data, 's')?.documentRequirements).toHaveLength(1);
    expect(publicService(data, 's', { extra: 'yes' })?.documentRequirements).toHaveLength(2);
    const result = publicService(data, 's');
    expect(result?.formVersionIds).toEqual(['form-v1']);
    expect(result?.reviewFields).toEqual([
      { id: 'person.fullName', label: 'Nome', valueKind: 'text', required: true },
    ]);
    expect(result?.reviewForms).toEqual([{
      formVersionId: 'form-v1',
      formId: 'form',
      name: 'Teste',
      fields: [
        { id: 'person.fullName', label: 'Nome', valueKind: 'text', required: true },
      ],
    }]);
    expect(JSON.stringify(result)).not.toContain('backend/templates');
  });
  it('mantém um valor semântico único mesmo quando aparece em mais de um formulário', () => {
    const data = fixture();
    data.forms = [...data.forms, { id: 'form-2', name: 'Segundo formulário' }];
    data.versions = [...data.versions, {
      ...data.versions[0]!,
      id: 'form-2-v1',
      formId: 'form-2',
      templatePath: 'backend/templates/form-2/v1/original.pdf',
    }];
    data.mappings = [...data.mappings, {
      ...data.mappings[0]!,
      id: 'map-2-v1',
      formVersionId: 'form-2-v1',
      placements: [{
        kind: 'COORDINATES',
        fieldId: 'person.fullName',
        required: false,
        pageIndex: 0,
        x: 20,
        y: 20,
        fontSize: 10,
        maxWidth: 200,
      }],
    }];
    data.serviceForms = [...data.serviceForms,
      { serviceId: 's', formVersionId: 'form-2-v1', order: 2 }];

    const result = publicService(data, 's');
    expect(result?.reviewFields).toHaveLength(1);
    expect(result?.reviewForms).toHaveLength(2);
    expect(result?.reviewForms[0]?.fields[0]?.id).toBe('person.fullName');
    expect(result?.reviewForms[0]?.fields[0]?.required).toBe(true);
    expect(result?.reviewForms[1]?.fields[0]?.id).toBe('person.fullName');
    expect(result?.reviewForms[1]?.fields[0]?.required).toBe(false);
  });

  it('falha fechado com condições inválidas ou mapeamento não aprovado', () => {
    const data = fixture();
    expect(publicService(data, 's', { extra: 'not-an-option' })).toBeNull();
    data.mappings = [{ ...data.mappings[0]!, status: 'TESTED' }];
    expect(publicService(data, 's')).toBeNull();
  });
});
