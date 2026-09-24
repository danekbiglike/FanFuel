-- UX-TASK-041: новые настройки не меняют существующие заказы и начисления.
CREATE TABLE catalog_works (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_key text NOT NULL UNIQUE,
 title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ADD COLUMN work_id uuid REFERENCES catalog_works(id),
 ADD COLUMN identity_json jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN variant_key text NOT NULL DEFAULT '',
 ADD COLUMN promo_bps integer NOT NULL DEFAULT 0,
 ADD COLUMN storefront_bps integer NOT NULL DEFAULT 0,
 ADD COLUMN commission_configured boolean NOT NULL DEFAULT false,
 ADD CONSTRAINT products_commission_rates CHECK (
  (NOT commission_configured AND promo_bps=0 AND storefront_bps=0) OR
  (commission_configured AND promo_bps>0 AND storefront_bps>promo_bps AND storefront_bps<=5000)
 );
CREATE INDEX products_variant_idx ON products(variant_key,currency,price_amount_minor) WHERE status='published' AND deleted_at IS NULL AND variant_key<>'';
CREATE INDEX products_search_idx ON products USING gin(to_tsvector('simple',title||' '||description));
CREATE INDEX products_format_idx ON products((identity_json->>'format'),(identity_json->>'platform'),(identity_json->>'region')) WHERE deleted_at IS NULL;
CREATE TABLE creator_commerce (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 creator_profile_id uuid NOT NULL UNIQUE REFERENCES creator_profiles(id) ON DELETE CASCADE,
 storefront_enabled boolean NOT NULL DEFAULT false, promo_enabled boolean NOT NULL DEFAULT false,
 promo_code text UNIQUE CHECK(promo_code IS NULL OR promo_code ~ '^[A-Z0-9][A-Z0-9_-]{2,23}$'),
 design_json jsonb NOT NULL DEFAULT '{"banner":"lime","avatar":"oily","accent":"lime","layout":"grid","blocks":["products","about","donation"],"headline":"","about":"","donate_placement":"button"}'::jsonb,
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(NOT promo_enabled OR promo_code IS NOT NULL)
);
CREATE TABLE creator_store_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 creator_profile_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position>=0 AND position<100),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(creator_profile_id,product_id)
);
CREATE INDEX creator_store_products_order_idx ON creator_store_products(creator_profile_id,position);
CREATE TRIGGER creator_commerce_updated BEFORE UPDATE ON creator_commerce FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER catalog_works_updated BEFORE UPDATE ON catalog_works FOR EACH ROW EXECUTE FUNCTION set_updated_at();
