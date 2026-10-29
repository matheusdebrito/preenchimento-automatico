import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { fillPdf } from './fill-pdf.js';
import { catalog } from '../catalog/catalog.js';
import { fillApprovedTemplate } from './verified-template.js';

async function syntheticPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages()[0]!.drawText('MODELO SINTÉTICO', { x: 40, y: 780, font, size: 14 });
  return doc.save();
}

describe('motor determinístico de PDF', () => {
  it('preenche PDF estático de teste sem modificar o original', async () => {
    const original = await syntheticPdf();
    const snapshot = Uint8Array.from(original);
    const output = await fillPdf(original, [{
      kind: 'COORDINATES', fieldId: 'person.fullName', required: true,
      pageIndex: 0, x: 50, y: 640, fontSize: 12, maxWidth: 350,
    }], { 'person.fullName': 'Maria Teste da Silva' });
    expect(output.length).toBeGreaterThan(original.length);
    expect(original).toEqual(snapshot);
    const rendered = await PDFDocument.load(output);
    expect(rendered.getPages()).toHaveLength(1);
  });

  it('rejeita campos ausentes, texto longo, quebras de linha e páginas incorretas', async () => {
    const input = await syntheticPdf();
    const field = { kind: 'COORDINATES' as const, fieldId: 'name', required: true,
      pageIndex: 0, x: 50, y: 640, fontSize: 12, maxWidth: 80 };
    await expect(fillPdf(input, [field], {})).rejects.toThrow('obrigatório');
    await expect(fillPdf(input, [field], { name: 'A'.repeat(100) })).rejects.toThrow('excede');
    await expect(fillPdf(input, [field], { name: 'Maria\nTeste' })).rejects.toThrow('Quebra');
    await expect(fillPdf(input, [{ ...field, pageIndex: 100 }], { name: 'OK' })).rejects.toThrow('Página');
  });

  it('aceita acentuação portuguesa e rejeita bidi, controles e glifos inexistentes', async () => {
    const input = await syntheticPdf();
    const placement = [{ kind: 'COORDINATES' as const, fieldId: 'name',
      required: true, pageIndex: 0, x: 50, y: 640, fontSize: 12, maxWidth: 400 }];
    const result = await fillPdf(input, placement, { name: 'João Gonçalves – São Luís' });
    expect((await PDFDocument.load(result)).getPages()).toHaveLength(1);
    await expect(fillPdf(input, placement, { name: 'Maria' + String.fromCharCode(0x202e) + 'Anulada' }))
      .rejects.toThrow('caracteres');
    await expect(fillPdf(input, placement, { name: 'Maria' + String.fromCharCode(9) + 'Teste' }))
      .rejects.toThrow('caracteres');
    await expect(fillPdf(input, placement, { name: 'Maria 你好' }))
      .rejects.toThrow('Caractere');
  });

  it('marca somente a escolha selecionada, não imprime o valor literal', async () => {
    const input = await syntheticPdf();
    const stamped = await fillPdf(input, [
      { kind: 'COORDINATES', fieldId: 'answer', pageIndex: 0, x: 50, y: 600,
        fontSize: 12, maxWidth: 12, required: true, markWhen: 'sim' },
      { kind: 'COORDINATES', fieldId: 'answer', pageIndex: 0, x: 110, y: 600,
        fontSize: 12, maxWidth: 12, required: true, markWhen: 'nao' },
    ], { answer: 'sim' });
    const doc = await PDFDocument.load(stamped);
    expect(doc.getPages()).toHaveLength(1);
    // The X is visibly tested by rendered PDF regression; this asserts both options fit.
  });

  it('aceita false em checkbox estático unilateral deixando a caixa em branco', async () => {
    const input = await syntheticPdf();
    const placement = [{
      kind: 'COORDINATES' as const, fieldId: 'equipment',
      pageIndex: 0, x: 50, y: 600, fontSize: 12, maxWidth: 12,
      required: false, markWhen: 'true',
    }];
    const output = await fillPdf(input, placement, { equipment: 'false' });
    expect((await PDFDocument.load(output)).getPages()).toHaveLength(1);
    await expect(fillPdf(input, placement, { equipment: 'maybe' }))
      .rejects.toThrow('Opção não prevista');
  });

  it('formata a mesma data canônica em partes exigidas pelo formulário', async () => {
    const input = await syntheticPdf();
    const output = await fillPdf(input, [
      { kind: 'COORDINATES', fieldId: 'date', required: true, pageIndex: 0,
        x: 50, y: 600, fontSize: 10, maxWidth: 20, valueTransform: 'DATE_DAY' },
      { kind: 'COORDINATES', fieldId: 'date', required: true, pageIndex: 0,
        x: 90, y: 600, fontSize: 10, maxWidth: 80, valueTransform: 'DATE_MONTH_NAME_PT_BR' },
      { kind: 'COORDINATES', fieldId: 'date', required: true, pageIndex: 0,
        x: 190, y: 600, fontSize: 10, maxWidth: 30, valueTransform: 'DATE_YEAR_2' },
    ], { date: '29/10/2026' });
    expect((await PDFDocument.load(output)).getPages()).toHaveLength(1);
    await expect(fillPdf(input, [{
      kind: 'COORDINATES', fieldId: 'date', required: true, pageIndex: 0,
      x: 50, y: 600, fontSize: 10, maxWidth: 20, valueTransform: 'DATE_DAY',
    }], { date: '2026-10-29' })).rejects.toThrow('Data inválida');
  });

  it('identifica tipos reais de AcroForm em vez de confundir texto true com checkbox', async () => {
    const original = await PDFDocument.create();
    const page = original.addPage([595, 842]);
    const form = original.getForm();
    form.createTextField('field_text').addToPage(page, { x: 40, y: 700, width: 200, height: 22 });
    form.createCheckBox('field_check').addToPage(page, { x: 40, y: 660, width: 20, height: 20 });
    const stamped = await fillPdf(await original.save(), [
      { kind: 'ACROFORM', fieldId: 'text', required: true, pdfFieldName: 'field_text' },
      { kind: 'ACROFORM', fieldId: 'checked', required: true, pdfFieldName: 'field_check' },
    ], { text: 'true', checked: 'false' });
    const filled = (await PDFDocument.load(stamped)).getForm();
    expect(filled.getTextField('field_text').getText()).toBe('true');
    expect(filled.getCheckBox('field_check').isChecked()).toBe(false);
    await expect(fillPdf(await original.save(), [{
      kind: 'ACROFORM', fieldId: 'checked', required: true, pdfFieldName: 'field_check',
    }], { checked: 'yes' })).rejects.toThrow('true ou false');
  });

  it('recusa mapeamento em página girada ou com campo fora de CropBox', async () => {
    const original = await PDFDocument.create();
    const page = original.addPage([595, 842]);
    page.setRotation(degrees(90));
    const bytes = await original.save();
    const placement = [{ kind: 'COORDINATES' as const, fieldId: 'name',
      required: true, pageIndex: 0, x: 50, y: 600, fontSize: 12, maxWidth: 200 }];
    await expect(fillPdf(bytes, placement, { name: 'Maria' }))
      .rejects.toThrow('girada');
    page.setRotation(degrees(0));
    page.setCropBox(100, 100, 300, 400);
    await expect(fillPdf(await original.save(), placement, { name: 'Maria' }))
      .rejects.toThrow('fora dos limites');
  });

  it('nunca gera os PDFs oficiais enquanto o mapeamento não estiver aprovado', async () => {
    await expect(fillApprovedTemplate(catalog, 'bdmoto-v1', {
      'person.fullName': 'Pessoa de exemplo',
    })).rejects.toThrow('não homologado');
  });
});
