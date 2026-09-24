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

В Docker Compose web-контейнер ходит к Go API по внутреннему адресу `http://api:8080` через `FANFUEL_INTERNAL_API_BASE_URL`. При запуске `npm run dev:web` на хосте можно использовать значение из `.env.example`: `http://localhost:8080`.

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

Для локальной разработки есть идемпотентные seed scripts:

- `infra/scripts/seed-dev.sh`;
- `infra/scripts/seed-dev.ps1`.

После применения миграций они создают dev-only продавцов и опубликованные marketplace-товары через реальные таблицы `users`, `seller_profiles`, `product_categories` и `products`.

Запуск:

```bash
sh infra/scripts/seed-dev.sh docker-compose.yml
```

На Windows:

```powershell
.\infra\scripts\seed-dev.ps1 -ComposeFile docker-compose.yml
```

Текущий seed-набор:

- test seller lite/pro;
- active marketplace categories из миграции;
- published mock products для OBS-паков, дизайна, цифровых услуг и coaching.

Mock orders, disputes, payouts и реальные платёжные сценарии seed-скрипт не создаёт.

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

## Отдельная VM приложения — FF-0009

Для VM используется дополнительный override и сборка frontend без dev servers:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.vm.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.vm.yml up -d
sh infra/scripts/migrate.sh docker-compose.yml
```

Перед первым стартом создать `.env` на VM с уникальными секретами. После подключения edge в FF-0010 все `*_PORT`, включая web/API/WS/widget, задают `127.0.0.1:<port>`. Не публиковать базовый Compose с его wildcard bindings наружу.

nginx на VM приложения обращается к loopback upstream: web `3000`, API `8080`, WebSocket `8081` (путь `/ws/alerts`), widget `5173`. Виджет собран с base `/widget/`; nginx удаляет этот префикс при проксировании в widget container. Админка на loopback `3001` доступна через SSH tunnel. Edge принимает публичные TCP 80/443 и передаёт их на 80/443 VM приложения по Host/SNI. Адреса и ключи находятся в игнорируемом `docs/SERVER_ACCESS.md`.

Для публичной доступности недостаточно работающего edge и проброса портов на домашнем роутере. Если WAN роутера имеет частный адрес, входящие TCP 80/443 должен направлять вышестоящий NAT провайдера (услуга внешнего IP / Static NAT) либо провайдер должен выдать маршрутизируемый публичный WAN-адрес. DNS A-запись указывает на внешний адрес провайдера и сама по себе не создаёт входящий маршрут. Проверять публикацию нужно из независимой внешней сети; HTTPS 200 при прямом обращении к edge из LAN подтверждает только локальную цепочку. 24.09.2026 публичный доступ восстановлен после переподключения моста VirtualBox; обе VM снова видят роутер. Детали в `docs/HANDOFF.md`.

Для наблюдения за повторением сбоя Windows-задание `FanFuel - Monitor VM Bridge` каждые две минуты запускает `C:\ProgramData\FanFuel\monitor-vm-bridge.ps1` (исходник: `infra/scripts/monitor-vm-bridge.ps1`). Оно пишет `C:\ProgramData\FanFuel\vm-bridge-state.json`; конфигурация с локальными адресами и путями к ключам находится рядом в `vm-bridge-monitor.json` и не хранится в репозитории. Статусы: `healthy`, `degraded` после первой неудачи, `alert` после второй. Автоматизация Codex с ID `fanfuel` читает состояние раз в десять минут и уведомляет об изменениях. Монитор только наблюдает; ручное восстановление описано в `docs/HANDOFF.md`.

`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WIDGET_BASE_URL`, `VITE_API_BASE_URL` и `VITE_WS_BASE_URL` передаются также во время сборки. Изменение публичного домена требует повторной сборки frontend. До настройки отдельного nginx/TLS возможна проверка HTTP upstream, но браузерные обращения к публичному HTTPS API ещё не работают.

Для Docker ingress запускать от root:

```sh
sh infra/scripts/vm-firewall.sh <LAN_INTERFACE> <ALLOWED_SOURCE_CIDR>
```

На созданной VM эта команда закреплена в `fanfuel-firewall.service` после Docker; разрешённый источник сужен до edge. UFW разрешает 80/443 только от edge, SSH доступен через NAT forwarding Windows. В FF-0010 адрес приложения был закреплён на роутере по DHCP; после потери аренды 24.09.2026 интерфейс `enp0s8` переведён на статический `192.168.0.108/24`, маршрут через `192.168.0.1` с метрикой 100. `enp0s3` оставлен на NAT DHCP как независимый SSH-доступ. Конфигурация находится в `/etc/netplan/50-cloud-init.yaml`, исходный файл сохранён рядом с суффиксом `.before-20260924-dhcp-loss`. В `/etc/cloud/cloud.cfg.d/99-fanfuel-network.cfg` отключено только управление сетью со стороны cloud-init, чтобы оно не перезаписало netplan при перезагрузке. Резервирование адреса на роутере оставлено для защиты от конфликта.

В FF-0010 пользователь возобновил настройку edge и роутера. `infra/nginx/fanfuel.conf` остаётся HTTP bootstrap, а `infra/nginx/fanfuel-tls.conf` — итоговая конфигурация на VM приложения. Существующая TLS-маршрутизация LibreChat на edge сохранена.

### HTTPS и обновление сертификата — FF-0010

Сначала проверить извне `http://fanfuel.ru/.well-known/acme-challenge/<test-file>` из `/var/www/letsencrypt`. Затем на FanFuel VM из корня проекта:

