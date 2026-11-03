import type { ServiceForm } from './contracts.js';

export function serviceFormValues(
  relation: ServiceForm | undefined,
  answers: Readonly<Record<string, string>>,
  reviewedValues: Readonly<Record<string, string>>,
): Record<string, string> {
  const boundValues = Object.fromEntries(Object.entries(relation?.answerBindings ?? {})
    .flatMap(([fieldId, questionId]) => {
      const value = answers[questionId];
      return value ? [[fieldId, value]] : [];
    }));
  const mappedValues = Object.fromEntries(Object.entries(relation?.answerValueMappings ?? {})
    .flatMap(([fieldId, mapping]) => {
      const answer = answers[mapping.questionId];
      const value = answer ? mapping.values[answer] : undefined;
      return value ? [[fieldId, value]] : [];
    }));

  const cityState = [reviewedValues['person.city'], reviewedValues['person.state']]
    .filter(Boolean).join('/');
  const fullAddress = [
    reviewedValues['person.address'],
    reviewedValues['person.streetNumber'],
    reviewedValues['person.apartment'],
    reviewedValues['person.neighborhood'],
    cityState,
    reviewedValues['person.postalCode'],
  ].filter(Boolean).join(', ');
  // Anexo 2-G: render the reviewed address fragments in their correct order.
  // A generic extracted fullAddress may omit neighborhood, CEP or complements.
  // Keep that fallback only when there are no structured address parts to join.
  const preferReviewedParts = relation?.formVersionId === 'declaracao-residencia-er-2026-v1';
  const derivedValues: Record<string, string> =
    fullAddress && (preferReviewedParts || !reviewedValues['person.fullAddress'])
      ? { 'person.fullAddress': fullAddress }
      : {};

  return {
    ...reviewedValues,
    ...derivedValues,
    ...boundValues,
    ...mappedValues,
    ...relation?.fixedValues,
  };
}
