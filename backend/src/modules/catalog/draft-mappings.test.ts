import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { validateCatalog } from './validate-catalog.js';
import { PDFDocument } from 'pdf-lib';
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
});
