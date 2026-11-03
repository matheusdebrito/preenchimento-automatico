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
type MissingFieldStatus = 'not_visible' | 'uncertain';

export interface MissingFieldObservation {
  fieldId: string;
  sourceRequirementId: string;
  status: MissingFieldStatus;
}


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
  /** Status metadata only: no raw document text or personal identifiers. */
  missingFields: readonly MissingFieldObservation[];
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
  'cha',
  'cir',
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
  missingFields: z.array(z.object({
    fieldId: z.string().min(1).max(100),
    sourceRequirementId: z.string().min(1).max(100),
    status: z.enum(['not_visible', 'uncertain']),
  })).max(100).optional().default([]),
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
    required: ['candidates', 'documents', 'missingFields'],
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
      missingFields: {
        type: 'array',
        maxItems: 100,
        items: {
          type: 'object', additionalProperties: false,
          required: ['fieldId', 'sourceRequirementId', 'status'],
          properties: {
            fieldId: { type: 'string', enum: fieldIds },
            sourceRequirementId: { type: 'string', enum: requirementIds },
            status: { type: 'string', enum: ['not_visible', 'uncertain'] },
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
              enum: ['rg', 'cin', 'cnh', 'cha', 'tie-digital', 'tie-legacy', 'unknown', 'not-applicable'],
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
    label: field.id.endsWith('.identity')
      ? 'Número da identidade / Registro Geral (RG)'
      : field.label,
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

  const types = new Set(documents.map((item) => item.documentType ?? 'unknown'));
  const typeRules: string[] = [];
  if (types.has('identity')) {
    const identityDocuments = documents.filter((item) => item.documentType === 'identity');
    const knownSubtypes = identityDocuments.map((item) => item.detectedSubtype);
    const requireClassification = knownSubtypes.some((item) =>
      item !== 'rg' && item !== 'cin' && item !== 'cnh');
    typeRules.push('IDENTIDADE: classifique rg, cin ou cnh pela imagem, e nao pelo nome do arquivo.');
    if (requireClassification || knownSubtypes.includes('rg')) {
      typeRules.push('RG: o número da identidade/documento (identity) vem do valor ligado a REGISTRO GERAL / RG. Nunca substituir por CPF.');
    }
    if (requireClassification || knownSubtypes.includes('cin')) {
      typeRules.push('CIN: CPF e o identificador unico; o backend preenche identity a partir do CPF validado.');
    }
    if (requireClassification || knownSubtypes.includes('cnh')) {
      typeRules.push('CNH: nao confunda numero de registro da habilitacao com o numero da identidade. Extraia identity so quando o numero do documento de identidade estiver impresso.');
    }
    typeRules.push(
      'Procure órgão emissor/expedidor sob ORGAO EMISSOR, ORGAO EXPEDIDOR, EXPEDIDOR, EMISSOR e siglas visíveis como SSP/RJ ou IFP. Extrair a autoridade do documento de identidade, nao a UF nem o departamento responsavel pela habilitacao.',
      'issuer e issuerState sao independentes: um valor pode existir sem o outro. Se o texto impresso for SSP/RJ, separar issuer=SSP e issuerState=RJ. Nunca deduza SSP, DETRAN ou UF apenas pelo estado, brasao ou titulo do documento.',
      'Se o órgão emissor nao aparecer no documento de identidade, marque issuer como not_visible. Se o trecho existir, mas nao estiver legivel, marque uncertain.',
    );
  }
  if (types.has('residence-proof')) {
    typeRules.push('COMPROVANTE: extraia apenas endereco, numero, complemento, bairro, cidade, UF e CEP impressos; nao preencha identidade nem orgao emissor.');
  }
  if (types.has('tie')) {
    typeRules.push('TIE/TIEM: nao confunda inscricao, casco/HIN e serie de motor; endereco so se estiver impresso. Classifique como tie-digital ou tie-legacy.');
  }
  if (types.has('cha')) {
    typeRules.push('Classifique Carteira de Habilitação de Amador como cha. CHA: amateur.chaNumber e o numero de inscricao, nunca CPF, QR Code ou protocolo; amateur.category e a categoria expressa; amateur.chaIssueDate e somente a data de emissao.');
  }
  if (types.has('cir')) {
    typeRules.push('CIR: aquaviario.cirNumber e o numero da CIR, aquaviario.category e a categoria expressa na capa. Nao inferir promocao ou outros dados.');
  }
  return [
    'Extraia apenas os campos autorizados e VISIVEIS dos documentos brasileiros.',
    'Nao invente nem infira valores. Trate cada documento e seu titular separadamente.',
    'Classifique cada documento no mesmo processamento. Se knownSubtype estiver informado, preserve-o.',
    'Para cada fonte retorne SOMENTE campos do seu allowedFieldIds e use seu requirementId.',
    'Nunca confunda CPF, RG, inscricao da embarcacao, registro de CNH ou numero de motor.',
    'Datas: DD/MM/AAAA somente com dia, mes e ano visiveis. Valores sim/nao: sim ou nao. Booleanos: true ou false.',
    'Candidates: apenas dados visiveis com confianca high ou medium.',
    'missingFields: registre SOMENTE issuer e issuerState solicitados sem candidate para cada fonte de identidade, status not_visible (ausente) ou uncertain (ilegivel/ambiguo). Para os demais campos, nao crie missingFields. Nao inclua valor nem dados pessoais.',
    'Nao gere candidates para campos com status missingFields. Em caso de conflito entre fontes, retorne candidates separados.',
    ...typeRules,
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
    beforeRequest?: () => void | Promise<void>;
  } = {},
): Promise<OpenAiExtractionResult> {
  if (documents.length === 0 || fields.length === 0) {
    return { evidence: [], diagnostics: [], model: DEFAULT_MODEL, documentSubtypes: {}, missingFields: [] };
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

  await options.beforeRequest?.();

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

  // Only accept status reports for authorized fields without an accepted candidate.
  // Inconsistent status vs candidate is treated as uncertain, never used to
  // suppress a recovery attempt.
  const missingFields: MissingFieldObservation[] = parsed.missingFields
    .filter((item) => allowedBySource.get(item.sourceRequirementId)?.has(item.fieldId))
    .filter((item) => allowedFields.has(item.fieldId))
    .filter((item) => !evidence.some((candidate) =>
      candidate.fieldId === item.fieldId && candidate.sourceId === item.sourceRequirementId));

  // When the model returns an explicitly combined issuer such as SSP/RJ,
  // split the visible UF into issuerState if both target fields are allowed.
  for (const [requirementId, source] of allowedSources) {
    if (source.documentType !== 'identity') continue;
    const subtypeAllowed = allowedBySource.get(requirementId) ?? new Set<string>();
    for (const issuer of evidence.filter((item) =>
      item.sourceId === requirementId && item.fieldId.endsWith('.issuer'))) {
      const match = /^(.+?)[\s/-]+([A-Z]{2})$/i.exec(issuer.value.trim());
      if (!match) continue;
      const issuerStateFieldId = issuer.fieldId.replace(/\.issuer$/, '.issuerState');
      if (!subtypeAllowed.has(issuerStateFieldId) || !allowedFields.has(issuerStateFieldId)) continue;
      issuer.value = match[1]!.trim();
      if (!evidence.some((item) => item.sourceId === requirementId &&
        item.fieldId === issuerStateFieldId)) {
        evidence.push({
          ...issuer,
          fieldId: issuerStateFieldId,
          value: match[2]!.toUpperCase(),
        });
      }
    }
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
    missingFields: missingFields.filter((item) => !evidence.some((candidate) =>
      candidate.fieldId === item.fieldId && candidate.sourceId === item.sourceRequirementId)),
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
    beforeRequest?: () => void | Promise<void>;
  } = {},
): Promise<OpenAiExtractionWithContingencyResult> {
  const primary = await extractDocumentsWithOpenAi(documents, fields, options);
  const pending = fieldsNeedingContingency(primary.evidence, fields);
  // Only skip a costly retry for an issuer field explicitly reported absent
  // from EVERY eligible source. Uncertain / unreadable fields still retry.
  // A missing status report is never sufficient to suppress recovery.
  for (const field of fields) {
    if (!field.id.endsWith('.issuer') && !field.id.endsWith('.issuerState')) continue;
    if (!pending.has(field.id)) continue;
    const eligible = documents.filter((document) =>
      document.allowedFieldIds.includes(field.id));
    if (eligible.length === 0) continue;
    if (eligible.every((document) => primary.missingFields.some((observation) =>
      observation.fieldId === field.id &&
      observation.sourceRequirementId === document.document.requirementId &&
      observation.status === 'not_visible'))) {
      pending.delete(field.id);
    }
  }

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

  // A joint primary pass is cost-efficient, but a joint retry can repeat the
  // same omission when an identity and a residence proof compete for attention.
  // For small multi-document requests, retry each source in isolation, exactly
  // once per source, with only its own unresolved fields. Never retry a field
  // that was already resolved, and never send unrelated fields to a document.
  // Larger batches keep the existing bounded single-request behavior.
  const retryGroups = retryDocuments.length > 1 && retryDocuments.length <= 3
    ? retryDocuments.map((document) => ({
        documents: [document],
        fields: retryFields.filter((field) => document.allowedFieldIds.includes(field.id)),
      }))
    : [{ documents: retryDocuments, fields: retryFields }];

  const results: OpenAiExtractionResult[] = [];
  let failed = false;
  for (const group of retryGroups) {
    if (group.fields.length === 0) continue;
    try {
      results.push(await extractDocumentsWithOpenAi(group.documents, group.fields, options));
    } catch (error) {
      if (!(error instanceof OpenAiDocumentError)) throw error;
      failed = true;
    }
  }
  // Successfully resolved first-pass fields are immutable. An unresolved
  // field is still review-required if multiple retry sources disagree.
  const evidence = [
    ...primary.evidence.filter((item) => !pending.has(item.fieldId)),
    ...results.flatMap((item) => item.evidence),
  ];
  const retryDiagnostics = results.flatMap((item) => item.diagnostics);
  const recoveredFieldCount = new Set(results.flatMap((item) =>
    item.evidence.map((entry) => entry.fieldId))).size;
  return {
    evidence,
    diagnostics: mergedDiagnostics(documents, evidence, primary.diagnostics, retryDiagnostics),
    model: primary.model,
    documentSubtypes: primary.documentSubtypes,
    missingFields: [...primary.missingFields, ...results.flatMap((item) => item.missingFields)]
      .filter((item) => !evidence.some((candidate) =>
        candidate.fieldId === item.fieldId && candidate.sourceId === item.sourceRequirementId)),
    usage: results.reduce((usage, item) => sumUsage(usage, item.usage), primary.usage),
    contingency: {
      used: true,
      failed,
      requestedFieldCount: retryFields.length,
      documentCount: retryDocuments.length,
      recoveredFieldCount,
    },
  };
}
