import { describe, expect, it } from 'vitest';
import {
  APPLICANT_IDENTITY_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SALE_DOCUMENT_FIELDS,
  SELLER_IDENTITY_FIELDS,
  TIE_FIELDS,
} from './document-field-policies.js';

describe('document field source policies', () => {
  it('não usa comprovante de residência como fonte de identidade', () => {
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.address');
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.postalCode');
    expect(RESIDENCE_PROOF_FIELDS).not.toContain('person.fullName');
    expect(RESIDENCE_PROOF_FIELDS).not.toContain('person.cpf');
  });

  it('não transforma TIE/TIEM em identidade de comprador ou vendedor', () => {
    expect(TIE_FIELDS).toContain('vessel.registration');
    expect(TIE_FIELDS).toContain('registeredOwner.fullName');
    expect(TIE_FIELDS).not.toContain('person.fullName');
    expect(TIE_FIELDS).not.toContain('person.cpf');
    expect(TIE_FIELDS).not.toContain('seller.fullName');
    expect(TIE_FIELDS).not.toContain('seller.cpf');
  });

  it('mantém identidades pessoais fora do domínio da embarcação', () => {
    expect(APPLICANT_IDENTITY_FIELDS).toContain('person.fullName');
    expect(SELLER_IDENTITY_FIELDS).toContain('seller.fullName');
    expect(APPLICANT_IDENTITY_FIELDS.some((field) => field.startsWith('vessel.')))
      .toBe(false);
    expect(SELLER_IDENTITY_FIELDS.some((field) => field.startsWith('vessel.')))
      .toBe(false);
  });

  it('limita documento de venda a venda, partes explícitas e identificadores estáveis', () => {
    expect(SALE_DOCUMENT_FIELDS).toContain('sale.date');
    expect(SALE_DOCUMENT_FIELDS).toContain('person.fullName');
    expect(SALE_DOCUMENT_FIELDS).toContain('seller.fullName');
    expect(SALE_DOCUMENT_FIELDS).toContain('vessel.registration');
    expect(SALE_DOCUMENT_FIELDS).not.toContain('person.address');
    expect(SALE_DOCUMENT_FIELDS).not.toContain('seller.address');
    expect(SALE_DOCUMENT_FIELDS).not.toContain('vessel.motorSerial');
  });
});
