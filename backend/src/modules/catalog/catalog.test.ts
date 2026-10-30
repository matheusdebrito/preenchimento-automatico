import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { motoAquaticaServiceForms } from './vessel-services.js';
import { BADE_ALLOWED_FIELD_NUMBERS } from './normam211-mappings.js';
import { validateCatalog } from './validate-catalog.js';
import type { CatalogDefinition } from './contracts.js';

/** Isolated synthetic fixture; NO real form or official approval is implied. */
function sharedFormFixture(): CatalogDefinition {
  return {
    fields: [{ id: 'person.fullName', label: 'Nome', valueKind: 'text' }],
    forms: [{ id: 'example-form', name: 'Modelo sintético' }],
    versions: [{
      id: 'example-form-v1', formId: 'example-form', revision: 'v1',
      officialRevision: null, regulation: 'N/A - teste',
      sourceUrl: 'https://example.invalid/form.pdf', verifiedAt: '2026-10-26',
      sha256: 'a'.repeat(64), templatePath: 'backend/templates/example-form/v1/original.pdf',
      pdfKind: 'ACROFORM', status: 'VERIFIED',
    }],
    mappings: [{
      id: 'example-map-v1', formVersionId: 'example-form-v1',
      revision: 'v1', status: 'APPROVED',
      reviewedAt: '2026-10-26', reviewer: 'revisor-fixture',
      reportPath: 'docs/mapping-reports/fixture.md',
      placements: [{
        kind: 'ACROFORM', fieldId: 'person.fullName',
        required: true, pdfFieldName: 'person_name',
      }],
    }],
    services: [
      { id: 'service-a', title: 'Serviço A', description: 'Teste', creditCost: 1,
        status: 'AVAILABLE', questions: [], documentRequirements: [] },
      { id: 'service-b', title: 'Serviço B', description: 'Teste', creditCost: 1,
        status: 'AVAILABLE', questions: [{ id: 'mode', label: 'Modalidade', options: ['yes', 'no'] }],
        documentRequirements: [{
          id: 'document-b', label: 'Documento de teste', required: true,
          conditions: [{ questionId: 'mode', equals: 'yes' }],
        }] },
    ],
    serviceForms: [
      { serviceId: 'service-a', formVersionId: 'example-form-v1', order: 1 },
      { serviceId: 'service-b', formVersionId: 'example-form-v1', order: 1,
        conditions: [{ questionId: 'mode', equals: 'yes' }] },
    ],
  };
}

