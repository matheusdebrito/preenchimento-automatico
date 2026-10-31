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
    expect(publicServices(catalog)).toHaveLength(18);
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao')).not.toBeNull();
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      transferTarget: 'propriedade',
    })?.formVersionIds).toEqual([
      'requerimento-ma-v1',
      'bdmoto-v1',
      'autorizacao-transferencia-ma-v1',
      'declaracao-residencia-ma-v1',
    ]);
  });

  it('pergunta sobre coproprietário em todos os serviços de embarcação', () => {
    const vesselServiceIds = [
      'inscricao-embarcacao',
      'transferencia-propriedade-embarcacao',
      'renovacao-tie-embarcacao',
      'segunda-via-tie-embarcacao',
      'alteracao-dados-embarcacao',
      'comunicacao-venda-embarcacao',
    ];
    for (const serviceId of vesselServiceIds) {
      const service = publicService(catalog, serviceId);
      expect(service?.questions.find((question) => question.id === 'hasCoOwner')).toMatchObject({
        label: 'A embarcação possui coproprietário?',
        options: ['sim', 'nao'],
      });
    }
  });

  it('mostra campos de coproprietário somente quando a resposta for sim', () => {
    const noCoOwner = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_6_ate_12m',
      initialResponsibilityTerm: 'nao',
      hasCoOwner: 'nao',
    });
    const noCoOwnerBade = noCoOwner?.reviewForms.find((form) =>
      form.formVersionId === 'bade-er-2026-v1')?.fields.map((field) => field.id) ?? [];
    expect(noCoOwnerBade.some((fieldId) => fieldId.startsWith('coOwner.'))).toBe(false);

    const withCoOwner = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_6_ate_12m',
      initialResponsibilityTerm: 'nao',
      hasCoOwner: 'sim',
    });
    const withCoOwnerBade = withCoOwner?.reviewForms.find((form) =>
      form.formVersionId === 'bade-er-2026-v1')?.fields.map((field) => field.id) ?? [];
    expect(withCoOwnerBade).toContain('coOwner.fullName');
    expect(withCoOwnerBade).toContain('coOwner.cpf');
    expect(withCoOwnerBade).toContain('coOwner.address');

    const transferNo = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      transferTarget: 'propriedade',
      hasCoOwner: 'nao',
    });
    const transferNoAuth = transferNo?.reviewForms.find((form) =>
      form.formVersionId === 'autorizacao-transferencia-ma-v1')
      ?.fields.map((field) => field.id) ?? [];
    expect(transferNoAuth.some((fieldId) => fieldId.startsWith('coOwner.'))).toBe(false);

    const transferYes = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      transferTarget: 'propriedade',
      hasCoOwner: 'sim',
    });
    const transferYesAuth = transferYes?.reviewForms.find((form) =>
      form.formVersionId === 'autorizacao-transferencia-ma-v1')
      ?.fields.map((field) => field.id) ?? [];
    expect(transferYesAuth).toContain('coOwner.fullName');
    expect(transferYesAuth).toContain('coOwner.cpf');
  });

  it('condiciona documentos de propriedade no serviço unificado de transferência', () => {
    const jurisdiction = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      transferTarget: 'jurisdicao',
    });
    expect(jurisdiction?.documentRequirements.map((item) => item.id))
      .not.toContain('seller-identity-transfer');
    expect(jurisdiction?.documentRequirements.map((item) => item.id))
      .not.toContain('vessel-origin-document-transfer');
    expect(jurisdiction?.formVersionIds)
      .not.toContain('autorizacao-transferencia-er-2026-v1');

    const combined = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      transferTarget: 'propriedade_jurisdicao',
    });
    expect(combined?.documentRequirements.map((item) => item.id))
      .toContain('seller-identity-transfer');
    expect(combined?.documentRequirements.map((item) => item.id))
      .toContain('vessel-origin-document-transfer');
    expect(combined?.formVersionIds)
      .toContain('autorizacao-transferencia-er-2026-v1');
  });

  it('publica inscrição para exame com 5-H e uploads opcionais', () => {
    const enrollment = publicService(catalog, 'inscricao-exame-amador', {
      amateurCategory: 'capitao',
    });
    expect(enrollment).not.toBeNull();
    expect(enrollment?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);
    expect(enrollment?.documentRequirements.map((item) => item.id))
      .toEqual(['applicant-identity', 'current-cha', 'residence-proof']);
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
    expect(mta?.documentRequirements.map((item) => item.id))
      .toContain('current-cha');
  });

  it('publica renovação da CHA com uploads opcionais e pacote condicional 5-D', () => {
    const regular = publicService(catalog, 'renovacao-cha-amador', {
      amateurCategory: 'arrais',
      chaSituation: 'regular',
    });
    expect(regular).not.toBeNull();
    expect(regular?.formVersionIds).toEqual(['requerimento-cha-amador-2026-v1']);
    expect(regular?.documentRequirements.map((item) => item.id))
      .toEqual(['applicant-identity', 'current-cha', 'residence-proof']);
    const cha = regular?.documentRequirements.find((item) => item.id === 'current-cha');
    expect(cha?.extraction?.documentType).toBe('cha');
    expect(cha?.extraction?.allowedFieldIds).toEqual([
      'person.fullName',
      'person.cpf',
      'amateur.chaNumber',
      'amateur.category',
      'amateur.chaIssueDate',
    ]);
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

  it('trata o vendedor como requerente e oferece identidade separada do comprador no comunicado de venda', () => {
    const service = publicService(catalog, 'comunicacao-venda-embarcacao', {
      vesselType: 'embarcacao',
    });
    expect(service).not.toBeNull();

    const requirements = service?.documentRequirements ?? [];
    expect(requirements.map((item) => item.id)).toEqual([
      'seller-applicant-identity',
      'buyer-identity',
      'seller-residence-proof',
      'buyer-residence-proof',
      'tie',
      'vessel-origin-document',
    ]);

    const seller = requirements.find((item) => item.id === 'seller-applicant-identity');
    const buyer = requirements.find((item) => item.id === 'buyer-identity');
    const sellerResidence = requirements.find((item) => item.id === 'seller-residence-proof');
    const buyerResidence = requirements.find((item) => item.id === 'buyer-residence-proof');
    expect(seller?.label).toContain('requerente/vendedor');
    expect(seller?.extraction?.allowedFieldIds).toContain('seller.fullName');
    expect(seller?.extraction?.allowedFieldIds).not.toContain('person.fullName');
    expect(buyer?.extraction?.allowedFieldIds).toContain('person.fullName');
    expect(buyer?.extraction?.allowedFieldIds).not.toContain('seller.fullName');
    expect(buyer?.extraction?.allowedFieldIds).not.toContain('declarant.fullName');
    expect(sellerResidence?.extraction?.allowedFieldIds).toContain('seller.address');
    expect(sellerResidence?.extraction?.allowedFieldIds).not.toContain('person.address');
    expect(buyerResidence?.extraction?.allowedFieldIds).toContain('person.address');
    expect(buyerResidence?.extraction?.allowedFieldIds).not.toContain('seller.address');
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
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
          transferTarget: 'propriedade',
        },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'autorizacao-transferencia-er-2026-v1', 'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
          transferTarget: 'jurisdicao',
        },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
          transferTarget: 'propriedade_jurisdicao',
        },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'autorizacao-transferencia-er-2026-v1', 'declaracao-residencia-er-2026-v1'],
      },
      {
        id: 'renovacao-tie-embarcacao',
        answers: {
          vesselType: 'embarcacao', vesselBand: 'ate_6m',
          tieSituation: 'regular', dataChanged: 'nao',
        },
        forms: ['requerimento-embarcacao-er-2026-v1', 'bsade-er-2026-v1',
          'declaracao-residencia-er-2026-v1'],
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

  it('inclui BSADE ou BADE na renovação mesmo quando dataChanged é nao', () => {
    expect(publicService(catalog, 'renovacao-tie-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      dataChanged: 'nao',
    })?.formVersionIds).toContain('bsade-er-2026-v1');

    const larger = publicService(catalog, 'renovacao-tie-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'maior_6_ate_12m',
      tieSituation: 'regular',
      dataChanged: 'nao',
    })?.formVersionIds ?? [];
    expect(larger).toContain('bade-er-2026-v1');
    expect(larger).not.toContain('bsade-er-2026-v1');
  });

  it('seleciona BSADE até 6 m e BADE acima de 6 m conforme a NORMAM-211', () => {
    expect(publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular', transferTarget: 'jurisdicao',
    })?.formVersionIds).toContain('bsade-er-2026-v1');

    const small = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'maior_6_ate_12m', tieSituation: 'regular', transferTarget: 'jurisdicao',
    })?.formVersionIds;
    expect(small).toContain('bade-er-2026-v1');
    expect(small).not.toContain('bsade-er-2026-v1');

    const medium = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao', vesselBand: 'maior_12_menor_24m', tieSituation: 'regular', transferTarget: 'jurisdicao',
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
      boatAlterationTarget: 'dados_caracteristicas',
    });
    expect(alterationRegular?.formVersionIds).not.toContain('termo-responsabilidade-er-2026-v1');

    const alterationArtisanal = publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      responsibilityTermCase: 'construcao_artesanal',
      boatAlterationTarget: 'dados_e_motor',
      rowToMotorConversion: 'nao',
    });
    expect(alterationArtisanal?.formVersionIds).toContain('termo-responsabilidade-er-2026-v1');

    const motorOnly = publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      responsibilityTermCase: 'nao',
      boatAlterationTarget: 'motor',
      rowToMotorConversion: 'nao',
    });
    expect(motorOnly).not.toBeNull();
    expect(motorOnly?.documentRequirements.map((item) => item.id))
      .toContain('motor-document-boat');
    expect(motorOnly?.documentRequirements.map((item) => item.id))
      .not.toContain('vessel-origin-document-boat');
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
        answers: {
          vesselType: 'moto_aquatica', tieSituation: 'regular', transferTarget: 'propriedade',
        },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
          'declaracao-residencia-ma-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: {
          vesselType: 'moto_aquatica', tieSituation: 'regular', transferTarget: 'jurisdicao',
        },
        forms: ['requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1'],
      },
      {
        id: 'transferencia-propriedade-embarcacao',
        answers: {
          vesselType: 'moto_aquatica', tieSituation: 'regular',
          transferTarget: 'propriedade_jurisdicao',
        },
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
        answers: {
          vesselType: 'moto_aquatica',
          motoCharacteristicsChanged: 'nao',
          motoTieSecondCopyReason: 'extravio',
        },
        forms: ['requerimento-ma-v1', 'declaracao-perda-tie-ma-v1',
          'declaracao-residencia-ma-v1'],
      },
      {
        id: 'alteracao-dados-embarcacao',
        answers: {
          vesselType: 'moto_aquatica',
          tieSituation: 'regular',
          motoAlterationTarget: 'dados_embarcacao_motor',
        },
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

    const secondCopy = catalog.serviceForms.find((relation) =>
      relation.serviceId === 'segunda-via-tie-embarcacao' &&
      relation.formVersionId === 'requerimento-ma-v1');
    expect(secondCopy?.answerBindings).toMatchObject({
      'process.tieSecondCopyReason': 'motoTieSecondCopyReason',
    });

    const dataChange = catalog.serviceForms.find((relation) =>
      relation.serviceId === 'alteracao-dados-embarcacao' &&
      relation.formVersionId === 'requerimento-ma-v1');
    expect(dataChange?.answerValueMappings).toMatchObject({
      'process.dataChangeTarget': {
        questionId: 'motoAlterationTarget',
      },
    });
  });

  it('mostra local e data para revisão sem expor outros campos internos do processo', () => {
    const service = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      initialResponsibilityTerm: 'nao',
    });
    const ids = service?.reviewFields.map((field) => field.id) ?? [];
    expect(ids).toContain('process.place');
    expect(ids).toContain('process.date');
    expect(ids).not.toContain('process.vesselAction');
    expect(ids).not.toContain('process.inscription');
  });

  it('oculta venda e vendedor no BSADE fora de transferência de propriedade', () => {
    const inscription = publicService(catalog, 'inscricao-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      initialResponsibilityTerm: 'nao',
    });
    const inscriptionIds = inscription?.reviewForms.find((form) =>
      form.formVersionId === 'bsade-er-2026-v1')?.fields.map((field) => field.id) ?? [];
    expect(inscriptionIds).not.toContain('sale.invoice');
    expect(inscriptionIds).not.toContain('seller.fullName');

    const jurisdiction = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      transferTarget: 'jurisdicao',
    });
    const jurisdictionIds = jurisdiction?.reviewForms.find((form) =>
      form.formVersionId === 'bsade-er-2026-v1')?.fields.map((field) => field.id) ?? [];
    expect(jurisdictionIds).not.toContain('sale.invoice');
    expect(jurisdictionIds).not.toContain('seller.fullName');

    const property = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'embarcacao',
      vesselBand: 'ate_6m',
      tieSituation: 'regular',
      transferTarget: 'propriedade',
    });
    const propertyIds = property?.reviewForms.find((form) =>
      form.formVersionId === 'bsade-er-2026-v1')?.fields.map((field) => field.id) ?? [];
    expect(propertyIds).toContain('sale.invoice');
    expect(propertyIds).toContain('seller.fullName');
  });

  it('oculta venda e vendedor no BDMOTO fora de transferência de propriedade', () => {
    const alteration = publicService(catalog, 'alteracao-dados-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      motoAlterationTarget: 'dados_embarcacao_motor',
    });
    const alterationIds = alteration?.reviewForms.find((form) =>
      form.formVersionId === 'bdmoto-v1')?.fields.map((field) => field.id) ?? [];
    expect(alterationIds).not.toContain('sale.invoice');
    expect(alterationIds).not.toContain('seller.fullName');

    const jurisdiction = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      transferTarget: 'jurisdicao',
    });
    const jurisdictionIds = jurisdiction?.reviewForms.find((form) =>
      form.formVersionId === 'bdmoto-v1')?.fields.map((field) => field.id) ?? [];
    expect(jurisdictionIds).not.toContain('sale.invoice');
    expect(jurisdictionIds).not.toContain('seller.fullName');

    const property = publicService(catalog, 'transferencia-propriedade-embarcacao', {
      vesselType: 'moto_aquatica',
      tieSituation: 'regular',
      transferTarget: 'propriedade',
    });
    const propertyIds = property?.reviewForms.find((form) =>
      form.formVersionId === 'bdmoto-v1')?.fields.map((field) => field.id) ?? [];
    expect(propertyIds).toContain('sale.invoice');
    expect(propertyIds).toContain('seller.fullName');
  });

  it('não pede novamente a categoria da CHA quando ela vem da pergunta do serviço', () => {
    const service = publicService(catalog, 'renovacao-cha-amador', {
      amateurCategory: 'mestre',
      chaSituation: 'furtada',
    });
    const lossFields = service?.reviewForms.find((form) =>
      form.formVersionId === 'declaracao-extravio-cha-amador-2026-v1')
      ?.fields.map((field) => field.id) ?? [];
    expect(lossFields).not.toContain('amateur.category');
  });

  it('filtra requisitos condicionais e não revela caminhos privados', () => {
    const data = fixture();
    expect(publicService(data, 's')?.documentRequirements).toHaveLength(1);
    expect(publicService(data, 's', { extra: 'yes' })?.documentRequirements).toHaveLength(2);
    const result = publicService(data, 's');
    expect(result?.formVersionIds).toEqual(['form-v1']);
    expect(result?.reviewFields).toEqual([
      { id: 'person.fullName', label: 'Nome', valueKind: 'text', required: false },
    ]);
    expect(result?.reviewForms).toEqual([{
      formVersionId: 'form-v1',
      formId: 'form',
      name: 'Teste',
      fields: [
        { id: 'person.fullName', label: 'Nome', valueKind: 'text', required: false },
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
    expect(result?.reviewForms[0]?.fields[0]?.required).toBe(false);
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
