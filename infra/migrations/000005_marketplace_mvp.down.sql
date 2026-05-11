ALTER TABLE idempotency_keys DROP COLUMN IF EXISTS order_id;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS deal_events;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_deal_id_fkey;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_media;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_categories;
