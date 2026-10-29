import type {
  CatalogDefinition,
  ServiceCondition,
  ServiceQuestion,
} from './contracts.js';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA256 = /^[0-9a-fA-F]{64}$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function validDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function buildIndex<T extends { id: string }>(
  items: readonly T[],
  name: string,
  issues: string[],
): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    if (!SAFE_ID.test(item.id)) issues.push(name + ': identificador inválido: ' + item.id);
    if (index.has(item.id)) issues.push(name + ': identificador duplicado: ' + item.id);
    index.set(item.id, item);
  }
  return index;
}

function validateConditions(
  conditions: readonly ServiceCondition[] | undefined,
  questions: Map<string, ServiceQuestion>,
  context: string,
  issues: string[],
): void {
  const seen = new Set<string>();
  for (const condition of conditions ?? []) {
    const question = questions.get(condition.questionId);
    if (!question) {
      issues.push(context + ': pergunta inexistente: ' + condition.questionId);
    } else if (!question.options.includes(condition.equals)) {
      issues.push(context + ': resposta fora das opções: ' + condition.equals);
    }
    if (seen.has(condition.questionId)) {
      issues.push(context + ': pergunta repetida nas condições: ' + condition.questionId);
    }
    seen.add(condition.questionId);
  }
}

/**
 * Pure metadata validation: it never reads files or proves an official source.
 * Physical PDF validation and human visual approval are separate mandatory gates.
 */
