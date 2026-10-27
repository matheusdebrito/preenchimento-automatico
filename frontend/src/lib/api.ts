export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
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
    throw new ApiError(response.status,
      response.status === 401 ? 'Entre na sua conta para continuar.' :
      response.status === 409 ? 'Serviço ainda não disponível ou sessão expirada.' :
      response.status === 422 ? 'Confira os documentos e campos obrigatórios.' :
      'Não foi possível concluir a solicitação.');
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
