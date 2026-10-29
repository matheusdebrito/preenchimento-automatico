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
  it('não publica o piloto em DRAFT', () => {
    expect(publicServices(catalog)).toEqual([]);
    expect(publicService(catalog, 'transferencia-moto-aquatica')).toBeNull();
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
  it('falha fechado com condições inválidas ou mapeamento não aprovado', () => {
    const data = fixture();
    expect(publicService(data, 's', { extra: 'not-an-option' })).toBeNull();
    data.mappings = [{ ...data.mappings[0]!, status: 'TESTED' }];
    expect(publicService(data, 's')).toBeNull();
  });
});
