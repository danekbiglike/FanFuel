-- Локальный демонстрационный каталог FanFuel. Все пользователи и товары фиктивные.
-- Не запускать на публичном или production окружении.
BEGIN;

WITH seller_seed(email, display_name, description) AS (
  VALUES
    ('seed-northpixel@example.test', 'NorthPixel', 'Демонстрационная студия игровых ассетов.'),
    ('seed-mossysounds@example.test', 'Mossy Sounds', 'Демонстрационные звуковые паки.'),
    ('seed-limestudio@example.test', 'Lime Studio', 'Демонстрационные материалы для авторов.')
),
inserted_users AS (
  INSERT INTO users (email, password_hash, status, default_locale, time_zone)
  SELECT email, 'dev_seed_password_hash_not_for_login', 'active', 'ru', 'Europe/Moscow'
  FROM seller_seed
  ON CONFLICT DO NOTHING
  RETURNING id, email
),
seed_users AS (
  SELECT id, email FROM inserted_users
  UNION
  SELECT u.id, u.email FROM seller_seed s
  JOIN users u ON lower(u.email) = lower(s.email) AND u.deleted_at IS NULL
),
seller_rows AS (
  SELECT u.id, s.email, s.display_name, s.description
  FROM seller_seed s JOIN seed_users u ON lower(u.email) = lower(s.email)
),
inserted_roles AS (
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'seller' FROM seller_rows
  ON CONFLICT (user_id, role) DO NOTHING
  RETURNING user_id
),
upserted_profiles AS (
  INSERT INTO profiles (user_id, display_name, slug, bio)
  SELECT id, display_name, 'seed-' || lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')), description
  FROM seller_rows
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, updated_at = now()
  RETURNING user_id
)
INSERT INTO seller_profiles (user_id, seller_type, status, display_name, description, verification_status)
SELECT id, 'lite', 'active', display_name, description, 'approved' FROM seller_rows
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active', display_name = EXCLUDED.display_name, description = EXCLUDED.description,
  verification_status = 'approved', updated_at = now();

WITH product_seed(
  seller_email, category_slug, kind, title, slug, description, terms,
  price_amount_minor, delivery_type, cover_url, platform, license_name
) AS (
  VALUES
    ('seed-northpixel@example.test', 'game-assets', 'digital_asset', 'Лесной набор пиксель-арта', 'pixel-forest-assets', '24 тайловых спрайта, растения и детали для уютной 2D-игры.', 'Архив с PNG-тайлами и краткой памяткой по сборке сцены.', 49000, 'digital_file', '/products/demo/pixel-forest.svg', '2D game', 'personal use'),
    ('seed-northpixel@example.test', 'game-assets', 'digital_asset', 'Интерфейс для инди-RPG', 'indie-rpg-ui-kit', 'Панели, кнопки, рамки диалогов и иконки предметов в одном стиле.', 'Исходники SVG и PNG в нескольких размерах.', 79000, 'digital_file', '/products/demo/rpg-ui.svg', '2D game', 'personal use'),
    ('seed-mossysounds@example.test', 'game-assets', 'digital_asset', 'Звуки шагов и меню', 'game-foley-sound-pack', 'Небольшая библиотека атмосферных звуков для прототипа игры.', 'WAV-файлы и таблица с описанием дорожек.', 39000, 'digital_file', '/products/demo/foley-sounds.svg', 'game audio', 'personal use'),
    ('seed-northpixel@example.test', 'software', 'digital_asset', 'Материалы для Blender', 'blender-materials-kit', 'Набор авторских материалов и узлов для первых игровых сцен.', 'Файл проекта Blender и инструкция по подключению материалов.', 59000, 'digital_file', '/products/demo/blender-materials.svg', 'Blender', 'personal use'),
    ('seed-limestudio@example.test', 'obs-packs', 'obs_pack', 'Сцены OBS «Ночная смена»', 'night-shift-obs-scenes', 'Стартовая, пауза, эфир и экран завершения в тёмной палитре с лаймовыми акцентами.', 'Файлы сцен, шрифты с открытой лицензией и инструкция по настройке.', 99000, 'digital_file', '/products/demo/night-shift-obs.svg', 'OBS Studio', 'personal use'),
    ('seed-limestudio@example.test', 'design-assets', 'design_asset', 'Панели и аватар для канала', 'channel-panels-avatar-kit', 'Согласованный набор панелей, значков и рамки аватара для страницы автора.', 'PNG и редактируемые SVG-файлы.', 65000, 'digital_file', '/products/demo/channel-kit.svg', 'creator profile', 'personal use')
),
inserted_products AS (
  INSERT INTO products (
    seller_profile_id, category_id, kind, status, title, slug, description, terms,
    price_amount_minor, currency, delivery_type, affiliate_percent_bps, safe_deal_required,
    published_at, identity_json, variant_key, promo_bps, storefront_bps, commission_configured
  )
  SELECT
    sp.id, c.id, ps.kind, 'published', ps.title, ps.slug, ps.description, ps.terms,
    ps.price_amount_minor, 'RUB', ps.delivery_type, 500, true, now(),
    jsonb_build_object(
      'source', 'seller', 'external_id', 'seed:' || ps.slug, 'work_title', ps.title,
      'format', 'digital_file', 'platform', ps.platform, 'edition', 'single',
      'region', 'global', 'language', 'ru', 'duration_days', 0,
      'license', ps.license_name, 'bundle', 'single'
    ),
    '', 500, 1200, true
  FROM product_seed ps
  JOIN users u ON lower(u.email) = lower(ps.seller_email) AND u.deleted_at IS NULL
  JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'active'
  JOIN product_categories c ON c.slug = ps.category_slug AND c.status = 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM products existing
    WHERE existing.seller_profile_id = sp.id AND lower(existing.slug) = lower(ps.slug) AND existing.deleted_at IS NULL
  )
  RETURNING id, seller_profile_id, slug
),
all_products AS (
  SELECT id, seller_profile_id, slug FROM inserted_products
  UNION ALL
  SELECT p.id, p.seller_profile_id, p.slug
  FROM product_seed ps
  JOIN users u ON lower(u.email) = lower(ps.seller_email) AND u.deleted_at IS NULL
  JOIN seller_profiles sp ON sp.user_id = u.id
  JOIN products p ON p.seller_profile_id = sp.id AND lower(p.slug) = lower(ps.slug) AND p.deleted_at IS NULL
)
INSERT INTO product_media (product_id, kind, url, alt_text, visibility, sort_order)
SELECT p.id, 'image', ps.cover_url, ps.title, 'public', 0
FROM product_seed ps
JOIN users u ON lower(u.email) = lower(ps.seller_email) AND u.deleted_at IS NULL
JOIN seller_profiles sp ON sp.user_id = u.id
JOIN all_products p ON p.seller_profile_id = sp.id AND lower(p.slug) = lower(ps.slug)
WHERE NOT EXISTS (
  SELECT 1 FROM product_media pm WHERE pm.product_id = p.id AND pm.kind = 'image' AND pm.visibility = 'public'
);

COMMIT;
