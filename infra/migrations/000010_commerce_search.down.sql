DROP INDEX IF EXISTS products_search_ru_idx;
DROP INDEX IF EXISTS products_title_trgm_idx;
-- Общий pg_trgm не удаляем: его могут использовать другие модули.
