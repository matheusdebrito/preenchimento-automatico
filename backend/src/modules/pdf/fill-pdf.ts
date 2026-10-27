import { PDFCheckBox, PDFDocument, PDFTextField, StandardFonts, rgb } from 'pdf-lib';
import type { FieldPlacement } from '../catalog/contracts.js';

const MAX_TEMPLATE_BYTES = 12 * 1024 * 1024;
const MAX_FIELD_CHARS = 500;

/**
 * Sanitize one-line fields without silently truncating or transliterating
 * legal names. Any unsupported glyph, layout overflow or control character
 * blocks the PDF rather than producing a misleading official form.
 */
function prepareValue(raw: string, fieldId: string): string {
  const value = raw.trim().normalize('NFC');
  if (/[\r\n]/.test(value)) {
    throw new Error('Quebra de linha não permitida: ' + fieldId);
  }
  if (Array.from(value).length > MAX_FIELD_CHARS ||
      [...value].some((char) => {
        const cp = char.codePointAt(0)!;
        return cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) ||
          cp === 0x200b || cp === 0x200c || cp === 0x200d ||
          (cp >= 0x202a && cp <= 0x202e) ||
          (cp >= 0x2066 && cp <= 0x2069) || cp === 0xfeff;
      })) {
    throw new Error('Campo contém caracteres ou comprimento inválidos: ' + fieldId);
  }
  return value;
}

function assertStaticPlacement(
  page: ReturnType<PDFDocument['getPages']>[number], placement: Extract<FieldPlacement, { kind: 'COORDINATES' }>,
): void {
  if (((page.getRotation().angle % 360) + 360) % 360 !== 0) {
    throw new Error('Página girada requer mapeamento específico: ' + placement.fieldId);
  }
  const crop = page.getCropBox();
  const { x, y, fontSize, maxWidth, fieldId } = placement;
  if (![x, y, fontSize, maxWidth, crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
      x < 0 || y < 0 || fontSize < 4.5 || maxWidth <= 0 ||
      x < crop.x || y < crop.y ||
      x + maxWidth > crop.x + crop.width + 0.5 ||
      y + fontSize > crop.y + crop.height + 0.5) {
    throw new Error('Posição inválida ou fora dos limites: ' + fieldId);
  }
}

/**
 * Fill an original PDF without rebuilding or mutating the template.
 * Placements and user values are untrusted until validation succeeds.
 *
 * This operation is independent of official approval. Applications MUST use
 * fillApprovedTemplate before exposing real PDFs to users.
 */
export async function fillPdf(
  templateBytes: Uint8Array,
  placements: readonly FieldPlacement[],
  values: Readonly<Record<string, string>>,
): Promise<Uint8Array> {
  if (templateBytes.length === 0 || templateBytes.length > MAX_TEMPLATE_BYTES ||
      new TextDecoder('latin1').decode(templateBytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('Modelo PDF inválido ou acima do limite.');
  }
  const choices = new Map<string, Set<string>>();
  for (const placement of placements) {
    if (placement.kind === 'COORDINATES' && placement.markWhen !== undefined) {
      const options = choices.get(placement.fieldId) ?? new Set<string>();
      options.add(placement.markWhen);
      choices.set(placement.fieldId, options);
    }
  }
  for (const [fieldId, options] of choices) {
    const value = values[fieldId];
    if (typeof value === 'string' && value.trim() && !options.has(value.trim())) {
      throw new Error('Opção não prevista no formulário: ' + fieldId);
    }
  }
  const pdf = await PDFDocument.load(templateBytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  let changedAcroForm = false;

  for (const placement of placements) {
    const raw = values[placement.fieldId];
    if (typeof raw !== 'string') {
      if (placement.required) throw new Error('Campo obrigatório ausente: ' + placement.fieldId);
      continue;
    }
    const value = prepareValue(raw, placement.fieldId);
    if (value === '') {
      if (placement.required) throw new Error('Campo obrigatório vazio: ' + placement.fieldId);
      continue;
    }

    if (placement.kind === 'ACROFORM') {
      const field = form.getField(placement.pdfFieldName);
      if (field instanceof PDFCheckBox) {
        if (value !== 'true' && value !== 'false') {
          throw new Error('Checkbox requer true ou false: ' + placement.fieldId);
        }
        if (value === 'true') field.check();
        else field.uncheck();
      } else if (field instanceof PDFTextField) {
        try {
          font.encodeText(value);
        } catch {
          throw new Error('Caractere não suportado pela fonte PDF: ' + placement.fieldId);
        }
        field.setText(value);
      } else {
        throw new Error('Tipo de campo AcroForm não suportado: ' + placement.fieldId);
      }
      changedAcroForm = true;
      continue;
    }

    const page = pdf.getPages()[placement.pageIndex];
    if (!page) throw new Error('Página inexistente: ' + placement.pageIndex);
    assertStaticPlacement(page, placement);
    // Declarative choice fields: write an X only in the selected box.
    // Never stamp the literal word "sim" or "não" into a tiny checkbox.
    if (placement.markWhen !== undefined && value !== placement.markWhen) continue;
    const printed = placement.markWhen === undefined ? value : 'X';
    let width: number;
    try {
      width = font.widthOfTextAtSize(printed, placement.fontSize);
    } catch {
      throw new Error('Caractere não suportado pela fonte PDF: ' + placement.fieldId);
    }
    if (width > placement.maxWidth + 0.01) {
      throw new Error('Texto excede área do campo: ' + placement.fieldId);
    }
    page.drawText(printed, {
      x: placement.x, y: placement.y, size: placement.fontSize,
      font, color: rgb(0, 0, 0),
    });
  }

  if (changedAcroForm) {
    try {
      form.updateFieldAppearances(font);
    } catch {
      throw new Error('Falha ao atualizar a aparência dos campos AcroForm.');
    }
  }
  return pdf.save({ useObjectStreams: false });
}
