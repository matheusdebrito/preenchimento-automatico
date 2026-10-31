/**
 * Source-of-truth policies for document -> field extraction.
 *
 * These lists are intentionally conservative. A field may only be suggested from
 * a document when it is both required by the selected service and present here.
 * Unknown/unsupported documents must not become generic sources for arbitrary fields.
 */

export type DetectedDocumentSubtype =
  | 'rg'
  | 'cin'
  | 'cnh'
  | 'cha'
  | 'cir'
  | 'tie-digital'
  | 'tie-legacy'
  | 'unknown'
  | 'not-applicable';

export const APPLICANT_IDENTITY_FIELDS = [
  'person.fullName',
  'person.cpf',
  'person.identity',
  'person.identityType',
  'person.issuer',
  'person.issuerState',
  'person.issueDate',
  'person.birthDate',
  'person.birthplace',
  'person.nationality',
  'person.parent1Name',
  'person.parent2Name',
  'person.documentOrigin',

  // In loss/extravio declarations the applicant is also the declarant.
  // Keep this limited to facts that can actually appear on an identity document.
  'declarant.fullName',
  'declarant.identity',
  'declarant.cpf',
  'declarant.nationality',
  'declarant.birthplace',
  'declarant.issueDate',
] as const;

export const BUYER_IDENTITY_FIELDS = [
  'person.fullName',
  'person.cpf',
  'person.identity',
  'person.identityType',
  'person.issuer',
  'person.issuerState',
  'person.issueDate',
  'person.birthDate',
  'person.birthplace',
  'person.nationality',
  'person.parent1Name',
  'person.parent2Name',
  'person.documentOrigin',
] as const;

export const SELLER_IDENTITY_FIELDS = [
  'seller.fullName',
  'seller.cpf',
  'seller.identity',
  'seller.identityType',
  'seller.issuer',
  'seller.issuerState',
  'seller.issueDate',
  'seller.nationality',
  'seller.birthplace',
  'seller.parent1Name',
  'seller.parent2Name',
  'seller.documentOrigin',
] as const;

const IDENTITY_FIELDS_BY_SUBTYPE: Readonly<Record<
  Extract<DetectedDocumentSubtype, 'rg' | 'cin' | 'cnh'>,
  ReadonlySet<string>
>> = {
  rg: new Set([
    'fullName', 'cpf', 'identity', 'identityType', 'issuer', 'issuerState',
    'issueDate', 'birthDate', 'birthplace', 'nationality',
    'parent1Name', 'parent2Name', 'documentOrigin',
  ]),
  cin: new Set([
    'fullName', 'cpf', 'identity', 'identityType', 'issuer', 'issuerState',
    'issueDate', 'birthDate', 'birthplace', 'nationality',
    'parent1Name', 'parent2Name',
  ]),
  cnh: new Set([
    'fullName', 'cpf', 'identity', 'identityType', 'issuer', 'issuerState',
    'issueDate', 'birthDate', 'birthplace', 'nationality',
    'parent1Name', 'parent2Name',
  ]),
};

/** Somente dados normalmente identificados na folha de rosto da CIR; sem inferir documentos de embarque. */
export const AQUAVIARIO_CIR_FIELDS = [
  'aquaviario.cirNumber',
  'aquaviario.category',
  'person.fullName',
] as const;

export const CHA_FIELDS = [
  'person.fullName',
  'person.cpf',
  'amateur.chaNumber',
  'amateur.category',
  'amateur.chaIssueDate',
] as const;

export const RESIDENCE_PROOF_FIELDS = [
  'person.address',
  'person.streetNumber',
  'person.apartment',
  'person.neighborhood',
  'person.city',
  'person.state',
  'person.postalCode',
] as const;

export const SELLER_RESIDENCE_PROOF_FIELDS = [
  'seller.address',
  'seller.streetNumber',
  'seller.apartment',
  'seller.neighborhood',
  'seller.city',
  'seller.state',
  'seller.postalCode',
] as const;

