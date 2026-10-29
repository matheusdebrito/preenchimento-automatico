import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { isValidBrazilianDate, isValidCpf } from '../catalog/field-validation.js';
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
type Confidence = 'high' | 'medium' | 'low';
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
}

export interface OpenAiExtractionResult {
  evidence: FieldEvidence[];
  diagnostics: ExtractionDiagnostic[];
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
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
  confidence: z.enum(['high', 'medium', 'low']),
});

const structuredResultSchema = z.object({
  candidates: z.array(candidateSchema).max(100),
  documents: z.array(z.object({
    requirementId: z.string().min(1).max(100),
    status: z.enum(['readable', 'partial', 'unreadable']),
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
  return value === 'high' ? 0.95 : value === 'medium' ? 0.75 : 0.55;
}

function normalizeSimple(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
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
  if (!normalized || normalized.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(normalized)) {
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
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
        },
      },
      documents: {
        type: 'array',
        maxItems: requirementIds.length,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['requirementId', 'status'],
          properties: {
            requirementId: { type: 'string', enum: requirementIds },
            status: { type: 'string', enum: ['readable', 'partial', 'unreadable'] },
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
  }));

  return [
    'Tarefa: extrair dados visíveis de documentos para preencher um formulário brasileiro.',
    'Regras críticas:',
    '1. Use SOMENTE informação claramente visível no documento enviado.',
    '2. Nunca complete, deduza, adivinhe ou corrija um valor ausente.',
    '3. Valor mascarado, borrado, cortado, conflitante ou incerto deve ser OMITIDO de candidates.',
    '4. Não confunda titular com pai, mãe, vendedor, comprador, proprietário ou coproprietário.',
    '5. Não confunda número de inscrição da embarcação com casco/HIN, série do motor, datas ou medidas.',
    '6. Para datas, só retorne DD/MM/AAAA quando a data completa estiver inequivocamente presente.',
    '7. Para campos sim/não use exatamente sim ou nao. Para booleanos use true ou false.',
    '8. Preserve nomes e identificadores como aparecem, exceto normalizações explícitas acima.',
    '9. Cada candidate deve apontar para o requirementId do documento em que o valor está visível.',
    '10. Se documentos divergirem, retorne candidatos separados por documento; o backend resolverá o conflito.',
    '11. Não produza comentários, explicações ou campos além do schema.',
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
    return { evidence: [], diagnostics: [], model: DEFAULT_MODEL };
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
  const allowedSources = new Set(requirementIds);
  const evidence: FieldEvidence[] = [];
  for (const candidate of parsed.candidates) {
    const field = allowedFields.get(candidate.fieldId);
    if (!field || !allowedSources.has(candidate.sourceRequirementId)) continue;
    const normalized = validateCandidateValue(candidate.value, field);
    if (!normalized) continue;
    const document = documents.find((item) =>
      item.document.requirementId === candidate.sourceRequirementId)?.document;
    if (!document) continue;
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

  const documentStatuses = new Map<string, DocumentStatus>();
  for (const item of parsed.documents) {
    if (allowedSources.has(item.requirementId) && !documentStatuses.has(item.requirementId)) {
      documentStatuses.set(item.requirementId, item.status);
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

  return { evidence, diagnostics, model, usage };
}
