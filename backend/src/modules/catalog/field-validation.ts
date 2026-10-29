import type { FieldDefinition, FieldPlacement } from './contracts.js';

export type FormFieldErrorReason =
  | 'required'
  | 'invalid_cpf'
  | 'invalid_date'
  | 'invalid_boolean'
  | 'invalid_choice'
  | 'unsupported_character'
  | 'text_too_long'
  | 'text_overflow';

export class FormFieldError extends Error {
  constructor(
    public readonly code: 'missing_required_fields' | 'invalid_field_value',
    public readonly fieldId: string,
    public readonly reason: FormFieldErrorReason,
  ) {
    super(code + ':' + fieldId + ':' + reason);
  }
}

/** Arithmetic validation, not verification of ownership or CPF authenticity. */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/[. -]/g, '');
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = Array.from({ length }, (_, i) =>
      Number(digits[i]) * (length + 1 - i)).reduce((a, b) => a + b, 0);
    if ((sum * 10) % 11 % 10 !== Number(digits[length])) return false;
  }
  return true;
}

export function isValidBrazilianDate(value: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day;
}

/**
 * Validate only fields actually used by this specific form mapping.
 * Other service values may belong to other forms in the same PDF package.
 */
export function validateMappedFieldValues(
  definitions: readonly FieldDefinition[],
  placements: readonly FieldPlacement[],
  values: Readonly<Record<string, string>>,
): void {
  const registry = new Map(definitions.map((definition) => [definition.id, definition]));
  const used = new Set(placements.map((placement) => placement.fieldId));
  for (const fieldId of used) {
    const field = registry.get(fieldId);
    if (!field) throw new Error('Definição de campo não encontrada: ' + fieldId);
    const value = values[fieldId];
    if (value === undefined || value.trim() === '') continue; // Required validation stays in fillPdf.
    if (field.validationRuleId === 'cpf' && !isValidCpf(value)) {
      throw new FormFieldError('invalid_field_value', fieldId, 'invalid_cpf');
    }
    if (field.validationRuleId === 'simNao' && !['sim', 'nao'].includes(value)) {
      throw new FormFieldError('invalid_field_value', fieldId, 'invalid_choice');
    }
    if (field.valueKind === 'date' && !isValidBrazilianDate(value)) {
      throw new FormFieldError('invalid_field_value', fieldId, 'invalid_date');
    }
    if (field.valueKind === 'boolean' && !['true', 'false'].includes(value)) {
      throw new FormFieldError('invalid_field_value', fieldId, 'invalid_boolean');
    }
  }
}
