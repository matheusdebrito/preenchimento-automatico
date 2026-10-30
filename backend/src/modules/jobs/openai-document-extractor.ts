import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { isValidBrazilianDate, isValidCpf } from '../catalog/field-validation.js';
import {
  fieldsAllowedForDetectedSubtype,
  identityTypeValue,
} from '../catalog/document-field-policies.js';
import type { DetectedDocumentSubtype } from '../catalog/document-field-policies.js';
import type { FieldEvidence } from '../document-understanding/contracts.js';
import type { StoredDocument, ExtractionDiagnostic } from './job-store.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.4-mini-2026-03-17';
const ALLOWED_MODELS = new Set([
  'gpt-5.4-mini-2026-03-17',
  'gpt-5.4-nano-2026-03-17',
]);
const ALLOWED_DETAIL = new Set(['auto', 'low', 'high']);

type FetchLike = typeof fetch;
type Confidence = 'high' | 'medium';
type DocumentStatus = 'readable' | 'partial' | 'unreadable';

export interface OpenAiTargetField {
  id: string;
  label: string;
  valueKind: string;
  validationRuleId?: string;
  required: boolean;
}

export interface OpenAiDocumentDescriptor {
  document: StoredDocument;
  label: string;
  documentType?: string;
  subjectRole?: string;
  /** Reuse a subtype already classified in the primary pass during contingency. */
  detectedSubtype?: DetectedDocumentSubtype;
  /** Fields this source document is authorized to provide for this request. */
  allowedFieldIds: readonly string[];
}

export interface OpenAiExtractionResult {
  evidence: FieldEvidence[];
  diagnostics: ExtractionDiagnostic[];
  model: string;
  documentSubtypes: Readonly<Record<string, DetectedDocumentSubtype>>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface OpenAiExtractionWithContingencyResult extends OpenAiExtractionResult {
  contingency: {
    used: boolean;
    failed: boolean;
    requestedFieldCount: number;
    documentCount: number;
    recoveredFieldCount: number;
  };
}

export class OpenAiDocumentError extends Error {
  constructor(
    public readonly code: 'not_configured' | 'unavailable' | 'invalid_response',
  ) {
    super(code);
  }
}

const candidateSchema = z.object({
  fieldId: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
  sourceRequirementId: z.string().min(1).max(100),
  confidence: z.enum(['high', 'medium']),
});

const documentSubtypeSchema = z.enum([
  'rg',
  'cin',
  'cnh',
  'tie-digital',
  'tie-legacy',
  'unknown',
  'not-applicable',
]);

const structuredResultSchema = z.object({
  candidates: z.array(candidateSchema).max(100),
  documents: z.array(z.object({
    requirementId: z.string().min(1).max(100),
    status: z.enum(['readable', 'partial', 'unreadable']),
    subtype: documentSubtypeSchema.optional().default('unknown'),
  })).max(24),
});

const apiResponseSchema = z.object({
  output: z.array(z.object({
    type: z.string().optional(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      refusal: z.string().optional(),
    }).passthrough()).optional(),
  }).passthrough()).optional(),
  usage: z.object({
    input_tokens: z.number().int().nonnegative().optional(),
    output_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional(),
  }).optional(),
}).passthrough();

function modelFromEnvironment(env: NodeJS.ProcessEnv): string {
  const configured = env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.has(configured)) {
    throw new OpenAiDocumentError('not_configured');
  }
  return configured;
}

function detailFromEnvironment(env: NodeJS.ProcessEnv): 'auto' | 'low' | 'high' {
  const configured = env.OPENAI_DOCUMENT_DETAIL?.trim().toLowerCase() || 'high';
  return ALLOWED_DETAIL.has(configured)
    ? configured as 'auto' | 'low' | 'high'
    : 'high';
}

function confidenceNumber(value: Confidence): number {
  return value === 'high' ? 0.95 : 0.75;
}

function normalizeSimple(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function hasDisallowedControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
  });
}

