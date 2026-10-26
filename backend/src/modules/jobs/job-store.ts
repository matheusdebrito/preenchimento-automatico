import { randomUUID } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { classifyDocument, validatePdfPages } from './document-validator.js';
import type { DocumentKind } from './document-validator.js';

export interface StoredDocument {
  id: string;
  requirementId: string;
  path: string;
  kind: DocumentKind;
}
export interface DocumentJob {
  id: string;
  userId: string;
  serviceId: string;
  expiresAt: number;
  files: StoredDocument[];
  values: Record<string, string>;
  sourceNotes: Record<string, string>;
  outputs: Map<string, string>;
  stage: 'CREATED' | 'UPLOADED' | 'REVIEW' | 'GENERATED';
}

const TTL = 20 * 60_000;
const DOCUMENT_LIMIT = 12;
const MAX_ROOT_FILES = 100;

export class JobStore {
  private readonly jobs = new Map<string, DocumentJob>();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly root = resolve(process.cwd(), '.temp-documents')) {
    this.timer = setInterval(() => { void this.cleanup().catch(() => undefined); }, 60_000);
    this.timer.unref();
  }

  async create(userId: string, serviceId: string): Promise<DocumentJob> {
    await this.cleanup();
    if (this.jobs.size >= MAX_ROOT_FILES) throw new Error('Limite temporário de processamento atingido.');
    const id = randomUUID();
    await mkdir(join(this.root, id), { recursive: true, mode: 0o700 });
    const job: DocumentJob = {
      id, userId, serviceId, expiresAt: Date.now() + TTL,
      files: [], values: {}, sourceNotes: {}, outputs: new Map(), stage: 'CREATED',
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
    if (job.files.length >= DOCUMENT_LIMIT) throw new Error('Limite de documentos atingido.');
    if (job.stage === 'GENERATED') throw new Error('Processo já finalizado.');
    const sizeSum = job.files.length * (10 * 1024 * 1024);
    if (sizeSum >= DOCUMENT_LIMIT * 10 * 1024 * 1024) throw new Error('Limite de uploads.');
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
    const doc = { id, requirementId, path, kind };
    job.files.push(doc);
    job.stage = 'UPLOADED';
    return doc;
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

  async close(): Promise<void> {
    clearInterval(this.timer);
    for (const id of this.jobs.keys()) await rm(join(this.root, id), { recursive: true, force: true });
    this.jobs.clear();
  }
}
