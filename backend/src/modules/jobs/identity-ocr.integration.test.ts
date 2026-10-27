import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'vitest';
import { extractText, suggestFields } from './ocr.js';

const execFile = promisify(execFileCallback);
const describeOcr = process.env.DATABASE_TEST_URL || process.env.OCR_INTEGRATION_TESTS === '1'
  ? describe : describe.skip;

async function syntheticImage(root: string, label = 'NOME'): Promise<string> {
  const path = join(root, 'synthetic.png');
  const lines = ['DOCUMENTO FICTICIO PARA TESTES', label, 'MARIA DE SOUZA',
    'FILIACAO', 'ANA DE SOUZA', 'CPF: 123.456.789-09'];
  const args = ['-size', '1600x1100', 'xc:white', '-fill', 'black',
    '-font', 'DejaVu-Sans', '-pointsize', '40'];
  lines.forEach((line, index) => args.push('-draw', `text 120,${120 + index * 120} '${line}'`));
  await execFile('convert', [...args, path], { timeout: 15_000 });
  return path;
}

// No real document image, OCR text or personal values in versioned fixtures.
describeOcr('identity OCR with real local Tesseract', () => {
  it('extracts name and CPF from all four right-angle orientations', async () => {
    const root = await mkdtemp(join(tmpdir(), 'identity-orientations-'));
    try {
      const original = await syntheticImage(root);
      for (const rotation of [0, 90, 180, 270]) {
        const image = join(root, 'input.png');
        await execFile('convert', [original, '-rotate', String(rotation), '+repage', image]);
        const text = await extractText({ id: 'synthetic', requirementId: 'buyer-identity',
          kind: 'png', path: image, size: (await stat(image)).size }, root);
        const fields = suggestFields(text, 'buyer-identity');
        assert.equal(fields['person.fullName']?.value, 'MARIA DE SOUZA');
        assert.equal(fields['person.cpf']?.value, '123.456.789-09');
        assert.equal(fields['person.fullName']?.status, 'REVIEW_REQUIRED');
        assert.equal(fields['seller.fullName'], undefined);
        assert.equal((await readdir(root)).some((name) => name.startsWith('identity-')), false);
      }
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 120_000);

  it('preserves seller/buyer roles on a smaller raster', async () => {
    const root = await mkdtemp(join(tmpdir(), 'identity-scale-'));
    try {
      const original = await syntheticImage(root);
      const image = join(root, 'smaller.png');
      await execFile('convert', [original, '-resize', '60%', image]);
      const text = await extractText({ id: 'synthetic', requirementId: 'seller-identity',
        kind: 'png', path: image, size: (await stat(image)).size }, root);
      const fields = suggestFields(text, 'seller-identity');
      assert.equal(fields['seller.fullName']?.value, 'MARIA DE SOUZA');
      assert.equal(fields['seller.cpf']?.value, '123.456.789-09');
      assert.equal(fields['person.fullName'], undefined);
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 60_000);

  it('does not assign a parent name to the holder', async () => {
    const root = await mkdtemp(join(tmpdir(), 'identity-parent-'));
    try {
      const image = await syntheticImage(root, 'NOME DA MAE');
      const text = await extractText({ id: 'synthetic', requirementId: 'buyer-identity',
        kind: 'png', path: image, size: (await stat(image)).size }, root);
      assert.equal(suggestFields(text, 'buyer-identity')['person.fullName'], undefined);
    } finally { await rm(root, { recursive: true, force: true }); }
  }, 60_000);
});
