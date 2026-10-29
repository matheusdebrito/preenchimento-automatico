import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
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
  it('publica os serviços de barco somente com versões e mapas aprovados', () => {
    expect(catalog.services).toHaveLength(9);
    expect(catalog.services.filter((service) => service.status === 'AVAILABLE')).toHaveLength(7);
    expect(catalog.services.filter((service) => service.status === 'DRAFT')).toHaveLength(2);
    expect(catalog.forms).toHaveLength(14);
    expect(catalog.versions).toHaveLength(14);
    expect(catalog.versions.filter((version) => version.status === 'VERIFIED')).toHaveLength(14);
    expect(catalog.versions.filter((version) => version.status === 'IDENTIFIED')).toHaveLength(0);
    expect(catalog.versions.every((version) =>
      version.templatePath !== null && version.sha256 !== null)).toBe(true);
    expect(catalog.mappings).toHaveLength(14);
    expect(catalog.mappings.filter((mapping) =>
      mapping.formVersionId.includes('-er-2026-')).every((mapping) =>
      mapping.status === 'APPROVED')).toBe(true);
    expect(catalog.mappings.filter((mapping) =>
      !mapping.formVersionId.includes('-er-2026-')).every((mapping) =>
      mapping.status === 'DRAFT')).toBe(true);
    expect(catalog.serviceForms).toHaveLength(45);
    expect(catalog.services.every((service) =>
      service.questions.some((question) => question.id === 'vesselType'))).toBe(true);
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('publica sete serviços NORMAM-211 e mantém alterações dependentes do 3-D em validação', () => {
    const ids = new Set(catalog.services.map((service) => service.id));
    for (const id of [
      'inscricao-embarcacao',
      'transferencia-propriedade-embarcacao',
      'transferencia-jurisdicao-embarcacao',
      'transferencia-propriedade-jurisdicao-embarcacao',
      'renovacao-tie-embarcacao',
      'segunda-via-tie-embarcacao',
      'alteracao-dados-embarcacao',
      'alteracao-motor-embarcacao',
      'comunicacao-venda-embarcacao',
    ]) {
      expect(ids.has(id)).toBe(true);
      const expectedStatus = ['alteracao-dados-embarcacao', 'alteracao-motor-embarcacao'].includes(id)
        ? 'DRAFT' : 'AVAILABLE';
      expect(catalog.services.find((service) => service.id === id)?.status).toBe(expectedStatus);
      expect(catalog.serviceForms.some((relation) => relation.serviceId === id)).toBe(true);
    }
  });

  it('usa rótulos simples para rua e número sem alterar os IDs semânticos', () => {
    expect(catalog.fields.find((field) => field.id === 'person.address')?.label).toBe('Rua');
    expect(catalog.fields.find((field) => field.id === 'person.streetNumber')?.label).toBe('Número');
    expect(catalog.fields.find((field) => field.id === 'seller.address')?.label)
      .toBe('Rua do vendedor');
    expect(catalog.fields.find((field) => field.id === 'seller.streetNumber')?.label)
      .toBe('Número do vendedor');
  });

  it('envia todos os documentos dos novos serviços ao pipeline OCR sem inventar campos genéricos', () => {
    const vesselServices = catalog.services;
    expect(vesselServices).toHaveLength(9);
    for (const service of vesselServices) {
      expect(service.documentRequirements.length).toBeGreaterThan(0);
      expect(service.documentRequirements.every((requirement) => requirement.extraction)).toBe(true);
    }
    const generic = vesselServices.flatMap((service) => service.documentRequirements)
      .filter((requirement) => requirement.extraction?.documentType === 'supporting-document');
    expect(generic.length).toBeGreaterThan(0);
    expect(vesselServices.flatMap((service) => service.documentRequirements)
      .some((requirement) => requirement.id === 'vessel-photos')).toBe(false);
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
