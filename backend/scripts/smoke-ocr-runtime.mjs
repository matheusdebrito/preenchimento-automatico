// Run INSIDE the built API image. Only the bundled fictitious fixture is accepted.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { classifyDocument } from '../dist/modules/jobs/document-validator.js';
import { extractText, identityNameStage, suggestFields } from '../dist/modules/jobs/ocr.js';

assert.equal(process.argv.length, 2, 'This smoke test accepts no document arguments.');
const expectedSha = 'c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb';
const tessdata = process.env.TESSDATA_PREFIX ?? '/usr/share/tessdata';
const modelSha = createHash('sha256')
  .update(await readFile(join(tessdata, 'por.traineddata'))).digest('hex');
assert.equal(modelSha, expectedSha, 'Portuguese model differs from the validated model.');
const execFile = promisify(execFileCallback);
const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', LC_ALL: 'C',
  OMP_THREAD_LIMIT: '1', TESSDATA_PREFIX: tessdata };
const { stdout: version } = await execFile('tesseract', ['--version'],
  { timeout: 5000, maxBuffer: 16 * 1024, env });
const scratch = await mkdtemp(join(tmpdir(), 'ocr-runtime-smoke-'));
const results = [];
try {
  const original = join(scratch, 'synthetic.png');
  const bytes = await readFile(new URL('./fixtures/identity-synthetic.png', import.meta.url));
  assert.equal(classifyDocument(bytes, 'image/png'), 'png');
  await writeFile(original, bytes, { mode: 0o600, flag: 'wx' });
  for (const rotation of [0, 90]) {
    const image = rotation === 0 ? original : join(scratch, 'synthetic-sideways.png');
    if (rotation !== 0) {
      await execFile('convert', ['-limit', 'thread', '1', '-limit', 'memory', '192MiB',
        '-limit', 'map', '0', '-limit', 'disk', '0', 'png:' + original,
        '-rotate', String(rotation), '+repage', '-strip', 'png:' + image],
      { timeout: 10000, maxBuffer: 16 * 1024, env });
    }
    const imageBytes = await readFile(image);
    const kind = classifyDocument(imageBytes, 'image/png');
    const started = Date.now();
    const text = await extractText({ id: 'synthetic-' + rotation,
      requirementId: 'buyer-identity', path: image, kind,
      size: (await stat(image)).size }, scratch);
    const fields = suggestFields(text, 'buyer-identity');
    assert.equal(fields['person.fullName']?.value, 'MARIA DE SOUZA');
    assert.equal(fields['person.cpf']?.value, '123.456.789-09');
    assert.equal(fields['person.fullName']?.status, 'REVIEW_REQUIRED');
    assert.equal(fields['seller.fullName'], undefined);
    const nameStage = identityNameStage(text, 'buyer-identity', fields,
      new Set(['person.fullName', 'person.cpf']));
    assert.equal(nameStage, 'name_recognized');
    assert.equal((await readdir(scratch)).some((name) => name.startsWith('identity-')), false);
    results.push({ rotation, nameCorrect: true, cpfCorrect: true,
      nameStage, elapsedMs: Date.now() - started });
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
console.log('[OCR_RUNTIME_SMOKE]', JSON.stringify({
  tesseract: version.split(/\r?\n/)[0], model: 'tessdata_fast/4.1.0/por',
  modelSha256: modelSha, results,
  scope: 'Synthetic OCR core in built image; not user photo or browser E2E',
}, null, 2));
