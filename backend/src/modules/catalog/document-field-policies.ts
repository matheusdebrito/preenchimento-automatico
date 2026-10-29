/**
 * Source-of-truth policies for document -> field extraction.
 *
 * These lists are intentionally conservative. A field may only be suggested from
 * a document when it is both required by the selected service and present here.
 * Unknown/unsupported documents must not become generic sources for arbitrary fields.
 */

export const APPLICANT_IDENTITY_FIELDS = [
  'person.fullName',
  'person.cpf',
  'person.identity',
  'person.identityType',
  'person.issuer',
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

export const SELLER_IDENTITY_FIELDS = [
  'seller.fullName',
  'seller.cpf',
  'seller.identity',
  'seller.identityType',
  'seller.issuer',
  'seller.issueDate',
  'seller.nationality',
  'seller.birthplace',
  'seller.parent1Name',
  'seller.parent2Name',
  'seller.documentOrigin',
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

export const SALE_DOCUMENT_FIELDS = [
  'sale.invoice',
  'sale.date',
  'sale.place',
  'sale.price',

  // Only when the document explicitly identifies the parties.
  'person.fullName',
  'person.cpf',
  'seller.fullName',
  'seller.cpf',

  // Stable vessel identifiers may also be present on a purchase/sale instrument.
  'vessel.name',
  'vessel.registration',
  'vessel.hullId',
] as const;

export const MOTOR_DOCUMENT_FIELDS = [
  'vessel.motorBrand',
  'vessel.motorManufacturerBrandModel',
  'vessel.motorPower',
  'vessel.motorSerial',
  'vessel.motorCount',
  'vessel.totalPropulsionPowerKw',
] as const;

export const DPEM_DOCUMENT_FIELDS = [
  'vessel.dpemNumber',
  'vessel.dpemExpiry',
] as const;

/** Documents that are useful to the official process but not trusted as field sources. */
export const NO_AUTOMATIC_FIELDS: readonly string[] = [];
