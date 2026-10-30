-- Administrative credit reasons and immutable audit trail.
ALTER TABLE credit_ledger
  DROP CONSTRAINT IF EXISTS credit_ledger_reason_check;

ALTER TABLE credit_ledger
  ADD CONSTRAINT credit_ledger_reason_check
  CHECK (reason IN ('test_grant','consume','refund','adjust','admin_grant','admin_reversal'));

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL
    CHECK (action IN ('CREDIT_GRANT','STATUS_CHANGE','ROLE_CHANGE')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON admin_audit_log(target_user_id, created_at DESC);
