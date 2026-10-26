import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { FieldPlacement } from '../catalog/contracts.js';

/**
 * Deterministic, template-preserving PDF filler.
 * Only supplied, validated mappings may be passed. This does not approve an
 * official form: visual review of the output remains mandatory.
 */
export async function fillPdf(
  templateBytes: Uint8Array,
  placements: readonly FieldPlacement[],
  values: Readonly<Record<string, string>>,
): Promise<Uint8Array> {
  if (templateBytes.length === 0 || templateBytes.length > 12 * 1024 * 1024) {
    throw new Error('O modelo PDF está vazio ou acima do limite permitido.');
  }
  const pdf = await PDFDocument.load(templateBytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  for (const placement of placements) {
    const raw = values[placement.fieldId];
    if (typeof raw !== 'string') {
      if (placement.required) throw new Error('Campo obrigatório ausente: ' + placement.fieldId);
      continue;
    }
    const value = raw.trim();
    if (!value) {
      if (placement.required) throw new Error('Campo obrigatório vazio: ' + placement.fieldId);
      continue;
    }
    if (value.length > 500 || /[\u0000-\u0008\u000B-\u001F\u007F]/.test(value)) {
      throw new Error('Campo contém caracteres inválidos: ' + placement.fieldId);
    }
    if (placement.kind === 'ACROFORM') {
      if (value === 'true' || value === 'false') {
        const checkbox = form.getCheckBox(placement.pdfFieldName);
        if (value === 'true') checkbox.check();
        else checkbox.uncheck();
      } else {
        form.getTextField(placement.pdfFieldName).setText(value);
      }
      continue;
    }
    const page = pdf.getPages()[placement.pageIndex];
    if (!page) throw new Error('Página inexistente: ' + placement.pageIndex);
    const { width, height } = page.getSize();
    const { x, y, fontSize, maxWidth } = placement;
    if (![x, y, fontSize, maxWidth].every(Number.isFinite) ||
      x < 0 || y < 0 || fontSize <= 0 || maxWidth <= 0 ||
      x + maxWidth > width + 0.5 || y + fontSize > height + 0.5) {
      throw new Error('Posição inválida ou fora dos limites: ' + placement.fieldId);
    }
    if (/[\r\n]/.test(value)) {
      throw new Error('Quebra de linha não permitida em campo estático: ' + placement.fieldId);
    }
    let textWidth: number;
    try {
      textWidth = font.widthOfTextAtSize(value, fontSize);
    } catch {
      throw new Error('Caractere não suportado pela fonte PDF: ' + placement.fieldId);
    }
    if (textWidth > maxWidth) {
      throw new Error('Texto excede área do campo: ' + placement.fieldId);
    }
    page.drawText(value, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
  }

  try {
    form.updateFieldAppearances(font);
  } catch {
    // Static templates have no fields; keep their existing contents unchanged.
    if (form.getFields().length !== 0) throw new Error('Aparência dos campos PDF inválida.');
  }
  return pdf.save({ useObjectStreams: false });
}
