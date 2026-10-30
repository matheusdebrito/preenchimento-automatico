-- Allow privileged maintenance commands to leave an explicit CLI audit trail.
ALTER TABLE admin_audit_log
  ALTER COLUMN admin_user_id DROP NOT NULL;

ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS actor_label text;

ALTER TABLE admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_actor_check;

ALTER TABLE admin_audit_log
  ADD CONSTRAINT admin_audit_log_actor_check
  CHECK (
    admin_user_id IS NOT NULL
    OR (actor_label IS NOT NULL AND length(trim(actor_label)) > 0)
  );