function normalizeYesNo(value: string): string | null {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
  if (['sim', 'yes', 'true'].includes(normalized)) return 'sim';
  if (['nao', 'no', 'false'].includes(normalized)) return 'nao';
  return null;
}

function normalizeBoolean(value: string): string | null {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
  if (['sim', 'yes', 'true', '1', 'marcado'].includes(normalized)) return 'true';
  if (['nao', 'no', 'false', '0', 'desmarcado'].includes(normalized)) return 'false';
  return null;
}

function validateCandidateValue(
  value: string,
  field: OpenAiTargetField,
): string | null {
  const normalized = normalizeSimple(value);
  if (!normalized || normalized.length > 500 || hasDisallowedControlCharacter(normalized)) {
    return null;
  }
  if (field.validationRuleId === 'cpf') {
    return isValidCpf(normalized) ? normalized : null;
  }
  if (field.validationRuleId === 'simNao') {
    return normalizeYesNo(normalized);
  }
  if (field.valueKind === 'date') {
    return isValidBrazilianDate(normalized) ? normalized : null;
  }
  if (field.valueKind === 'boolean') {
    return normalizeBoolean(normalized);
  }

  if (field.id === 'vessel.registration') {
    const compact = normalized.replace(/\s+/g, '');
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(compact) ||
      /^\d{1,4}[.,]\d{1,3}$/.test(compact) ||
      !/^[A-Z0-9./-]{8,30}$/i.test(compact) ||
      !/\d/.test(compact)) return null;
  }
  if (['vessel.crewCount', 'vessel.passengerCount', 'vessel.motorCount']
    .includes(field.id) && !/^\d{1,4}$/.test(normalized)) return null;
  if (field.id === 'vessel.year' &&
    !/^(?:19|20)\d{2}$/.test(normalized)) return null;
  if (field.id.endsWith('.postalCode') &&
    !/^\d{5}-?\d{3}$/.test(normalized)) return null;
  if (field.id.endsWith('.email') &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;

  return normalized;
}

function responseText(value: unknown): {
  parsed: z.infer<typeof structuredResultSchema>;
  usage?: OpenAiExtractionResult['usage'];
} {
  const api = apiResponseSchema.safeParse(value);
  if (!api.success) throw new OpenAiDocumentError('invalid_response');

  let refusal = false;
  const texts: string[] = [];
  for (const item of api.data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'refusal' || part.refusal) refusal = true;
      if (part.type === 'output_text' && typeof part.text === 'string') texts.push(part.text);
    }
  }
  if (refusal || texts.length === 0) throw new OpenAiDocumentError('invalid_response');

  let json: unknown;
  try {
    json = JSON.parse(texts.join(''));
  } catch {
    throw new OpenAiDocumentError('invalid_response');
  }
  const parsed = structuredResultSchema.safeParse(json);
  if (!parsed.success) throw new OpenAiDocumentError('invalid_response');

  const usage = api.data.usage ? {
    inputTokens: api.data.usage.input_tokens,
    outputTokens: api.data.usage.output_tokens,
    totalTokens: api.data.usage.total_tokens,
  } : undefined;
  return { parsed: parsed.data, usage };
}

function outputSchema(fieldIds: readonly string[], requirementIds: readonly string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['candidates', 'documents'],
    properties: {
      candidates: {
        type: 'array',
        maxItems: 100,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['fieldId', 'value', 'sourceRequirementId', 'confidence'],
          properties: {
            fieldId: { type: 'string', enum: fieldIds },
            value: { type: 'string' },
            sourceRequirementId: { type: 'string', enum: requirementIds },
            confidence: { type: 'string', enum: ['high', 'medium'] },
          },
        },
      },
      documents: {
        type: 'array',
        maxItems: requirementIds.length,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['requirementId', 'status', 'subtype'],
          properties: {
            requirementId: { type: 'string', enum: requirementIds },
            status: { type: 'string', enum: ['readable', 'partial', 'unreadable'] },
            subtype: {
              type: 'string',
              enum: ['rg', 'cin', 'cnh', 'tie-digital', 'tie-legacy', 'unknown', 'not-applicable'],
            },
          },
        },
      },
    },
  } as const;
}

