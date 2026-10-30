import { PDFCheckBox, PDFDocument, PDFTextField, StandardFonts, rgb } from 'pdf-lib';
import type { FieldPlacement } from '../catalog/contracts.js';
import { FormFieldError } from '../catalog/field-validation.js';
import { TemplateGenerationError } from './template-error.js';

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
    throw new FormFieldError('invalid_field_value', fieldId, 'unsupported_character');
  }
  if (Array.from(value).length > MAX_FIELD_CHARS) {
    throw new FormFieldError('invalid_field_value', fieldId, 'text_too_long');
  }
  if ([...value].some((char) => {
    const cp = char.codePointAt(0)!;
    return cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) ||
      cp === 0x200b || cp === 0x200c || cp === 0x200d ||
      (cp >= 0x202a && cp <= 0x202e) ||
      (cp >= 0x2066 && cp <= 0x2069) || cp === 0xfeff;
  })) {
    throw new FormFieldError('invalid_field_value', fieldId, 'unsupported_character');
  }
  return value;
}

function normalizeChoice(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function placementChoices(
  placement: Extract<FieldPlacement, { kind: 'COORDINATES' }>,
): readonly string[] {
  if (placement.markWhen === undefined) return [];
  return [placement.markWhen, ...(placement.markAliases ?? [])].map(normalizeChoice);
}

const MONTHS_PT_BR = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

function transformStaticValue(
  value: string,
  placement: Extract<FieldPlacement, { kind: 'COORDINATES' }>,
): string {
  if (!placement.valueTransform) return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) throw new FormFieldError('invalid_field_value', placement.fieldId, 'invalid_date');
  const [, day, monthText, year] = match;
  const month = Number(monthText);
  if (month < 1 || month > 12) {
    throw new FormFieldError('invalid_field_value', placement.fieldId, 'invalid_date');
  }
  switch (placement.valueTransform) {
    case 'DATE_DAY': return day!;
    case 'DATE_MONTH_NUMBER': return monthText!;
    case 'DATE_MONTH_NAME_PT_BR': return MONTHS_PT_BR[month - 1]!;
    case 'DATE_YEAR': return year!;
    case 'DATE_YEAR_2': return year!.slice(-2);
  }
}

function assertStaticPlacement(
  page: ReturnType<PDFDocument['getPages']>[number], placement: Extract<FieldPlacement, { kind: 'COORDINATES' }>,
): void {
  if (((page.getRotation().angle % 360) + 360) % 360 !== 0) {
    throw new TemplateGenerationError('template_rotation_unsupported');
  }
  const crop = page.getCropBox();
  const { x, y, fontSize, maxWidth } = placement;
  if (![x, y, fontSize, maxWidth, crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
      x < 0 || y < 0 || fontSize < 4.5 || maxWidth <= 0 ||
      x < crop.x || y < crop.y ||
      x + maxWidth > crop.x + crop.width + 0.5 ||
      y + fontSize > crop.y + crop.height + 0.5) {
    throw new TemplateGenerationError('template_layout_invalid');
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
    throw new TemplateGenerationError('template_invalid_pdf');
  }
  const choices = new Map<string, Set<string>>();
  for (const placement of placements) {
    if (placement.kind === 'COORDINATES' && placement.markWhen !== undefined) {
      const options = choices.get(placement.fieldId) ?? new Set<string>();
      for (const option of placementChoices(placement)) options.add(option);
      choices.set(placement.fieldId, options);
    }
  }
  for (const [fieldId, options] of choices) {
    const value = values[fieldId];
    if (typeof value === 'string' && value.trim()) {
      const normalized = normalizeChoice(value);
      if (!options.has(normalized)) {
        const unilateralBoolean = options.size === 1 && options.has('true') && normalized === 'false';
        if (!unilateralBoolean) {
          throw new FormFieldError('invalid_field_value', fieldId, 'invalid_choice');
        }
      }
    }
  }
  const pdf = await PDFDocument.load(templateBytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  let changedAcroForm = false;

  for (const placement of placements) {
    const raw = values[placement.fieldId];
    if (typeof raw !== 'string') continue;
    const value = prepareValue(raw, placement.fieldId);
    if (value === '') continue;

    if (placement.kind === 'ACROFORM') {
      const field = form.getField(placement.pdfFieldName);
      if (field instanceof PDFCheckBox) {
        if (value !== 'true' && value !== 'false') {
          throw new FormFieldError('invalid_field_value', placement.fieldId, 'invalid_boolean');
        }
        if (value === 'true') field.check();
        else field.uncheck();
      } else if (field instanceof PDFTextField) {
        try {
          font.encodeText(value);
        } catch {
          throw new FormFieldError('invalid_field_value', placement.fieldId, 'unsupported_character');
        }
        field.setText(value);
      } else {
        throw new TemplateGenerationError('template_acroform_unsupported');
      }
      changedAcroForm = true;
      continue;
    }

    const page = pdf.getPages()[placement.pageIndex];
    if (!page) throw new TemplateGenerationError('template_page_missing');
    assertStaticPlacement(page, placement);
    // Declarative choice fields: write an X only in the selected box.
    // Never stamp the literal word "sim" or "não" into a tiny checkbox.
    if (placement.markWhen !== undefined &&
      !placementChoices(placement).includes(normalizeChoice(value))) continue;
    const transformed = transformStaticValue(value, placement);
    const printed = placement.markWhen === undefined ? transformed : 'X';
    let width: number;
    try {
      width = font.widthOfTextAtSize(printed, placement.fontSize);
    } catch {
      throw new FormFieldError('invalid_field_value', placement.fieldId, 'unsupported_character');
    }
    if (width > placement.maxWidth + 0.01) {
      throw new FormFieldError('invalid_field_value', placement.fieldId, 'text_overflow');
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
      throw new TemplateGenerationError('template_acroform_appearance_failed');
    }
  }
  return pdf.save({ useObjectStreams: false });
}
