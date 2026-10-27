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

  it('restringe a quantidade de jobs simultâneos e processos por usuário', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-quotas-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    await store.create('alice', 's');
    await store.create('alice', 's');
    await expect(store.create('alice', 's')).rejects.toThrow('Capacidade');
    await store.create('bob', 's');
    await expect(store.create('charlie', 's')).rejects.toThrow('Capacidade');
  });

  it('não permite uploads simultâneos ultrapassarem o controle do mesmo job', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-race-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const job = await store.create('alice', 's');
    const png = Buffer.alloc(40);
    Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
    png.write('IHDR',12);
    png.writeUInt32BE(20,16);
    png.writeUInt32BE(20,20);
    const outcomes = await Promise.allSettled([
      store.upload(job, 'one', png, 'image/png'),
      store.upload(job, 'two', png, 'image/png'),
    ]);
    expect(outcomes.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((entry) => entry.status === 'rejected')).toHaveLength(1);
    expect(job.files).toHaveLength(1);
  });

  it('não apaga documentos durante leitura ativa; renova o prazo ao final e apaga depois', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-lease-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const job = await store.create('alice', 'service');
    expect(store.beginOperation(job)).toBe(true);
    expect(store.beginOperation(job)).toBe(false);
    job.expiresAt = Date.now() - 1;
    await store.cleanup();
    await stat(store.directory(job));
    await expect(store.remove(job)).rejects.toThrow('ocupado');
    store.endOperation(job);
    expect(store.get(job.id, 'alice')).not.toBeNull();
    job.expiresAt = Date.now() - 1;
    await store.cleanup();
    await expect(stat(store.directory(job))).rejects.toThrow();
  });

  it('não ultrapassa o limite global com várias criações concorrentes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-create-race-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const results = await Promise.allSettled(
      Array.from({ length: 7 }, (_, i) => store.create('owner-' + i, 'service')),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(3);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(4);
  });


  it('recusa reenvio duplicado para o mesmo documento obrigatório', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-duplicate-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const job = await store.create('alice', 'service');
    const png = Buffer.alloc(40);
    Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
    png.write('IHDR', 12);
    png.writeUInt32BE(20, 16);
    png.writeUInt32BE(20, 20);
    await store.upload(job, 'identidade', png, 'image/png');
    await expect(store.upload(job, 'identidade', png, 'image/png')).rejects.toThrow('já enviado');
    expect(job.files).toHaveLength(1);
  });

});
