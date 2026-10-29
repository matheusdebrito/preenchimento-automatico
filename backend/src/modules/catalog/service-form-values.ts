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

  return { ...reviewedValues, ...boundValues, ...relation?.fixedValues };
}
