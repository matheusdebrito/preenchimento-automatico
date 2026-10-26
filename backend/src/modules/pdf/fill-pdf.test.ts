import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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

  it('nunca gera os PDFs oficiais enquanto o mapeamento não estiver aprovado', async () => {
    await expect(fillApprovedTemplate(catalog, 'bdmoto-v1', {
      'person.fullName': 'Pessoa de exemplo',
    })).rejects.toThrow('não homologado');
  });
});
