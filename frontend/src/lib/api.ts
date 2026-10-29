export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldId?: string,
    public readonly errorCode?: string,
    public readonly requirementId?: string,
    public readonly fieldReason?: string,
  ) { super(message); }
}

/** Temporary QA diagnostic requested by the developer; never log arbitrary API responses. */
function logLocalOcrResult(path: string, method: string, data: unknown): void {
  const route = /^\/api\/jobs\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}(\/extract)?$/i.exec(path);
  if (!route || method !== (route[1] ? 'POST' : 'GET') ||
    typeof window === 'undefined' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) ||
    !data || typeof data !== 'object' || !('diagnostics' in data) ||
    !Array.isArray(data.diagnostics)) return;

  // nameStage is emitted by the backend ONLY for identity documents in DEV_QA_PREVIEW.
  // Vite's import.meta.env.DEV cannot be used: local Docker serves a built frontend.
  const qaIdentity = data.diagnostics.some((item: unknown) =>
    !!item && typeof item === 'object' && 'requirementId' in item &&
    typeof item.requirementId === 'string' &&
    ['buyer-identity', 'seller-identity'].includes(item.requirementId) &&
    'nameStage' in item && typeof item.nameStage === 'string' &&
    ['name_recognized', 'name_not_mapped', 'label_seen_name_rejected', 'label_not_detected']
      .includes(item.nameStage));
  if (!qaIdentity) return;

  // Snapshot only these fields; no job IDs, cookies, files or raw OCR text.
  console.log(route[1]
    ? '[OCR] Extracao concluida - dados retornados pela API'
    : '[OCR] Processo recuperado - sem nova leitura; pode incluir edicoes manuais',
  JSON.stringify({
    fields: 'fields' in data ? data.fields : {},
    sources: 'sources' in data ? data.sources : {},
    diagnostics: data.diagnostics,
  }, null, 2));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: 'same-origin',
    headers: {
      ...(init?.body !== undefined &&
        !(init.body instanceof FormData) &&
        !(init.body instanceof Blob)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    // The API supplies error codes and public catalog identifiers, never OCR
    // text or personal values. Parse defensively if a proxy returns HTML.
    const detail: unknown = await response.json().catch(() => null);
    const body = detail && typeof detail === 'object' ? detail as Record<string, unknown> : {};
    const code = typeof body.error === 'string' ? body.error : undefined;
    const safeIdentifier = (value: unknown): string | undefined =>
      typeof value === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(value)
        ? value : undefined;
    const fieldId = safeIdentifier(body.fieldId);
    const requirementId = safeIdentifier(body.requirementId);
    const allowedReasons = new Set([
      'required', 'invalid_cpf', 'invalid_date', 'invalid_boolean',
      'invalid_choice', 'unsupported_character', 'text_too_long', 'text_overflow',
    ]);
    const fieldReason = typeof body.reason === 'string' && allowedReasons.has(body.reason)
      ? body.reason : undefined;
    const message = response.status === 401 ? 'Entre na sua conta para continuar.'
      : code === 'missing_required_fields' ? 'Há um campo obrigatório sem preencher.'
      : code === 'invalid_field_value' ? 'Um campo contém um valor inválido.'
      : code === 'missing_document' ? 'Ainda falta um documento obrigatório.'
      : code === 'openai_not_configured'
        ? 'A leitura pela OpenAI não está configurada neste servidor. Use PaddleOCR ou configure a API.'
      : code === 'openai_failed'
        ? 'A leitura pela OpenAI não foi concluída. Tente novamente ou use PaddleOCR.'
      : code === 'ocr_failed' ? 'A leitura não foi concluída. Tente novamente.'
      : code === 'insufficient_credits' ? 'Você não possui créditos suficientes para gerar os formulários.'
      : code === 'credit_charge_failed'
        ? 'Não foi possível confirmar a cobrança do crédito agora. Tente novamente.'
      : code === 'template_generation_failed'
        ? 'O modelo do formulário não pôde ser gerado. Tente novamente ou informe o suporte.'
      : code === 'generation_failed' ? 'Não foi possível gerar o PDF. Confira os dados e tente novamente.'
      : code === 'invalid_document' ? 'Arquivo não aceito. Confira formato, integridade e tamanho.'
      : response.status === 413 ? 'Arquivo excede o limite de 10 MB.'
      : response.status === 409 ? 'O processo está indisponível, ocupado ou expirou.'
      : response.status === 422 ? 'Revise os documentos e valores informados.'
      : response.status === 429 ? 'Muitas tentativas. Aguarde antes de continuar.'
      : 'Não foi possível concluir a solicitação. Tente novamente.';
    throw new ApiError(response.status, message, fieldId, code, requirementId, fieldReason);
  }
  const data: unknown = await response.json();
  logLocalOcrResult(path, (init?.method ?? 'GET').toUpperCase(), data);
  return data as T;
}

export interface LiveReviewField {
  id: string;
  label: string;
  valueKind: string;
  required: boolean;
}

export interface LiveReviewForm {
  formVersionId: string;
  formId: string;
  name: string;
  description?: string;
  fields: readonly LiveReviewField[];
}

export interface LiveService {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  questions: readonly {
    id:string;
    label:string;
    options:readonly string[];
    unavailableOptions?:readonly string[];
    conditions?:readonly {questionId:string;equals?:string;oneOf?:readonly string[]}[];
  }[];
  documentRequirements: readonly {id:string;label:string;description?:string;required:boolean}[];
  reviewFields: readonly LiveReviewField[];
  reviewForms?: readonly LiveReviewForm[];
  formVersionIds: readonly string[];
}
