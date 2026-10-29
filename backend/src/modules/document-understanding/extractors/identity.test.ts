import { describe, expect, it } from 'vitest';
import { identityDocumentExtractor } from './identity.js';
import type { DocumentObservation, ExtractionContext } from '../contracts.js';

const context: ExtractionContext = {
  documentId: 'doc-1',
  sourceId: 'buyer-identity',
  documentType: 'identity',
  subjectRole: 'person',
};

const observation = (label = 'NOME'): DocumentObservation => ({
  engine: 'paddleocr',
  engineVersion: '3.7.0',
  model: 'PP-OCRv6',
  elapsedMs: 10,
  pages: [{
    page: 0,
    orientation: 0,
    lines: [
      { id: '0:0', page: 0, text: label, confidence: .99, box: [10, 10, 80, 30], polygon: null },
      { id: '0:1', page: 0, text: 'MARIA DE SOUZA', confidence: .97, box: [10, 36, 220, 62], polygon: null },
      { id: '0:2', page: 0, text: 'CPF 123.456.789-09', confidence: .98, box: [10, 70, 230, 96], polygon: null },
      { id: '0:3', page: 0, text: 'REGISTRO GERAL', confidence: .98, box: [10, 105, 150, 128], polygon: null },
      { id: '0:4', page: 0, text: '12.345.678-9', confidence: .96, box: [10, 132, 150, 156], polygon: null },
      { id: '0:5', page: 0, text: 'ÓRGÃO EXPEDIDOR', confidence: .97, box: [180, 105, 330, 128], polygon: null },
      { id: '0:6', page: 0, text: 'SSP/RJ', confidence: .95, box: [180, 132, 260, 156], polygon: null },
    ],
  }],
});

