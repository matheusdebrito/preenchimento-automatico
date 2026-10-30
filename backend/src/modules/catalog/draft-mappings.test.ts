import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';
import { validateCatalog } from './validate-catalog.js';
import { PDFDocument } from 'pdf-lib';
import { fillPdf } from '../pdf/fill-pdf.js';
import { validateMappedFieldValues } from './field-validation.js';
import { publicService } from './public-catalog.js';
import { serviceFormValues } from './service-form-values.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('official form map coordinates', () => {
  it('mantém todos os mapas homologados e o catálogo publicável', () => {
    expect(catalog.mappings).toHaveLength(17);
    expect(validateCatalog(catalog)).toEqual([]);
    expect(catalog.mappings.every((mapping) => mapping.status === 'APPROVED')).toBe(true);
    expect(catalog.services.every((service) => service.status === 'AVAILABLE')).toBe(true);
  });
  it('positions stay within the dimensions of the real official PDF pages', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId);
      expect(version?.templatePath).toBeTruthy();
      const pdfBytes = await readFile(resolve(process.cwd(), '..', version!.templatePath!));
      const pdf = await PDFDocument.load(pdfBytes);
      for (const field of mapping.placements) {
        if (field.kind !== 'COORDINATES') continue;
        const page = pdf.getPages()[field.pageIndex];
        expect(page, mapping.id + '/' + field.fieldId).toBeDefined();
        const { width, height } = page!.getSize();
        expect(field.x + field.maxWidth, mapping.id + '/' + field.fieldId).toBeLessThanOrEqual(width + 0.5);
        expect(field.y + field.fontSize, mapping.id + '/' + field.fieldId).toBeLessThanOrEqual(height + 0.5);
        expect(field.x, mapping.id + '/' + field.fieldId).toBeGreaterThan(0);
        expect(field.y, mapping.id + '/' + field.fieldId).toBeGreaterThan(0);
      }
    }
  });
  it('mantém cada formulário independente com campos essenciais explícitos', () => {
    const required: Record<string, readonly string[]> = {
      'requerimento-ma-v1': ['person.fullName', 'person.cpf', 'vessel.name', 'vessel.hullId'],
      'bdmoto-v1': ['person.fullName', 'person.cpf', 'vessel.name', 'vessel.hullId'],
      'autorizacao-transferencia-ma-v1': ['person.fullName', 'seller.fullName', 'person.cpf', 'seller.cpf'],
      'comunicacao-transferencia-ma-v1': ['person.fullName', 'seller.fullName', 'person.cpf', 'seller.cpf'],
      'declaracao-perda-tie-ma-v1': ['declarant.fullName', 'declarant.cpf', 'vessel.name'],
      'declaracao-residencia-ma-v1': ['person.fullName', 'person.cpf', 'person.address'],
      'bade-er-2026-v1': ['person.fullName', 'person.cpf', 'vessel.name'],
      'bsade-er-2026-v1': ['person.fullName', 'person.cpf', 'vessel.name', 'vessel.hullId'],
      'requerimento-embarcacao-er-2026-v1': ['person.fullName', 'person.cpf', 'vessel.name'],
      'declaracao-residencia-er-2026-v1': ['person.fullName', 'person.cpf', 'person.address'],
      'declaracao-perda-tie-er-2026-v1': ['declarant.fullName', 'declarant.cpf', 'vessel.name', 'vessel.registration'],
      'comunicacao-transferencia-er-2026-v1': ['seller.fullName', 'seller.cpf', 'person.fullName', 'person.cpf', 'vessel.name', 'vessel.registration'],
      'autorizacao-transferencia-er-2026-v1': ['seller.fullName', 'seller.cpf', 'person.fullName', 'person.cpf', 'vessel.name', 'vessel.registration'],
      'termo-responsabilidade-er-2026-v1': ['vessel.name', 'vessel.builderName'],
    };
    expect(catalog.mappings).toHaveLength(
      catalog.versions.filter((version) => version.status === 'VERIFIED').length,
    );
    for (const mapping of catalog.mappings) {
      const fields = new Set(mapping.placements.filter((p) => p.required).map((p) => p.fieldId));
      for (const field of required[mapping.formVersionId] ?? []) {
        expect(fields.has(field), mapping.formVersionId + ': ' + field).toBe(true);
      }
      for (const placement of mapping.placements) {
        expect(placement.fieldId).not.toMatch(/signature|assinatura|firma|rubrica|carimbo|stamp/i);
      }
    }
  });

  it('mantém um único motor em todos os mapas e nunca deriva declarante de vendedor', () => {
    const fields = catalog.mappings.flatMap((mapping) =>
      mapping.placements.map((placement) => placement.fieldId));
    expect(fields).toContain('vessel.motorBrand');
    expect(fields).toContain('vessel.motorPower');
    expect(fields).toContain('vessel.motorSerial');
    expect(fields.some((id) =>
      /^vessel\.motor[1-4](?:Choice|Brand|Power|Serial)$/.test(id))).toBe(false);

    const loss = catalog.mappings.find((m) => m.formVersionId === 'declaracao-perda-tie-ma-v1')!;
    expect(loss.placements.some((p) => p.fieldId === 'declarant.fullName')).toBe(true);
    expect(loss.placements.some((p) => p.fieldId.startsWith('seller.'))).toBe(false);
  });

  it('mantém as marcações do 2-C e 2-H dentro das caixas impressas revisadas', () => {
    const request = catalog.mappings.find((m) =>
      m.formVersionId === 'requerimento-embarcacao-er-2026-v1')!;
    const requestMarks = request.placements.filter((p) =>
      p.kind === 'COORDINATES' && p.markWhen !== undefined);
    const byValue = new Map(requestMarks.map((p) =>
      [p.kind === 'COORDINATES' ? p.markWhen : undefined, p]));
    expect((byValue.get('interior') as { x: number } | undefined)?.x).toBe(100);
    expect((byValue.get('costeira') as { x: number } | undefined)?.x).toBe(168);
    expect((byValue.get('oceanica') as { x: number } | undefined)?.x).toBe(240);
    expect((byValue.get('transf_prop') as { x: number } | undefined)?.x).toBe(96);
    expect((byValue.get('transf_jur') as { x: number } | undefined)?.x).toBe(260);

    const loss = catalog.mappings.find((m) =>
      m.formVersionId === 'declaracao-perda-tie-er-2026-v1')!;
    const lostTie = loss.placements.find((p) =>
      p.kind === 'COORDINATES' && p.fieldId === 'process.lostTie');
    expect(lostTie?.kind).toBe('COORDINATES');
    if (lostTie?.kind === 'COORDINATES') expect(lostTie.x).toBe(94);
  });

  it('gera cada modelo oficial com valores fictícios preservando páginas e bytes originais', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId)!;
      const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
      const snapshot = Buffer.from(original);
      const values: Record<string, string> = {};
      for (const placement of mapping.placements) {
        if (!placement.required) continue;
        const id = placement.fieldId;
        values[id] = id.endsWith('.cpf') ? '123.456.789-09' :
          id.endsWith('fullName') ? 'MARIA TESTE' :
          id.endsWith('registration') ? '123456789' :
          id.endsWith('hullId') ? 'BR-ABC-12345' :
          id.endsWith('address') ? 'RUA TESTE' : 'DADO TESTE';
      }
      validateMappedFieldValues(catalog.fields, mapping.placements, values);
      const output = await fillPdf(original, mapping.placements, values);
      const pdf = await PDFDocument.load(output);
      const template = await PDFDocument.load(original);
      expect(pdf.getPageCount(), mapping.id).toBe(template.getPageCount());
      expect(pdf.getPages().map((p) => p.getSize()), mapping.id)
        .toEqual(template.getPages().map((p) => p.getSize()));
      expect(Buffer.from(original), mapping.id).toEqual(snapshot);
    }
  }, 30_000);

  it('gera pacotes representativos de todos os serviços publicados', async () => {
    const cases = [
      ['inscricao-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'ate_6m', initialResponsibilityTerm: 'nao',
      }],
      ['inscricao-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'maior_12_menor_24m',
        initialResponsibilityTerm: 'sim',
      }],
      ['transferencia-propriedade-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
      }],
      ['transferencia-jurisdicao-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'maior_6_ate_12m', tieSituation: 'regular',
      }],
      ['transferencia-propriedade-jurisdicao-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'extraviado',
      }],
      ['renovacao-tie-embarcacao', {
        vesselType: 'embarcacao', tieSituation: 'regular', dataChanged: 'nao',
      }],
      ['segunda-via-tie-embarcacao', {
        vesselType: 'embarcacao', dataChanged: 'nao',
      }],
      ['alteracao-dados-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
        responsibilityTermCase: 'construcao_artesanal',
      }],
      ['alteracao-motor-embarcacao', {
        vesselType: 'embarcacao', vesselBand: 'ate_6m', tieSituation: 'regular',
        responsibilityTermCase: 'nao', rowToMotorConversion: 'nao',
      }],
      ['comunicacao-venda-embarcacao', { vesselType: 'embarcacao' }],
      ['inscricao-exame-amador', { amateurCategory: 'arrais' }],
      ['renovacao-cha-amador', { amateurCategory: 'mestre', chaSituation: 'regular' }],
      ['emissao-cha-veleiro', {}],
      ['concessao-cha-equivalencia', { amateurCategory: 'capitao' }],
      ['renovacao-cha-agregacao-mta', {
        amateurCategory: 'arrais', motonautaDeclaration: 'sim',
      }],
    ] as const;

    for (const [serviceId, answers] of cases) {
      const service = publicService(catalog, serviceId, answers);
      expect(service, serviceId).not.toBeNull();

      const reviewedValues = Object.fromEntries((service?.reviewFields ?? [])
        .filter((field) => field.required)
        .map((field) => {
          const value = field.id.endsWith('.cpf') ? '123.456.789-09'
            : field.valueKind === 'date' ? '15/10/2026'
              : field.valueKind === 'boolean' ? 'true'
                : field.id.endsWith('fullName') ? 'MARIA TESTE'
                  : field.id.includes('registration') ? 'RJ123456'
                    : field.id.includes('hullId') ? 'BR-ABC-12345'
                      : field.id.includes('address') ? 'RUA TESTE'
                        : field.id === 'amateur.category' ? 'Mestre-Amador'
                          : field.id === 'amateur.chaNumber' ? 'CHA123456'
                            : 'DADO TESTE';
          return [field.id, value];
        }));

      for (const versionId of service?.formVersionIds ?? []) {
        const relation = catalog.serviceForms.find((item) =>
          item.serviceId === serviceId && item.formVersionId === versionId);
        const mapping = catalog.mappings.find((item) => item.formVersionId === versionId)!;
        const version = catalog.versions.find((item) => item.id === versionId)!;
        const values = serviceFormValues(relation, answers, reviewedValues);
        validateMappedFieldValues(catalog.fields, mapping.placements, values);
        const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
        await expect(fillPdf(original, mapping.placements, values), serviceId + '/' + versionId)
          .resolves.toBeInstanceOf(Uint8Array);
      }
    }
  }, 60_000);

  it('gera todos os pacotes liberados de moto aquática com marcações de serviço válidas', async () => {
    const cases = [
      ['inscricao-embarcacao', { vesselType: 'moto_aquatica' }],
      ['transferencia-propriedade-embarcacao',
        { vesselType: 'moto_aquatica', tieSituation: 'regular' }],
      ['transferencia-jurisdicao-embarcacao',
        { vesselType: 'moto_aquatica', tieSituation: 'regular' }],
      ['transferencia-propriedade-jurisdicao-embarcacao',
        { vesselType: 'moto_aquatica', tieSituation: 'regular' }],
      ['renovacao-tie-embarcacao', {
        vesselType: 'moto_aquatica', tieSituation: 'regular',
        motoCharacteristicsChanged: 'nao',
      }],
      ['renovacao-tie-embarcacao', {
        vesselType: 'moto_aquatica', tieSituation: 'extraviado',
        motoCharacteristicsChanged: 'sim',
      }],
      ['segunda-via-tie-embarcacao', {
        vesselType: 'moto_aquatica', motoCharacteristicsChanged: 'nao',
        motoTieSecondCopyReason: 'extravio',
      }],
      ['alteracao-dados-embarcacao', {
        vesselType: 'moto_aquatica', tieSituation: 'regular',
        motoDataChangeTarget: 'ambos',
      }],
      ['alteracao-motor-embarcacao',
        { vesselType: 'moto_aquatica', tieSituation: 'regular' }],
      ['comunicacao-venda-embarcacao', { vesselType: 'moto_aquatica' }],
    ] as const;

    for (const [serviceId, answers] of cases) {
      const service = publicService(catalog, serviceId, answers);
      expect(service, serviceId).not.toBeNull();
      const reviewedValues = Object.fromEntries((service?.reviewFields ?? [])
        .filter((field) => field.required)
        .map((field) => {
          const value = field.id.endsWith('.cpf') ? '123.456.789-09'
            : field.valueKind === 'date' ? '15/10/2026'
              : field.valueKind === 'boolean' ? 'true'
                : field.id.endsWith('fullName') ? 'MARIA TESTE'
                  : field.id.includes('registration') ? 'RJ123456'
                    : field.id.includes('hullId') ? 'BR-ABC-12345'
                      : field.id.includes('address') ? 'RUA TESTE'
                        : 'DADO TESTE';
          return [field.id, value];
        }));

      for (const versionId of service?.formVersionIds ?? []) {
        const relation = catalog.serviceForms.find((item) =>
          item.serviceId === serviceId && item.formVersionId === versionId);
        const mapping = catalog.mappings.find((item) => item.formVersionId === versionId)!;
        const version = catalog.versions.find((item) => item.id === versionId)!;
        const values = serviceFormValues(relation, answers, reviewedValues);
        validateMappedFieldValues(catalog.fields, mapping.placements, values);
        const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
        await expect(fillPdf(original, mapping.placements, values)).resolves.toBeInstanceOf(Uint8Array);
      }
    }
  }, 30_000);

  it('impede a impressão de texto excessivo em cada modelo mapeado', async () => {
    for (const mapping of catalog.mappings) {
      const version = catalog.versions.find((v) => v.id === mapping.formVersionId)!;
      const original = await readFile(resolve(process.cwd(), '..', version.templatePath!));
      const firstText = mapping.placements.find((p) =>
        p.kind === 'COORDINATES' && p.markWhen === undefined)!;
      await expect(fillPdf(original, [{ ...firstText, required: true }],
        { [firstText.fieldId]: 'NOME'.repeat(100) }))
        .rejects.toThrow(/excede|comprimento/);
    }
  }, 30_000);

});
