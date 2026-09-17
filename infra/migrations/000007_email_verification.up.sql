CREATE TABLE IF NOT EXISTS email_verification_challenges (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  purpose text NOT NULL DEFAULT 'registration'
    CHECK (purpose IN ('registration')),
  locale text NOT NULL DEFAULT 'ru'
    CHECK (locale IN ('ru', 'en')),
  code_digest text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  expires_at timestamptz NOT NULL,
  resend_available_at timestamptz NOT NULL,
  verified_at timestamptz,
  completed_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_challenges_email_idx
  ON email_verification_challenges (lower(email), purpose, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS email_verification_challenges_active_unique_idx
  ON email_verification_challenges (lower(email), purpose)
  WHERE completed_at IS NULL AND invalidated_at IS NULL;

CREATE INDEX IF NOT EXISTS email_verification_challenges_expiry_idx
  ON email_verification_challenges (expires_at)
  WHERE completed_at IS NULL;

CREATE TRIGGER email_verification_challenges_set_updated_at
  BEFORE UPDATE ON email_verification_challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Аккаунты до UX-TASK-035 создавались без verification flow. Grandfathering
-- сохраняет доступ при rollout; все новые аккаунты создаются только после challenge.
UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL
  AND deleted_at IS NULL;
