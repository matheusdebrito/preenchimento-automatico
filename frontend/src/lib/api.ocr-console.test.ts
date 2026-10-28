// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

const job = '/api/jobs/11111111-1111-4111-8111-111111111111';
const freshLabel = '[OCR] Extracao concluida - dados retornados pela API';
const restoredLabel = '[OCR] Processo recuperado - sem nova leitura; pode incluir edicoes manuais';
const payload = () => ({
  id: 'not-for-console',
  fields: { 'person.fullName': 'MARIA TESTE', 'person.cpf': '123.456.789-09' },
  sources: { 'person.fullName': 'buyer-identity', 'person.cpf': 'buyer-identity' },
  diagnostics: [{ requirementId: 'buyer-identity', outcome: 'suggested',
    suggestionCount: 2, nameStage: 'name_recognized' }],
  rawText: 'not-for-console',
});
function mockResponse(data: unknown, status = 200) {
  const json = vi.fn().mockResolvedValue(data);
  const fetcher = vi.fn().mockResolvedValue({ ok: status < 400, status, json });
  vi.stubGlobal('fetch', fetcher);
  return { fetcher, json };
}

beforeEach(() => {
  vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } });
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('console OCR local e limitado ao QA de identidade', () => {
  it('imprime um snapshot e devolve a resposta sem alterar dados nem fazer outra requisicao', async () => {
    const data = payload();
    const { fetcher, json } = mockResponse(data);
    expect(await api(job + '/extract', { method: 'POST' })).toBe(data);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(freshLabel, JSON.stringify({
      fields: data.fields, sources: data.sources, diagnostics: data.diagnostics,
    }, null, 2));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(job + '/extract', expect.objectContaining({
      method: 'POST', credentials: 'same-origin',
    }));
    expect(vi.mocked(console.log).mock.calls[0]?.[1]).not.toContain('not-for-console');
  });

  it('distingue processo recuperado de uma nova extracao', async () => {
    const data = payload();
    mockResponse(data);
    await api(job);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(restoredLabel, expect.any(String));
  });

  it('mostra CPF sem inventar o nome ausente', async () => {
    const data = { ...payload(), fields: { 'person.cpf': '123.456.789-09' },
      sources: { 'person.cpf': 'buyer-identity' }, diagnostics: [{
        requirementId: 'buyer-identity', outcome: 'suggested', suggestionCount: 1,
        nameStage: 'label_not_detected',
      }] };
    mockResponse(data);
    await api(job + '/extract', { method: 'POST' });
    expect(console.log).toHaveBeenCalledWith(freshLabel, JSON.stringify({
      fields: data.fields, sources: data.sources, diagnostics: data.diagnostics,
    }, null, 2));
  });

  it('mostra resultado vazio e diagnostico do vendedor no QA', async () => {
    mockResponse({ fields: {}, sources: {}, diagnostics: [{ requirementId: 'seller-identity',
      outcome: 'no_text', suggestionCount: 0, nameStage: 'label_not_detected' }] });
    await api(job + '/extract', { method: 'POST' });
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('nao imprime respostas de producao, sem nameStage', async () => {
    const data = payload();
    mockResponse({ ...data, diagnostics: [{ requirementId: 'buyer-identity',
      outcome: 'suggested', suggestionCount: 2 }] });
    await api(job + '/extract', { method: 'POST' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it.each(['localhost', '[::1]'])('permite QA em %s', async (hostname) => {
    vi.stubGlobal('window', { location: { hostname } });
    mockResponse(payload());
    await api(job + '/extract', { method: 'POST' });
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it.each(['example.invalid', '192.168.1.50', 'localhost.example.invalid',
    '127.0.0.1.example.invalid'])('nao imprime fora do loopback: %s', async (hostname) => {
    vi.stubGlobal('window', { location: { hostname } });
    mockResponse(payload());
    await api(job + '/extract', { method: 'POST' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it.each(['/api/auth/me', '/api/jobs', job + '/review', job + '/generate'])
  ('nao imprime outras rotas: %s', async (path) => {
    mockResponse(payload());
    await api(path, { method: 'POST' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it('nao imprime metodos de mutacao do processo nem GET extract', async () => {
    mockResponse(payload());
    await api(job, { method: 'DELETE' });
    await api(job + '/extract');
    expect(console.log).not.toHaveBeenCalled();
  });

  it.each([null, [], {}, { diagnostics: [] }, { diagnostics: [null, 7, 'text'] },
    { diagnostics: [{ requirementId: 'buyer-identity', nameStage: 'invalid' }] }])
  ('tolera resposta sem diagnostico valido: %j', async (data) => {
    mockResponse(data);
    expect(await api(job + '/extract', { method: 'POST' })).toBe(data);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('preserva erro HTTP sem imprimir corpo ou dados pessoais', async () => {
    mockResponse({ ...payload(), error: 'ocr_failed' }, 503);
    await expect(api(job + '/extract', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('nao exige window em ambiente sem navegador', async () => {
    vi.stubGlobal('window', undefined);
    const data = payload();
    mockResponse(data);
    expect(await api(job + '/extract', { method: 'POST' })).toBe(data);
    expect(console.log).not.toHaveBeenCalled();
  });
});
