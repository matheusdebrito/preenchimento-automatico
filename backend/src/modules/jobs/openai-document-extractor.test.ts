import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoredDocument } from './job-store.js';
import { extractDocumentsWithOpenAi } from './openai-document-extractor.js';

const roots: string[] = [];

async function fixture(
  name: string,
  kind: StoredDocument['kind'],
  requirementId: string,
): Promise<StoredDocument> {
  const root = await mkdtemp(join(tmpdir(), 'openai-document-test-'));
  roots.push(root);
  const path = join(root, name);
  await writeFile(path, Buffer.from('synthetic-test-content'));
  return {
    id: requirementId + '-id',
    requirementId,
    path,
    kind,
    size: 22,
  };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) =>
    rm(root, { recursive: true, force: true })));
});

describe('OpenAI document extractor', () => {
  it('envia vários documentos em uma única chamada e valida a saída no backend', async () => {
    const identity = await fixture('identity.jpg', 'jpeg', 'buyer-identity');
    const tie = await fixture('tie.pdf', 'pdf', 'tie');

    const fakeFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return new Response(JSON.stringify({
      output: [{
        type: 'message',
        content: [{
          type: 'output_text',
          text: JSON.stringify({
            candidates: [
              {
                fieldId: 'person.fullName',
                value: 'MARIA DE SOUZA',
                sourceRequirementId: 'buyer-identity',
                confidence: 'high',
              },
              {
                fieldId: 'person.cpf',
                value: '111.111.111-11',
                sourceRequirementId: 'buyer-identity',
                confidence: 'high',
              },
              {
                fieldId: 'person.identity',
                value: '12.345.678-9',
                sourceRequirementId: 'buyer-identity',
                confidence: 'high',
              },
              {
                fieldId: 'person.issuer',
                value: 'SSP/RJ',
                sourceRequirementId: 'buyer-identity',
                confidence: 'high',
              },
              {
                fieldId: 'vessel.registration',
                value: '441M20200001',
                sourceRequirementId: 'tie',
                confidence: 'medium',
              },
              {
                fieldId: 'vessel.registration',
                value: '999M20209999',
                sourceRequirementId: 'buyer-identity',
                confidence: 'high',
              },
              {
                fieldId: 'person.fullName',
                value: 'OUTRO NOME',
                sourceRequirementId: 'tie',
                confidence: 'high',
              },
            ],
            documents: [
              { requirementId: 'buyer-identity', status: 'readable' },
              { requirementId: 'tie', status: 'readable' },
            ],
          }),
        }],
      }],
      usage: { input_tokens: 1200, output_tokens: 130, total_tokens: 1330 },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const result = await extractDocumentsWithOpenAi([
      {
        document: identity,
        label: 'Identidade do comprador',
        documentType: 'identity',
        subjectRole: 'person',
        allowedFieldIds: ['person.fullName', 'person.cpf', 'person.identity', 'person.issuer'],
      },
      {
        document: tie,
        label: 'TIE/TIEM',
        documentType: 'tie',
        subjectRole: 'vessel',
        allowedFieldIds: ['vessel.registration'],
      },
    ], [
      {
        id: 'person.fullName',
        label: 'Nome completo',
        valueKind: 'text',
        required: true,
      },
      {
        id: 'person.cpf',
        label: 'CPF',
        valueKind: 'text',
        validationRuleId: 'cpf',
        required: true,
      },
      {
        id: 'person.identity',
        label: 'Identidade',
        valueKind: 'text',
        required: false,
      },
      {
        id: 'person.issuer',
        label: 'Órgão emissor',
        valueKind: 'text',
        required: false,
      },
      {
        id: 'vessel.registration',
        label: 'Número de inscrição',
        valueKind: 'text',
        required: true,
      },
    ], {
      env: {
        OPENAI_API_KEY: 'test-key-never-logged',
        OPENAI_MODEL: 'gpt-5.4-mini-2026-03-17',
        OPENAI_DOCUMENT_DETAIL: 'high',
      },
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [, init] = fakeFetch.mock.calls[0]!;
    const body = JSON.parse(String(init?.body)) as {
      model: string;
      store: boolean;
      reasoning: { effort: string };
      input: Array<{content:Array<Record<string, unknown>>}>;
      text: {format:{strict:boolean}};
    };
    expect(body.model).toBe('gpt-5.4-mini-2026-03-17');
    expect(body.store).toBe(false);
    expect(body.reasoning.effort).toBe('none');
    expect(body.text.format.strict).toBe(true);
    expect(body.input).toHaveLength(1);
    expect(body.input[0]!.content.filter((item) => item.type === 'input_file'))
      .toHaveLength(1);
    expect(body.input[0]!.content.filter((item) => item.type === 'input_image'))
      .toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain(identity.path);
    expect(JSON.stringify(body)).not.toContain(tie.path);
    expect(JSON.stringify(body)).toContain('número da identidade/documento');
    expect(JSON.stringify(body)).toContain('órgão emissor/expedidor');
    expect(JSON.stringify(body)).toContain('nunca deduza o órgão apenas pela UF');

    const values = Object.fromEntries(result.evidence.map((item) => [
      item.fieldId, item.value,
    ]));
    expect(values['person.fullName']).toBe('MARIA DE SOUZA');
    // Invalid CPF from an external model response must never be promoted.
    expect(values['person.cpf']).toBeUndefined();
    expect(values['person.identity']).toBe('12.345.678-9');
    expect(values['person.issuer']).toBe('SSP/RJ');
    expect(values['vessel.registration']).toBe('441M20200001');
    expect(result.evidence.filter((item) => item.fieldId === 'person.fullName'))
      .toEqual([expect.objectContaining({
        value: 'MARIA DE SOUZA',
        sourceId: 'buyer-identity',
      })]);
    expect(result.evidence.filter((item) => item.fieldId === 'vessel.registration'))
      .toEqual([expect.objectContaining({
        value: '441M20200001',
        sourceId: 'tie',
      })]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        requirementId: 'buyer-identity',
        engine: 'openai',
        outcome: 'suggested',
        suggestionCount: 3,
      }),
      expect.objectContaining({
        requirementId: 'tie',
        engine: 'openai',
        outcome: 'suggested',
        suggestionCount: 1,
      }),
    ]);
    expect(result.usage?.totalTokens).toBe(1330);
  });

  it('falha antes da rede quando a chave da API não está configurada', async () => {
    const identity = await fixture('identity.jpg', 'jpeg', 'buyer-identity');
    const fakeFetch = vi.fn();

    await expect(extractDocumentsWithOpenAi([
      { document: identity, label: 'Identidade', allowedFieldIds: ['person.fullName'] },
    ], [
      {
        id: 'person.fullName',
        label: 'Nome completo',
        valueKind: 'text',
        required: true,
      },
    ], {
      env: {},
      fetchImpl: fakeFetch as unknown as typeof fetch,
    })).rejects.toMatchObject({
      code: 'not_configured',
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('rejeita modelo não permitido em vez de aceitar configuração arbitrária', async () => {
    const identity = await fixture('identity.jpg', 'jpeg', 'buyer-identity');

    await expect(extractDocumentsWithOpenAi([
      { document: identity, label: 'Identidade', allowedFieldIds: ['person.fullName'] },
    ], [
      {
        id: 'person.fullName',
        label: 'Nome completo',
        valueKind: 'text',
        required: true,
      },
    ], {
      env: {
        OPENAI_API_KEY: 'test-key',
        OPENAI_MODEL: 'modelo-nao-permitido',
      },
    })).rejects.toMatchObject({
      code: 'not_configured',
    });
  });
});
