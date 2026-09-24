#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${1:-docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-fanfuel}"
POSTGRES_DB="${POSTGRES_DB:-fanfuel}"

docker compose -f "$COMPOSE_FILE" up -d postgres
docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 < infra/scripts/seed-demo-catalog.sql
