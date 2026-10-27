import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { validateCatalog } from './validate-catalog.js';
import { PDFDocument } from 'pdf-lib';
import { fillPdf } from '../pdf/fill-pdf.js';
import { validateMappedFieldValues } from './field-validation.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('draft form map coordinates', () => {
  it('all draft placements refer to known semantic fields and remain unpublished', () => {
    expect(catalog.mappings).toHaveLength(6);
    expect(validateCatalog(catalog)).toEqual([]);
    expect(catalog.mappings.every((m) => m.status === 'DRAFT')).toBe(true);
    expect(catalog.services[0]?.status).toBe('DRAFT');
  });
  it('positions stay within the dimensions of the real official PDF pages', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId);
      expect(version?.templatePath).toBeTruthy();
      const pdfBytes = await readFile(resolve(process.cwd(), '..', version!.templatePath!));
      const pdf = await PDFDocument.load(pdfBytes);
      for (const field of mapping.placements) {
        if (field.kind !== 'COORDINATES') continue;
        const page = pdf.getPages()[field.pageIndex];
        expect(page, mapping.id + '/' + field.fieldId).toBeDefined();
        const { width, height } = page!.getSize();
        expect(field.x + field.maxWidth, mapping.id + '/' + field.fieldId).toBeLessThanOrEqual(width + 0.5);
        expect(field.y + field.fontSize, mapping.id + '/' + field.fieldId).toBeLessThanOrEqual(height + 0.5);
        expect(field.x, mapping.id + '/' + field.fieldId).toBeGreaterThan(0);
        expect(field.y, mapping.id + '/' + field.fieldId).toBeGreaterThan(0);
      }
    }
  });
  it('mantém os 6 formulários independentes com campos essenciais explícitos', () => {
    const required: Record<string, readonly string[]> = {
      'requerimento-ma-v1': ['person.fullName', 'person.cpf', 'vessel.name', 'vessel.registration'],
      'bdmoto-v1': ['person.fullName', 'person.cpf', 'vessel.name', 'vessel.registration'],
      'autorizacao-transferencia-ma-v1': ['person.fullName', 'seller.fullName', 'person.cpf', 'seller.cpf'],
      'comunicacao-transferencia-ma-v1': ['person.fullName', 'seller.fullName', 'person.cpf', 'seller.cpf'],
      'declaracao-perda-tie-ma-v1': ['declarant.fullName', 'declarant.cpf', 'vessel.name'],
      'declaracao-residencia-ma-v1': ['person.fullName', 'person.cpf', 'person.address'],
    };
    expect(catalog.mappings).toHaveLength(catalog.versions.length);
    for (const mapping of catalog.mappings) {
      const fields = new Set(mapping.placements.filter((p) => p.required).map((p) => p.fieldId));
      for (const field of required[mapping.formVersionId] ?? []) {
        expect(fields.has(field), mapping.formVersionId + ': ' + field).toBe(true);
      }
      for (const placement of mapping.placements) {
        expect(placement.fieldId).not.toMatch(/signature|assinatura|firma|rubrica|carimbo|stamp/i);
      }
    }
  });

  it('tem ambas escolhas sim/nao em cada motor e nunca deriva declarante de vendedor', () => {
    const transfer = catalog.mappings.find((m) => m.formVersionId === 'autorizacao-transferencia-ma-v1')!;
    for (let engine = 1; engine <= 4; engine++) {
      const choices = transfer.placements.filter((placement) =>
        placement.kind === 'COORDINATES' && placement.fieldId === 'vessel.motor' + engine + 'Choice');
      expect(choices).toHaveLength(2);
      expect(new Set(choices.map((choice) =>
        choice.kind === 'COORDINATES' ? choice.markWhen : ''))).toEqual(new Set(['sim', 'nao']));
      expect(choices.every((choice) => choice.required)).toBe(true);
    }
    const loss = catalog.mappings.find((m) => m.formVersionId === 'declaracao-perda-tie-ma-v1')!;
    expect(loss.placements.some((p) => p.fieldId === 'declarant.fullName')).toBe(true);
    expect(loss.placements.some((p) => p.fieldId.startsWith('seller.'))).toBe(false);
  });

  it('gera cada modelo oficial com valores fictícios preservando páginas e bytes originais', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId)!;
      const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
      const snapshot = Buffer.from(original);
      const values: Record<string, string> = {};
      for (const placement of mapping.placements) {
        if (!placement.required) continue;
        const id = placement.fieldId;
        values[id] = id.includes('motor') && id.endsWith('Choice') ? 'nao' :
          id.endsWith('.cpf') ? '123.456.789-09' :
          id.endsWith('fullName') ? 'MARIA TESTE' :
          id.endsWith('registration') ? '123456789' :
          id.endsWith('hullId') ? 'BR-ABC-12345' :
          id.endsWith('address') ? 'RUA TESTE' : 'DADO TESTE';
      }
      validateMappedFieldValues(catalog.fields, mapping.placements, values);
      const output = await fillPdf(original, mapping.placements, values);
      const pdf = await PDFDocument.load(output);
      const template = await PDFDocument.load(original);
      expect(pdf.getPageCount(), mapping.id).toBe(template.getPageCount());
      expect(pdf.getPages().map((p) => p.getSize()), mapping.id)
        .toEqual(template.getPages().map((p) => p.getSize()));
      expect(Buffer.from(original), mapping.id).toEqual(snapshot);
    }
  }, 30_000);

  it('impede a impressão de nome excessivo em cada um dos seis modelos', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId)!;
      const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
      const firstText = mapping.placements.find((p) =>
        p.kind === 'COORDINATES' && p.markWhen === undefined)!;
      await expect(fillPdf(original, [{ ...firstText, required: true }],
        { [firstText.fieldId]: 'NOME'.repeat(100) }))
        .rejects.toThrow(/excede|comprimento/);
    }
  }, 30_000);

});
