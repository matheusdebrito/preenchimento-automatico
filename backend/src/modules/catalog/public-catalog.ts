import type { CatalogDefinition, DocumentRequirement, ServiceCondition, ServiceDefinition } from './contracts.js';

export interface PublicService {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  questions: ServiceDefinition['questions'];
  documentRequirements: readonly DocumentRequirement[];
  /** Only IDs, never paths or internal approval metadata. */
  formVersionIds: readonly string[];
  reviewFields: readonly { id: string; label: string; valueKind: string }[];
}

function matches(
  rules: readonly ServiceCondition[] | undefined,
  answers: Readonly<Record<string, string>>,
): boolean {
  return (rules ?? []).every((rule) => answers[rule.questionId] === rule.equals);
}

/**
 * Authoritative public projection of AVAILABLE services only.
 * Unknown/unanswered conditions are false (fail closed).
 */
export function publicService(
  catalog: CatalogDefinition,
  serviceId: string,
  answers: Readonly<Record<string, string>> = {},
): PublicService | null {
  const service = catalog.services.find((item) => item.id === serviceId);
  if (!service || service.status !== 'AVAILABLE') return null;

  const allowed = new Map(service.questions.map((question) => [question.id, question.options]));
  if (Object.entries(answers).some(([id, value]) => !allowed.get(id)?.includes(value))) {
    return null;
  }

  const eligibleVersions = new Set(catalog.versions
    .filter((version) => version.status === 'VERIFIED' &&
      catalog.mappings.some((mapping) =>
        mapping.formVersionId === version.id && mapping.status === 'APPROVED'))
    .map((version) => version.id));
  const relations = catalog.serviceForms.filter((relation) => relation.serviceId === service.id);
  if (relations.length === 0 || relations.some((relation) => !eligibleVersions.has(relation.formVersionId))) {
    return null;
  }

  const versionIds = relations
    .filter((relation) => matches(relation.conditions, answers))
    .sort((a, b) => a.order - b.order)
    .map((relation) => relation.formVersionId);
  const mappedFields = new Set(catalog.mappings
    .filter((mapping) => mapping.status === 'APPROVED' && versionIds.includes(mapping.formVersionId))
    .flatMap((mapping) => mapping.placements.map((p) => p.fieldId)));

  return {
    id: service.id,
    title: service.title,
    description: service.description,
    creditCost: service.creditCost,
    questions: service.questions,
    documentRequirements: service.documentRequirements.filter((requirement) =>
      matches(requirement.conditions, answers)),
    formVersionIds: versionIds,
    reviewFields: catalog.fields.filter((field) => mappedFields.has(field.id))
      .map(({ id, label, valueKind }) => ({ id, label, valueKind })),
  };
}

export function publicServices(catalog: CatalogDefinition): readonly PublicService[] {
  return catalog.services.flatMap((service) => {
    const view = publicService(catalog, service.id);
    return view ? [view] : [];
  });
}
