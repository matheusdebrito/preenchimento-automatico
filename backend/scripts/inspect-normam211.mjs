import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField } from 'pdf-lib';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(backendDir, '..');
const outRoot = resolve(repoRoot, 'docs/_normam211_inspection');

const documents = [
  ['2-A', 'documentos/anexos/Anexo 2-A (BADE).pdf'],
  ['2-B', 'documentos/anexos/anexo-2b.pdf'],
  ['2-C', 'documentos/anexos/anexo-2-c-REQUERIMENTO.pdf'],
  ['2-G', 'documentos/anexos/anexo-2G.pdf'],
  ['2-H', 'documentos/anexos/Extravio ANEXO 2-H.pdf'],
  ['2-I', 'documentos/anexos/anexo 2-i_0.pdf'],
  ['2-K', 'documentos/anexos/Compra e venda ANEXO 2-K.pdf'],
  ['3-C', 'documentos/anexos/NORMAM 211 Anx 3-C.pdf'],
];

function fieldType(field) {
  if (field instanceof PDFTextField) return 'text';
  if (field instanceof PDFCheckBox) return 'checkbox';
  if (field instanceof PDFRadioGroup) return 'radio';
  if (field instanceof PDFDropdown) return 'dropdown';
  if (field instanceof PDFOptionList) return 'option-list';
  return field.constructor?.name ?? 'unknown';
}

await mkdir(outRoot, { recursive: true });
const summary = [];

for (const [id, relativePath] of documents) {
  const absolutePath = resolve(repoRoot, relativePath);
  const bytes = await readFile(absolutePath);
  const header = bytes.subarray(0, 5).toString('latin1');
  if (header !== '%PDF-') throw new Error(id + ': assinatura PDF inválida');

  const sha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = pdf.getPages().map((page, pageIndex) => {
    const size = page.getSize();
    const crop = page.getCropBox();
    return {
      pageIndex,
      width: size.width,
      height: size.height,
      rotation: page.getRotation().angle,
      cropBox: crop,
    };
  });

  let fields = [];
  try {
    fields = pdf.getForm().getFields().map((field) => ({
      name: field.getName(),
      type: fieldType(field),
    }));
  } catch {
    fields = [];
  }

  const directory = resolve(outRoot, id);
  await mkdir(directory, { recursive: true });
  await copyFile(absolutePath, resolve(directory, basename(relativePath)));

  summary.push({
    id,
    relativePath,
    fileName: basename(relativePath),
    byteLength: bytes.length,
    sha256,
    pageCount: pages.length,
    pdfKind: fields.length ? 'ACROFORM' : 'STATIC',
    pages,
    fields,
  });
}

await writeFile(resolve(outRoot, 'inspection.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
