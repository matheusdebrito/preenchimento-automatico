import type { CatalogDefinition, DocumentRequirement, ServiceCondition, ServiceDefinition } from './contracts.js';

export interface PublicReviewField {
  id: string;
  label: string;
  valueKind: string;
  required: boolean;
}

export interface PublicReviewForm {
  formVersionId: string;
  formId: string;
  name: string;
  description?: string;
  fields: readonly PublicReviewField[];
}

export interface PublicService {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  questions: ServiceDefinition['questions'];
  documentRequirements: readonly DocumentRequirement[];
  /** Only IDs, never paths or internal approval metadata. */
  formVersionIds: readonly string[];
  reviewFields: readonly PublicReviewField[];
  /**
   * Same semantic values grouped by the exact PDFs that will be generated.
   * A field may appear in more than one form; the client must keep one shared value per field ID.
   */
  reviewForms: readonly PublicReviewForm[];
}

function matches(
  rules: readonly ServiceCondition[] | undefined,
  answers: Readonly<Record<string, string>>,
): boolean {
  return (rules ?? []).every((rule) => rule.equals !== undefined
    ? answers[rule.questionId] === rule.equals
    : rule.oneOf?.includes(answers[rule.questionId] ?? '') === true);
}

function isUserReviewField(fieldId: string): boolean {
  return !fieldId.startsWith('process.') ||
    fieldId === 'process.place' ||
    fieldId === 'process.date' ||
    fieldId === 'process.requestAuthority';
}

function fieldApplies(
  relation: CatalogDefinition['serviceForms'][number],
  fieldId: string,
  answers: Readonly<Record<string, string>>,
): boolean {
  if (relation.excludedReviewFieldIds?.includes(fieldId)) return false;
  if (Object.hasOwn(relation.fixedValues ?? {}, fieldId) ||
    Object.hasOwn(relation.answerBindings ?? {}, fieldId) ||
    Object.hasOwn(relation.answerValueMappings ?? {}, fieldId)) return false;
  return matches(relation.reviewFieldConditions?.[fieldId], answers);
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
  const unavailable = new Map(service.questions.map((question) =>
    [question.id, new Set(question.unavailableOptions ?? [])]));
  if (Object.entries(answers).some(([id, value]) =>
    !allowed.get(id)?.includes(value) || unavailable.get(id)?.has(value))) {
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

  const applicableRelations = relations
    .filter((relation) => matches(relation.conditions, answers))
    .sort((a, b) => a.order - b.order);
  const versionIds = applicableRelations.map((relation) => relation.formVersionId);
  const relationByVersion = new Map(applicableRelations.map((relation) =>
    [relation.formVersionId, relation]));
  const placements = catalog.mappings
    .filter((mapping) => mapping.status === 'APPROVED' && versionIds.includes(mapping.formVersionId))
    .flatMap((mapping) => {
      const relation = relationByVersion.get(mapping.formVersionId);
      return mapping.placements.filter((placement) =>
        relation ? fieldApplies(relation, placement.fieldId, answers) : false);
    });
  const mappedFields = new Set(placements.map((placement) => placement.fieldId));
  const fieldById = new Map(catalog.fields.map((field) => [field.id, field]));
  const versionById = new Map(catalog.versions.map((version) => [version.id, version]));
  const formById = new Map(catalog.forms.map((form) => [form.id, form]));
  const approvedMappingByVersion = new Map(catalog.mappings
    .filter((mapping) => mapping.status === 'APPROVED')
    .map((mapping) => [mapping.formVersionId, mapping]));

  const reviewForms: PublicReviewForm[] = versionIds.flatMap((formVersionId) => {
    const version = versionById.get(formVersionId);
    const mapping = approvedMappingByVersion.get(formVersionId);
    const form = version ? formById.get(version.formId) : undefined;
    if (!version || !mapping || !form) return [];

    const relation = relationByVersion.get(formVersionId);
    if (!relation) return [];

    const orderedIds: string[] = [];
    const seen = new Set<string>();
    for (const placement of mapping.placements) {
      if (!isUserReviewField(placement.fieldId) ||
        !fieldApplies(relation, placement.fieldId, answers) ||
        seen.has(placement.fieldId)) continue;
      seen.add(placement.fieldId);
      orderedIds.push(placement.fieldId);
    }

    const fields = orderedIds.flatMap((fieldId): PublicReviewField[] => {
      const field = fieldById.get(fieldId);
      if (!field) return [];
      return [{
        id: field.id,
        label: field.label,
        valueKind: field.valueKind,
        required: false,
      }];
    });

    return [{
      formVersionId,
      formId: form.id,
      name: form.name,
      ...(form.description ? { description: form.description } : {}),
      fields,
    }];
  });

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
      .filter((field) => isUserReviewField(field.id))
      .map(({ id, label, valueKind }) => ({ id, label, valueKind, required: false })),
    reviewForms,
  };
}

export function publicServices(catalog: CatalogDefinition): readonly PublicService[] {
  return catalog.services.flatMap((service) => {
    const view = publicService(catalog, service.id);
    return view ? [view] : [];
  });
}
