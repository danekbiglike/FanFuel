#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${1:-docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-fanfuel}"
POSTGRES_DB="${POSTGRES_DB:-fanfuel}"
MIGRATION_DIR="infra/migrations"

docker compose -f "$COMPOSE_FILE" up -d postgres

docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 \
  -c "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

for file in "$MIGRATION_DIR"/*.up.sql; do
  version="$(basename "$file" .up.sql)"
  applied="$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version';" | tr -d '[:space:]')"

  if [ "$applied" = "1" ]; then
    echo "migration $version already applied"
    continue
  fi

  echo "applying migration $version"
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 < "$file"
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (version) VALUES ('$version');"
done