export const TIE_FIELDS = [
  'vessel.registration',
  'vessel.registrationDate',
  'vessel.expirationDate',
  'vessel.issueDate',
  'vessel.issuePlace',
  'vessel.name',
  'vessel.hullId',
  'vessel.year',
  'vessel.length',
  'vessel.capacity',
  'vessel.grossTonnage',
  'vessel.breadth',
  'vessel.type',
  'vessel.navigationArea',
  'vessel.depth',
  'vessel.hullMaterial',
  'vessel.propulsionType',
  'vessel.activity',
  'vessel.builderName',
  'vessel.motorManufacturerBrandModel',
  'vessel.motorBrand',
  'vessel.motorPower',
  'vessel.motorSerial',
  'vessel.motorCount',
  'vessel.crewCount',
  'vessel.passengerCount',
  'vessel.mortgaged',
  'vessel.mortgageCreditor',
  'vessel.hullColor',
  'vessel.authority',

  // TIE/TIEM may show the currently registered owner and co-owner. These values
  // are deliberately NOT treated as buyer/seller/applicant aliases.
  'registeredOwner.fullName',
  'registeredOwner.taxId',
  'registeredOwner.address',
  'registeredOwner.streetNumber',
  'registeredOwner.apartment',
  'registeredOwner.neighborhood',
  'registeredOwner.postalCode',
  'registeredOwner.cityState',
  'coOwner.fullName',
  'coOwner.cpf',
  'coOwner.identity',
  'coOwner.issuer',
  'coOwner.issuerState',
  'coOwner.state',
  'coOwner.address',
  'coOwner.streetNumber',
  'coOwner.apartment',
  'coOwner.cityState',
  'coOwner.postalCode',
  'coOwner.neighborhood',
  'coOwner.city',
  'coOwner.nationality',
] as const;

const TIE_DIGITAL_FIELDS = new Set<string>([
  'vessel.registration',
  'vessel.registrationDate',
  'vessel.expirationDate',
  'vessel.issueDate',
  'vessel.issuePlace',
  'vessel.name',
  'vessel.hullId',
  'vessel.year',
  'vessel.length',
  'vessel.capacity',
  'vessel.grossTonnage',
  'vessel.breadth',
  'vessel.type',
  'vessel.navigationArea',
  'vessel.depth',
  'vessel.hullMaterial',
  'vessel.propulsionType',
  'vessel.activity',
  'vessel.motorManufacturerBrandModel',
  'vessel.motorBrand',
  'vessel.motorPower',
  'vessel.motorSerial',
  'vessel.motorCount',
  'vessel.crewCount',
  'vessel.passengerCount',
  'vessel.mortgaged',
  'vessel.mortgageCreditor',
  'vessel.hullColor',
  'vessel.authority',
  'registeredOwner.fullName',
  'registeredOwner.taxId',
  'coOwner.fullName',
  'coOwner.cpf',
]);

const TIE_LEGACY_FIELDS = new Set<string>(TIE_FIELDS);

;

;

/** Documents that are useful to the official process but not trusted as field sources. */
export const NO_AUTOMATIC_FIELDS: readonly string[] = [];

function semanticLeaf(fieldId: string): string {
  const dot = fieldId.indexOf('.');
  return dot >= 0 ? fieldId.slice(dot + 1) : fieldId;
}

/**
 * Applies a second deterministic allow-list after the model classifies a known
 * identity/TIE subtype. Unknown classifications preserve the configured policy
 * to avoid turning classification uncertainty into silent data loss.
 */
export function fieldsAllowedForDetectedSubtype(
  documentType: string | undefined,
  subtype: DetectedDocumentSubtype,
  configuredAllowedFieldIds: readonly string[],
): readonly string[] {
  if (subtype === 'not-applicable' && documentType !== 'residence-proof') return [];

  if (documentType === 'identity') {
    if (['rg', 'cin', 'cnh'].includes(subtype)) {
      const allowed = IDENTITY_FIELDS_BY_SUBTYPE[subtype as 'rg' | 'cin' | 'cnh'];
      return configuredAllowedFieldIds.filter((fieldId) => allowed.has(semanticLeaf(fieldId)));
    }
    return configuredAllowedFieldIds;
  }
  if (documentType === 'cir') {
    if (subtype === 'cir') {
      const allowed = new Set<string>(AQUAVIARIO_CIR_FIELDS);
      return configuredAllowedFieldIds.filter((fieldId) => allowed.has(fieldId));
    }
    return subtype === 'unknown' ? configuredAllowedFieldIds : [];
  }
  if (documentType === 'cha') {
    if (subtype === 'cha') {
      const allowed = new Set<string>(CHA_FIELDS);
      return configuredAllowedFieldIds.filter((fieldId) => allowed.has(fieldId));
    }
    return subtype === 'unknown' ? configuredAllowedFieldIds : [];
  }
  if (documentType === 'tie') {
    if (subtype === 'tie-digital') {
      return configuredAllowedFieldIds.filter((fieldId) => TIE_DIGITAL_FIELDS.has(fieldId));
    }
    if (subtype === 'tie-legacy') {
      return configuredAllowedFieldIds.filter((fieldId) => TIE_LEGACY_FIELDS.has(fieldId));
    }
    return subtype === 'unknown' ? configuredAllowedFieldIds : [];
  }
  return configuredAllowedFieldIds;
}

export function identityTypeValue(
  subtype: DetectedDocumentSubtype,
): 'RG' | 'CIN' | 'CNH' | null {
  if (subtype === 'rg') return 'RG';
  if (subtype === 'cin') return 'CIN';
  if (subtype === 'cnh') return 'CNH';
  return null;
}
