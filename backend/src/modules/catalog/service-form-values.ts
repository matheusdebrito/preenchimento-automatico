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

  return { ...reviewedValues, ...boundValues, ...mappedValues, ...relation?.fixedValues };
}
