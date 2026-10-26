import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JobStore } from './job-store.js';

const stores: JobStore[] = [];
const directories: string[] = [];
afterEach(async () => {
  for (const store of stores.splice(0)) await store.close();
  for (const path of directories.splice(0)) await rm(path, { recursive: true, force: true });
});

describe('JobStore', () => {
  it('isola jobs por dono, não grava nomes de documentos e apaga ao encerrar', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-test-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const job = await store.create('user-a', 'service-a');
    expect(store.get(job.id, 'user-b')).toBeNull();
    const png = Buffer.alloc(40);
    Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
    png.write('IHDR', 12);
    png.writeUInt32BE(20, 16);
    png.writeUInt32BE(20, 20);
    const uploaded = await store.upload(job, 'identidade', png, 'image/png');
    expect(uploaded.path).not.toContain('identidade');
    await stat(uploaded.path);
    await store.remove(job);
    await expect(stat(uploaded.path)).rejects.toThrow();
  });
});