```sh
sudo sh infra/scripts/enable-vm-tls.sh
sudo certbot renew --dry-run
```

Скрипт получает сертификат для `fanfuel.ru` и `www.fanfuel.ru`, включает TLS после успешной проверки nginx и устанавливает deploy hook для reload при обновлении. `certbot.timer` выполняет автоматическое продление. HTTP перенаправляется на HTTPS; ACME challenge остаётся доступным на HTTP. Admin API и mock callbacks закрыты на публичном nginx.

Edge использует TCP passthrough для HTTPS, поэтому сертификаты и certbot хранятся на VM приложения. Текущая схема не передаёт исходный IP клиента через TLS; rate limits на nginx приложения агрегируются по адресу edge. Если понадобится индивидуальное ограничение по IP, потребуется согласованное внедрение PROXY protocol или TLS termination на edge.

### Образ MinIO для VM

При запуске FF-0009 исходный `minio/minio:latest` вернул `pull access denied`. VM override использует доступный образ из `quay.io/minio/minio`, закреплённый по digest; общий dev Compose не изменён. Реестр указан в [официальной Docker-инструкции MinIO](https://github.com/minio/minio/blob/master/docs/docker/README.md). Storage остаётся на loopback. Перед публичным использованием storage отдельно проверить поддержку и обновления выбранной версии.

### Статическая тестовая главная Ойли — UX-TASK-044

`playground.fanfuel.ru` использует тот же публичный edge и FanFuel VM. Edge направляет Host/SNI на её порты 80/443. На VM приложения отдельный nginx vhost отдаёт статические файлы, без нового контейнера и прокси к Next.js. Источники конфигурации: `infra/nginx/fanfuel-playground-http.conf`, `infra/nginx/fanfuel-playground-tls.conf`, `infra/scripts/enable-playground-edge.sh`. Текущая сборка и инструкции разработки: `docs/PLAYGROUND.md`.

Когда входящий Static NAT провайдера недоступен, edge имеет отдельный HTTP-вход `http://<EDGE_LAN_IP>:8085/` только к статическому playground. Скрипт `infra/scripts/enable-playground-lan.sh` подставляет LAN-адреса в `infra/nginx/fanfuel-playground-lan.conf.template`, устанавливает server block, включает только его файл в nginx, проверяет конфигурацию и сохраняет резервную копию для отката. Порт привязан к LAN-адресу edge, ограничен домашней подсетью и не пробрасывается роутером; соединение edge → FanFuel VM идёт по HTTPS с проверкой сертификата. iPhone не смог открыть прямой адрес VM в Wi-Fi, поэтому фактический адрес для телефона — `http://<WINDOWS_LAN_IP>:8085/`. На Windows из корня репозитория должен работать `node infra/scripts/playground-lan-proxy.mjs <WINDOWS_LAN_IP> 8085 <EDGE_LAN_IP> 8085`. После перезагрузки Windows этот процесс нужно запустить снова. Не размещать на HTTP-входе авторизацию, API, платежи или личные данные. Публичные 80/443 и их маршруты не меняются.

Первичное включение: проверить A-запись `playground.fanfuel.ru`; разместить HTTP-конфигурацию в `/etc/nginx/sites-available/fanfuel-playground`, включить symlink в `sites-enabled`, выполнить `nginx -t` и reload. На edge выполнить `sudo sh enable-playground-edge.sh` из заранее скопированного файла. После публичной проверки HTTP-01 выпустить отдельный сертификат на FanFuel VM:

```sh
sudo certbot certonly --webroot -w /var/www/letsencrypt \
  --non-interactive --agree-tos --cert-name playground.fanfuel.ru \
  -d playground.fanfuel.ru
```

Собрать `npm run build:playground -w @fanfuel/pencil-engine`, передать **только** `packages/pencil-engine/dist-playground` в новый `/var/www/fanfuel-playground/releases/<id>`, проверить права чтения nginx. Сменить `/var/www/fanfuel-playground/current` атомарно на новый release, установить TLS-конфигурацию, затем `nginx -t` и reload. Проверить HTTPS 200, сертификат, HTML/JS/Worker, noindex/CSP, перетаскивание и настройки в браузере, отдельно `https://fanfuel.ru/`. `certbot.timer` и существующий deploy hook продлевают сертификат и перезагружают nginx. Контроль продления: `sudo certbot renew --dry-run --no-random-sleep-on-renew --cert-name playground.fanfuel.ru`. Откат страницы — вернуть symlink `current` на предыдущий release; при ошибке TLS-конфигурации восстановить HTTP-конфигурацию из `sites-available` и проверить nginx до reload.