function extractionPrompt(
  documents: readonly OpenAiDocumentDescriptor[],
  fields: readonly OpenAiTargetField[],
): string {
  const fieldList = fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.valueKind,
    required: field.required,
  }));
  const documentList = documents.map((item) => ({
    requirementId: item.document.requirementId,
    label: item.label,
    documentType: item.documentType ?? 'unknown',
    subjectRole: item.subjectRole ?? 'unknown',
    knownSubtype: item.detectedSubtype ?? null,
    allowedFieldIds: item.allowedFieldIds,
  }));

  return [
    'Tarefa: extrair dados visíveis de documentos para preencher um formulário brasileiro.',
    'Regras críticas:',
    '1. Use SOMENTE informação claramente visível no documento enviado.',
    '2. Nunca complete, deduza, adivinhe ou corrija um valor ausente.',
    '3. Valor mascarado, borrado, cortado, conflitante ou incerto deve ser OMITIDO de candidates.',
    '3a. Só retorne candidates com confiança alta ou média; evidência de baixa confiança deve ser omitida.',
    '4. Não confunda titular com pai, mãe, vendedor, comprador, proprietário ou coproprietário.',
    '5. Não confunda número de inscrição da embarcação com casco/HIN, série do motor, datas ou medidas.',
    '6. Para datas, só retorne DD/MM/AAAA quando a data completa estiver inequivocamente presente.',
    '7. Para campos sim/não use exatamente sim ou nao. Para booleanos use true ou false.',
    '8. Preserve nomes e identificadores como aparecem, exceto normalizações explícitas acima.',
    '9. Cada candidate deve apontar para o requirementId do documento em que o valor está visível.',
    '9a. Para cada documento, retorne SOMENTE fieldIds presentes em allowedFieldIds daquele documento.',
    '10. Se documentos divergirem, retorne candidatos separados por documento; o backend resolverá o conflito.',
    '11. Classifique cada documento: identidade como rg, cin ou cnh; TIE/TIEM como tie-digital ou tie-legacy; outros como not-applicable. Use unknown somente se realmente não for possível distinguir.',
    '11a. Se knownSubtype estiver preenchido, preserve exatamente esse subtipo; ele foi classificado na tentativa principal.',
    '11b. Em RG ou CNH, o número da identidade/documento só pode vir de um número explicitamente associado à identidade; nunca use CPF como identidade nesses subtipos.',
    '11c. Na CIN, o CPF é o número único da identidade. Retorne o CPF normalmente; o backend deriva o campo de identidade de forma determinística.',
    '11d. Não retorne identityType a partir de texto livre; o backend deriva RG, CIN ou CNH do subtipo classificado.',
    '11e. Para órgão emissor/expedidor, preserve a sigla/texto visível e nunca deduza o órgão apenas pela UF, layout ou tipo.',
    '11f. Em TIE digital, não invente endereço de proprietário/coproprietário se o bloco não existir. Em TIE/TIEM legado, extraia endereço somente quando estiver explicitamente impresso.',
    '11g. vessel.motorCount só pode ser retornado quando a quantidade de motores estiver explicitamente indicada; nunca inferir 1 apenas porque um motor aparece no documento.',
    '12. Não produza comentários, explicações ou campos além do schema.',
    'Campos permitidos: ' + JSON.stringify(fieldList),
    'Documentos enviados: ' + JSON.stringify(documentList),
  ].join('\n');
}

function mimeFor(document: StoredDocument): string {
  return document.kind === 'pdf' ? 'application/pdf'
    : document.kind === 'png' ? 'image/png' : 'image/jpeg';
}

function extensionFor(document: StoredDocument): string {
  return document.kind === 'jpeg' ? 'jpg' : document.kind;
}

