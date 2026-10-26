-- Initial persistent data: accounts, opaque sessions and append-only credit movements.
-- No names, CPF, boat identifiers, uploaded files, OCR output or generated PDFs.
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_normalized CHECK (email = lower(email))
);
CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_user_idx ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expiry_idx ON app_sessions(expires_at);
CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  reason text NOT NULL CHECK (reason IN ('test_grant','consume','refund','adjust')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS credit_ledger_user_idx ON credit_ledger(user_id,created_at DESC);