describe('identityDocumentExtractor', () => {
  it('produz evidências canônicas sem conhecer serviço ou formulário', () => {
    const evidence = identityDocumentExtractor.extract(observation(), context);
    expect(evidence.find((item) => item.fieldId === 'person.fullName')?.value)
      .toBe('MARIA DE SOUZA');
    expect(evidence.find((item) => item.fieldId === 'person.cpf')?.value)
      .toBe('123.456.789-09');
    expect(evidence.find((item) => item.fieldId === 'person.identity')?.value)
      .toBe('12.345.678-9');
    expect(evidence.find((item) => item.fieldId === 'person.issuer')?.value)
      .toBe('SSP/RJ');
    expect(evidence.every((item) => item.documentId === 'doc-1')).toBe(true);
  });

  it('usa o papel semântico para separar comprador e vendedor', () => {
    const evidence = identityDocumentExtractor.extract(observation(), {
      ...context, subjectRole: 'seller', sourceId: 'seller-identity',
    });
    expect(evidence.some((item) => item.fieldId === 'seller.fullName')).toBe(true);
    expect(evidence.find((item) => item.fieldId === 'seller.identity')?.value)
      .toBe('12.345.678-9');
    expect(evidence.find((item) => item.fieldId === 'seller.issuer')?.value)
      .toBe('SSP/RJ');
    expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
  });

  it('rejeita nome de filiação e nome social', () => {
    for (const label of ['NOME DA MAE', 'NOME DO PAI', 'NOME SOCIAL']) {
      const evidence = identityDocumentExtractor.extract(observation(label), context);
      expect(evidence.some((item) => item.fieldId === 'person.fullName')).toBe(false);
    }
  });

  it('aceita número e órgão emissor na mesma linha do rótulo', () => {
    const inline: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'RG: 45.678.901-2', confidence: .97,
            box: [10, 10, 180, 34], polygon: null },
          { id: '0:1', page: 0, text: 'ÓRGÃO EMISSOR: DETRAN-RJ', confidence: .96,
            box: [10, 40, 280, 66], polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(inline, context);
    expect(evidence.find((item) => item.fieldId === 'person.identity')?.value)
      .toBe('45.678.901-2');
    expect(evidence.find((item) => item.fieldId === 'person.issuer')?.value)
      .toBe('DETRAN-RJ');
  });

  it('não confunde CPF ou data com número da identidade', () => {
    const unsafe: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'RG', confidence: .99, box: null, polygon: null },
          { id: '0:1', page: 0, text: '123.456.789-09', confidence: .98, box: null, polygon: null },
          { id: '0:2', page: 0, text: '01/02/2000', confidence: .98, box: null, polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(unsafe, context);
    expect(evidence.some((item) => item.fieldId === 'person.identity')).toBe(false);
  });

  it('não escolhe órgão emissor quando há dois valores diferentes', () => {
    const ambiguous: DocumentObservation = {
      ...observation(),
      pages: [{
        ...observation().pages[0]!,
        lines: [
          { id: '0:0', page: 0, text: 'ÓRGÃO EMISSOR: SSP/RJ', confidence: .98,
            box: null, polygon: null },
          { id: '0:1', page: 0, text: 'EMISSOR: DETRAN/RJ', confidence: .98,
            box: null, polygon: null },
        ],
      }],
    };
    const evidence = identityDocumentExtractor.extract(ambiguous, context);
    expect(evidence.some((item) => item.fieldId === 'person.issuer')).toBe(false);
  });

  it('aproveita âncoras úteis de CNH e CIN sem importar campos extras', () => {
    const sample: DocumentObservation = {
      ...observation(),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'NAME AND SURNAME', confidence: .99,
            box: [10, 10, 180, 32], polygon: null },
          { id: '0:1', page: 0, text: 'MARIA DE SOUZA', confidence: .98,
            box: [10, 36, 230, 60], polygon: null },
          { id: '0:2', page: 0, text: 'CPF 123.456.789-09', confidence: .99,
            box: [10, 70, 230, 94], polygon: null },
          { id: '0:3', page: 0, text: 'DATA DE EMISSÃO', confidence: .97,
            box: [10, 104, 170, 126], polygon: null },
          { id: '0:4', page: 0, text: '15/08/2026', confidence: .97,
            box: [10, 132, 130, 154], polygon: null },
          { id: '0:5', page: 0, text: 'NACIONALIDADE / NATIONALITY', confidence: .97,
            box: [10, 164, 260, 186], polygon: null },
          { id: '0:6', page: 0, text: 'BRASILEIRA', confidence: .96,
            box: [10, 192, 130, 214], polygon: null },
          { id: '0:7', page: 0, text: 'NATURALIDADE / PLACE OF BIRTH', confidence: .97,
            box: [10, 224, 290, 246], polygon: null },
          { id: '0:8', page: 0, text: 'RIO DE JANEIRO RJ', confidence: .96,
            box: [10, 252, 220, 274], polygon: null },
          { id: '0:9', page: 0, text: 'TIPO SANGUÍNEO: O+', confidence: .99,
            box: [10, 284, 220, 306], polygon: null },
        ],
      }],
    };

    const evidence = identityDocumentExtractor.extract(sample, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['person.fullName']).toBe('MARIA DE SOUZA');
    expect(values['person.issueDate']).toBe('15/08/2026');
    expect(values['person.nationality']).toBe('BRASILEIRA');
    expect(values['person.birthplace']).toBe('RIO DE JANEIRO RJ');
    expect(Object.keys(values).some((field) => field.includes('blood'))).toBe(false);
  });

  it('extrai data de nascimento do RG antigo sem reutilizar a data de expedição', () => {
    const rgAntigo: DocumentObservation = {
      ...observation(),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'DATA DE EXPEDIÇÃO', confidence: .99,
            box: [300, 20, 470, 42], polygon: null },
          { id: '0:1', page: 0, text: '29/10/2018', confidence: .98,
            box: [300, 48, 420, 70], polygon: null },
          { id: '0:2', page: 0, text: 'DATA DE NASCIMENTO', confidence: .99,
            box: [300, 140, 500, 162], polygon: null },
          { id: '0:3', page: 0, text: '22/11/1999', confidence: .98,
            box: [300, 168, 420, 190], polygon: null },
        ],
      }],
    };

    const evidence = identityDocumentExtractor.extract(rgAntigo, context);
    expect(evidence.find((item) => item.fieldId === 'person.issueDate')?.value)
      .toBe('29/10/2018');
    expect(evidence.find((item) => item.fieldId === 'person.birthDate')?.value)
      .toBe('22/11/1999');
  });

  it('mantém CIN como família de identidade sem transformar CPF em RG automaticamente', () => {
    const cin: DocumentObservation = {
      ...observation(),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'NOME / NAME', confidence: .99,
            box: [10, 10, 160, 32], polygon: null },
          { id: '0:1', page: 0, text: 'MARIA DE SOUZA', confidence: .98,
            box: [10, 38, 220, 60], polygon: null },
          { id: '0:2', page: 0, text: 'REGISTRO GERAL - CPF / PERSONAL NUMBER', confidence: .99,
            box: [10, 70, 340, 92], polygon: null },
          { id: '0:3', page: 0, text: '123.456.789-09', confidence: .99,
            box: [10, 98, 180, 120], polygon: null },
        ],
      }],
    };

    const evidence = identityDocumentExtractor.extract(cin, context);
    expect(evidence.find((item) => item.fieldId === 'person.cpf')?.value)
      .toBe('123.456.789-09');
    expect(evidence.some((item) => item.fieldId === 'person.identity')).toBe(false);
  });

  it('mapeia RG antigo usando posição relativa e preserva filiação sem inferir parentesco', () => {
    const rgAntigo: DocumentObservation = {
      ...observation(),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'REGISTRO GERAL', confidence: .99,
            box: [20, 20, 125, 44], polygon: null },
          { id: '0:1', page: 0, text: '26.324.631-6', confidence: .98,
            box: [150, 18, 285, 46], polygon: null },
          { id: '0:2', page: 0, text: 'DATA DE EXPEDIÇÃO', confidence: .99,
            box: [500, 20, 670, 44], polygon: null },
          { id: '0:3', page: 0, text: '29/10/2018', confidence: .98,
            box: [700, 18, 820, 46], polygon: null },
          { id: '0:4', page: 0, text: 'NOME', confidence: .99,
            box: [20, 70, 90, 94], polygon: null },
          { id: '0:5', page: 0, text: 'MATHEUS DE BRITO LEONCIO SALIM', confidence: .98,
            box: [20, 100, 430, 128], polygon: null },
          { id: '0:6', page: 0, text: 'FILIAÇÃO', confidence: .99,
            box: [20, 150, 120, 174], polygon: null },
          { id: '0:7', page: 0, text: 'JULIO CESAR LEONCIO SALIM', confidence: .97,
            box: [20, 182, 360, 208], polygon: null },
          { id: '0:8', page: 0, text: 'LUCELIA DE BRITO LEONCIO SALIM', confidence: .97,
            box: [20, 216, 390, 242], polygon: null },
          { id: '0:9', page: 0, text: 'NATURALIDADE', confidence: .99,
            box: [20, 270, 170, 294], polygon: null },
          { id: '0:10', page: 0, text: 'ESTADO DO RIO DE JANEIRO', confidence: .98,
            box: [20, 302, 340, 328], polygon: null },
          { id: '0:11', page: 0, text: 'DATA DE NASCIMENTO', confidence: .99,
            box: [500, 270, 690, 294], polygon: null },
          { id: '0:12', page: 0, text: '22/11/1999', confidence: .98,
            box: [700, 270, 820, 296], polygon: null },
          { id: '0:13', page: 0, text: 'DOC. ORIGEM', confidence: .99,
            box: [20, 350, 160, 374], polygon: null },
          { id: '0:14', page: 0, text: 'C. NASC LIV 277A FLS 61 TERM 101358 C 01',
            confidence: .95, box: [20, 382, 520, 408], polygon: null },
          { id: '0:15', page: 0, text: 'RIO DE JANEIRO RJ', confidence: .96,
            box: [20, 414, 250, 440], polygon: null },
          { id: '0:16', page: 0, text: 'CPF', confidence: .99,
            box: [20, 462, 70, 486], polygon: null },
          { id: '0:17', page: 0, text: '138.989.167-40', confidence: .99,
            box: [20, 494, 210, 520], polygon: null },
        ],
      }],
    };

    const evidence = identityDocumentExtractor.extract(rgAntigo, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['person.identity']).toBe('26.324.631-6');
    expect(values['person.issueDate']).toBe('29/10/2018');
    expect(values['person.fullName']).toBe('MATHEUS DE BRITO LEONCIO SALIM');
    expect(values['person.parent1Name']).toBe('JULIO CESAR LEONCIO SALIM');
    expect(values['person.parent2Name']).toBe('LUCELIA DE BRITO LEONCIO SALIM');
    expect(values['person.birthplace']).toBe('ESTADO DO RIO DE JANEIRO');
    expect(values['person.birthDate']).toBe('22/11/1999');
    expect(values['person.documentOrigin']).toBe(
      'C. NASC LIV 277A FLS 61 TERM 101358 C 01 RIO DE JANEIRO RJ');
    expect(values['person.cpf']).toBe('138.989.167-40');
  });

  it('tolera corrupção leve nas âncoras do RG antigo sem confundir campos vizinhos', () => {
    const noisyRg: DocumentObservation = {
      ...observation(),
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'REGISTR0 GERAL', confidence: .91,
            box: [20, 20, 125, 44], polygon: null },
          { id: '0:1', page: 0, text: '26.324.631-6', confidence: .97,
            box: [150, 18, 285, 46], polygon: null },
          { id: '0:2', page: 0, text: 'DATA DE EXPEDICA0', confidence: .90,
            box: [500, 20, 670, 44], polygon: null },
          { id: '0:3', page: 0, text: '29/10/2018', confidence: .97,
            box: [700, 18, 820, 46], polygon: null },
          { id: '0:4', page: 0, text: 'NATURAL1DADE', confidence: .90,
            box: [20, 270, 170, 294], polygon: null },
          { id: '0:5', page: 0, text: 'ESTADO DO RIO DE JANEIRO', confidence: .97,
            box: [20, 302, 340, 328], polygon: null },
          { id: '0:6', page: 0, text: 'DATA DE NASCIMENT0', confidence: .90,
            box: [500, 270, 690, 294], polygon: null },
          { id: '0:7', page: 0, text: '22/11/1999', confidence: .97,
            box: [500, 302, 620, 328], polygon: null },
        ],
      }],
    };

    const evidence = identityDocumentExtractor.extract(noisyRg, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['person.identity']).toBe('26.324.631-6');
    expect(values['person.issueDate']).toBe('29/10/2018');
    expect(values['person.birthplace']).toBe('ESTADO DO RIO DE JANEIRO');
    expect(values['person.birthDate']).toBe('22/11/1999');
  });

});
