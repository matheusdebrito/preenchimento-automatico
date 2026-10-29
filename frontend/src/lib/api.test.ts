import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api headers', () => {
  it('não envia Content-Type JSON em DELETE sem corpo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ removed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await api<{removed:boolean}>('/api/jobs/00000000-0000-4000-8000-000000000000', {
      method: 'DELETE',
    });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('continua enviando Content-Type JSON quando existe corpo JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await api<{ok:boolean}>('/api/test', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });
  it('expõe erro seguro quando a leitura OpenAI não está configurada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'openai_not_configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api('/api/jobs/job/extract', {
      method: 'POST',
      body: JSON.stringify({ provider: 'openai' }),
    })).rejects.toMatchObject<Partial<ApiError>>({
      status: 503,
      errorCode: 'openai_not_configured',
      message: expect.stringContaining('OpenAI'),
    });
  });

});
