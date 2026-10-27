import { mkdir, mkdtemp, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
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
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==', 'base64');
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
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==', 'base64');
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
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==', 'base64');
    await store.upload(job, 'identidade', png, 'image/png');
    await expect(store.upload(job, 'identidade', png, 'image/png')).rejects.toThrow('já enviado');
    expect(job.files).toHaveLength(1);
  });


  it('renova explicitamente até no máximo uma hora desde a criação', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-renew-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const job = await store.create('alice', 'service');
    const initial = job.expiresAt;
    expect(store.renew(job)).toBeGreaterThanOrEqual(initial);
    job.createdAt = Date.now() - 59 * 60_000;
    const capped = store.renew(job);
    expect(capped).toBeLessThanOrEqual(job.createdAt + 60 * 60_000);
    expect(capped).toBeGreaterThan(Date.now());
    job.createdAt = Date.now() - 61 * 60_000;
    expect(store.renew(job)).toBeNull();
    job.expiresAt = Date.now() - 1;
    expect(store.renew(job)).toBeNull();
  });

  it('limpa arquivos órfãos de um processo interrompido sem restaurar conteúdo privado', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-crash-'));
    directories.push(root);
    const orphan = join(root, randomUUID());
    await mkdir(orphan, { mode: 0o700 });
    await writeFile(join(orphan, 'sample.pdf'), Buffer.from('DOCUMENTO FICTICIO'));
    const store = new JobStore(root);
    stores.push(store);
    await store.cleanup();
    await expect(stat(orphan)).rejects.toThrow();
  });

  it('não permite acessar arquivos de uma pasta órfã como se fossem um job recuperável', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-orphan-auth-'));
    directories.push(root);
    const orphanId = randomUUID();
    const orphan = join(root, orphanId);
    await mkdir(orphan, { mode: 0o700 });
    const store = new JobStore(root);
    stores.push(store);
    expect(store.get(orphanId, 'alice')).toBeNull();
    await store.cleanup();
    await expect(stat(orphan)).rejects.toThrow();
  });

  it('recusa raiz genérica de temporários e não aceita symlink para documentos', async () => {
    expect(() => new JobStore(tmpdir())).toThrow('inseguro');
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-root-'));
    directories.push(root);
    const actual = join(root, 'actual');
    const linked = join(root, 'linked');
    await mkdir(actual);
    await symlink(actual, linked, 'dir');
    const store = new JobStore(linked);
    stores.push(store);
    await expect(store.cleanup()).rejects.toThrow('link simbólico');
  });

});
