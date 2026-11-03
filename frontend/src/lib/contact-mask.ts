/** Format Brazilian contact information for display, without changing unrelated fields. */
export function formatPostalCodeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
}

export function formatMobileInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? '(' + digits : '';
  const area = '(' + digits.slice(0, 2) + ') ';
  const local = digits.slice(2);
  // Support both eight- and nine-digit local numbers while typing.
  const firstPartLength = digits.length > 10 ? 5 : 4;
  return area + (local.length > firstPartLength
    ? local.slice(0, firstPartLength) + '-' + local.slice(firstPartLength)
    : local);
}

export function formatContactField(fieldId: string, value: string): string {
  if (fieldId.endsWith('.postalCode')) return formatPostalCodeInput(value);
  if (fieldId.endsWith('.mobile')) return formatMobileInput(value);
  return value;
}
