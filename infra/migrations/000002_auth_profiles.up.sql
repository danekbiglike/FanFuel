CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verified_at timestamptz,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'pending_verification', 'deleted')),
  default_locale text NOT NULL DEFAULT 'ru'
    CHECK (default_locale IN ('ru', 'en')),
  time_zone text NOT NULL DEFAULT 'Europe/Moscow',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS users_status_idx
  ON users (status);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL
    CHECK (role IN ('buyer', 'streamer', 'seller', 'admin', 'support', 'moderator')),
  granted_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_role_idx
  ON user_roles (role);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text NOT NULL,
  avatar_file_id uuid,
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (char_length(display_name) BETWEEN 2 AND 80),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_idx
  ON profiles (lower(slug))
  WHERE deleted_at IS NULL;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_locale text NOT NULL DEFAULT 'ru'
    CHECK (preferred_locale IN ('ru', 'en')),
  notification_settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER buyer_profiles_set_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  creator_slug text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  banner_file_id uuid,
  theme_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  donations_enabled boolean NOT NULL DEFAULT true,
  store_enabled boolean NOT NULL DEFAULT true,
  partner_disclosure_enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'hidden', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (creator_slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

CREATE UNIQUE INDEX IF NOT EXISTS creator_profiles_slug_unique_idx
  ON creator_profiles (lower(creator_slug));

CREATE INDEX IF NOT EXISTS creator_profiles_status_idx
  ON creator_profiles (status);

CREATE TRIGGER creator_profiles_set_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  seller_type text NOT NULL DEFAULT 'lite'
    CHECK (seller_type IN ('lite', 'pro')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'blocked', 'rejected')),
  display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  inn text,
  legal_name text,
  verification_status text NOT NULL DEFAULT 'not_started'
    CHECK (verification_status IN ('not_started', 'pending', 'approved', 'rejected', 'manual_review')),
  hold_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (char_length(display_name) BETWEEN 2 AND 120),
  CHECK (rating_avg >= 0 AND rating_avg <= 5),
  CHECK (rating_count >= 0)
);

CREATE INDEX IF NOT EXISTS seller_profiles_status_idx
  ON seller_profiles (status);

CREATE INDEX IF NOT EXISTS seller_profiles_type_idx
  ON seller_profiles (seller_type);

CREATE TRIGGER seller_profiles_set_updated_at
  BEFORE UPDATE ON seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  request_id text,
  ip_address inet,
  user_agent text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
  ON audit_logs (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON audit_logs (action, created_at DESC);
