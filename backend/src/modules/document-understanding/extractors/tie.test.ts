import { describe, expect, it } from 'vitest';
import { tieDocumentExtractor } from './tie.js';
import type { DocumentObservation, ExtractionContext } from '../contracts.js';

const context: ExtractionContext = {
  documentId: 'tie-doc', sourceId: 'tie', documentType: 'tie', subjectRole: 'vessel',
};

function observation(lines: readonly string[]): DocumentObservation {
  return {
    engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
    pages: [{
      page: 0, orientation: 0,
      lines: lines.map((text, index) => ({
        id: '0:' + index, page: 0, text, confidence: .95,
        box: [10, 10 + index * 30, 320, 30 + index * 30], polygon: null,
      })),
    }],
  };
}

describe('tieDocumentExtractor', () => {
  it('extrai os campos náuticos canônicos sem conhecer o serviço', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE INSCRIÇÃO: 3810056831',
      'NOME DA EMBARCAÇÃO: MAR AZUL',
      'HIN: BRABC12345D626',
      'ANO DE CONSTRUÇÃO: 2025',
      'COMPRIMENTO: 3,20 M',
      'LOTAÇÃO: 3',
      'MOTOR/MARCA: YAMAHA',
      'POTÊNCIA DO MOTOR: 180 HP',
      'SÉRIE DO MOTOR: 6AN123456',
      'CP/DL/AG: CPRJ',
    ]), context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('3810056831');
    expect(values['vessel.name']).toBe('MAR AZUL');
    expect(values['vessel.hullId']).toBe('BRABC12345D626');
    expect(values['vessel.year']).toBe('2025');
    expect(values['vessel.length']).toBe('3,20 M');
    expect(values['vessel.capacity']).toBe('3');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
    expect(values['vessel.motorPower']).toBe('180 HP');
    expect(values['vessel.motorSerial']).toBe('6AN123456');
    expect(values['vessel.authority']).toBe('CPRJ');
  });

  it('aceita valor abaixo do rótulo', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'INSCRIÇÃO',
      '3810056831',
      'NOME DA EMBARCAÇÃO',
      'MAR AZUL',
    ]), context);
    expect(evidence.find((item) => item.fieldId === 'vessel.registration')?.value)
      .toBe('3810056831');
    expect(evidence.find((item) => item.fieldId === 'vessel.name')?.value)
      .toBe('MAR AZUL');
  });

  it('não escolhe valor quando o mesmo campo diverge no documento', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'INSCRIÇÃO: 3810056831',
      'NÚMERO DE INSCRIÇÃO: 9999999999',
    ]), context);
    expect(evidence.some((item) => item.fieldId === 'vessel.registration')).toBe(false);
  });

  it('trata o rótulo bilíngue completo como rótulo e pega o nome abaixo', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NOME DA EMBARCAÇÃO / NAME OF VESSEL',
      'MAR AZUL',
    ]), context);
    expect(evidence.find((item) => item.fieldId === 'vessel.name')?.value)
      .toBe('MAR AZUL');
  });

  it('não usa NAME OF VESSEL como nome da embarcação quando o rótulo vem fragmentado', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NOME DA EMBARCAÇÃO',
      'NAME OF VESSEL',
      'MAR AZUL',
    ]), context);
    expect(evidence.find((item) => item.fieldId === 'vessel.name')?.value)
      .toBe('MAR AZUL');
  });


  it('extrai campos bilíngues adicionais do TIE', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'AB / GT',
      '2,35',
      'BOCA / BREADTH',
      '1,20 M',
      'ATIVIDADE / ACTIVITY',
      'ESPORTE E RECREIO',
      'MOTOR 1 / ENGINE 1 FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      'YAMAHA - WAVERUNNER - VX',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '6AN123456',
      'NÚMERO DE TRIPULANTES / NUMBER OF CREW MEMBER',
      '2',
      'NÚMERO DE PASSAGEIROS / NUMBER OF PASSAGERS',
      '3',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.grossTonnage']).toBe('2,35');
    expect(values['vessel.breadth']).toBe('1,20 M');
    expect(values['vessel.activity']).toBe('ESPORTE E RECREIO');
    expect(values['vessel.motorManufacturerBrandModel']).toBe('YAMAHA - WAVERUNNER - VX');
    expect(values['vessel.motorSerial']).toBe('6AN123456');
    expect(values['vessel.crewCount']).toBe('2');
    expect(values['vessel.passengerCount']).toBe('3');
  });

  it('não confunde o rótulo bilíngue do motor com o valor do fabricante/marca/modelo', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'MOTOR 1 / ENGINE 1',
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      'YAMAHA - WAVERUNNER - VX',
    ]), context);

    expect(evidence.find((item) =>
      item.fieldId === 'vessel.motorManufacturerBrandModel')?.value)
      .toBe('YAMAHA - WAVERUNNER - VX');
  });


  it('extrai os campos equivalentes do layout antigo do TIE', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'Nº DE INSCRIÇÃO',
      '441M2023001234',
      'NOME DA EMBARCAÇÃO',
      'MAR AZUL',
      'POTÊNCIA (HP)',
      '115',
      'Nº DO 1º MOTOR/SÉRIE',
      '6E5L1001234',
      'NOME FABRICANTE',
      'YAMAHA',
      'ATIVIDADE/USO',
      'Esporte e Recreio',
      'QTD. DE TRIPULANTES',
      '2',
      'QTD. DE PASSAGEIROS',
      '6',
      'ANO DE CONSTRUÇÃO',
      '2022',
      'COMPRIMENTO TOTAL',
      '6,50 m',
      'FORMATO DE SÉRIE DO CASCO/FORMA',
      'BR-MZL-123456',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('441M2023001234');
    expect(values['vessel.name']).toBe('MAR AZUL');
    expect(values['vessel.motorPower']).toBe('115');
    expect(values['vessel.motorSerial']).toBe('6E5L1001234');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
    expect(values['vessel.activity']).toBe('Esporte e Recreio');
    expect(values['vessel.crewCount']).toBe('2');
    expect(values['vessel.passengerCount']).toBe('6');
    expect(values['vessel.year']).toBe('2022');
    expect(values['vessel.length']).toBe('6,50 m');
    expect(values['vessel.hullId']).toBe('BR-MZL-123456');
  });

  it('aproveita aliases adicionais do TIE digital e TIEM antigo', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE INSCRIÇÃO / REGISTRATION NUMBER',
      '3810056831',
      'ANO DE CONSTRUÇÃO / YEAR OF BUILD',
      '2025',
      'COMPRIMENTO / LENGTH',
      '3,20 M',
      'Nº DO CASCO / HULL NUMBER',
      'BRABC12345D626',
      'ATIVIDADE / SERVIÇO',
      'ESPORTE E RECREIO',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('3810056831');
    expect(values['vessel.year']).toBe('2025');
    expect(values['vessel.length']).toBe('3,20 M');
    expect(values['vessel.hullId']).toBe('BRABC12345D626');
    expect(values['vessel.activity']).toBe('ESPORTE E RECREIO');
  });

  it('prioriza a direção declarada quando há candidatos válidos à direita e abaixo', () => {
    const directional: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'NOME DA EMBARCAÇÃO', confidence: .99,
            box: [10, 10, 170, 30], polygon: null },
          { id: '0:1', page: 0, text: 'VALOR A DIREITA', confidence: .96,
            box: [180, 10, 320, 30], polygon: null },
          { id: '0:2', page: 0, text: 'MAR AZUL', confidence: .97,
            box: [10, 36, 140, 58], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(directional, context);
    expect(evidence.find((item) => item.fieldId === 'vessel.name')?.value)
      .toBe('MAR AZUL');
  });

  it('não usa o próprio rótulo bilíngue como número de série do motor', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '6AN123456',
    ]), context);

    expect(evidence.find((item) => item.fieldId === 'vessel.motorSerial')?.value)
      .toBe('6AN123456');
  });

  it('rejeita texto de rótulo mesmo quando OCR o compacta como candidato alfanumérico', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      'MOTOR1',
      '6AN123456',
    ]), context);

    expect(evidence.find((item) => item.fieldId === 'vessel.motorSerial')?.value)
      .toBe('6AN123456');
  });

});