export async function extractDocumentsWithOpenAi(
  documents: readonly OpenAiDocumentDescriptor[],
  fields: readonly OpenAiTargetField[],
  options: {
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
  } = {},
): Promise<OpenAiExtractionResult> {
  if (documents.length === 0 || fields.length === 0) {
    return { evidence: [], diagnostics: [], model: DEFAULT_MODEL, documentSubtypes: {} };
  }

  const env = options.env ?? process.env;
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new OpenAiDocumentError('not_configured');
  const model = modelFromEnvironment(env);
  const detail = detailFromEnvironment(env);
  const fetchImpl = options.fetchImpl ?? fetch;

  const requirementIds = [...new Set(documents.map((item) => item.document.requirementId))];
  const fieldIds = [...new Set(fields.map((field) => field.id))];
  const content: Record<string, unknown>[] = [
    { type: 'input_text', text: extractionPrompt(documents, fields) },
  ];

  for (const item of documents) {
    const document = item.document;
    const bytes = await readFile(document.path);
    content.push({
      type: 'input_text',
      text: 'DOCUMENTO requirementId=' + document.requirementId + ' label=' + item.label,
    });
    const dataUrl = 'data:' + mimeFor(document) + ';base64,' + bytes.toString('base64');
    if (document.kind === 'pdf') {
      content.push({
        type: 'input_file',
        filename: document.requirementId + '.' + extensionFor(document),
        file_data: dataUrl,
        detail,
      });
    } else {
      content.push({ type: 'input_image', image_url: dataUrl, detail });
    }
  }

  const headers: Record<string, string> = {
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  };
  const projectId = env.OPENAI_PROJECT_ID?.trim();
  if (projectId && !/[\r\n]/.test(projectId)) headers['OpenAI-Project'] = projectId;

  let response: Response;
  try {
    response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: 'none' },
        max_output_tokens: 4_000,
        input: [{ role: 'user', content }],
        text: {
          format: {
            type: 'json_schema',
            name: 'document_field_extraction',
            strict: true,
            schema: outputSchema(fieldIds, requirementIds),
          },
        },
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
    });
  } catch {
    throw new OpenAiDocumentError('unavailable');
  }

  if (!response.ok) throw new OpenAiDocumentError('unavailable');

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new OpenAiDocumentError('invalid_response');
  }
  const { parsed, usage } = responseText(raw);

  const allowedFields = new Map(fields.map((field) => [field.id, field]));
  const allowedSources = new Map(documents.map((item) => [
    item.document.requirementId,
    item,
  ]));
  const documentStatuses = new Map<string, DocumentStatus>();
  const documentSubtypes = new Map<string, DetectedDocumentSubtype>();
  for (const item of parsed.documents) {
    const source = allowedSources.get(item.requirementId);
    if (!source || documentStatuses.has(item.requirementId)) continue;
    documentStatuses.set(item.requirementId, item.status);
    documentSubtypes.set(
      item.requirementId,
      source.detectedSubtype ?? item.subtype,
    );
  }

  const allowedBySource = new Map<string, ReadonlySet<string>>();
  for (const [requirementId, source] of allowedSources) {
    const subtype = documentSubtypes.get(requirementId) ?? 'unknown';
    allowedBySource.set(requirementId, new Set(fieldsAllowedForDetectedSubtype(
      source.documentType,
      subtype,
      source.allowedFieldIds,
    )));
  }

  const evidence: FieldEvidence[] = [];
  for (const candidate of parsed.candidates) {
    const field = allowedFields.get(candidate.fieldId);
    const source = allowedSources.get(candidate.sourceRequirementId);
    const subtypeAllowed = allowedBySource.get(candidate.sourceRequirementId);
    if (!field || !source || !subtypeAllowed?.has(field.id)) continue;
    // identityType is deterministic from the classified subtype, never trusted
    // as free-form model output.
    if (source.documentType === 'identity' && field.id.endsWith('.identityType')) continue;
    const normalized = validateCandidateValue(candidate.value, field);
    if (!normalized) continue;
    const document = source.document;
    evidence.push({
      fieldId: field.id,
      value: normalized,
      confidence: confidenceNumber(candidate.confidence),
      documentId: document.id,
      sourceId: candidate.sourceRequirementId,
      page: 0,
      method: 'openai-structured-vision',
      lineIds: [],
      status: 'REVIEW_REQUIRED',
    });
  }

  // Derive identity type from classification and, for CIN only, mirror a
  // validated CPF into the identity field because CPF is the CIN's unique ID.
  for (const [requirementId, source] of allowedSources) {
    if (source.documentType !== 'identity') continue;
    const subtype = documentSubtypes.get(requirementId) ?? 'unknown';
    const subtypeAllowed = allowedBySource.get(requirementId) ?? new Set<string>();
    const typeValue = identityTypeValue(subtype);
    if (typeValue) {
      for (const fieldId of source.allowedFieldIds.filter((id) => id.endsWith('.identityType'))) {
        if (!subtypeAllowed.has(fieldId) || !allowedFields.has(fieldId)) continue;
        evidence.push({
          fieldId,
          value: typeValue,
          confidence: 0.95,
          documentId: source.document.id,
          sourceId: requirementId,
          page: 0,
          method: 'openai-structured-vision',
          lineIds: [],
          status: 'REVIEW_REQUIRED',
        });
      }
    }
    if (subtype !== 'cin') continue;
    const cpfEvidence = evidence.filter((item) =>
      item.sourceId === requirementId && item.fieldId.endsWith('.cpf'));
    for (const cpf of cpfEvidence) {
      const identityFieldId = cpf.fieldId.replace(/\.cpf$/, '.identity');
      if (!subtypeAllowed.has(identityFieldId) || !allowedFields.has(identityFieldId) ||
        evidence.some((item) => item.sourceId === requirementId &&
          item.fieldId === identityFieldId)) continue;
      evidence.push({
        ...cpf,
        fieldId: identityFieldId,
        confidence: 0.95,
      });
    }
  }
  const diagnostics: ExtractionDiagnostic[] = documents.map((item) => {
    const requirementId = item.document.requirementId;
    const suggestionCount = evidence.filter((candidate) =>
      candidate.sourceId === requirementId).length;
    const status = documentStatuses.get(requirementId);
    return {
      requirementId,
      outcome: suggestionCount > 0 ? 'suggested'
        : status === 'unreadable' ? 'no_text'
          : 'no_supported_labels',
      suggestionCount,
      engine: 'openai',
    };
  });

  return {
    evidence,
    diagnostics,
    model,
    documentSubtypes: Object.fromEntries(documentSubtypes),
    usage,
  };
}


