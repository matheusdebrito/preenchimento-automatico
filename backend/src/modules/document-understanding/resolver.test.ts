import { describe, expect, it } from 'vitest';
import { resolveFieldEvidence } from './resolver.js';
import type { FieldEvidence } from './contracts.js';

const evidence = (sourceId: string, value: string, confidence = .9): FieldEvidence => ({
  fieldId: 'person.fullName',
  value,
  confidence,
  documentId: sourceId + '-doc',
  sourceId,
  page: 0,
  method: 'test',
  lineIds: ['0:0'],
  status: 'REVIEW_REQUIRED',
});

describe('resolveFieldEvidence', () => {
  it('aceita fontes concordantes e preserva a melhor apresentação', () => {
    const result = resolveFieldEvidence([
      evidence('rg', 'MARIA DE SOUZA', .8),
      evidence('cnh', 'Maria de Souza', .95),
    ]);
    expect(result.values['person.fullName']).toBe('Maria de Souza');
    expect(result.conflicts).toEqual([]);
    expect(result.sourceNotes['person.fullName']).toContain('rg');
    expect(result.sourceNotes['person.fullName']).toContain('cnh');
  });

  it('não escolhe silenciosamente quando documentos divergem', () => {
    const result = resolveFieldEvidence([
      evidence('rg', 'MARIA DE SOUZA'),
      evidence('cnh', 'MARIA DE SOUSA'),
    ]);
    expect(result.values['person.fullName']).toBeUndefined();
    expect(result.conflicts).toEqual(['person.fullName']);
  });
});
