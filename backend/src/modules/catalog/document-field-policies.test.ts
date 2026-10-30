import { describe, expect, it } from 'vitest';
import {
  APPLICANT_IDENTITY_FIELDS,
  BUYER_IDENTITY_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SELLER_RESIDENCE_PROOF_FIELDS,
  SALE_DOCUMENT_FIELDS,
  SELLER_IDENTITY_FIELDS,
  TIE_FIELDS,
  fieldsAllowedForDetectedSubtype,
  identityTypeValue,
} from './document-field-policies.js';

describe('document field source policies', () => {
  it('não usa comprovante de residência como fonte de identidade', () => {
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.address');
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.postalCode');
    expect(RESIDENCE_PROOF_FIELDS).not.toContain('person.fullName');
    expect(RESIDENCE_PROOF_FIELDS).not.toContain('person.cpf');
  });

  it('separa comprovante de residência do comprador e do vendedor', () => {
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.address');
    expect(RESIDENCE_PROOF_FIELDS).not.toContain('seller.address');
    expect(SELLER_RESIDENCE_PROOF_FIELDS).toContain('seller.address');
    expect(SELLER_RESIDENCE_PROOF_FIELDS).not.toContain('person.address');
  });

  it('separa UF do órgão emissor da UF de endereço no BADE', () => {
    expect(APPLICANT_IDENTITY_FIELDS).toContain('person.issuerState');
    expect(RESIDENCE_PROOF_FIELDS).toContain('person.state');
    expect(TIE_FIELDS).toContain('coOwner.issuerState');
    expect(TIE_FIELDS).toContain('coOwner.state');
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
    expect(BUYER_IDENTITY_FIELDS).toContain('person.fullName');
    expect(BUYER_IDENTITY_FIELDS).not.toContain('declarant.fullName');
    expect(BUYER_IDENTITY_FIELDS).not.toContain('seller.fullName');
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

  it('refina identidade por subtipo sem permitir origem documental em CIN/CNH', () => {
    expect(fieldsAllowedForDetectedSubtype('identity', 'rg', APPLICANT_IDENTITY_FIELDS))
      .toContain('person.documentOrigin');
    expect(fieldsAllowedForDetectedSubtype('identity', 'cin', APPLICANT_IDENTITY_FIELDS))
      .not.toContain('person.documentOrigin');
    expect(fieldsAllowedForDetectedSubtype('identity', 'cnh', APPLICANT_IDENTITY_FIELDS))
      .not.toContain('person.documentOrigin');
    expect(identityTypeValue('rg')).toBe('RG');
    expect(identityTypeValue('cin')).toBe('CIN');
    expect(identityTypeValue('cnh')).toBe('CNH');
  });

  it('restringe endereço de proprietário ao TIE/TIEM legado e mantém construtor legado', () => {
    const digital = fieldsAllowedForDetectedSubtype('tie', 'tie-digital', TIE_FIELDS);
    const legacy = fieldsAllowedForDetectedSubtype('tie', 'tie-legacy', TIE_FIELDS);
    expect(digital).toContain('registeredOwner.fullName');
    expect(digital).not.toContain('registeredOwner.address');
    expect(digital).not.toContain('coOwner.address');
    expect(digital).not.toContain('vessel.builderName');
    expect(legacy).toContain('registeredOwner.address');
    expect(legacy).toContain('coOwner.address');
    expect(legacy).toContain('vessel.builderName');
  });

  it('preserva política configurada quando o subtipo é desconhecido', () => {
    expect(fieldsAllowedForDetectedSubtype('identity', 'unknown', BUYER_IDENTITY_FIELDS))
      .toEqual(BUYER_IDENTITY_FIELDS);
    expect(fieldsAllowedForDetectedSubtype('tie', 'unknown', TIE_FIELDS))
      .toEqual(TIE_FIELDS);
  });

});
