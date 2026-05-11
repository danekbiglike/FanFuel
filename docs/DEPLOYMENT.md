# DEPLOYMENT.md

## Цель

Документ описывает запуск FanFuel локально, на Oracle VM/локальной Linux VM, staging и production Linux server. Foundation-слой `v0.0` уже содержит Docker Compose, skeleton приложений, Go-сервисы, PostgreSQL, Redis, MinIO и первую миграцию; `v0.1` добавляет auth/profile миграцию, JWT auth и первые web/admin сценарии; `v0.2` добавляет Donate MVP, mock payment и OBS WebSocket alert flow.

## Локальный запуск

Сценарий:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Ожидаемые сервисы:

- `web`: `http://localhost:3000`;
- `admin`: `http://localhost:3001`;
- `widget`: `http://localhost:5173`;
- `api`: `http://localhost:8080`;
- `ws`: `ws://localhost:8081`;
- `worker`: `http://localhost:8082`;
- `postgres`: `localhost:5432`;
- `redis`: `localhost:6379`;
- `minio`: `http://localhost:9000`;
- `minio console`: `http://localhost:9001`.

## Docker Compose

Файлы:

- `docker-compose.yml` — базовая общая конфигурация;
- `docker-compose.dev.yml` — dev overrides для web/admin/widget;
- `docker-compose.prod.example.yml` — пример production compose без секретов.

Контейнеры:

- `web`;
- `admin`;
- `widget`;
- `api`;
- `ws`;
- `worker`;
- `postgres`;
- `redis`;
- `minio`.

## Переменные окружения

Все переменные документируются в `.env.example`.

Для `v0.1` критичны:

- `JWT_SECRET`;
- `ACCESS_TOKEN_TTL_MINUTES`;
- `ADMIN_BOOTSTRAP_EMAIL`;
- `CORS_ALLOWED_ORIGINS`;
- `NEXT_PUBLIC_API_BASE_URL`;
- `VITE_API_BASE_URL`.

Для `v0.2` дополнительно важны:

- `NEXT_PUBLIC_WIDGET_BASE_URL`;
- `NEXT_PUBLIC_DEFAULT_CURRENCY`;
- `VITE_WS_BASE_URL`;
- `VITE_DEFAULT_CURRENCY`;
- `REDIS_ADDR`;
- `DATABASE_URL` для `services/ws`.

Запрещено коммитить:

- `.env`;
- `.env.local`;
- `.env.production`;
- `SECRETS.md`;
- `SERVER_ACCESS.md`;
- `docs/SERVER_ACCESS.md`.

## Миграции

Миграции хранятся в `infra/migrations`.

Команда Linux/macOS/VM:

```bash
sh infra/scripts/migrate.sh docker-compose.yml
```

Команда Windows:

```powershell
.\infra\scripts\migrate.ps1 -ComposeFile docker-compose.yml
```

В `v0.0-v0.2` используется простой SQL runner на базе `psql` и таблицы `schema_migrations`. На текущий момент ожидаются миграции `000001_foundation`, `000002_auth_profiles` и `000003_donate_mvp`. Перед production можно заменить runner на полноценный migration tool через отдельный ADR.

Правила:

- миграции append-only;
- нельзя редактировать применённые production миграции;
- down migration желательна для dev, но rollback production должен планироваться отдельно;
- финансовые таблицы изменять особенно осторожно;
- каждая новая сущность описывается в `docs/DOMAIN_MODEL.md`.

## Seed data

В `v0.0` добавлены placeholder scripts:

- `infra/scripts/seed-dev.sh`;
- `infra/scripts/seed-dev.ps1`.

Полные seed данные появятся после доменной схемы `v0.1-v0.3`.

Планируемые seed данные:

- admin user;
- test buyer;
- test creator;
- test seller lite;
- test seller pro;
- categories;
- products;
- donation goal;
- mock orders;
- mock disputes.

Seed не должен содержать реальные персональные данные.

## Проверки разработки

