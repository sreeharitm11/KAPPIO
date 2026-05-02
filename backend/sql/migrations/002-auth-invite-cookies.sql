-- Run against your Postgres DB when using synchronize: false.
-- Safer onboarding: nullable password until invite is accepted.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_token ON users (invite_token)
  WHERE invite_token IS NOT NULL;
