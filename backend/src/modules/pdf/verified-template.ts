import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { CatalogDefinition } from '../catalog/contracts.js';
import { fillPdf } from './fill-pdf.js';
import { validateMappedFieldValues } from '../catalog/field-validation.js';

const TEMPLATE_ROOT = resolve(process.cwd(), 'templates');
/** Rejects unapproved mappings, substituted files and arbitrary paths. */
export async function fillApprovedTemplate(
  catalog: CatalogDefinition,
  formVersionId: string,
  values: Readonly<Record<string, string>>,
): Promise<Uint8Array> {
  const version = catalog.versions.find((entry) => entry.id === formVersionId);
  const approved = catalog.mappings.filter((entry) =>
    entry.formVersionId === formVersionId && entry.status === 'APPROVED');
  if (!version || version.status !== 'VERIFIED' || approved.length !== 1 ||
      !version.templatePath || !version.sha256) {
    throw new Error('Modelo ou mapeamento não homologado.');
  }
  const expectedPath = 'backend/templates/' + version.formId + '/' + version.revision + '/original.pdf';
  if (version.templatePath !== expectedPath) {
    throw new Error('Caminho de modelo fora do catálogo.');
  }
  const pdfBytes = await readFile(resolve(TEMPLATE_ROOT, version.formId, version.revision, 'original.pdf'));
  const hash = createHash('sha256').update(pdfBytes).digest('hex').toUpperCase();
  if (hash !== version.sha256.toUpperCase()) {
    throw new Error('O PDF original diverge do hash homologado.');
  }
  validateMappedFieldValues(catalog.fields, approved[0]!.placements, values);
  return fillPdf(pdfBytes, approved[0]!.placements, values);
}
