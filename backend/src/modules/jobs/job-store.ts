import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { classifyDocument, validatePdfPages } from './document-validator.js';
import type { DocumentKind } from './document-validator.js';

export interface StoredDocument {
  id: string;
  requirementId: string;
  path: string;
  kind: DocumentKind;
  size: number;
}
export interface DocumentJob {
  id: string;
  userId: string;
  serviceId: string;
  answers: Readonly<Record<string, string>>;
  expiresAt: number;
  files: StoredDocument[];
  values: Record<string, string>;
  sourceNotes: Record<string, string>;
  outputs: Map<string, string>;
  stage: 'CREATED' | 'UPLOADED' | 'PROCESSING' | 'REVIEW' | 'GENERATING' | 'GENERATED';
  reviewConfirmed: boolean;
}

const TTL = 20 * 60_000;
const DOCUMENT_LIMIT = 12;
const MAX_ROOT_FILES = 3;
const MAX_USER_JOBS = 2;
const MAX_JOB_BYTES = 30 * 1024 * 1024;

export class JobStore {
  private readonly jobs = new Map<string, DocumentJob>();
  private readonly activeUploads = new Set<string>();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly root = resolve(tmpdir(), 'preenchimento-automatico-jobs')) {
    this.timer = setInterval(() => { void this.cleanup().catch(() => undefined); }, 60_000);
    this.timer.unref();
  }

  async create(userId: string, serviceId: string, answers: Readonly<Record<string, string>> = {}): Promise<DocumentJob> {
    await this.cleanup();
    if (this.jobs.size >= MAX_ROOT_FILES ||
      [...this.jobs.values()].filter((job) => job.userId === userId).length >= MAX_USER_JOBS) {
      throw new Error('Capacidade temporária de processamento atingida.');
    }
    const id = randomUUID();
    await mkdir(join(this.root, id), { recursive: true, mode: 0o700 });
    const job: DocumentJob = {
      id, userId, serviceId, answers, expiresAt: Date.now() + TTL,
      files: [], values: {}, sourceNotes: {}, outputs: new Map(), stage: 'CREATED', reviewConfirmed: false,
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string, userId: string): DocumentJob | null {
    const job = this.jobs.get(id);
    if (!job || job.userId !== userId || job.expiresAt < Date.now()) return null;
    return job;
  }

  async upload(job: DocumentJob, requirementId: string, bytes: Buffer, contentType: string): Promise<StoredDocument> {
    if (this.jobs.get(job.id) !== job || job.expiresAt <= Date.now()) {
      throw new Error('Processo expirado ou removido.');
    }
    // Serialise mutations per job: parallel requests must not bypass the byte/file quotas.
    if (this.activeUploads.has(job.id)) throw new Error('Outro upload está em andamento.');
    this.activeUploads.add(job.id);
    try {
      if (job.files.length >= DOCUMENT_LIMIT) throw new Error('Limite de documentos atingido.');
      if (job.stage !== 'CREATED' && job.stage !== 'UPLOADED') {
        throw new Error('Envio não permitido neste estágio.');
      }
      if (job.files.reduce((sum, doc) => sum + doc.size, 0) + bytes.length > MAX_JOB_BYTES) {
        throw new Error('Limite total de uploads de 30 MB excedido.');
      }
      const kind = classifyDocument(bytes, contentType);
      const id = randomUUID();
      const path = join(this.root, job.id, id + '.' + kind);
      await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
      try {
        if (kind === 'pdf') await validatePdfPages(path);
      } catch (error) {
        await rm(path, { force: true });
        throw error;
      }
      const doc = { id, requirementId, path, kind, size: bytes.length };
      job.files.push(doc);
      job.stage = 'UPLOADED';
      return doc;
    } finally {
      this.activeUploads.delete(job.id);
    }
  }

  directory(job: DocumentJob): string {
    return join(this.root, job.id);
  }

  async cleanup(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (job.expiresAt > now) continue;
      this.jobs.delete(id);
      await rm(join(this.root, id), { recursive: true, force: true });
    }
    // Orphaned directories from interrupted processes are not reusable.
    const dirs = await readdir(this.root, { withFileTypes: true });
    for (const item of dirs) {
      if (!item.isDirectory() || !/^[0-9a-f-]{36}$/i.test(item.name) || this.jobs.has(item.name)) continue;
      // Private ephemeral volume. New instance never recovers abandoned processes.
      await rm(join(this.root, item.name), { recursive: true, force: true });
    }
  }

  async remove(job: DocumentJob): Promise<void> {
    this.jobs.delete(job.id);
    await rm(join(this.root, job.id), { recursive: true, force: true });
  }

  async close(): Promise<void> {
    clearInterval(this.timer);
    for (const id of this.jobs.keys()) await rm(join(this.root, id), { recursive: true, force: true });
    this.jobs.clear();
  }
}
