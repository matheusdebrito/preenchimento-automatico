import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { catalog } from '../modules/catalog/catalog.js';

const templateRoot = resolve(process.cwd(), 'templates');
const failures: string[] = [];

for (const version of catalog.versions) {
  if (version.status !== 'VERIFIED') continue;
  if (!version.templatePath || !version.sha256) {
    failures.push(version.id + ': metadados de template ausentes');
    continue;
  }

  const expectedPath = 'backend/templates/' + version.formId + '/' + version.revision + '/original.pdf';
  if (version.templatePath !== expectedPath) {
    failures.push(version.id + ': templatePath divergente');
    continue;
  }

  try {
    const bytes = await readFile(resolve(templateRoot, version.formId, version.revision, 'original.pdf'));
    const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    if (hash !== version.sha256.toUpperCase()) {
      failures.push(version.id + ': SHA-256 divergente');
    }
  } catch {
    failures.push(version.id + ': arquivo não encontrado');
  }
}

if (failures.length > 0) {
  throw new Error('Templates oficiais inconsistentes:\n' + failures.join('\n'));
}

console.log('Templates oficiais verificados: ' +
  catalog.versions.filter((version) => version.status === 'VERIFIED').length);