describe('catálogo reutilizável de formulários', () => {
  it('publica todos os serviços homologados somente com versões e mapas aprovados', () => {
    expect(catalog.services).toHaveLength(21);
    expect(catalog.services.filter((service) => service.status === 'AVAILABLE')).toHaveLength(21);
    expect(catalog.services.filter((service) => service.status === 'DRAFT')).toHaveLength(0);
    expect(catalog.forms).toHaveLength(20);
    expect(catalog.versions).toHaveLength(20);
    expect(catalog.versions.filter((version) => version.status === 'VERIFIED')).toHaveLength(20);
    expect(catalog.versions.filter((version) => version.status === 'IDENTIFIED')).toHaveLength(0);
    expect(catalog.versions.filter((version) => version.status === 'VERIFIED').every((version) =>
      version.templatePath !== null && version.sha256 !== null)).toBe(true);
    expect(catalog.mappings).toHaveLength(20);
    expect(catalog.mappings.filter((mapping) =>
      mapping.formVersionId.includes('-er-2026-')).every((mapping) =>
      mapping.status === 'APPROVED')).toBe(true);
    expect(catalog.mappings.filter((mapping) =>
      ['requerimento-cha-amador-2026-v1', 'declaracao-extravio-cha-amador-2026-v1']
        .includes(mapping.formVersionId)).every((mapping) =>
      mapping.status === 'APPROVED')).toBe(true);
    expect(catalog.mappings.filter((mapping) =>
      mapping.formVersionId.endsWith('-ma-v1') || mapping.formVersionId === 'bdmoto-v1')
      .every((mapping) => mapping.status === 'APPROVED')).toBe(true);
    expect(catalog.serviceForms).toHaveLength(73);
    expect(catalog.services.filter((service) => service.id.includes('embarcacao')).every((service) =>
      service.questions.some((question) => question.id === 'vesselType'))).toBe(true);
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('publica os seis serviços de embarcação com as condições normativas validadas', () => {
    const ids = new Set(catalog.services.map((service) => service.id));
    for (const id of [
      'inscricao-embarcacao',
      'transferencia-propriedade-embarcacao',
      'renovacao-tie-embarcacao',
      'segunda-via-tie-embarcacao',
      'alteracao-dados-embarcacao',
      'comunicacao-venda-embarcacao',
    ]) {
      expect(ids.has(id)).toBe(true);
      expect(catalog.services.find((service) => service.id === id)?.status).toBe('AVAILABLE');
      expect(catalog.serviceForms.some((relation) => relation.serviceId === id)).toBe(true);
    }
  });

  it('unifica transferência de propriedade e/ou jurisdição em um único serviço', () => {
    const service = catalog.services.find((item) => item.id === 'transferencia-propriedade-embarcacao');
    expect(service?.title).toBe('Transferência de propriedade e/ou jurisdição');
    expect(service?.questions.find((question) => question.id === 'transferTarget')?.options)
      .toEqual(['propriedade', 'jurisdicao', 'propriedade_jurisdicao']);
    expect(catalog.services.some((item) => item.id === 'transferencia-jurisdicao-embarcacao')).toBe(false);
    expect(catalog.services.some((item) =>
      item.id === 'transferencia-propriedade-jurisdicao-embarcacao')).toBe(false);

    const authorization = catalog.serviceForms.find((relation) =>
      relation.serviceId === 'transferencia-propriedade-embarcacao' &&
      relation.formVersionId === 'autorizacao-transferencia-er-2026-v1');
    expect(authorization?.conditions).toContainEqual({
      questionId: 'transferTarget',
      oneOf: ['propriedade', 'propriedade_jurisdicao'],
    });
  });

  it('publica inscrição para exame e os demais serviços de CHA sustentados pelos anexos', () => {
    const enrollment = catalog.services.find((service) => service.id === 'inscricao-exame-amador');
    const renewal = catalog.services.find((service) => service.id === 'renovacao-cha-amador');
    const sailor = catalog.services.find((service) => service.id === 'emissao-cha-veleiro');
    const equivalence = catalog.services.find((service) => service.id === 'concessao-cha-equivalencia');
    const mta = catalog.services.find((service) => service.id === 'renovacao-cha-agregacao-mta');
    expect(enrollment?.status).toBe('AVAILABLE');
    expect(renewal?.status).toBe('AVAILABLE');
    expect(sailor?.status).toBe('AVAILABLE');
    expect(equivalence?.status).toBe('AVAILABLE');
    expect(mta?.status).toBe('AVAILABLE');
    expect(catalog.forms.some((form) => form.id === 'requerimento-cha-amador')).toBe(true);
    expect(catalog.forms.some((form) => form.id === 'declaracao-extravio-cha-amador')).toBe(true);
    expect(catalog.serviceForms.some((relation) =>
      relation.serviceId === 'renovacao-cha-amador' &&
      relation.formVersionId === 'declaracao-extravio-cha-amador-2026-v1')).toBe(true);
  });

  it('unifica alteração de dados e motor preservando as condições do Anexo 3-C', () => {
    const service = catalog.services.find((item) => item.id === 'alteracao-dados-embarcacao');
    expect(service?.status).toBe('AVAILABLE');
    expect(catalog.services.some((item) => item.id === 'alteracao-motor-embarcacao')).toBe(false);
    expect(service?.questions.some((question) => question.id === 'boatAlterationTarget')).toBe(true);
    expect(service?.questions.some((question) => question.id === 'motoAlterationTarget')).toBe(true);
    expect(service?.questions.some((question) => question.id === 'rowToMotorConversion')).toBe(true);

    const term = catalog.serviceForms.find((relation) =>
      relation.serviceId === 'alteracao-dados-embarcacao' &&
      relation.formVersionId === 'termo-responsabilidade-er-2026-v1');
    expect(term?.conditions).toContainEqual({
      questionId: 'responsibilityTermCase',
      oneOf: ['estaleiro_extinto', 'construcao_artesanal'],
    });

    const motorDocuments = service?.documentRequirements.filter((requirement) =>
      requirement.id.startsWith('motor-document')) ?? [];
    expect(motorDocuments).toHaveLength(2);
    expect(service?.documentRequirements.some((requirement) =>
      requirement.id === 'row-to-motor-technical-declaration' ||
      requirement.id === 'technical-responsibility-document' ||
      requirement.id.startsWith('moto-technical-responsibility'))).toBe(false);
  });

  it('libera inscrição inicial até 24 m e gera o Anexo 3-C somente quando informado', () => {
    const service = catalog.services.find((item) => item.id === 'inscricao-embarcacao');
    const band = service?.questions.find((question) => question.id === 'vesselBand');
    const responsibility = service?.questions.find((question) =>
      question.id === 'initialResponsibilityTerm');
    expect(band?.unavailableOptions ?? []).not.toContain('maior_12_menor_24m');
    expect(responsibility?.options).toEqual(['nao', 'sim']);

    const term = catalog.serviceForms.find((relation) =>
      relation.serviceId === 'inscricao-embarcacao' &&
      relation.formVersionId === 'termo-responsabilidade-er-2026-v1');
    expect(term?.conditions).toContainEqual({
      questionId: 'initialResponsibilityTerm',
      equals: 'sim',
    });
    expect(term?.fixedValues).toMatchObject({ 'process.constructionAction': 'construída' });
  });

  it('mantém BADE/BSADE na renovação de TIE/TIEM mesmo sem alteração', () => {
    const relations = catalog.serviceForms.filter((relation) =>
      relation.serviceId === 'renovacao-tie-embarcacao');
    const request = relations.find((relation) =>
      relation.formVersionId === 'requerimento-embarcacao-er-2026-v1');
    const bsade = relations.find((relation) => relation.formVersionId === 'bsade-er-2026-v1');
    const bade = relations.find((relation) => relation.formVersionId === 'bade-er-2026-v1');
    const loss = relations.find((relation) =>
      relation.formVersionId === 'declaracao-perda-tie-er-2026-v1');

    expect(request?.conditions).toEqual([{ questionId: 'vesselType', equals: 'embarcacao' }]);
    expect(bsade?.conditions).not.toContainEqual({ questionId: 'dataChanged', equals: 'sim' });
    expect(bade?.conditions).not.toContainEqual({ questionId: 'dataChanged', equals: 'sim' });
    expect(loss?.conditions).toContainEqual({ questionId: 'tieSituation', equals: 'extraviado' });
  });

  it('limita o BADE aos números de campo definidos pelo produto', () => {
    expect(BADE_ALLOWED_FIELD_NUMBERS).toEqual([
      2, 3, 4, 8, 9, 10, 16, 17, 20, 21, 22, 23, 24, 25, 26,
      39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
      53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
    ]);
    expect(BADE_ALLOWED_FIELD_NUMBERS).not.toContain(52);
    expect(BADE_ALLOWED_FIELD_NUMBERS).not.toContain(66);

    const mapping = catalog.mappings.find((item) => item.formVersionId === 'bade-er-2026-v1');
    const fieldIds = new Set(mapping?.placements.map((placement) => placement.fieldId) ?? []);
    expect(fieldIds).toEqual(new Set([
      'vessel.name',
      'vessel.registration',
      'vessel.registrationDate',
      'vessel.navigationArea',
      'vessel.activity',
      'vessel.passengerCount',
      'vessel.hullId',
      'vessel.year',
      'vessel.length',
      'vessel.breadth',
      'vessel.depth',
      'vessel.propulsionType',
      'vessel.motorCount',
      'vessel.totalPropulsionPowerKw',
      'vessel.motorSerial',
      'person.fullName',
      'person.cpf',
      'person.identity',
      'person.issuer',
      'person.issuerState',
      'person.address',
      'person.streetNumber',
      'person.apartment',
      'person.postalCode',
      'person.neighborhood',
      'person.city',
      'person.state',
      'person.email',
      'person.nationality',
      'person.phone',
      'coOwner.fullName',
      'coOwner.cpf',
      'coOwner.identity',
      'coOwner.issuer',
      'coOwner.issuerState',
      'coOwner.address',
      'coOwner.postalCode',
      'coOwner.neighborhood',
      'coOwner.city',
      'coOwner.state',
      'coOwner.email',
      'coOwner.nationality',
      'coOwner.phone',
    ]));
    expect(fieldIds.has('person.fax')).toBe(false);
    expect(fieldIds.has('coOwner.fax')).toBe(false);
    expect(fieldIds.has('process.date')).toBe(false);
    expect(fieldIds.has('vessel.imoNumber')).toBe(false);
    expect(fieldIds.has('vessel.dpemNumber')).toBe(false);
  });

  it('publica toda a matriz NORMAM-212 homologada para Moto Aquática', () => {
    const byService = new Map<string, Set<string>>();
    for (const relation of motoAquaticaServiceForms) {
      const forms = byService.get(relation.serviceId) ?? new Set<string>();
      forms.add(relation.formVersionId);
      byService.set(relation.serviceId, forms);
      expect(relation.conditions).toContainEqual({
        questionId: 'vesselType',
        equals: 'moto_aquatica',
      });

      const service = catalog.services.find((item) => item.id === relation.serviceId);
      expect(service).toBeDefined();
      for (const condition of relation.conditions ?? []) {
        const question = service?.questions.find((item) => item.id === condition.questionId);
        expect(question, relation.serviceId + ':' + condition.questionId).toBeDefined();
        if (condition.equals !== undefined) {
          expect(question?.options).toContain(condition.equals);
        }
        for (const value of condition.oneOf ?? []) expect(question?.options).toContain(value);
      }
    }

    expect(byService.get('inscricao-embarcacao')).toEqual(new Set([
      'requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1',
    ]));
    expect(byService.get('transferencia-propriedade-embarcacao')).toEqual(new Set([
      'requerimento-ma-v1', 'bdmoto-v1', 'autorizacao-transferencia-ma-v1',
      'declaracao-residencia-ma-v1', 'declaracao-perda-tie-ma-v1',
    ]));
    expect(byService.get('renovacao-tie-embarcacao')).toEqual(new Set([
      'requerimento-ma-v1', 'bdmoto-v1', 'declaracao-residencia-ma-v1',
      'declaracao-perda-tie-ma-v1',
    ]));

    const renewalBdmoto = motoAquaticaServiceForms.find((relation) =>
      relation.serviceId === 'renovacao-tie-embarcacao' &&
      relation.formVersionId === 'bdmoto-v1');
    expect(renewalBdmoto?.conditions).toContainEqual({
      questionId: 'motoCharacteristicsChanged',
      equals: 'sim',
    });

    const vesselType = catalog.services
      .find((service) => service.id === 'renovacao-tie-embarcacao')
      ?.questions.find((question) => question.id === 'vesselType');
    expect(vesselType?.unavailableOptions ?? []).not.toContain('moto_aquatica');
  });

  it('usa rótulos simples para rua e número sem alterar os IDs semânticos', () => {
    expect(catalog.fields.find((field) => field.id === 'person.address')?.label).toBe('Rua');
    expect(catalog.fields.find((field) => field.id === 'person.streetNumber')?.label).toBe('Número');
    expect(catalog.fields.find((field) => field.id === 'seller.address')?.label)
      .toBe('Rua do vendedor');
    expect(catalog.fields.find((field) => field.id === 'seller.streetNumber')?.label)
      .toBe('Número do vendedor');
  });

  it('mantém perfis de análise documental em todos os serviços de embarcação', () => {
    const vesselServices = catalog.services.filter((service) => service.id.includes('embarcacao'));
    expect(vesselServices).toHaveLength(6);
    for (const service of vesselServices) {
      expect(service.documentRequirements.length).toBeGreaterThan(0);
      expect(service.documentRequirements.every((requirement) => requirement.extraction)).toBe(true);
    }
    const generic = vesselServices.flatMap((service) => service.documentRequirements)
      .filter((requirement) => requirement.extraction?.documentType === 'supporting-document');
    expect(generic.length).toBeGreaterThan(0);
    const requirementIds = vesselServices.flatMap((service) =>
      service.documentRequirements.map((requirement) => requirement.id));
    expect(requirementIds).not.toContain('power-of-attorney');
    expect(requirementIds).not.toContain('gru-receipt');
    expect(requirementIds).not.toContain('dpem-proof');
    expect(requirementIds).not.toContain('vessel-photos');
  });

  it('mantém origem de campos explícita em todo perfil de extração', () => {
    const requirements = catalog.services.flatMap((service) => service.documentRequirements)
      .filter((requirement) => requirement.extraction);
    expect(requirements.length).toBeGreaterThan(0);
    for (const requirement of requirements) {
      const allowed = requirement.extraction!.allowedFieldIds;
      expect(new Set(allowed).size).toBe(allowed.length);
      expect(allowed.every((fieldId) =>
        catalog.fields.some((field) => field.id === fieldId))).toBe(true);
      expect(allowed.some((fieldId) => fieldId.startsWith('process.'))).toBe(false);
    }
  });

  it('rejeita política de origem com campo inexistente ou de processo', () => {
    const fixture = sharedFormFixture();
    fixture.services = [{
      ...fixture.services[0]!,
      documentRequirements: [{
        id: 'identity',
        label: 'Identidade',
        required: false,
        extraction: {
          documentType: 'identity',
          subjectRole: 'person',
          allowedFieldIds: ['missing.field', 'process.fake'],
        },
      }],
    }, fixture.services[1]!];

    const problems = validateCatalog(fixture).join(' ');
    expect(problems).toContain('campo de extração inválido missing.field');
    expect(problems).toContain('campo de extração inválido process.fake');
  });

  it('mantém o domínio do MVP restrito ao único motor aprovado', () => {
    const ids = new Set(catalog.fields.map((field) => field.id));
    expect(ids.has('vessel.motorBrand')).toBe(true);
    expect(ids.has('vessel.motorPower')).toBe(true);
    expect(ids.has('vessel.motorSerial')).toBe(true);
    expect([...ids].some((id) =>
      /^vessel\.motor[1-4](?:Choice|Brand|Power|Serial)$/.test(id))).toBe(false);

    const placements = catalog.mappings.flatMap((mapping) =>
      mapping.placements.map((placement) => placement.fieldId));
    expect(placements.some((id) =>
      /^vessel\.motor[1-4](?:Choice|Brand|Power|Serial)$/.test(id))).toBe(false);
  });

  it('permite a mesma versão do PDF em dois serviços sem duplicar o mapeamento', () => {
    const fixture = sharedFormFixture();
    expect(fixture.mappings).toHaveLength(1);
    expect(fixture.serviceForms).toHaveLength(2);
    expect(validateCatalog(fixture)).toEqual([]);
  });

  it('rejeita relação que aponta para versão inexistente', () => {
    const fixture = sharedFormFixture();
    fixture.serviceForms = [{ serviceId: 'service-a', formVersionId: 'missing', order: 1 }];
    expect(validateCatalog(fixture).join(' ')).toContain('versão inexistente');
  });

  it('rejeita serviço disponível com mapeamento não aprovado', () => {
    const fixture = sharedFormFixture();
    fixture.mappings = [{ ...fixture.mappings[0]!, status: 'TESTED' }];
    expect(validateCatalog(fixture).join(' ')).toContain('sem versão/mapeamento aprovados');
  });

  it('rejeita modelos sem evidências verificáveis e caminho indevido', () => {
    const fixture = sharedFormFixture();
    fixture.versions = [{ ...fixture.versions[0]!, sha256: 'invalid',
      templatePath: '../other.pdf' }];
    const problems = validateCatalog(fixture).join(' ');
    expect(problems).toContain('SHA-256 inválido');
    expect(problems).toContain('caminho fora da estrutura');
  });

  it('rejeita campo desconhecido em mapeamento e posição repetida', () => {
    const fixture = sharedFormFixture();
    fixture.mappings = [{ ...fixture.mappings[0]!, placements: [
      { kind: 'ACROFORM', fieldId: 'unknown', required: true, pdfFieldName: 'person_name' },
      { kind: 'ACROFORM', fieldId: 'person.fullName', required: true, pdfFieldName: 'person_name' },
    ] }];
    const problems = validateCatalog(fixture).join(' ');
    expect(problems).toContain('campo inexistente');
    expect(problems).toContain('posição repetida');
  });

  it('não aceita condições com respostas não declaradas', () => {
    const fixture = sharedFormFixture();
    fixture.serviceForms = [{ serviceId: 'service-b', formVersionId: 'example-form-v1', order: 1,
      conditions: [{ questionId: 'mode', equals: 'maybe' }] }];
    expect(validateCatalog(fixture).join(' ')).toContain('resposta fora das opções');
  });

  it('valida bindings entre respostas do serviço e campos semânticos', () => {
    const fixture = sharedFormFixture();
    const serviceA = fixture.serviceForms[0]!;
    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      answerBindings: { 'person.fullName': 'mode' },
    }];
    expect(validateCatalog(fixture)).toEqual([]);

    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      answerBindings: { 'person.fullName': 'missing-question' },
    }];
    expect(validateCatalog(fixture).join(' ')).toContain('binding inválido');
  });

  it('valida mapeamentos de respostas enumeradas para texto revisado', () => {
    const fixture = sharedFormFixture();
    const serviceA = fixture.serviceForms[0]!;
    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      answerValueMappings: {
        'person.fullName': {
          questionId: 'mode',
          values: { yes: 'Sim', no: 'Não' },
        },
      },
    }];
    expect(validateCatalog(fixture)).toEqual([]);

    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      answerValueMappings: {
        'person.fullName': {
          questionId: 'mode',
          values: { maybe: 'Talvez' },
        },
      },
    }];
    expect(validateCatalog(fixture).join(' ')).toContain('mapeamento de resposta inválido');
  });

  it('aceita condição oneOf somente com opções declaradas', () => {
    const fixture = sharedFormFixture();
    const serviceA = fixture.serviceForms[0]!;
    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      conditions: [{ questionId: 'mode', oneOf: ['yes', 'no'] }],
    }];
    expect(validateCatalog(fixture)).toEqual([]);

    fixture.serviceForms = [serviceA, {
      serviceId: 'service-b',
      formVersionId: 'example-form-v1',
      order: 1,
      conditions: [{ questionId: 'mode', oneOf: ['yes', 'maybe'] }],
    }];
    expect(validateCatalog(fixture).join(' ')).toContain('respostas fora das opções em oneOf');
  });

  it('não permite versão desatualizada em serviço ativo', () => {
    const fixture = sharedFormFixture();
    fixture.versions = [{ ...fixture.versions[0]!, status: 'OUTDATED' }];
    const problems = validateCatalog(fixture).join(' ');
    expect(problems).toContain('versão desatualizada');
    expect(problems).toContain('sem versão/mapeamento aprovados');
  });

  it('rejeita colisões de identificadores e revisão', () => {
    const fixture = sharedFormFixture();
    fixture.forms = [...fixture.forms, fixture.forms[0]!];
    expect(validateCatalog(fixture).join(' ')).toContain('identificador duplicado');
  });

  it('rejeita coordenadas impossíveis antes de renderizar um PDF', () => {
    const fixture = sharedFormFixture();
    fixture.versions = [{ ...fixture.versions[0]!, pdfKind: 'STATIC' }];
    fixture.mappings = [{ ...fixture.mappings[0]!, placements: [
      { kind: 'COORDINATES', fieldId: 'person.fullName', required: true,
        pageIndex: 0, x: -10, y: 400, fontSize: 10, maxWidth: 150 },
    ] }];
    expect(validateCatalog(fixture).join(' ')).toContain('coordenadas inválidas');
  });
});
