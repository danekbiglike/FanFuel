CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name_i18n_key text NOT NULL,
  description_i18n_key text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'hidden', 'restricted')),
  requires_legal_review boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

CREATE INDEX IF NOT EXISTS product_categories_status_idx
  ON product_categories (status, sort_order);

CREATE TRIGGER product_categories_set_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO product_categories (slug, name_i18n_key, description_i18n_key, status, requires_legal_review, sort_order)
VALUES
  ('obs-packs', 'marketplace.categories.obsPacks.name', 'marketplace.categories.obsPacks.description', 'active', false, 10),
  ('creator-assets', 'marketplace.categories.creatorAssets.name', 'marketplace.categories.creatorAssets.description', 'active', false, 20),
  ('design-assets', 'marketplace.categories.designAssets.name', 'marketplace.categories.designAssets.description', 'active', false, 30),
  ('coaching', 'marketplace.categories.coaching.name', 'marketplace.categories.coaching.description', 'active', false, 40),
  ('digital-services', 'marketplace.categories.digitalServices.name', 'marketplace.categories.digitalServices.description', 'active', false, 50),
  ('restricted-game-accounts', 'marketplace.categories.restrictedGameAccounts.name', 'marketplace.categories.restrictedGameAccounts.description', 'restricted', true, 100)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  kind text NOT NULL DEFAULT 'digital_asset'
    CHECK (kind IN ('digital_asset', 'obs_pack', 'design_asset', 'coaching', 'digital_service')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_moderation', 'published', 'rejected', 'hidden', 'archived')),
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  price_amount_minor bigint NOT NULL CHECK (price_amount_minor >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  delivery_type text NOT NULL DEFAULT 'manual'
    CHECK (delivery_type IN ('manual', 'digital_file', 'session')),
  affiliate_percent_bps integer NOT NULL DEFAULT 0
    CHECK (affiliate_percent_bps >= 0 AND affiliate_percent_bps <= 5000),
  safe_deal_required boolean NOT NULL DEFAULT true,
  moderation_note text NOT NULL DEFAULT '',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (char_length(title) BETWEEN 2 AND 140),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$')
);

CREATE UNIQUE INDEX IF NOT EXISTS products_seller_slug_unique_idx
  ON products (seller_profile_id, lower(slug))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS products_public_idx
  ON products (status, published_at DESC, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS products_seller_idx
  ON products (seller_profile_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS products_category_idx
  ON products (category_id, status, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'preview'
    CHECK (kind IN ('image', 'video', 'preview', 'digital_file', 'document')),
  url text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_media_product_idx
  ON product_media (product_id, sort_order);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_profile_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  deal_id uuid,
  payment_id uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'awaiting_payment', 'paid', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled', 'refunded', 'failed')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 20),
  gross_amount_minor bigint NOT NULL CHECK (gross_amount_minor >= 0),
  discount_amount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_amount_minor >= 0),
  total_amount_minor bigint NOT NULL CHECK (total_amount_minor >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  terms_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  creator_profile_id uuid REFERENCES creator_profiles(id) ON DELETE SET NULL,
  promo_code text NOT NULL DEFAULT '',
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_unique_idx
  ON orders (buyer_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_buyer_idx
  ON orders (buyer_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_seller_idx
  ON orders (seller_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_product_idx
  ON orders (product_id, created_at DESC);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'awaiting_payment', 'paid', 'held', 'seller_working', 'seller_submitted', 'buyer_confirmed', 'auto_confirmed', 'disputed', 'resolved_to_buyer', 'resolved_to_seller', 'refunded', 'completed', 'cancelled', 'failed')),
  gross_amount_minor bigint NOT NULL CHECK (gross_amount_minor >= 0),
  seller_amount_minor bigint NOT NULL DEFAULT 0 CHECK (seller_amount_minor >= 0),
  creator_amount_minor bigint NOT NULL DEFAULT 0 CHECK (creator_amount_minor >= 0),
  platform_fee_minor bigint NOT NULL DEFAULT 0 CHECK (platform_fee_minor >= 0),
  provider_fee_minor bigint NOT NULL DEFAULT 0 CHECK (provider_fee_minor >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  buyer_response_deadline_at timestamptz,
  seller_response_deadline_at timestamptz,
  auto_confirm_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders
  ADD CONSTRAINT orders_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS deals_status_idx
  ON deals (status, created_at DESC);

CREATE INDEX IF NOT EXISTS deals_auto_confirm_idx
  ON deals (auto_confirm_at)
  WHERE auto_confirm_at IS NOT NULL;

CREATE TRIGGER deals_set_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS deal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  from_status text NOT NULL DEFAULT '',
  to_status text NOT NULL DEFAULT '',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_events_deal_idx
  ON deal_events (deal_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_profile_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden', 'flagged', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx
  ON reviews (product_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_seller_idx
  ON reviews (seller_profile_id, status, created_at DESC);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
