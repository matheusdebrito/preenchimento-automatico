import type { FieldDefinition, FieldPlacement } from './contracts.js';

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
      throw new Error('CPF com formato ou dígitos inválidos: ' + fieldId);
    }
    if (field.validationRuleId === 'simNao' && !['sim', 'nao'].includes(value)) {
      throw new Error('Escolha deve ser sim ou nao: ' + fieldId);
    }
    if (field.valueKind === 'date' && !isValidBrazilianDate(value)) {
      throw new Error('Data deve ser válida no formato DD/MM/AAAA: ' + fieldId);
    }
    if (field.valueKind === 'boolean' && !['true', 'false'].includes(value)) {
      throw new Error('Booleano deve ser true ou false: ' + fieldId);
    }
  }
}
