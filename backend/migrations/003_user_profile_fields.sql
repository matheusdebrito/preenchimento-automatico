-- Extend account contact details without breaking existing users created before this migration.
-- New registrations enforce these fields in the application layer. Existing rows may remain null
-- until a future profile-completion flow is introduced.
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS cellphone varchar(13),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'app_users_status_check'
      AND conrelid = 'app_users'::regclass
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_status_check
      CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'app_users_role_check'
      AND conrelid = 'app_users'::regclass
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_role_check
      CHECK (role IN ('USER', 'ADMIN'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'app_users_cellphone_digits_check'
      AND conrelid = 'app_users'::regclass
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_cellphone_digits_check
      CHECK (cellphone IS NULL OR cellphone ~ '^[0-9]{11,13}$');
  END IF;
END $$;