function canonicalEvidenceValue(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase();
}

function fieldsNeedingContingency(
  evidence: readonly FieldEvidence[],
  fields: readonly OpenAiTargetField[],
): Set<string> {
  const valuesByField = new Map<string, Set<string>>();
  for (const item of evidence) {
    const values = valuesByField.get(item.fieldId) ?? new Set<string>();
    values.add(canonicalEvidenceValue(item.value));
    valuesByField.set(item.fieldId, values);
  }

  return new Set(fields
    .filter((field) => {
      const values = valuesByField.get(field.id);
      return !values || values.size !== 1;
    })
    .map((field) => field.id));
}

function sumUsage(
  first?: OpenAiExtractionResult['usage'],
  second?: OpenAiExtractionResult['usage'],
): OpenAiExtractionResult['usage'] | undefined {
  if (!first && !second) return undefined;
  const sum = (key: 'inputTokens' | 'outputTokens' | 'totalTokens') => {
    const values = [first?.[key], second?.[key]].filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length > 0 ? values.reduce((total, value) => total + value, 0) : undefined;
  };
  return {
    inputTokens: sum('inputTokens'),
    outputTokens: sum('outputTokens'),
    totalTokens: sum('totalTokens'),
  };
}

function mergedDiagnostics(
  documents: readonly OpenAiDocumentDescriptor[],
  evidence: readonly FieldEvidence[],
  primary: readonly ExtractionDiagnostic[],
  contingency?: readonly ExtractionDiagnostic[],
): ExtractionDiagnostic[] {
  const primaryById = new Map(primary.map((item) => [item.requirementId, item]));
  const contingencyById = new Map((contingency ?? []).map((item) => [item.requirementId, item]));

  return documents.map((item) => {
    const requirementId = item.document.requirementId;
    const suggestionCount = evidence.filter((candidate) =>
      candidate.sourceId === requirementId).length;
    if (suggestionCount > 0) {
      return {
        requirementId,
        outcome: 'suggested',
        suggestionCount,
        engine: 'openai',
      };
    }
    const base = contingencyById.get(requirementId) ?? primaryById.get(requirementId);
    return base ? { ...base, suggestionCount: 0 } : {
      requirementId,
      outcome: 'no_supported_labels',
      suggestionCount: 0,
      engine: 'openai',
    };
  });
}

