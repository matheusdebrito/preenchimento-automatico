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
    const store = new JobStore(root, undefined, {maxOpenJobs: 3});
    stores.push(store);
    await store.create('alice', 's');
    await store.create('alice', 's');
    await expect(store.create('alice', 's')).rejects.toThrow('Capacidade');
    await store.create('bob', 's');
    await expect(store.create('charlie', 's')).rejects.toThrow('Capacidade');
  });

  it('limita operações pesadas sem bloquear a criação e a edição de novos processos', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-heavy-slots-'));
    directories.push(root);
    const store = new JobStore(root, undefined, {maxOpenJobs: 10, maxHeavyOperations: 2});
    stores.push(store);
    const [first, second, third] = await Promise.all([
      store.create('alice', 's'),
      store.create('bob', 's'),
      store.create('carol', 's'),
    ]);
    expect(store.beginHeavyOperation(first)).toBe('acquired');
    expect(store.beginHeavyOperation(first)).toBe('job_busy');
    expect(store.beginHeavyOperation(second)).toBe('acquired');
    expect(store.beginHeavyOperation(third)).toBe('at_capacity');
    expect(store.get(third.id, 'carol')).not.toBeNull();
    store.endOperation(first);
    expect(store.beginHeavyOperation(third)).toBe('acquired');
    // Releasing the same lease twice must not free another process's slot.
    store.endOperation(first);
    const fourth = await store.create('diana', 's');
    expect(store.beginHeavyOperation(fourth)).toBe('at_capacity');
    store.endOperation(second);
    store.endOperation(third);
    expect(store.beginHeavyOperation(fourth)).toBe('acquired');
    store.endOperation(fourth);
  });

  it('preserva cotas por usuário quando a capacidade global aumenta', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-job-user-quota-'));
    directories.push(root);
    const store = new JobStore(root, undefined, {maxOpenJobs: 100});
    stores.push(store);
    const outcomes = await Promise.allSettled([
      store.create('alice', 's'), store.create('alice', 's'), store.create('alice', 's'),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(2);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
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

  it('protege operações ativas sensíveis, mas permite cancelar OCR e apagar os arquivos', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-lease-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);

    const protectedJob = await store.create('alice', 'service');
    expect(store.beginOperation(protectedJob)).toBe(true);
    protectedJob.stage = 'GENERATING';
    await expect(store.remove(protectedJob)).rejects.toThrow('ocupado');
    store.endOperation(protectedJob);

    const ocrJob = await store.create('alice', 'service');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==',
      'base64',
    );
    const uploaded = await store.upload(ocrJob, 'source', png, 'image/png');
    expect(store.beginOperation(ocrJob)).toBe(true);
    ocrJob.stage = 'PROCESSING';
    await expect(store.remove(ocrJob)).resolves.toBeUndefined();
    expect(store.get(ocrJob.id, 'alice')).toBeNull();
    await expect(stat(uploaded.path)).rejects.toThrow();
    // The original OCR request may finish after cancellation; releasing its lease
    // must not recreate or renew the detached job.
    store.endOperation(ocrJob);
    expect(store.get(ocrJob.id, 'alice')).toBeNull();
  });

  it('não ultrapassa o limite global com várias criações concorrentes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-create-race-'));
    directories.push(root);
    const store = new JobStore(root);
    stores.push(store);
    const results = await Promise.allSettled(
      Array.from({ length: 101 }, (_, i) => store.create('owner-' + i, 'service')),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(100);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
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

  it('notifica uma única vez o vencimento de job após remover seus arquivos privados', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-expiry-'));
    directories.push(root);
    const expiredIds: string[] = [];
    const store = new JobStore(root, async (jobId) => {
      // Private files must already be gone when refund processing begins.
      await expect(stat(join(root, jobId))).rejects.toThrow();
      expiredIds.push(jobId);
    });
    stores.push(store);
    const job = await store.create('alice', 'service');
    job.expiresAt = Date.now() - 1;
    await store.cleanup();
    await store.cleanup();
    expect(expiredIds).toEqual([job.id]);
  });

  it('mantém a exclusão privada mesmo se o estorno estiver indisponível', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pa-jobs-expiry-db-offline-'));
    directories.push(root);
    const store = new JobStore(root, async () => {
      throw new Error('Banco temporariamente indisponível.');
    });
    stores.push(store);
    const job = await store.create('alice', 'service');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==',
      'base64',
    );
    const uploaded = await store.upload(job, 'source', png, 'image/png');
    job.expiresAt = Date.now() - 1;
    await expect(store.cleanup()).resolves.toBeUndefined();
    expect(store.get(job.id, 'alice')).toBeNull();
    await expect(stat(uploaded.path)).rejects.toThrow();
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
    await symlink(actual, linked, process.platform === 'win32' ? 'junction' : 'dir');
    const store = new JobStore(linked);
    stores.push(store);
    await expect(store.cleanup()).rejects.toThrow('link simbólico');
  });

});