Frontend/package checks:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
```

Backend checks:

```bash
cd services
go test ./...
```

Smoke checks:

```bash
curl http://localhost:8080/healthz
curl http://localhost:8081/healthz
curl http://localhost:8082/healthz
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:5173
```

## Oracle VM / локальная Linux VM

Для локальной VM:

1. Не хранить реальные доступы в Git.
2. Заполнить локальный ignored-файл `docs/SERVER_ACCESS.md` на основе `docs/SERVER_ACCESS.template.md`.
3. Проверить SSH.
4. Перейти в папку проекта на VM.
5. Запустить compose.
6. Применить миграции.
7. Проверить health endpoints.

Пример:

```bash
cd ~/FanFuel
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
sh infra/scripts/migrate.sh docker-compose.yml
curl http://localhost:8080/healthz
```

## Linux VM setup

Минимальные требования для staging:

- Ubuntu/Debian-like Linux server;
- Docker Engine;
- Docker Compose plugin;
- nginx или reverse proxy container;
- firewall;
- SSH access by key;
- отдельный non-root user;
- backups storage.

План:

1. Создать пользователя приложения.
2. Настроить SSH key auth.
3. Установить Docker и Compose.
4. Настроить firewall.
5. Скопировать repository или настроить CI deploy.
6. Создать `.env` на сервере вручную из `.env.example`.
7. Запустить compose.
8. Применить миграции.
9. Проверить healthchecks.

## Staging

Staging должен быть максимально похож на production:

- отдельная БД;
- отдельный Redis;
- отдельные S3/R2 buckets;
- sandbox credentials платёжного провайдера;
- тестовые email/notification providers;
- ограниченный доступ админов.

Перед merge/release:

- миграции применяются на staging;
- smoke tests проходят;
- payment mock/provider sandbox проверен;
- rollback plan известен.

## Production outline

Production не запускается до:

- legal review;
- provider review;
- working backups;
- restore test;
- monitoring;
- security checklist;
- support workflow;
- admin access policy.

Production требования:

- TLS;
- secure cookies;
- secret management;
- separate production buckets;
- restricted SSH;
- audit logs;
- database backups;
- object storage backup/replication strategy;
- incident process.

## Healthchecks

Endpoints:

- `GET /healthz` — процесс жив;
- `GET /readyz` — зависимости доступны;
- `GET /metrics` — если будет Prometheus-compatible metrics.

Проверять:

- DB connection;
- Redis connection;
- migration state;
- storage connectivity;
- worker queue lag, если применимо.

## Logs

Правила:

- писать structured logs в stdout/stderr;
- добавлять `request_id`;
- не логировать секреты;
- не логировать raw card/payment sensitive data;
- provider webhooks хранить в БД безопасно, а не печатать полностью в logs.

## Backup PostgreSQL

Для staging/production:

- ежедневный logical dump;
- регулярный restore test;
- retention policy;
- шифрование backup;
- хранение отдельно от сервера.

Плановая команда:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

В production использовать более безопасный wrapper/script с датой, шифрованием и upload в backup storage.

## Backup S3/R2 metadata

Нужно различать:

- metadata в PostgreSQL;
- сами объекты в S3/R2.

Для private bucket:

- versioning, если доступно;
- lifecycle policy;
- retention для dispute evidence;
- backup/replication strategy.

## Restore

План восстановления должен проверяться до public beta:

1. Поднять чистое staging окружение.
2. Восстановить PostgreSQL dump.
3. Проверить миграции.
4. Проверить доступ к S3/R2 объектам.
5. Проверить auth, marketplace, donation, order flows.
6. Сверить финансовые агрегаты с ledger.

## Troubleshooting

### API не стартует

- проверить `.env`;
- проверить Postgres/Redis health;
- проверить миграции;
- проверить port conflicts.

### WebSocket не подключается

- проверить WS URL;
- проверить token;
- проверить nginx upgrade headers;
- проверить Redis pub/sub.

### Webhooks не обрабатываются

- проверить provider endpoint;
- проверить signature secret;
- проверить raw event in `provider_webhooks`;
- проверить worker logs;
- проверить idempotency conflict.

### Файлы не загружаются

- проверить signed upload URL;
- проверить bucket policy;
- проверить MIME/size limits;
- проверить CORS для S3/R2.

## Инструкции для системного администратора

- Не хранить реальные доступы в репозитории.
- Использовать `docs/SERVER_ACCESS.template.md` только как шаблон.
- Ограничить SSH доступ ключами.
- Обновлять систему и Docker.
- Проверять backups и restore.
- Не давать production DB доступ без причины.
- Ротировать секреты при смене сотрудников/агентов.

## Инструкции для ИИ-агента

- Перед DevOps задачей прочитать `AGENTS.md`, `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/PAYMENTS.md`.
- Не добавлять реальные IP/пароли/ключи.
- Не менять production outline без обновления docs.
- Все новые env vars добавлять в `.env.example` и `SECRETS.template.md`.
- После работы обновить `docs/HANDOFF.md` или `docs/CHANGELOG.md`.
