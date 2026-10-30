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
    // The API supplies error codes and public catalog identifiers, never document
    // content or personal values. Parse defensively if a proxy returns HTML.
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
      : code === 'review_required'
        ? 'Revise e confirme os campos antes de gerar os formulários.'
      : code === 'service_unavailable'
        ? 'Este serviço não está disponível para geração neste momento.'
      : code === 'job_busy'
        ? 'Este processo já está sendo executado. Aguarde a conclusão antes de tentar novamente.'
      : code === 'invalid_state'
        ? 'Esta etapa não pode ser executada no estado atual do processo.'
      : code === 'openai_not_configured'
        ? 'A leitura pela OpenAI não está configurada neste servidor. Configure a chave da API.'
      : code === 'openai_failed'
        ? 'A leitura pela OpenAI não foi concluída. Confira a conexão e tente novamente.'
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
