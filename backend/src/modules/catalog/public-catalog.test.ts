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
  it('publica todos os serviços homologados e aceita moto aquática', () => {
    expect(publicServices(catalog)).toHaveLength(14);
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao')).not.toBeNull();
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
    })?.formVersionIds).toEqual([
      'requerimento-ma-v1',
      'bdmoto-v1',
      'autorizacao-transferencia-ma-v1',
      'declaracao-residencia-ma-v1',
    ]);
  });

  it('publica inscrição para exame com 5-H e uploads opcionais', () => {
    const enrollment = publicService(catalog, 'inscricao-exame-amador', {
      amateurCategory: 'capitao',
    });
    expect(enrollment).not.toBeNull();
    expect(enrollment?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);
    expect(enrollment?.documentRequirements.map((item) => item.id))
      .toEqual(['applicant-identity', 'residence-proof']);
    expect(enrollment?.documentRequirements.every((item) => item.required === false)).toBe(true);
  });

  it('publica Veleiro e equivalência profissional usando o 5-H aprovado', () => {
    const sailor = publicService(catalog, 'emissao-cha-veleiro');
    expect(sailor?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);
    expect(sailor?.documentRequirements.every((item) => item.required === false)).toBe(true);

    const equivalence = publicService(catalog, 'concessao-cha-equivalencia', {
      amateurCategory: 'capitao',
    });
    expect(equivalence?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);

    const mta = publicService(catalog, 'renovacao-cha-agregacao-mta', {
      amateurCategory: 'arrais', motonautaDeclaration: 'sim',
    });
    expect(mta).not.toBeNull();
    expect(mta?.formVersionIds).toEqual([
      'requerimento-cha-amador-2026-v1',
      'requerimento-motonauta-2026-v1',
    ]);
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
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m',
          initialResponsibilityTerm: 'nao',
        },
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

  it('libera os cenários homologados do Anexo 3-C sem incluí-lo fora de condição', () => {
    const initialWithoutTerm = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_12_menor_24m',
      initialResponsibilityTerm: 'nao',
    });
    expect(initialWithoutTerm?.formVersionIds).toEqual([
      'requerimento-embarcacao-er-2026-v1',
      'bade-er-2026-v1',
      'declaracao-residencia-er-2026-v1',
    ]);

    const initialWithTerm = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_12_menor_24m',
      initialResponsibilityTerm: 'sim',
    });
    expect(initialWithTerm?.formVersionIds).toContain('termo-responsabilidade-er-2026-v1');

    const alterationRegular = publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      responsibilityTermCase: 'nao',
    });
    expect(alterationRegular?.formVersionIds).not.toContain('termo-responsabilidade-er-2026-v1');

    const alterationArtisanal = publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      responsibilityTermCase: 'construcao_artesanal',
    });
    expect(alterationArtisanal?.formVersionIds).toContain('termo-responsabilidade-er-2026-v1');

    expect(publicService(catalog, 'alteracao-motor-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      responsibilityTermCase: 'nao',
      rowToMotorConversion: 'nao',
    })).not.toBeNull();
  });

  it('compõe os pacotes homologados da NORMAM-212 para moto aquática', () => {
    const cases = [
      {
        id: 'inscricao-embarcacao',
        answers: { vesselType: 'moto_aquatica' },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: { vesselType: 'moto_aquatica', tieSituation: 'regular' },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
          'declaracao-residencia-ma-v1'],
      },
      {
        id: 'transferencia-jurisdicao-embarcacao',
        answers: { vesselType: 'moto_aquatica', tieSituation: 'regular' },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'transferencia-propriedade-jurisdicao-embarcacao',
        answers: { vesselType: 'moto_aquatica', tieSituation: 'regular' },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
          'declaracao-residencia-ma-v1'],
      },
      {
        id: 'renovacao-tie-embarcacao',
        answers: {
          vesselType: 'moto_aquatica',
          tieSituation: 'regular',
          motoCharacteristicsChanged: 'nao',
        },
        forms: ['requerimento-ma-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'segunda-via-tie-embarcacao',
        answers: { vesselType: 'moto_aquatica', motoCharacteristicsChanged: 'nao' },
        forms: ['requerimento-ma-v1', 'declaracao-perda-tie-ma-v1',
          'declaracao-residencia-ma-v1'],
      },
      {
        id: 'alteracao-dados-embarcacao',
        answers: {
          vesselType: 'moto_aquatica',
          tieSituation: 'regular',
          motoCharacteristicAlteration: 'nao',
        },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'alteracao-motor-embarcacao',
        answers: { vesselType: 'moto_aquatica', tieSituation: 'regular' },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'comunicacao-venda-embarcacao',
        answers: { vesselType: 'moto_aquatica' },
        forms: ['comunicacao-transferencia-ma-v1', 'autorizacao-transferencia-ma-v1'],
      },
    ] as const;

    for (const item of cases) {
      expect(publicService(catalog, item.id, item.answers)?.formVersionIds)
        .toEqual(item.forms);
    }

    expect(publicService(catalog, 'renovacao-tie-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'extraviado',
      motoCharacteristicsChanged: 'sim',
    })?.formVersionIds).toEqual([
      'requerimento-ma-v1',
      'bdmoto-v1',
      'declaracao-residencia-ma-v1',
      'declaracao-perda-tie-ma-v1',
    ]);
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
