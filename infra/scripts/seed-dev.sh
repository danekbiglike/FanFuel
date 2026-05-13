#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${1:-docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-fanfuel}"
POSTGRES_DB="${POSTGRES_DB:-fanfuel}"

docker compose -f "$COMPOSE_FILE" up -d postgres

docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 <<'SQL'
WITH seller_seed(email, display_name, seller_type, rating_avg, rating_count, description) AS (
  VALUES
    ('seed-kiravisuals@example.test', 'KiraVisuals', 'pro', 4.90::numeric, 327, 'Dev seller for OBS packs and stream visuals.'),
    ('seed-streamfx@example.test', 'StreamFX', 'pro', 4.80::numeric, 214, 'Dev seller for alerts and stream packages.'),
    ('seed-pixelcraft@example.test', 'PixelCraft', 'lite', 4.70::numeric, 96, 'Dev seller for panels and creator assets.')
),
inserted_users AS (
  INSERT INTO users (email, password_hash, status, default_locale, time_zone)
  SELECT email, 'dev_seed_password_hash_not_for_login', 'active', 'ru', 'Europe/Moscow'
  FROM seller_seed
  ON CONFLICT DO NOTHING
  RETURNING id, email
),
seed_user_rows AS (
  SELECT id, email FROM inserted_users
  UNION
  SELECT u.id, u.email
  FROM seller_seed s
  JOIN users u ON lower(u.email) = lower(s.email) AND u.deleted_at IS NULL
),
seller_users AS (
  SELECT u.id, s.email, s.display_name, s.seller_type, s.rating_avg, s.rating_count, s.description
  FROM seller_seed s
  JOIN seed_user_rows u ON lower(u.email) = lower(s.email)
),
roles AS (
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'seller'
  FROM seller_users
  ON CONFLICT (user_id, role) DO NOTHING
  RETURNING 1
),
profiles_upsert AS (
  INSERT INTO profiles (user_id, display_name, slug, bio)
  SELECT
    id,
    display_name,
    'seed-' || lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')),
    description
  FROM seller_users
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        updated_at = now()
  RETURNING 1
),
sellers_upsert AS (
  INSERT INTO seller_profiles (
    user_id,
    seller_type,
    status,
    display_name,
    description,
    verification_status,
    rating_avg,
    rating_count
  )
  SELECT
    id,
    seller_type,
    'active',
    display_name,
    description,
    'approved',
    rating_avg,
    rating_count
  FROM seller_users
  ON CONFLICT (user_id) DO UPDATE
    SET seller_type = EXCLUDED.seller_type,
        status = EXCLUDED.status,
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        verification_status = EXCLUDED.verification_status,
        rating_avg = EXCLUDED.rating_avg,
        rating_count = EXCLUDED.rating_count,
        updated_at = now()
  RETURNING 1
)
SELECT count(*) AS seeded_sellers FROM seller_users;

WITH product_seed(
  seller_email,
  category_slug,
  kind,
  title,
  slug,
  description,
  terms,
  price_amount_minor,
  delivery_type,
  affiliate_percent_bps,
  published_offset_hours
) AS (
  VALUES
    ('seed-kiravisuals@example.test', 'obs-packs', 'obs_pack', 'Starter Stream Pack', 'starter-stream-pack', 'OBS overlays, alert screens, panels, and scenes for a clean first stream setup.', 'Digital files are provided through the order after mock payment confirmation.', 99000, 'digital_file', 1000, 2),
    ('seed-streamfx@example.test', 'obs-packs', 'obs_pack', 'Animated Alerts Pack', 'animated-alerts-pack', 'Animated alerts for donations, follows, subs, and marketplace purchases.', 'The seller delivers a download link and setup notes through the order.', 49000, 'digital_file', 800, 5),
    ('seed-pixelcraft@example.test', 'design-assets', 'design_asset', 'Dark Panels Collection', 'dark-panels-collection', 'Panel templates and profile blocks for dark creator pages.', 'Digital files are provided after order creation in the mock flow.', 35000, 'digital_file', 500, 8),
    ('seed-kiravisuals@example.test', 'design-assets', 'design_asset', 'Cyber Overlay Package', 'cyber-overlay-package', 'Overlay screens, intermission layout, and webcam frame for streamers.', 'Digital files are delivered after the seller confirms the order.', 79000, 'digital_file', 1200, 12),
    ('seed-streamfx@example.test', 'digital-services', 'digital_service', 'Discord Server Template', 'discord-server-template', 'A ready server structure for creator communities with channels and roles.', 'Manual handoff after the buyer provides server requirements.', 25000, 'manual', 700, 18),
    ('seed-pixelcraft@example.test', 'coaching', 'coaching', 'Stream Review Session', 'stream-review-session', 'One review session with notes on layout, alerts, and viewer flow.', 'Session time is agreed in the order chat; v0.3 uses mock safe deal.', 120000, 'session', 0, 24)
)
INSERT INTO products (
  seller_profile_id,
  category_id,
  kind,
  status,
  title,
  slug,
  description,
  terms,
  price_amount_minor,
  currency,
  delivery_type,
  affiliate_percent_bps,
  safe_deal_required,
  published_at
)
SELECT
  sp.id,
  c.id,
  ps.kind,
  'published',
  ps.title,
  ps.slug,
  ps.description,
  ps.terms,
  ps.price_amount_minor,
  'RUB',
  ps.delivery_type,
  ps.affiliate_percent_bps,
  true,
  now() - ((ps.published_offset_hours || ' hours')::interval)
FROM product_seed ps
JOIN users u ON lower(u.email) = lower(ps.seller_email) AND u.deleted_at IS NULL
JOIN seller_profiles sp ON sp.user_id = u.id
JOIN product_categories c ON c.slug = ps.category_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM products existing
  WHERE existing.seller_profile_id = sp.id
    AND lower(existing.slug) = lower(ps.slug)
    AND existing.deleted_at IS NULL
);
SQL
