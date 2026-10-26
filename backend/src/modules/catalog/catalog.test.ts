import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import type { CatalogDefinition } from './contracts.js';

function catalogIssues(data: CatalogDefinition): string[] {
  const issues: string[] = [];
  const fields = new Set(data.fields.map((field) => field.id));
  const forms = new Map(data.templates.map((form) => [form.id, form]));
  const services = new Set(data.services.map((service) => service.id));

  if (fields.size !== data.fields.length) issues.push('duplicate field id');
  if (forms.size !== data.templates.length) issues.push('duplicate form id');
  if (services.size !== data.services.length) issues.push('duplicate service id');

  for (const form of data.templates) {
    for (const fieldId of form.fieldIds) {
      if (!fields.has(fieldId)) issues.push('unknown field: ' + fieldId);
    }
    if (form.status === 'APPROVED' &&
      (!form.sourceUrl || !form.verifiedAt || !form.sha256 || !form.templatePath || form.pdfKind === 'UNKNOWN')) {
      issues.push('approved form missing verified evidence: ' + form.id);
    }
  }
  for (const service of data.services) {
    for (const relation of service.formRelations) {
      if (relation.serviceId !== service.id) issues.push('relation references another service');
      if (!forms.has(relation.formTemplateId)) issues.push('unknown form relation');
    }
    if (service.status === 'AVAILABLE' &&
      (service.formRelations.length === 0 ||
        service.formRelations.some((relation) => forms.get(relation.formTemplateId)?.status !== 'APPROVED'))) {
      issues.push('available service missing approved forms');
    }
  }
  return issues;
}

describe('catálogo documental', () => {
  it('não contém relações quebradas nem modelos aprovados sem evidências', () => {
    expect(catalogIssues(catalog)).toEqual([]);
  });

  it('mantém o piloto como rascunho até validar formulários oficiais', () => {
    expect(catalog.services[0]?.status).toBe('DRAFT');
    expect(catalog.services[0]?.formRelations).toEqual([]);
  });
});
