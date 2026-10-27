import { describe, expect, it } from 'vitest';
import { formatBrazilianDateInput } from './date-mask';

describe('máscara brasileira de data', () => {
  it.each([
    ['', ''], ['1','1'], ['12','12'], ['123','12/3'],
    ['1234','12/34'], ['12345','12/34/5'], ['12345678','12/34/5678'],
    ['12/03/2026','12/03/2026'], ['12-03-202612','12/03/2026'],
    ['12/03/202', '12/03/202'], ['1203/2026', '12/03/2026'],
  ])('formata %s em %s', (input, expected) => {
    expect(formatBrazilianDateInput(input)).toBe(expected);
  });

  it('permite apagar a partir de uma data parcial sem exigir validade prematura', () => {
    expect(formatBrazilianDateInput('1203')).toBe('12/03');
    expect(formatBrazilianDateInput('120')).toBe('12/0');
    expect(formatBrazilianDateInput('12')).toBe('12');
    // A validação da data real permanece no backend ao confirmar.
    expect(formatBrazilianDateInput('31022026')).toBe('31/02/2026');
  });
});
