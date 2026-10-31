import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { isValidBrazilianDate, isValidCpf, validateMappedFieldValues } from './field-validation.js';

describe('validação semântica por versão do formulário', () => {
  it('confere aritmética de CPF sem inferir autenticidade de identidade', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('123.456.789-00')).toBe(false);
    expect(isValidCpf('12345678909-000')).toBe(false);
  });
  it('valida datas brasileiras e calendário bissexto', () => {
    expect(isValidBrazilianDate('29/02/2024')).toBe(true);
    expect(isValidBrazilianDate('29/02/2025')).toBe(false);
    expect(isValidBrazilianDate('31/04/2026')).toBe(false);
    expect(isValidBrazilianDate('01/01/2020')).toBe(true);
  });
  it('rejeita CPF e data inválidos nos campos mapeados', () => {
    const mapping = catalog.mappings.find((m) => m.formVersionId === 'bdmoto-v1')!;
    expect(() => validateMappedFieldValues(catalog.fields, mapping.placements, {
      'person.cpf': '000.000.000-00',
    })).toThrow('invalid_field_value:person.cpf:invalid_cpf');
    expect(() => validateMappedFieldValues(catalog.fields, mapping.placements, {
      'person.issueDate': '31/02/2026',
    })).toThrow('invalid_field_value:person.issueDate:invalid_date');
  });
  it('rejeita quantidade de motores, passageiros e ano de construção inválidos', () => {
    const bade = catalog.mappings.find((item) => item.formVersionId === 'bade-er-2026-v1')!;
    expect(() => validateMappedFieldValues(catalog.fields, bade.placements, {
      'vessel.motorCount': 'abc',
    })).toThrow('invalid_field_value:vessel.motorCount:invalid_number');
    expect(() => validateMappedFieldValues(catalog.fields, bade.placements, {
      'vessel.passengerCount': '-3',
    })).toThrow('invalid_field_value:vessel.passengerCount:invalid_number');
    expect(() => validateMappedFieldValues(catalog.fields, bade.placements, {
      'vessel.year': '20A6',
    })).toThrow('invalid_field_value:vessel.year:invalid_number');
    expect(() => validateMappedFieldValues(catalog.fields, bade.placements, {
      'vessel.year': '2026',
      'vessel.motorCount': '2',
      'vessel.passengerCount': '12',
    })).not.toThrow();
    expect(() => validateMappedFieldValues(catalog.fields, bade.placements, {
      'vessel.motorCount': '',
      'vessel.year': '',
    })).not.toThrow();
  });

  it('reutiliza dados do pacote sem tentar validar campos de outras versões', () => {
    const mapping = catalog.mappings.find((m) => m.formVersionId === 'requerimento-ma-v1')!;
    expect(() => validateMappedFieldValues(catalog.fields, mapping.placements, {
      'person.cpf': '123.456.789-09', 'seller.cpf': '000.000.000-00',
    })).not.toThrow();
  });
});
