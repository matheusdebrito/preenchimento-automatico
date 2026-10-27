export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldId?: string,
    public readonly errorCode?: string,
    public readonly requirementId?: string,
  ) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: 'same-origin',
    headers: {
      ...(init?.body instanceof FormData || init?.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
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
    const message = response.status === 401 ? 'Entre na sua conta para continuar.'
      : code === 'missing_required_fields' ? 'Há um campo obrigatório sem preencher.'
      : code === 'invalid_field_value' ? 'Um campo contém um valor inválido.'
      : code === 'missing_document' ? 'Ainda falta um documento obrigatório.'
      : code === 'ocr_failed' ? 'A leitura não foi concluída. Tente novamente.'
      : code === 'generation_failed' ? 'Não foi possível gerar o PDF. Confira os dados e tente novamente.'
      : code === 'invalid_document' ? 'Arquivo não aceito. Confira formato, integridade e tamanho.'
      : response.status === 413 ? 'Arquivo excede o limite de 10 MB.'
      : response.status === 409 ? 'O processo está indisponível, ocupado ou expirou.'
      : response.status === 422 ? 'Revise os documentos e valores informados.'
      : response.status === 429 ? 'Muitas tentativas. Aguarde antes de continuar.'
      : 'Não foi possível concluir a solicitação. Tente novamente.';
    throw new ApiError(response.status, message, fieldId, code, requirementId);
  }
  return response.json() as Promise<T>;
}

export interface LiveService {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  questions: readonly {id:string;label:string;options:readonly string[]}[];
  documentRequirements: readonly {id:string;label:string;description?:string;required:boolean}[];
  reviewFields: readonly {id:string;label:string;valueKind:string;required:boolean}[];
  formVersionIds: readonly string[];
}
