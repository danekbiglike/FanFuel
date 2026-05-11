CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'requires_action', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  purpose text NOT NULL
    CHECK (purpose IN ('donation', 'order')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  provider text NOT NULL,
  provider_payment_id text NOT NULL,
  idempotency_key text,
  confirmation_url text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS payments_purpose_idx
  ON payments (purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS payments_idempotency_idx
  ON payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS donation_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_amount_minor bigint NOT NULL CHECK (target_amount_minor > 0),
  current_amount_minor bigint NOT NULL DEFAULT 0 CHECK (current_amount_minor >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS donation_goals_creator_idx
  ON donation_goals (creator_profile_id, status, sort_order, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER donation_goals_set_updated_at
  BEFORE UPDATE ON donation_goals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE RESTRICT,
  donation_goal_id uuid REFERENCES donation_goals(id) ON DELETE SET NULL,
  payment_id uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'payment_pending', 'paid', 'failed', 'refunded')),
  display_name text NOT NULL,
  message text NOT NULL DEFAULT '',
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  is_anonymous boolean NOT NULL DEFAULT false,
  idempotency_key text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS donations_idempotency_unique_idx
  ON donations (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_creator_status_idx
  ON donations (creator_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS donations_goal_idx
  ON donations (donation_goal_id, status);

CREATE TRIGGER donations_set_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS provider_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  headers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_body_hash text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS provider_webhooks_status_idx
  ON provider_webhooks (status, received_at DESC);

CREATE INDEX IF NOT EXISTS provider_webhooks_type_idx
  ON provider_webhooks (event_type, received_at DESC);

CREATE TABLE IF NOT EXISTS widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'donation_alert'
    CHECK (kind IN ('donation_alert')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'revoked')),
  name text NOT NULL DEFAULT 'OBS alert',
  token_hash text NOT NULL UNIQUE,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_rotated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS widgets_creator_idx
  ON widgets (creator_profile_id, status, created_at DESC);

CREATE TRIGGER widgets_set_updated_at
  BEFORE UPDATE ON widgets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  donation_id uuid REFERENCES donations(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idempotency_keys_created_idx
  ON idempotency_keys (created_at DESC);
