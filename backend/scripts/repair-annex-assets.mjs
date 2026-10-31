import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const source101Url = 'https://www.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-101.pdf';
// Exact SHA-256 from the owner's official PDF: required since the government server's TLS chain can be incomplete.\n// The isolated one-time script permits that certificate failure ONLY with this pinned digest.
const expected101Hash = '74AF4D83C26A255B7C8EF9A12359F905AEF00488490D0347AD548CE0A24CD049';
const source211Url = 'https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf';
const expected211Hash = '71492859082A6786203619C859FCC99BC72C85128DC9FD27D32F93A92B09598C';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex').toUpperCase();
const specs = [
  { form: 'declaracao-extravio-aquaviario', id: 'declaracao-extravio-aquaviario-2026-v1', page: 179, source: 'normam101', catalogFile: 'backend/src/modules/catalog/aquaviario-services.ts' },
  { form: 'declaracao-residencia-aquaviario', id: 'declaracao-residencia-aquaviario-2026-v1', page: 181, source: 'normam101', catalogFile: 'backend/src/modules/catalog/aquaviario-services.ts' },
  { form: 'termo-responsabilidade-er', id: 'termo-responsabilidade-er-2026-v1', page: 210, source: 'normam211', catalogFile: 'backend/src/modules/catalog/vessel-services.ts' },
];
const tmp = await mkdtemp(join(tmpdir(), 'normam-repair-'));
try {
  let src101 = process.env.NORMAM101_SOURCE_PATH;
  if (!src101) {
    src101 = join(tmp, 'normam101.pdf');
    await run('curl', ['--fail', '--location', '--show-error', '--silent', '--insecure', '--retry', '2', '--output', src101, source101Url], { timeout: 90000 });
  }
  const file101 = await readFile(src101);
  if (digest(file101) !== expected101Hash) {
    throw new Error('NORMAM-101 diverge do PDF oficial previamente conferido: SHA-256 ' + digest(file101));
  }
  let src211 = process.env.NORMAM211_SOURCE_PATH;
  if (!src211) {
    src211 = join(tmp, 'normam211.pdf');
    await run('curl', ['--fail', '--location', '--show-error', '--silent', '--insecure',
      '--retry', '2', '--output', src211, source211Url], { timeout: 90000 });
  }
  if (digest(await readFile(src211)) !== expected211Hash) {
    throw new Error('NORMAM-211 PDF changed: expected owner-supplied SHA-256');
  }
  const files = new Map();
  for (const spec of specs) {
    const source = spec.source === 'normam101' ? src101 : src211;
    const prefix = join(tmp, spec.form);
    await run('pdftoppm', ['-f', String(spec.page), '-l', String(spec.page), '-r', '220', '-gray', '-png', '-singlefile', source, prefix], { timeout: 60000 });
    const image = await readFile(prefix + '.png');
    const pdf = await PDFDocument.create();
    const dimensions = [595.303955, 841.88977];
    const page = pdf.addPage(dimensions);
    const png = await pdf.embedPng(image);
    page.drawImage(png, { x: 0, y: 0, width: dimensions[0], height: dimensions[1] });
    const output = Buffer.from(await pdf.save({ useObjectStreams: false }));
    const outFile = resolve(root, 'backend/templates', spec.form, 'v1/original.pdf');
    await writeFile(outFile, output);
    files.set(spec.id, { file: spec.catalogFile, hash: digest(output), bytes: output.length });
    console.log(spec.id + ': ' + digest(output) + ' (' + output.length + ' bytes)');
  }
  for (const file of new Set(specs.map((spec) => spec.catalogFile))) {
    const path = resolve(root, file);
    let content = await readFile(path, 'utf8');
    for (const [id, update] of files) {
      if (update.file !== file) continue;
      const start = content.indexOf(`id: '${id}'`);
      if (start === -1) throw new Error('Missing catalog version ' + id);
      const tail = content.slice(start, start + 750);
      const match = tail.match(/sha256:\s*'([0-9a-fA-F]{64})'/);
      if (!match) throw new Error('Missing catalog hash for ' + id);
      content = content.slice(0, start) + tail.replace(match[0], `sha256: '${update.hash}'`) + content.slice(start + tail.length);
    }
    await writeFile(path, content);
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}
