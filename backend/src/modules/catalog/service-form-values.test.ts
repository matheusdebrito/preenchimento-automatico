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

  it('converte resposta enumerada em texto revisado para o formulário', () => {
    const relation: ServiceForm = {
      serviceId: 'inscricao-exame-amador',
      formVersionId: 'requerimento-cha-amador-2026-v1',
      order: 1,
      answerValueMappings: {
        'process.notes': {
          questionId: 'amateurCategory',
          values: {
            arrais: 'Inscrição para exame de Arrais-Amador',
            mestre: 'Inscrição para exame de Mestre-Amador',
            capitao: 'Inscrição para exame de Capitão-Amador',
          },
        },
      },
    };

    expect(serviceFormValues(relation, { amateurCategory: 'mestre' }, {}))
      .toEqual({ 'process.notes': 'Inscrição para exame de Mestre-Amador' });
  });

  it('reutiliza a categoria já escolhida no preenchimento da declaração de extravio', () => {
    const relation: ServiceForm = {
      serviceId: 'renovacao-cha-amador',
      formVersionId: 'declaracao-extravio-cha-amador-2026-v1',
      order: 2,
      answerValueMappings: {
        'amateur.category': {
          questionId: 'amateurCategory',
          values: {
            arrais: 'Arrais-Amador',
            mestre: 'Mestre-Amador',
            capitao: 'Capitão-Amador',
          },
        },
      },
    };

    expect(serviceFormValues(relation, { amateurCategory: 'capitao' }, {}))
      .toEqual({ 'amateur.category': 'Capitão-Amador' });
  });

  it('deriva endereço completo sem exigir digitação duplicada', () => {
    const relation: ServiceForm = {
      serviceId: 'inscricao-inicial-cir-aquaviario',
      formVersionId: 'declaracao-residencia-aquaviario-2026-v1',
      order: 1,
    };

    expect(serviceFormValues(relation, {}, {
      'person.address': 'Rua das Acácias',
      'person.streetNumber': '123',
      'person.apartment': 'Apto 301',
      'person.neighborhood': 'Centro',
      'person.city': 'Niterói',
      'person.state': 'RJ',
      'person.postalCode': '24000-000',
    })['person.fullAddress']).toBe(
      'Rua das Acácias, 123, Apto 301, Centro, Niterói/RJ, 24000-000',
    );
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
