-- UX-TASK-042: широкие направления каталога, не отдельные категории для каждой игры.
-- Ключи, аккаунты и пополнения по-прежнему ограничены правилами формата и модерации.
INSERT INTO product_categories (slug, name_i18n_key, description_i18n_key, status, requires_legal_review, sort_order)
VALUES
  ('games', 'marketplace.categories.games.name', 'marketplace.categories.games.description', 'active', false, 10),
  ('software', 'marketplace.categories.software.name', 'marketplace.categories.software.description', 'active', false, 20),
  ('game-assets', 'marketplace.categories.gameAssets.name', 'marketplace.categories.gameAssets.description', 'active', false, 30)
ON CONFLICT (slug) DO NOTHING;

UPDATE product_categories SET sort_order = CASE slug
  WHEN 'design-assets' THEN 40
  WHEN 'digital-services' THEN 50
  WHEN 'creator-assets' THEN 60
  WHEN 'obs-packs' THEN 70
  WHEN 'coaching' THEN 80
  ELSE sort_order END
WHERE slug IN ('design-assets', 'digital-services', 'creator-assets', 'obs-packs', 'coaching');
