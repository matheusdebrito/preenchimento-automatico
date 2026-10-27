-- Minimal job-billing lifecycle only. Never store PDF bytes, OCR or personal data.
-- This table distinguishes a billed package from one actually transmitted to the user.
CREATE TABLE IF NOT EXISTS job_credit_receipts (
  job_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'charged'
    CHECK (state IN ('charged', 'delivered', 'refunded')),
  expires_at timestamptz NOT NULL,
  charged_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  refunded_at timestamptz
);
CREATE INDEX IF NOT EXISTS job_credit_receipts_pending_idx
  ON job_credit_receipts (expires_at) WHERE state = 'charged';
