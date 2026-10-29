import { describe, expect, it } from 'vitest';
import { classifyTieVariant, tieDocumentExtractor } from './tie.js';
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

describe('tie variant classification', () => {
  it('classifica TIE digital por marcadores bilíngues fortes', () => {
    expect(classifyTieVariant(observation([
      'NÚMERO DE INSCRIÇÃO / REGISTRATION NUMBER',
      'TIPO DA EMBARCAÇÃO / TYPE OF VESSEL',
      'MOTOR 1 / ENGINE 1',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      'BOCA / BREADTH',
    ]))).toBe('digital');
  });

  it('classifica TIEM antigo mesmo com rótulos degradados pelo OCR', () => {
    expect(classifyTieVariant(observation([
      'TÍTULO DE INSCRIÇÃO DE EMBARCAÇÃO MIÚDA',
      'NOMEDA EMBARCACAO',
      'N DO F MOTORSERIE',
      'NOME FABRICANTE',
      'CARACTERISTICAS DO CASCO',
      'CREDOR HIPOTECARIO',
    ]))).toBe('legacy');
  });

  it('mantém unknown quando não há evidência suficiente de variante', () => {
    expect(classifyTieVariant(observation([
      'INSCRIÇÃO',
      'NOME DA EMBARCAÇÃO',
    ]))).toBe('unknown');
  });
});

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

  it('separa proprietário registrado e coproprietário sem atribuir papel de comprador ou vendedor', () => {
    const source: DocumentObservation = {
      engine: 'paddleocr',
      engineVersion: '3.7.0',
      model: 'PP-OCRv6',
      elapsedMs: 10,
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'PROPRIETÁRIO / OWNER', confidence: .99,
            box: [10, 10, 240, 32], polygon: null },
          { id: '0:1', page: 0, text: 'NOME: MARIA DE SOUZA', confidence: .98,
            box: [10, 42, 280, 64], polygon: null },
          { id: '0:2', page: 0, text: 'CPF/CNPJ: 123.456.789-09', confidence: .98,
            box: [10, 72, 290, 94], polygon: null },
          { id: '0:3', page: 0, text: 'ENDEREÇO: RUA DAS FLORES', confidence: .97,
            box: [10, 102, 320, 124], polygon: null },
          { id: '0:4', page: 0, text: 'NÚMERO: 123', confidence: .97,
            box: [10, 132, 150, 154], polygon: null },
          { id: '0:5', page: 0, text: 'CEP: 20000-000', confidence: .97,
            box: [10, 162, 170, 184], polygon: null },
          { id: '0:6', page: 0, text: 'CIDADE/ESTADO: RIO DE JANEIRO/RJ', confidence: .97,
            box: [10, 192, 390, 214], polygon: null },
          { id: '0:7', page: 0, text: 'CO-PROPRIETÁRIO / CO-OWNER', confidence: .99,
            box: [10, 240, 310, 262], polygon: null },
          { id: '0:8', page: 0, text: 'NOME: JOAO DE SOUZA', confidence: .98,
            box: [10, 272, 270, 294], polygon: null },
          { id: '0:9', page: 0, text: 'CPF/CNPJ: 529.982.247-25', confidence: .98,
            box: [10, 302, 290, 324], polygon: null },
          { id: '0:10', page: 0, text: 'CARACTERÍSTICAS DO CASCO', confidence: .99,
            box: [10, 350, 310, 372], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(source, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['registeredOwner.fullName']).toBe('MARIA DE SOUZA');
    expect(values['registeredOwner.taxId']).toBe('123.456.789-09');
    expect(values['registeredOwner.address']).toBe('RUA DAS FLORES');
    expect(values['registeredOwner.streetNumber']).toBe('123');
    expect(values['registeredOwner.postalCode']).toBe('20000-000');
    expect(values['registeredOwner.cityState']).toBe('RIO DE JANEIRO/RJ');
    expect(values['coOwner.fullName']).toBe('JOAO DE SOUZA');
    expect(values['coOwner.cpf']).toBe('529.982.247-25');
    expect(values['person.fullName']).toBeUndefined();
    expect(values['seller.fullName']).toBeUndefined();
  });

  it('usa janela maior de inscrição somente no layout TIEM legado', () => {
    const legacy: DocumentObservation = {
      engine: 'paddleocr',
      engineVersion: '3.7.0',
      model: 'PP-OCRv6',
      elapsedMs: 10,
      pages: [{
        page: 0,
        orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'TÍTULO DE INSCRIÇÃO DE EMBARCAÇÃO MIÚDA',
            confidence: .99, box: [10, 10, 380, 30], polygon: null },
          { id: '0:1', page: 0, text: 'N DE INSCRIÇÃO',
            confidence: .98, box: [10, 60, 150, 80], polygon: null },
          { id: '0:2', page: 0, text: '441M20200001',
            confidence: .98, box: [10, 155, 170, 177], polygon: null },
          { id: '0:3', page: 0, text: 'CARACTERÍSTICAS DO CASCO',
            confidence: .98, box: [300, 220, 560, 242], polygon: null },
          { id: '0:4', page: 0, text: 'CREDOR HIPOTECÁRIO',
            confidence: .98, box: [300, 260, 520, 282], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(legacy, context);
    expect(classifyTieVariant(legacy)).toBe('legacy');
    expect(evidence.find((item) => item.fieldId === 'vessel.registration')?.value)
      .toBe('441M20200001');
  });

  it('tolera degradação real do rótulo bilíngue de inscrição sem confundir casco', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'MOMCIO DE INSCRICAO / REGISTRATION NUMSER',
      '3810056831',
      'Nº DO CASCO / HULL NUMBER',
      'BRABC12345D626',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('3810056831');
    expect(values['vessel.hullId']).toBe('BRABC12345D626');
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

  it('extrai passageiros quando o OCR preserva apenas a barra do rótulo bilíngue', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE PASSAGEIROS /',
      '9',
    ]), context);

    expect(evidence.find((item) => item.fieldId === 'vessel.passengerCount')?.value)
      .toBe('9');
  });

  it('usa o layout tabular para mapear datas, motores e hipoteca do TIE/TIEM', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE INSCRIÇÃO / REGISTRATION NUMBER',
      '4019909971',
      'DATA DE VALIDADE / EXPIRATION DATE',
      '31/07/2028',
      'QUANTIDADE DE MOTORES / QUANTITY OF ENGINES',
      '1',
      'ALIENAÇÃO FIDUCIÁRIA / CHATTEL MORTGAGE',
      'NÃO',
      'LOCAL DE EMISSÃO / PLACE OF ISSUE',
      'São Sebastião',
      'DATA DE EMISSÃO / DATE OF ISSUE',
      '31/07/2023',
    ]), context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.registration']).toBe('4019909971');
    expect(values['vessel.expirationDate']).toBe('31/07/2028');
    expect(values['vessel.motorCount']).toBe('1');
    expect(values['vessel.mortgaged']).toBe('NÃO');
    expect(values['vessel.issuePlace']).toBe('São Sebastião');
    expect(values['vessel.issueDate']).toBe('31/07/2023');
  });

  it('mapeia campos exclusivos do TIEM antigo sem importar rótulos vizinhos', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'TÍTULO DE INSCRIÇÃO DE EMBARCAÇÃO MIÚDA',
      'Nº DE INSCRIÇÃO',
      '441M20200001',
      'DATA INSCRIÇÃO',
      '28/01/1995',
      'VALIDADE',
      '5/12/2019',
      'POTÊNCIA (HP)',
      '85.00',
      'NOME FABRICANTE',
      'YAMAHA',
      'HIPOTECADA: NÃO',
      'CREDOR HIPOTECÁRIO',
      'BANCO TESTE',
    ]), context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.registration']).toBe('441M20200001');
    expect(values['vessel.registrationDate']).toBe('28/01/1995');
    expect(values['vessel.motorPower']).toBe('85.00');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
    expect(values['vessel.mortgaged']).toBe('NÃO');
    expect(values['vessel.mortgageCreditor']).toBe('BANCO TESTE');
  });

  it('extrai características compartilhadas confirmadas nos modelos TIE/TIEM', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE INSCRIÇÃO / REGISTRATION NUMBER',
      '3810056831',
      'TIPO DA EMBARCAÇÃO / TYPE OF VESSEL',
      'LANCHA - MOTORBOAT',
      'ÁREA DE NAVEGAÇÃO / NAVIGATION AREA',
      'NAVEGAÇÃO INTERIOR',
      'PONTAL / DEPTH',
      '1,57 M',
      'MATERIAL DO CASCO / HULL MATERIAL',
      'FIBRA DE VIDRO',
      'TIPO DE PROPULSÃO / TYPE OF PROPULSION',
      'MOTOR',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.type']).toBe('LANCHA - MOTORBOAT');
    expect(values['vessel.navigationArea']).toBe('NAVEGAÇÃO INTERIOR');
    expect(values['vessel.depth']).toBe('1,57 M');
    expect(values['vessel.hullMaterial']).toBe('FIBRA DE VIDRO');
    expect(values['vessel.propulsionType']).toBe('MOTOR');
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
      'TIPO DE PROPULSÃO',
      'Motor',
      'TIPO DA EMBARCAÇÃO',
      'Lancha - Motorboat',
      'ÁREA DE NAVEGAÇÃO',
      'Navegação Interior',
      'MAT. CONSTRUÇÃO CASCO',
      'Fibra de vidro',
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
    expect(values['vessel.propulsionType']).toBe('Motor');
    expect(values['vessel.type']).toBe('Lancha - Motorboat');
    expect(values['vessel.navigationArea']).toBe('Navegação Interior');
    expect(values['vessel.hullMaterial']).toBe('Fibra de vidro');
    expect(values['vessel.activity']).toBe('Esporte e Recreio');
    expect(values['vessel.crewCount']).toBe('2');
    expect(values['vessel.passengerCount']).toBe('6');
    expect(values['vessel.year']).toBe('2022');
    expect(values['vessel.length']).toBe('6,50 m');
    expect(values['vessel.hullId']).toBe('BR-MZL-123456');
  });

  it('não inventa AB/GT nem casco a partir de campos mascarados do TIE digital', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'NÚMERO DE INSCRIÇÃO / REGISTRATION NUMBER',
      '381M2023000087',
      'TIPO DA EMBARCAÇÃO / TYPE OF VESSEL',
      'MOTO-AQUÁTICA / PERSONAL WATER CRAFT',
      'NOME DA EMBARCAÇÃO / NAME OF VESSEL',
      'MESTRE LEO',
      'AB / GT',
      '**********',
      'BOCA / BREADTH',
      '**********',
      'ANO DE CONSTRUÇÃO / YEAR OF BUILD',
      '2022',
      'MATERIAL DO CASCO',
      'FIBRA',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('381M2023000087');
    expect(values['vessel.name']).toBe('MESTRE LEO');
    expect(values['vessel.year']).toBe('2022');
    expect(values['vessel.grossTonnage']).toBeUndefined();
    expect(values['vessel.breadth']).toBeUndefined();
    expect(values['vessel.hullId']).toBeUndefined();
  });

  it('extrai o TIEM legado limpo sem confundir inscrição com casco ou motor', () => {
    const cleanLegacy: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'TÍTULO DE INSCRIÇÃO DE EMBARCAÇÃO MIÚDA',
            confidence: .99, box: [20, 20, 850, 60], polygon: null },
          { id: '0:1', page: 0, text: 'Nº DE INSCRIÇÃO',
            confidence: .99, box: [40, 100, 350, 130], polygon: null },
          { id: '0:2', page: 0, text: '441M2023001234',
            confidence: .99, box: [90, 135, 310, 165], polygon: null },
          { id: '0:3', page: 0, text: 'POTÊNCIA (HP)',
            confidence: .99, box: [40, 340, 220, 370], polygon: null },
          { id: '0:4', page: 0, text: 'Nº DO 1º MOTOR/SÉRIE',
            confidence: .99, box: [230, 340, 560, 370], polygon: null },
          { id: '0:5', page: 0, text: 'NOME FABRICANTE',
            confidence: .99, box: [570, 340, 850, 370], polygon: null },
          { id: '0:6', page: 0, text: '115',
            confidence: .98, box: [95, 380, 150, 410], polygon: null },
          { id: '0:7', page: 0, text: '6E5L1001234',
            confidence: .98, box: [315, 380, 470, 410], polygon: null },
          { id: '0:8', page: 0, text: 'YAMAHA',
            confidence: .98, box: [655, 380, 770, 410], polygon: null },
          { id: '0:9', page: 0, text: 'CARACTERÍSTICAS DO CASCO',
            confidence: .99, box: [900, 500, 1450, 530], polygon: null },
          { id: '0:10', page: 0, text: 'FORMATO DE SÉRIE DO CASCO/FORMA',
            confidence: .99, box: [900, 610, 1280, 642], polygon: null },
          { id: '0:11', page: 0, text: 'BR-MZL-123456',
            confidence: .98, box: [1285, 610, 1500, 642], polygon: null },
        ],
      }],
    };

    expect(classifyTieVariant(cleanLegacy)).toBe('legacy');
    const evidence = tieDocumentExtractor.extract(cleanLegacy, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.registration']).toBe('441M2023001234');
    expect(values['vessel.motorPower']).toBe('115');
    expect(values['vessel.motorSerial']).toBe('6E5L1001234');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
    expect(values['vessel.hullId']).toBe('BR-MZL-123456');
    expect(values['vessel.grossTonnage']).toBeUndefined();
    expect(values['vessel.motorManufacturerBrandModel']).toBeUndefined();
  });

  it('mantém inscrição e série do casco separadas quando a ordem OCR diverge da geometria', () => {
    const geometryShuffled: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'Nº DE INSCRIÇÃO', confidence: .99,
            box: [30, 90, 330, 120], polygon: null },
          { id: '0:1', page: 0, text: 'BR-MZL-123456', confidence: .98,
            box: [1280, 650, 1490, 682], polygon: null },
          { id: '0:2', page: 0, text: 'FORMATO DE SÉRIE DO CASCO/FORMA', confidence: .99,
            box: [900, 610, 1280, 642], polygon: null },
          { id: '0:3', page: 0, text: '441M2023001234', confidence: .98,
            box: [75, 125, 315, 158], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(geometryShuffled, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.registration']).toBe('441M2023001234');
    expect(values['vessel.hullId']).toBe('BR-MZL-123456');
  });

  it('mantém campos do cabeçalho e motor em colunas densas sem conflito de frases sintéticas', () => {
    const dense: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'NOME DA EMBARCAÇÃO', confidence: .99,
            box: [120, 180, 520, 210], polygon: null },
          { id: '0:1', page: 0, text: 'MAR AZUL', confidence: .98,
            box: [250, 220, 390, 252], polygon: null },
          { id: '0:2', page: 0, text: 'POTÊNCIA (HP)', confidence: .99,
            box: [30, 340, 220, 370], polygon: null },
          { id: '0:3', page: 0, text: 'Nº DO 1º MOTOR/SÉRIE', confidence: .99,
            box: [230, 340, 560, 370], polygon: null },
          { id: '0:4', page: 0, text: 'NOME FABRICANTE', confidence: .99,
            box: [570, 340, 850, 370], polygon: null },
          { id: '0:5', page: 0, text: '115', confidence: .98,
            box: [95, 380, 150, 410], polygon: null },
          { id: '0:6', page: 0, text: '6E5L1001234', confidence: .98,
            box: [315, 380, 470, 410], polygon: null },
          { id: '0:7', page: 0, text: 'YAMAHA', confidence: .98,
            box: [655, 380, 770, 410], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(dense, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.name']).toBe('MAR AZUL');
    expect(values['vessel.motorPower']).toBe('115');
    expect(values['vessel.motorSerial']).toBe('6E5L1001234');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
  });

  it('tolera erros OCR nos rótulos antigos e usa somente o primeiro motor do MVP', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'N0ME DA EMBARCACA0',
      'MAR AZUL',
      'P0T3NCIA (HP)',
      '115',
      'N DO 1 MOTOR/S3R1E',
      '6E5L1001234',
      'N0ME FABR1CANTE',
      'YAMAHA',
      'N0ME FABR1CANTE',
      'SEM VALOR',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.name']).toBe('MAR AZUL');
    expect(values['vessel.motorPower']).toBe('115');
    expect(values['vessel.motorSerial']).toBe('6E5L1001234');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
  });

  it('rejeita identificador forte de casco como inscrição mesmo quando aparece junto ao rótulo', () => {
    const mixed: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:0', page: 0, text: 'N° DE INSCRIÇÃO BR-MZL-123456', confidence: .97,
            box: [30, 90, 430, 120], polygon: null },
          { id: '0:1', page: 0, text: '441M2023001234', confidence: .98,
            box: [70, 126, 315, 158], polygon: null },
          { id: '0:2', page: 0, text: 'FORMATO DE SÉRIE DO CASCO/FORMA', confidence: .99,
            box: [900, 610, 1280, 642], polygon: null },
          { id: '0:3', page: 0, text: 'BR-MZL-123456', confidence: .98,
            box: [1280, 650, 1490, 682], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(mixed, context);
    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));

    expect(values['vessel.registration']).toBe('441M2023001234');
    expect(values['vessel.hullId']).toBe('BR-MZL-123456');
  });

  it('aceita variantes comuns do símbolo de número e rótulos antigos', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'N° DE INSCRIÇÃO',
      '441M2023001234',
      'N° DO CASCO',
      'BRABC12345D626',
      'NOME DO FABRICANTE',
      'YAMAHA',
      'ATIVIDADE - USO',
      'Esporte e Recreio',
      'QTDADE DE TRIPULANTES',
      '2',
      'QTDADE DE PASSAGEIROS',
      '6',
    ]), context);

    const values = Object.fromEntries(evidence.map((item) => [item.fieldId, item.value]));
    expect(values['vessel.registration']).toBe('441M2023001234');
    expect(values['vessel.hullId']).toBe('BRABC12345D626');
    expect(values['vessel.motorBrand']).toBe('YAMAHA');
    expect(values['vessel.activity']).toBe('Esporte e Recreio');
    expect(values['vessel.crewCount']).toBe('2');
    expect(values['vessel.passengerCount']).toBe('6');
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

  it('não usa o rótulo de série como fabricante quando o TIE digital está mascarado', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'MOTOR 1 / ENGINE 1',
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      '**********',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '**********',
      'MOTOR 2 / ENGINE 2',
    ]), context);

    expect(evidence.some((item) =>
      item.fieldId === 'vessel.motorManufacturerBrandModel')).toBe(false);
    expect(evidence.some((item) => item.fieldId === 'vessel.motorSerial')).toBe(false);
  });

  it('mantém fabricante e série separados quando ambos têm valores reais', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'MOTOR 1 / ENGINE 1',
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      'YAMAHA - WAVERUNNER - VX',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '6AN123456',
      'MOTOR 2 / ENGINE 2',
    ]), context);

    expect(evidence.find((item) =>
      item.fieldId === 'vessel.motorManufacturerBrandModel')?.value)
      .toBe('YAMAHA - WAVERUNNER - VX');
    expect(evidence.find((item) => item.fieldId === 'vessel.motorSerial')?.value)
      .toBe('6AN123456');
  });

  it('para a busca de série ao chegar no cabeçalho do motor 2', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '**********',
      'MOTOR2/ENGINE2',
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      '2022',
    ]), context);

    expect(evidence.some((item) => item.fieldId === 'vessel.motorSerial')).toBe(false);
  });

  it('não trata cabeçalhos compactados de motor como valor de fabricante', () => {
    const evidence = tieDocumentExtractor.extract(observation([
      'FABRICANTE - MARCA - MODELO / MANUFACTURER - BRAND - MODEL',
      '**********',
      'MOTOR2/ENGINE2',
      'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
      '6AN123456',
    ]), context);

    expect(evidence.some((item) =>
      item.fieldId === 'vessel.motorManufacturerBrandModel')).toBe(false);
    expect(evidence.find((item) => item.fieldId === 'vessel.motorSerial')?.value)
      .toBe('6AN123456');
  });

  it('não usa ordem sequencial do OCR para atravessar colunas quando há geometria', () => {
    const multiColumn: DocumentObservation = {
      engine: 'paddleocr', engineVersion: '3.7.0', model: 'PP-OCRv6', elapsedMs: 10,
      pages: [{
        page: 0, orientation: 0,
        lines: [
          { id: '0:49', page: 0, text: 'N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER',
            confidence: .99, box: [420, 300, 760, 325], polygon: null },
          // Próxima linha na ordem do OCR, mas em outra coluna do documento.
          { id: '0:50', page: 0, text: '2022',
            confidence: .98, box: [180, 340, 240, 365], polygon: null },
        ],
      }],
    };

    const evidence = tieDocumentExtractor.extract(multiColumn, context);
    expect(evidence.some((item) => item.fieldId === 'vessel.motorSerial')).toBe(false);
  });

});
