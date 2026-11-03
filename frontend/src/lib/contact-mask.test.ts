import { describe, expect, it } from 'vitest';
import { formatContactField, formatMobileInput, formatPostalCodeInput } from './contact-mask';

describe('Brazilian input masks', () => {
  it('formats and limits postal codes', () => {
    expect(formatPostalCodeInput('22041001')).toBe('22041-001');
    expect(formatPostalCodeInput('22041-001123')).toBe('22041-001');
    expect(formatPostalCodeInput('2204')).toBe('2204');
  });
  it('formats mobile numbers and supports partial input', () => {
    expect(formatMobileInput('21987654321')).toBe('(21) 98765-4321');
    expect(formatMobileInput('(21) 98765-4321')).toBe('(21) 98765-4321');
    expect(formatMobileInput('2198765432')).toBe('(21) 9876-5432');
    expect(formatMobileInput('21')).toBe('(21');
  });
  it('does not modify fields unrelated to the mask', () => {
    expect(formatContactField('person.fullName', 'Ana Silva')).toBe('Ana Silva');
    expect(formatContactField('seller.postalCode', '12345678')).toBe('12345-678');
    expect(formatContactField('declarant.mobile', '11912345678')).toBe('(11) 91234-5678');
  });
});