/**
 * Runs one primary extraction and, only when needed, one global selective
 * contingency pass. The contingency receives every unresolved field together
 * and only the documents authorized to provide at least one of those fields.
 * There is deliberately no third attempt.
 */
export async function extractDocumentsWithOneContingency(
  documents: readonly OpenAiDocumentDescriptor[],
  fields: readonly OpenAiTargetField[],
  options: {
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
  } = {},
): Promise<OpenAiExtractionWithContingencyResult> {
  const primary = await extractDocumentsWithOpenAi(documents, fields, options);
  const pending = fieldsNeedingContingency(primary.evidence, fields);

  if (pending.size === 0) {
    return {
      ...primary,
      contingency: {
        used: false,
        failed: false,
        requestedFieldCount: 0,
        documentCount: 0,
        recoveredFieldCount: 0,
      },
    };
  }

  const retryFields = fields.filter((field) => pending.has(field.id));
  const retryDocuments = documents
    .filter((document) => document.allowedFieldIds.some((fieldId) => pending.has(fieldId)))
    .map((document) => {
      const detectedSubtype = primary.documentSubtypes[document.document.requirementId];
      return {
        ...document,
        ...(detectedSubtype ? { detectedSubtype } : {}),
        allowedFieldIds: document.allowedFieldIds.filter((fieldId) => pending.has(fieldId)),
      };
    });

  if (retryFields.length === 0 || retryDocuments.length === 0) {
    const evidence = primary.evidence.filter((item) => !pending.has(item.fieldId));
    return {
      ...primary,
      evidence,
      diagnostics: mergedDiagnostics(documents, evidence, primary.diagnostics),
      contingency: {
        used: false,
        failed: false,
        requestedFieldCount: 0,
        documentCount: 0,
        recoveredFieldCount: 0,
      },
    };
  }

  try {
    const retry = await extractDocumentsWithOpenAi(retryDocuments, retryFields, options);
    // Successful primary fields are immutable. For unresolved/conflicting fields,
    // discard first-pass evidence and trust only the isolated contingency result.
    const evidence = [
      ...primary.evidence.filter((item) => !pending.has(item.fieldId)),
      ...retry.evidence,
    ];
    const recoveredFieldCount = new Set(retry.evidence.map((item) => item.fieldId)).size;
    return {
      evidence,
      diagnostics: mergedDiagnostics(documents, evidence, primary.diagnostics, retry.diagnostics),
      model: primary.model,
      documentSubtypes: primary.documentSubtypes,
      usage: sumUsage(primary.usage, retry.usage),
      contingency: {
        used: true,
        failed: false,
        requestedFieldCount: retryFields.length,
        documentCount: retryDocuments.length,
        recoveredFieldCount,
      },
    };
  } catch (error) {
    if (!(error instanceof OpenAiDocumentError)) throw error;
    const evidence = primary.evidence.filter((item) => !pending.has(item.fieldId));
    return {
      evidence,
      diagnostics: mergedDiagnostics(documents, evidence, primary.diagnostics),
      model: primary.model,
      documentSubtypes: primary.documentSubtypes,
      usage: primary.usage,
      contingency: {
        used: true,
        failed: true,
        requestedFieldCount: retryFields.length,
        documentCount: retryDocuments.length,
        recoveredFieldCount: 0,
      },
    };
  }
}
