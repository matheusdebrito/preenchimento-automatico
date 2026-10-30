// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

function mockResponse(data: unknown, status = 200) {
  const json = vi.fn().mockResolvedValue(data);
  const fetcher = vi.fn().mockResolvedValue({ ok: status < 400, status, json });
  vi.stubGlobal('fetch', fetcher);
  return { fetcher, json };
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cliente HTTP da API', () => {
  it('devolve a resposta sem registrar dados pessoais no console', async () => {
    const data = {
      fields: { 'person.fullName': 'MARIA TESTE', 'person.cpf': '123.456.789-09' },
      sources: { 'person.fullName': 'buyer-identity' },
      diagnostics: [{ requirementId: 'buyer-identity', outcome: 'suggested' }],
    };
    const { fetcher, json } = mockResponse(data);

    expect(await api('/api/jobs/job-fixture/extract', { method: 'POST' })).toBe(data);
    expect(console.log).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledTimes(1);
  });

  it('mantém credenciais same-origin e Content-Type JSON para corpos textuais', async () => {
    const { fetcher } = mockResponse({ ok: true });
    await api('/api/example', { method: 'POST', body: JSON.stringify({ value: 1 }) });

    expect(fetcher).toHaveBeenCalledWith('/api/example', expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('não força Content-Type JSON em upload de Blob', async () => {
    const { fetcher } = mockResponse({ ok: true });
    const body = new Blob(['arquivo'], { type: 'application/pdf' });
    await api('/api/upload', { method: 'POST', body });

    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toEqual({});
  });

  it('traduz 401 e preserva apenas identificadores públicos seguros', async () => {
    mockResponse({
      error: 'invalid_field_value',
      fieldId: 'person.cpf',
      requirementId: 'buyer-identity',
      reason: 'invalid_cpf',
    }, 422);

    await expect(api('/api/jobs/job/review')).rejects.toMatchObject({
      status: 422,
      message: 'Um campo contém um valor inválido.',
      fieldId: 'person.cpf',
      requirementId: 'buyer-identity',
      fieldReason: 'invalid_cpf',
    });

    mockResponse({ error: 'unauthorized' }, 401);
    await expect(api('/api/auth/me')).rejects.toMatchObject({
      status: 401,
      message: 'Entre na sua conta para continuar.',
    });
  });

  it('descarta identificadores e motivos não permitidos vindos de erro externo', async () => {
    mockResponse({
      error: 'invalid_field_value',
      fieldId: 'person.cpf<script>',
      requirementId: 'buyer identity',
      reason: 'unexpected_reason',
    }, 422);

    try {
      await api('/api/example');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const issue = error as ApiError;
      expect(issue.fieldId).toBeUndefined();
      expect(issue.requirementId).toBeUndefined();
      expect(issue.fieldReason).toBeUndefined();
    }
  });
});
