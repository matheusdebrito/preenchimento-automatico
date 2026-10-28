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

});
