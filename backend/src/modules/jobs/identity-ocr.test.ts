import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { parseIdentityTsv, selectSpatialIdentityName, resolveIdentityReadings,
  orientationFromOsd, readIdentityImage } from './identity-ocr.js';
import type { OcrCommand } from './identity-ocr.js';
import { suggestFields, identityNameStage } from './ocr.js';

const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
function fixture(entries: Array<[number, number, number, string, number?]>, scale = 1): string {
  return [header, `1\t1\t0\t0\t0\t0\t0\t0\t${2000 * scale}\t${1200 * scale}\t-1\t`,
    ...entries.map(([block, x, y, text, confidence = 94], i) =>
      [5, 1, block, 1, 1, i + 1, x * scale, y * scale,
        text.length * 14 * scale, 24 * scale, confidence, text].join('\t'))].join('\n');
}
const source = 'buyer-identity';
const nameKey = 'person.fullName';
const reading = (entries: Parameters<typeof fixture>[0], scale = 1) => parseIdentityTsv(fixture(entries, scale));
const select = (readings: ReturnType<typeof reading>[]) => selectSpatialIdentityName(readings, suggestFields, source);

// Fictional identities only. Never version a real photograph or OCR text.
describe('identity OCR spatial association', () => {
  for (const scale of [0.5, 1, 1.5, 2]) it(`uses relative geometry at scale ${scale}`, () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 1140, 120, 'CPF'],
      [3, 130, 150, 'MARIA'], [3, 230, 150, 'DE'], [3, 290, 150, 'SOUZA'],
      [4, 120, 400, 'FILIACAO'], [5, 130, 450, 'ANA DE SOUZA']], scale);
    assert.equal(select([a]), 'MARIA DE SOUZA');
  });
  it('combines a heading from sparse mode with the same spatial line in dense mode', () => {
    const sparse = reading([[1, 120, 90, 'NOME'], [2, 130, 150, 'MARIA'],
      [2, 230, 150, 'DE'], [2, 290, 150, 'S0UZA', 27], [3, 120, 500, 'CPF: 123.456.789-09']]);
    const dense = reading([[1, 130, 150, 'MARIA'], [1, 230, 150, 'DE'], [1, 290, 150, 'SOUZA']]);
    const output = resolveIdentityReadings([sparse, dense], suggestFields, source);
    assert.equal(suggestFields(output, source)[nameKey]?.value, 'MARIA DE SOUZA');
    assert.equal(suggestFields(output, source)['person.cpf']?.value, '123.456.789-09');
    assert.equal(suggestFields(output, source)[nameKey]?.status, 'REVIEW_REQUIRED');
    assert.equal(suggestFields(output, source)['seller.fullName'], undefined);
  });
  it('does not favour a low-confidence but plausible misspelled surname', () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 130, 150, 'MARIA'], [2, 230, 150, 'SOUZ', 26]]);
    const b = reading([[1, 130, 150, 'MARIA'], [1, 230, 150, 'SOUZA', 93]]);
    assert.equal(select([a, b]), 'MARIA SOUZA');
  });
  it('rejects disagreement between confident readings', () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 130, 150, 'MARIA SOUZA']]);
    const b = reading([[1, 130, 150, 'MARIA SANTOS']]);
    assert.equal(select([a, b]), null);
    const output = resolveIdentityReadings([a, b], suggestFields, source);
    assert.equal(suggestFields(output, source)[nameKey], undefined);
    assert.equal(identityNameStage(output, source, suggestFields(output, source), new Set([nameKey])),
      'label_seen_name_rejected');
  });
  it('never silently drops an uncertain middle name', () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 130, 150, 'MARIA'],
      [2, 230, 150, 'ALICE', 0], [2, 330, 150, 'SOUZA']]);
    assert.equal(a.lines[1]?.length, 3);
    assert.equal(select([a]), null);
  });
  it('rejects unlabelled names even in the old fixed-pixel region', () => {
    const a = reading([[1, 280, 400, 'CPF'], [2, 280, 620, 'MARIA DE SOUZA']]);
    assert.equal(select([a]), null);
    assert.equal(suggestFields(resolveIdentityReadings([a], suggestFields, source), source)[nameKey], undefined);
  });
  it('accepts explicit OCR label confusion, not parent/social labels', () => {
    assert.equal(select([reading([[1, 120, 90, 'N0ME'], [2, 130, 150, 'MARIA SOUZA']])]), 'MARIA SOUZA');
    for (const tail of ['DA MAE', 'DO PAI', 'SOCIAL', 'DA GENITORA']) {
      assert.equal(select([reading([[1, 120, 90, 'NOME'], [1, 190, 90, tail],
        [2, 130, 150, 'ANA SOUZA']])]), null);
    }
  });
  it('vetoes an incomplete heading when another reading identifies a parent label', () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 130, 150, 'ANA SOUZA']]);
    const b = reading([[1, 120, 90, 'NOME'], [1, 190, 90, 'DA MAE'], [2, 130, 150, 'ANA SOUZA']]);
    assert.equal(select([a, b]), null);
    assert.equal(suggestFields(resolveIdentityReadings([a, b], suggestFields, source), source)[nameKey], undefined);
  });
  it('does not skip filiation missing from the second reading', () => {
    const sparse = reading([[1, 120, 90, 'NOME'], [2, 120, 126, 'FILIACAO']]);
    const dense = reading([[1, 130, 165, 'ANA SOUZA']]);
    assert.equal(select([sparse, dense]), null);
  });
  it('rejects multiple holders and coordinates from different rasters', () => {
    const a = reading([[1, 120, 90, 'NOME'], [2, 130, 130, 'MARIA SOUZA'],
      [3, 120, 370, 'NOME'], [4, 130, 410, 'ANA SOUZA']]);
    assert.equal(select([a]), null);
    assert.equal(select([a, { ...a, width: 1000 }]), null);
  });
  it('handles inline names and ordinary surnames resembling heading prefixes', () => {
    const a = reading([[1, 120, 90, 'NOME:'], [1, 220, 90, 'GERALDO'],
      [1, 350, 90, 'DO'], [1, 410, 90, 'NASCIMENTO']]);
    assert.equal(select([a]), 'GERALDO DO NASCIMENTO');
    assert.equal(selectSpatialIdentityName([a], suggestFields, 'seller-identity'), 'GERALDO DO NASCIMENTO');
    assert.equal(selectSpatialIdentityName([a], suggestFields, 'tie'), null);
  });
  it('rejects malformed/oversized TSV and out-of-bounds words', () => {
    assert.deepEqual(parseIdentityTsv('not tsv').lines, []);
    assert.deepEqual(parseIdentityTsv('x'.repeat(256 * 1024 + 1)).lines, []);
    assert.deepEqual(parseIdentityTsv(fixture([[1, 120, 90, 'NOME']]) + '\n'.repeat(3001) + 'x').lines, []);
    assert.equal(select([reading([[1, 2100, 90, 'NOME'], [2, 130, 130, 'MARIA SOUZA']])]), null);
  });
  it('accepts only four orientation angles', () => {
    for (const value of [0, 90, 180, 270]) assert.equal(orientationFromOsd('Rotate: ' + value + '\n'), value);
    for (const value of ['45', '-90', '270; echo secret', '']) assert.equal(orientationFromOsd('Rotate: ' + value), null);
  });
});