export function validateCatalog(data: CatalogDefinition): string[] {
  const issues: string[] = [];
  const fields = buildIndex(data.fields, 'campo', issues);
  const forms = buildIndex(data.forms, 'formulário', issues);
  const versions = buildIndex(data.versions, 'versão', issues);
  buildIndex(data.mappings, 'mapeamento', issues);
  const services = buildIndex(data.services, 'serviço', issues);
  const versionRevisions = new Set<string>();
  const mappingRevisions = new Set<string>();
  const approvedMappings = new Map<string, number>();

  for (const version of data.versions) {
    if (!forms.has(version.formId)) issues.push('versão ' + version.id + ': formulário inexistente');
    if (!SAFE_ID.test(version.revision)) issues.push('versão ' + version.id + ': revisão inválida');
    const pair = version.formId + ':' + version.revision;
    if (versionRevisions.has(pair)) issues.push('versão duplicada: ' + pair);
    versionRevisions.add(pair);

    if (version.templatePath !== null) {
      const expected = 'backend/templates/' + version.formId + '/' + version.revision + '/original.pdf';
      if (version.templatePath !== expected) {
        issues.push('versão ' + version.id + ': caminho fora da estrutura permitida');
      }
    }
    if (version.sourceUrl !== null && !validHttpsUrl(version.sourceUrl)) {
      issues.push('versão ' + version.id + ': origem deve ser URL HTTPS válida');
    }
    if (version.verifiedAt !== null && !validDay(version.verifiedAt)) {
      issues.push('versão ' + version.id + ': data de conferência inválida');
    }
    if (version.sha256 !== null && !SHA256.test(version.sha256)) {
      issues.push('versão ' + version.id + ': SHA-256 inválido');
    }
    if (version.status === 'VERIFIED' &&
      (!version.regulation.trim() || !version.sourceUrl || !version.verifiedAt ||
        !version.sha256 || !version.templatePath || version.pdfKind === 'UNKNOWN')) {
      issues.push('versão ' + version.id + ': evidências incompletas para VERIFIED');
    }
  }

  for (const mapping of data.mappings) {
    const version = versions.get(mapping.formVersionId);
    if (!version) issues.push('mapeamento ' + mapping.id + ': versão inexistente');
    if (!SAFE_ID.test(mapping.revision)) issues.push('mapeamento ' + mapping.id + ': revisão inválida');
    const pair = mapping.formVersionId + ':' + mapping.revision;
    if (mappingRevisions.has(pair)) issues.push('mapeamento duplicado: ' + pair);
    mappingRevisions.add(pair);
    if (mapping.status !== 'DRAFT' && mapping.placements.length === 0) {
      issues.push('mapeamento ' + mapping.id + ': nenhum campo mapeado');
    }
    if (mapping.reviewedAt !== null && !validDay(mapping.reviewedAt)) {
      issues.push('mapeamento ' + mapping.id + ': data de revisão inválida');
    }
    if (mapping.status === 'APPROVED') {
      approvedMappings.set(mapping.formVersionId, (approvedMappings.get(mapping.formVersionId) ?? 0) + 1);
      if (version?.status !== 'VERIFIED') issues.push('mapeamento ' + mapping.id + ': versão não verificada');
      if (!mapping.reviewedAt || !mapping.reviewer?.trim() || !mapping.reportPath?.trim()) {
        issues.push('mapeamento ' + mapping.id + ': revisão humana/relatório ausente');
      }
    }
    const locations = new Set<string>();
    for (const placement of mapping.placements) {
      if (!fields.has(placement.fieldId)) issues.push('mapeamento ' + mapping.id + ': campo inexistente: ' + placement.fieldId);
      if (version?.pdfKind === 'STATIC' && placement.kind === 'ACROFORM') {
        issues.push('mapeamento ' + mapping.id + ': AcroForm incompatível com PDF estático');
      }
      if (placement.kind === 'ACROFORM') {
        if (!placement.pdfFieldName.trim()) issues.push('mapeamento ' + mapping.id + ': nome do campo PDF vazio');
        const locator = 'acro:' + placement.pdfFieldName;
        if (locations.has(locator)) issues.push('mapeamento ' + mapping.id + ': posição repetida: ' + locator);
        locations.add(locator);
      } else {
        if (placement.markWhen !== undefined) {
          const definition = fields.get(placement.fieldId);
          if (placement.markWhen.trim() === '' || placement.markWhen.length > 32 ||
            (definition?.validationRuleId === 'simNao' &&
              !['sim', 'nao'].includes(placement.markWhen))) {
            issues.push('mapeamento ' + mapping.id + ': opção de marcação inválida');
          }
        }
        if (placement.markAliases !== undefined) {
          if (placement.markWhen === undefined || placement.markAliases.length === 0 ||
            placement.markAliases.length > 8 ||
            placement.markAliases.some((alias) => !alias.trim() || alias.length > 80)) {
            issues.push('mapeamento ' + mapping.id + ': aliases de marcação inválidos');
          }
        }
        if (placement.valueTransform !== undefined) {
          const definition = fields.get(placement.fieldId);
          if (definition?.valueKind !== 'date' || placement.markWhen !== undefined) {
            issues.push('mapeamento ' + mapping.id + ': transformação incompatível: ' + placement.fieldId);
          }
        }
        const values = [placement.pageIndex, placement.x, placement.y, placement.fontSize, placement.maxWidth];
        if (values.some((value) => !Number.isFinite(value)) ||
          !Number.isInteger(placement.pageIndex) || placement.pageIndex < 0 ||
          placement.x < 0 || placement.y < 0 || placement.fontSize <= 0 || placement.maxWidth <= 0) {
          issues.push('mapeamento ' + mapping.id + ': coordenadas inválidas');
        }
        const locator = 'xy:' + placement.pageIndex + ':' + placement.x + ':' + placement.y;
        if (locations.has(locator)) issues.push('mapeamento ' + mapping.id + ': posição repetida: ' + locator);
        locations.add(locator);
      }
    }
  }
  for (const [versionId, count] of approvedMappings) {
    if (count > 1) issues.push('versão ' + versionId + ': mais de um mapeamento aprovado');
  }

  const questionsByService = new Map<string, Map<string, ServiceQuestion>>();
  for (const service of data.services) {
    if (!Number.isInteger(service.creditCost) || service.creditCost < 0) {
      issues.push('serviço ' + service.id + ': custo em créditos inválido');
    }
    const questions = buildIndex(service.questions, 'pergunta de ' + service.id, issues);
    questionsByService.set(service.id, questions);
    for (const question of service.questions) {
      if (!question.label.trim() || question.options.length === 0 ||
        new Set(question.options).size !== question.options.length ||
        question.options.some((option) => !option.trim())) {
        issues.push('serviço ' + service.id + ': opções inválidas para ' + question.id);
      }
    }
    buildIndex(service.documentRequirements, 'documento de ' + service.id, issues);
    for (const requirement of service.documentRequirements) {
      validateConditions(requirement.conditions, questions, 'documento ' + requirement.id, issues);
      if (requirement.extraction &&
        (!SAFE_ID.test(requirement.extraction.documentType) ||
          !SAFE_ID.test(requirement.extraction.subjectRole))) {
        issues.push('documento ' + requirement.id + ': perfil de extração inválido');
      }
    }
  }

  const pairs = new Set<string>();
  const orders = new Set<string>();
  const formsByService = new Map<string, number>();
  for (const relation of data.serviceForms) {
    const service = services.get(relation.serviceId);
    const version = versions.get(relation.formVersionId);
    if (!service) issues.push('relação: serviço inexistente ' + relation.serviceId);
    if (!version) issues.push('relação: versão inexistente ' + relation.formVersionId);
    const pair = relation.serviceId + ':' + relation.formVersionId;
    if (pairs.has(pair)) issues.push('relação duplicada: ' + pair);
    pairs.add(pair);
    const order = relation.serviceId + ':' + relation.order;
    if (!Number.isInteger(relation.order) || relation.order < 1 || orders.has(order)) {
      issues.push('relação: ordem inválida/duplicada ' + order);
    }
    orders.add(order);
    formsByService.set(relation.serviceId, (formsByService.get(relation.serviceId) ?? 0) + 1);
    validateConditions(relation.conditions, questionsByService.get(relation.serviceId) ?? new Map(), pair, issues);
    for (const [fieldId, value] of Object.entries(relation.fixedValues ?? {})) {
      if (!fields.has(fieldId) || !value || value.length > 20) {
        issues.push('relação: valor fixo inválido: ' + fieldId);
      }
    }
    if (version?.status === 'OUTDATED') issues.push('relação: versão desatualizada ' + relation.formVersionId);
    if (service?.status === 'AVAILABLE' &&
      (version?.status !== 'VERIFIED' || approvedMappings.get(relation.formVersionId) !== 1)) {
      issues.push('serviço ' + service.id + ': formulário sem versão/mapeamento aprovados');
    }
  }
  for (const service of data.services) {
    if (service.status === 'AVAILABLE' && !formsByService.get(service.id)) {
      issues.push('serviço ' + service.id + ': sem formulários associados');
    }
  }
  return issues;
}
