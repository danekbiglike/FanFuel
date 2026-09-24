CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_title_trgm_idx ON products USING gin(lower(title) gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX products_search_ru_idx ON products USING gin(to_tsvector('russian',title||' '||description));
