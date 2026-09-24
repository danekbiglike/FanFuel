-- Перед rollback предложения из этих направлений нужно перевести в другой раздел.
DELETE FROM product_categories WHERE slug IN ('games', 'software', 'game-assets');
UPDATE product_categories SET sort_order = CASE slug
  WHEN 'obs-packs' THEN 10
  WHEN 'creator-assets' THEN 20
  WHEN 'design-assets' THEN 30
  WHEN 'coaching' THEN 40
  WHEN 'digital-services' THEN 50
  ELSE sort_order END
WHERE slug IN ('obs-packs', 'creator-assets', 'design-assets', 'coaching', 'digital-services');
