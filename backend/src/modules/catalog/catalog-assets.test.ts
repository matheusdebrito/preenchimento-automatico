import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('arquivos PDF versionados registrados no catálogo', () => {
  it('mantém cada PDF presente com assinatura e SHA-256 registrados', () => {
    for (const version of catalog.versions) {
      if (version.status === 'IDENTIFIED') {
        expect(version.templatePath, version.id).toBeNull();
        expect(version.sha256, version.id).toBeNull();
        continue;
      }
      expect(version.templatePath, version.id).not.toBeNull();
      expect(version.sha256, version.id).not.toBeNull();
      if (!version.templatePath) continue;

      const filePath = resolve(repositoryRoot, version.templatePath);
      expect(existsSync(filePath), version.id).toBe(true);

      const bytes = readFileSync(filePath);
      expect(bytes.subarray(0, 5).toString('latin1'), version.id).toBe('%PDF-');

      const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
      expect(hash, version.id).toBe(version.sha256);
    }
  });
});
