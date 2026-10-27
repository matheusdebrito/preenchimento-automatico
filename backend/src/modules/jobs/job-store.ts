import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { chmod, lstat, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join, parse } from 'node:path';
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
  createdAt: number;
  files: StoredDocument[];
  values: Record<string, string>;
  sourceNotes: Record<string, string>;
  outputs: Map<string, string>;
  stage: 'CREATED' | 'UPLOADED' | 'PROCESSING' | 'REVIEW' | 'GENERATING' | 'GENERATED';
  reviewConfirmed: boolean;
}

const TTL = 20 * 60_000;
const MAX_LIFETIME = 60 * 60_000;
const DOCUMENT_LIMIT = 12;
const MAX_ROOT_FILES = 3;
const MAX_USER_JOBS = 2;
const MAX_JOB_BYTES = 30 * 1024 * 1024;

export class JobStore {
  private readonly jobs = new Map<string, DocumentJob>();
  private readonly activeUploads = new Set<string>();
  private readonly activeJobs = new Set<string>();
  private readonly pendingCreates = new Map<string, string>();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly root = resolve(tmpdir(), 'preenchimento-automatico-jobs')) {
    const normalized = resolve(root);
    const prohibited = new Set([
      parse(normalized).root, resolve(tmpdir()), resolve(process.cwd()), resolve(process.cwd(), '..'),
    ]);
    if (prohibited.has(normalized) || normalized !== root) {
      throw new Error('Diretório temporário inseguro: configure uma pasta privada exclusiva.');
    }
    this.timer = setInterval(() => { void this.cleanup().catch(() => undefined); }, 60_000);
    this.timer.unref();
  }

  async create(userId: string, serviceId: string, answers: Readonly<Record<string, string>> = {}): Promise<DocumentJob> {
    await this.cleanup();
    const activeForUser = [...this.jobs.values()].filter((job) => job.userId === userId).length;
    const pendingForUser = [...this.pendingCreates.values()].filter((owner) => owner === userId).length;
    if (this.jobs.size + this.pendingCreates.size >= MAX_ROOT_FILES ||
      activeForUser + pendingForUser >= MAX_USER_JOBS) {
      throw new Error('Capacidade temporária de processamento atingida.');
    }
    const id = randomUUID();
    this.pendingCreates.set(id, userId);
    try {
      await mkdir(join(this.root, id), { recursive: true, mode: 0o700 });
      const createdAt = Date.now();
      const job: DocumentJob = {
        id, userId, serviceId, answers, createdAt, expiresAt: createdAt + TTL,
        files: [], values: {}, sourceNotes: {}, outputs: new Map(), stage: 'CREATED', reviewConfirmed: false,
      };
      this.jobs.set(id, job);
      return job;
    } finally {
      this.pendingCreates.delete(id);
    }
  }

  get(id: string, userId: string): DocumentJob | null {
    const job = this.jobs.get(id);
    if (!job || job.userId !== userId || job.expiresAt < Date.now()) return null;
    return job;
  }

  private refreshDeadline(job: DocumentJob): void {
    job.expiresAt = Math.min(Date.now() + TTL, job.createdAt + MAX_LIFETIME);
  }

  /**
   * Explicit, authenticated renewal. Never retain document content beyond the
   * absolute one-hour bound, even when the user repeatedly asks to extend.
   */
  renew(job: DocumentJob): number | null {
    if (this.jobs.get(job.id) !== job || job.expiresAt <= Date.now()) return null;
    this.refreshDeadline(job);
    return job.expiresAt > Date.now() ? job.expiresAt : null;
  }

  /** Prevent expiration/cancellation while a request reads or generates private files. */
  beginOperation(job: DocumentJob): boolean {
    if (this.jobs.get(job.id) !== job || job.expiresAt <= Date.now() ||
      this.activeJobs.has(job.id) || this.activeUploads.has(job.id)) return false;
    this.activeJobs.add(job.id);
    return true;
  }

  endOperation(job: DocumentJob): void {
    if (this.activeJobs.delete(job.id) && this.jobs.get(job.id) === job) {
      // The user can review/download the result after a potentially long OCR operation.
      this.refreshDeadline(job);
    }
  }

  async upload(job: DocumentJob, requirementId: string, bytes: Buffer, contentType: string): Promise<StoredDocument> {
    if (this.jobs.get(job.id) !== job || job.expiresAt <= Date.now()) {
      throw new Error('Processo expirado ou removido.');
    }
    // Serialise mutations per job: parallel requests must not bypass the byte/file quotas.
    if (this.activeUploads.has(job.id) || this.activeJobs.has(job.id)) {
      throw new Error('Processo ocupado.');
    }
    this.activeUploads.add(job.id);
    try {
      if (job.files.length >= DOCUMENT_LIMIT) throw new Error('Limite de documentos atingido.');
      if (job.files.some((file) => file.requirementId === requirementId)) {
        throw new Error('Documento já enviado para este requisito.');
      }
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
      this.refreshDeadline(job);
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
    const rootInfo = await lstat(this.root);
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
      throw new Error('Diretório temporário não pode ser um link simbólico.');
    }
    // Never leave uploaded images accessible to unrelated local users.
    await chmod(this.root, 0o700);
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (job.expiresAt > now || this.activeJobs.has(id) || this.activeUploads.has(id)) continue;
      this.jobs.delete(id);
      await rm(join(this.root, id), { recursive: true, force: true });
    }
    // Orphaned directories from interrupted processes are not reusable.
    const dirs = await readdir(this.root, { withFileTypes: true });
    for (const item of dirs) {
      if (!item.isDirectory() || !/^[0-9a-f-]{36}$/i.test(item.name) ||
        this.jobs.has(item.name) || this.pendingCreates.has(item.name)) continue;
      // Private ephemeral volume. New instance never recovers abandoned processes.
      await rm(join(this.root, item.name), { recursive: true, force: true });
    }
  }

  async remove(job: DocumentJob): Promise<void> {
    if (this.activeUploads.has(job.id) || this.activeJobs.has(job.id)) {
      throw new Error('Processo ocupado.');
    }
    this.jobs.delete(job.id);
    await rm(join(this.root, job.id), { recursive: true, force: true });
  }

  async close(): Promise<void> {
    clearInterval(this.timer);
    for (const id of this.jobs.keys()) await rm(join(this.root, id), { recursive: true, force: true });
    this.jobs.clear();
  }
}