describe('identity OCR process boundaries', () => {
  it('cleans temporary rasters after decoder failure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'identity-failure-'));
    try {
      const run: OcrCommand = async () => { throw new Error('decoder failed'); };
      await assert.rejects(readIdentityImage('/example.jpg', 'jpeg', source, root, suggestFields, run));
      assert.deepEqual(await readdir(root), []);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it('handles unavailable OSD, bounds commands and cleans on success', async () => {
    const root = await mkdtemp(join(tmpdir(), 'identity-fallback-'));
    let ocrCalls = 0;
    try {
      const run: OcrCommand = async (bin, args, timeout) => {
        assert.ok(timeout && timeout <= 15_000);
        assert.ok(['convert', 'tesseract'].includes(bin));
        if (bin === 'convert') {
          assert.ok(args.includes('-limit'));
          const out = args.at(-1)!;
          assert.ok(out.startsWith('png:'));
          await writeFile(out.slice(4), 'synthetic output');
          return '';
        }
        ocrCalls++;
        if (args.includes('osd')) throw new Error('too few characters');
        return fixture([[1, 120, 90, 'NOME'], [2, 130, 150, 'MARIA SOUZA']]);
      };
      const text = await readIdentityImage('/example.jpg', 'jpeg', source, root, suggestFields, run);
      assert.equal(suggestFields(text, source)[nameKey]?.value, 'MARIA SOUZA');
      assert.equal(ocrCalls, 3);
      assert.deepEqual(await readdir(root), []);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
