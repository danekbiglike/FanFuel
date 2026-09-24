DROP TABLE IF EXISTS creator_store_products;
DROP TABLE IF EXISTS creator_commerce;
DROP INDEX IF EXISTS products_format_idx;
DROP INDEX IF EXISTS products_search_idx;
DROP INDEX IF EXISTS products_variant_idx;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_commission_rates,
 DROP COLUMN IF EXISTS commission_configured, DROP COLUMN IF EXISTS storefront_bps,
 DROP COLUMN IF EXISTS promo_bps, DROP COLUMN IF EXISTS variant_key,
 DROP COLUMN IF EXISTS identity_json, DROP COLUMN IF EXISTS work_id;
DROP TABLE IF EXISTS catalog_works;
