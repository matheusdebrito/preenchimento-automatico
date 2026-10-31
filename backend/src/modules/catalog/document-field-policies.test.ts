import { describe, expect, it } from 'vitest';
import {
  APPLICANT_IDENTITY_FIELDS,
  AQUAVIARIO_CIR_FIELDS,
  BUYER_IDENTITY_FIELDS,
  CHA_FIELDS,
  RESIDENCE_PROOF_FIELDS,
  SELLER_RESIDENCE_PROOF_FIELDS,
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

  it('limita CIR a número da caderneta, categoria e titular, sem extrair documentos de protocolo', () => {
    const configured = [
      'aquaviario.cirNumber',
      'aquaviario.category',
      'person.fullName',
      'person.address',
      'person.cpf',
    ];
    expect(fieldsAllowedForDetectedSubtype('cir', 'cir', configured)).toEqual([
      'aquaviario.cirNumber',
      'aquaviario.category',
      'person.fullName',
    ]);
  });

  it('limita CHA aos dados realmente presentes na habilitação', () => {
    expect(CHA_FIELDS).toEqual([
      'person.fullName',
      'person.cpf',
      'amateur.chaNumber',
      'amateur.category',
      'amateur.chaIssueDate',
    ]);
    const configured = [...CHA_FIELDS, 'person.address'];
    expect(fieldsAllowedForDetectedSubtype('cha', 'cha', configured))
      .toEqual(CHA_FIELDS);
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

  it('não extrai campos quando o arquivo não corresponde à categoria de entrada', () => {
    expect(fieldsAllowedForDetectedSubtype('identity', 'not-applicable', APPLICANT_IDENTITY_FIELDS))
      .toEqual([]);
    expect(fieldsAllowedForDetectedSubtype('cha', 'rg', CHA_FIELDS)).toEqual([]);
    expect(fieldsAllowedForDetectedSubtype('cir', 'cha', AQUAVIARIO_CIR_FIELDS)).toEqual([]);
    expect(fieldsAllowedForDetectedSubtype('tie', 'not-applicable', TIE_FIELDS)).toEqual([]);
    expect(fieldsAllowedForDetectedSubtype('residence-proof', 'not-applicable', RESIDENCE_PROOF_FIELDS))
      .toEqual(RESIDENCE_PROOF_FIELDS);
  });

  it('preserva política configurada quando o subtipo é desconhecido', () => {
    expect(fieldsAllowedForDetectedSubtype('identity', 'unknown', BUYER_IDENTITY_FIELDS))
      .toEqual(BUYER_IDENTITY_FIELDS);
    expect(fieldsAllowedForDetectedSubtype('tie', 'unknown', TIE_FIELDS))
      .toEqual(TIE_FIELDS);
  });

});
