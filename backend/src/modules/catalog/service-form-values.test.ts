import { describe, expect, it } from 'vitest';
import type { ServiceForm } from './contracts.js';
import { serviceFormValues } from './service-form-values.js';

describe('serviceFormValues', () => {
  it('copia respostas validadas para campos sem permitir que revisão sobrescreva valores do serviço', () => {
    const relation: ServiceForm = {
      serviceId: 'renovacao-cha-amador',
      formVersionId: 'declaracao-extravio-cha-amador-2026-v1',
      order: 2,
      answerBindings: { 'process.chaLossReason': 'chaSituation' },
      fixedValues: { 'process.amateurRequest': 'emissao_renovacao' },
    };

    expect(serviceFormValues(relation, {
      chaSituation: 'furtada',
    }, {
      'person.fullName': 'MARIA TESTE',
      'process.chaLossReason': 'roubada',
      'process.amateurRequest': 'outro',
    })).toEqual({
      'person.fullName': 'MARIA TESTE',
      'process.chaLossReason': 'furtada',
      'process.amateurRequest': 'emissao_renovacao',
    });
  });

  it('ignora binding sem resposta em vez de inventar valor', () => {
    const relation: ServiceForm = {
      serviceId: 's',
      formVersionId: 'v',
      order: 1,
      answerBindings: { 'process.chaLossReason': 'chaSituation' },
    };
    expect(serviceFormValues(relation, {}, { 'person.fullName': 'ANA' }))
      .toEqual({ 'person.fullName': 'ANA' });
  });
});
