-- Persist aggregate OpenAI usage per extraction operation for administrative metrics.
-- Never store prompts, document text, extracted values or file contents here.
CREATE TABLE IF NOT EXISTS openai_usage (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS openai_usage_created_idx
  ON openai_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS openai_usage_user_created_idx
  ON openai_usage(user_id, created_at DESC);
