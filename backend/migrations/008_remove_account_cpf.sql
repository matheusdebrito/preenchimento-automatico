-- Remove account-level CPF entirely, including pre-existing values.
-- Document CPF extracted during a job remains ephemeral and outside app_users.
-- Safe to replay because migrations are re-applied transactionally at startup.
DROP INDEX IF EXISTS app_users_cpf_unique_idx;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_cpf_digits_check;
ALTER TABLE app_users DROP COLUMN IF EXISTS cpf;
