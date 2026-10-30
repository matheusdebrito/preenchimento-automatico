import { randomUUID } from 'node:crypto';
import type { Database } from '../auth/db.js';

export interface OpenAiUsageInput {
  userId: string;
  jobId: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export async function recordOpenAiUsage(
  pool: Database,
  usage: OpenAiUsageInput,
): Promise<void> {
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;

  if (![inputTokens, outputTokens, totalTokens].every(
    (value) => Number.isInteger(value) && value >= 0,
  )) {
    throw new Error('invalid_openai_usage');
  }

  await pool.query(
    `INSERT INTO openai_usage(
       id,user_id,job_id,model,input_tokens,output_tokens,total_tokens
     ) VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [
      randomUUID(),
      usage.userId,
      usage.jobId,
      usage.model,
      inputTokens,
      outputTokens,
      totalTokens,
    ],
  );
}
