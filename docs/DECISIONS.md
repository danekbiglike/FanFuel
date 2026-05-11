# DECISIONS.md

ADR-журнал FanFuel. Новые решения, влияющие на масштабируемость, безопасность или деньги, добавлять сюда.

## ADR-0001: Monorepo

Дата: 2026-05-08  
Статус: accepted

### Контекст

FanFuel включает web, admin, OBS widgets, Go services, shared UI, SDK, i18n и types.

### Решение

Использовать monorepo со структурой `apps`, `services`, `packages`, `infra`, `docs`.

### Последствия

Проще синхронизировать типы, UI и документацию. Нужна дисциплина ownership и CI.

### Альтернативы

Отдельные репозитории для web/backend/widgets.

### Связанные документы

- `README.md`
- `docs/ARCHITECTURE.md`

## ADR-0002: Next.js для web

Дата: 2026-05-08  
Статус: accepted

### Контекст

Нужны публичные страницы, SEO, dashboards и хороший mobile responsive UX.

### Решение

Использовать Next.js + React + TypeScript для `apps/web`.

### Последствия

Хорошая основа для публичных страниц и кабинетов. Нужно следить за i18n и API boundary.

### Альтернативы

Vite SPA, Remix, отдельный SSR backend.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/UX_PLAN.md`

## ADR-0003: Vite для OBS widgets

Дата: 2026-05-08  
Статус: accepted

### Контекст

OBS/browser source виджеты должны быть лёгкими, независимыми и быстрыми.

### Решение

Использовать Vite + React + TypeScript для `apps/widget`.

### Последствия

Виджеты не зависят от тяжёлого web app. Нужна отдельная сборка и event SDK.

### Альтернативы

Next.js route inside web app, vanilla JS widgets.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0004: Go backend

Дата: 2026-05-08  
Статус: accepted

### Контекст

Нужны надёжные API, платежные интеграции, workers и WebSocket gateway.

### Решение

Использовать Go для backend services.

### Последствия

Производительность и простота деплоя. Нужна дисциплина package boundaries.

### Альтернативы

Node.js/NestJS, Python/FastAPI, JVM.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0005: Go WebSocket gateway

Дата: 2026-05-08  
Статус: accepted

### Контекст

OBS alerts и realtime notifications требуют устойчивого WebSocket слоя.

### Решение

Выделить `services/ws` на Go.

### Последствия

Можно масштабировать realtime отдельно от REST API. Нужно Redis pub/sub или streams.

### Альтернативы

WebSocket inside API, managed realtime provider.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/API_PLAN.md`

## ADR-0006: PostgreSQL

Дата: 2026-05-08  
Статус: accepted

### Контекст

Нужна надёжная транзакционная БД для users, orders, payments, deals, ledger и audit.

### Решение

Использовать PostgreSQL.

### Последствия

ACID, constraints, индексы и транзакции подходят для финансовой модели. Нужно проектировать миграции аккуратно.

### Альтернативы

MySQL, CockroachDB, managed document DB.

### Связанные документы

- `docs/DOMAIN_MODEL.md`

## ADR-0007: Redis

Дата: 2026-05-08  
Статус: accepted

### Контекст

Нужны cache, queues, realtime state и pub/sub.

### Решение

Использовать Redis на ранних этапах.

### Последствия

Быстрый старт для WS и workers. Позже можно выделить очередь, если Redis станет узким местом.

### Альтернативы

RabbitMQ, NATS, Kafka, Postgres-only queue.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0008: S3/R2-compatible storage

Дата: 2026-05-08  
Статус: accepted

### Контекст

Нужны аватары, баннеры, product media, digital files, dispute evidence и alert assets.

### Решение

Использовать S3/R2-compatible storage через abstraction.

### Последствия

Можно менять провайдера хранения. Нужны signed URLs, public/private buckets и access control.

### Альтернативы

Локальное файловое хранилище, vendor-specific storage SDK без abstraction.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`

## ADR-0009: Payment provider abstraction

Дата: 2026-05-08  
Статус: accepted

### Контекст

Провайдер платежей не выбран окончательно. Возможны tome.ru, ЮKassa/ЮMoney или другой оператор.

### Решение

Ввести `PaymentProvider`, `PayoutProvider`, `SafeDealProvider`, `FiscalizationProvider`, `ProviderWebhookHandler`.

### Последствия

Домен не привязан к одному провайдеру. Требуется status mapping, idempotency и adapter tests.

### Альтернативы

Прямая интеграция с одним провайдером.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/DOMAIN_MODEL.md`

## ADR-0010: Русскоязычный продукт с i18n

Дата: 2026-05-08  
Статус: accepted

### Контекст

Основной язык продукта — русский, но английский должен поддерживаться без переписывания UI.

### Решение

Default locale `ru`, supported locales `ru/en`, все пользовательские тексты через i18n.

### Последствия

Больше дисциплины в компонентах, но проще масштабировать продукт и избегать hardcoded strings.

### Альтернативы

Хардкод русского языка на MVP.

### Связанные документы

- `docs/I18N.md`

## ADR-0011: Docker-based deployment

Дата: 2026-05-08  
Статус: accepted

### Контекст

Целевой запуск — Linux VM/server. Нужны воспроизводимые dev, staging и production окружения.

### Решение

Использовать Docker + Docker Compose.

### Последствия

Проще запускать сервисы и зависимости. Нужна дисциплина секретов, healthchecks и backups.

### Альтернативы

Bare metal install, Kubernetes с первого дня, managed PaaS.

### Связанные документы

- `docs/DEPLOYMENT.md`

## ADR-0012: npm workspaces для frontend monorepo

Дата: 2026-05-08  
Статус: accepted

### Контекст

На локальной машине доступны Node.js и npm, но `pnpm` не установлен. Для `v0.0 Foundation` нужен воспроизводимый способ запускать `apps/*` и `packages/*` без дополнительной установки менеджера пакетов.

### Решение

Использовать npm workspaces и `package-lock.json` для frontend/package части monorepo.

### Последствия

Разработчик может выполнить `npm install`, `npm run typecheck`, `npm run lint`, `npm run build` сразу после checkout. Если команда позже решит перейти на pnpm, это нужно оформить отдельным ADR и обновить lockfile/scripts.

### Альтернативы

pnpm workspaces, Yarn workspaces, Turborepo с отдельным package manager.

### Связанные документы

- `README.md`
- `docs/DEPLOYMENT.md`

## ADR-0013: JWT access token для v0.1 Auth

Дата: 2026-05-08  
Статус: accepted

### Контекст

Для `v0.1 Auth + Profiles` нужен быстрый и проверяемый способ авторизовать web/admin запросы. Cookie/session и refresh rotation требуют отдельной проработки CSRF, invalidation и device/session management.

### Решение

Использовать JWT access token в `Authorization: Bearer <token>` с HS256, `JWT_SECRET`, `ACCESS_TOKEN_TTL_MINUTES` и bcrypt password hashing. Public API регистрации принимает только `buyer`, `streamer`, `seller`; роль `admin` через публичный role intent не выдаётся. Dev bootstrap admin разрешён только вне production через `ADMIN_BOOTSTRAP_EMAIL`, если admin role ещё отсутствует.

### Последствия

`v0.1` можно тестировать через web/admin UI и REST API без cookie/session слоя. Logout на этом этапе клиентский/stateless, поэтому для production нужен следующий ADR по refresh token, session invalidation и secure cookie strategy.

### Альтернативы

Server-side sessions, JWT access + refresh сразу, OAuth-first подход.

### Связанные документы

- `docs/SECURITY.md`
- `docs/API_PLAN.md`
- `docs/TASKS.md`

## ADR-0014: Mock payment callback и Redis events для Donate MVP

Дата: 2026-05-09  
Статус: accepted

### Контекст

`v0.2 Donate MVP` должен дать проверяемый поток доната без подключения реального платёжного провайдера. Донат влияет на деньги, публичную историю, цели сбора и OBS realtime alerts.

### Решение

Для `v0.2` использовать mock `PaymentProvider`: `POST /donations` создаёт `Payment` в status `pending`, а dev-only mock callback переводит payment/donation в success или failure. Callback сохраняется в `provider_webhooks` и обрабатывается идемпотентно. После успешной оплаты API публикует provider-agnostic event envelope в Redis channels `creator:{creator_id}:alerts` и `creator:{creator_id}:goals`; `services/ws` валидирует read-only widget token по БД и пересылает события OBS widget.

### Последствия

Donate flow можно проверять локально и на VM без real provider credentials. Домен не получает прямой зависимости от конкретного провайдера, но перед production нужны real provider adapter, подписи webhook, fiscalization review, refund flow и отдельное решение по token rotation grace period.

### Альтернативы

Сразу подключить real provider sandbox; завершать оплату синхронно в `POST /donations`; держать WebSocket внутри API.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/SECURITY.md`

## ADR-0015: Semantic tokens и `data-theme` для UI

Дата: 2026-05-09  
Статус: accepted

### Контекст

FanFuel должен поддерживать зрелый creator-commerce UI, light/dark темы, OBS widgets и будущие marketplace/dashboard сценарии. В `v0.2` цвета были зашиты в web/admin/widget CSS и не давали безопасно развивать дизайн.

### Решение

Использовать shared design system в `packages/ui`:

- semantic CSS variables для цветов, статусов, surface, borders, shadows;
- `data-theme="light|dark"` на `<html>`;
- `ThemePreference = "system" | "light" | "dark"`;
- guest choice хранить в localStorage/cookie;
- authenticated choice хранить в `user_preferences`;
- синхронизация через `/api/v1/me/preferences`;
- OBS widgets поддерживают URL override `?theme=system|light|dark|transparent`.

### Последствия

Все новые страницы должны использовать semantic tokens. Темизация применяется до React render через inline script, что снижает flash неправильной темы. Backend получает новую таблицу preferences, но платёжная логика и provider abstractions не меняются.

### Альтернативы

- `next-themes` только для web без admin/widget.
- Hardcoded light theme до marketplace.
- Tailwind-only palette без backend preferences.

### Связанные документы

- `docs/DESIGN_SYSTEM.md`
- `docs/THEMING.md`
- `docs/UI_RULES.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`

## ADR-0016: Mock safe deal для Marketplace MVP

Дата: 2026-05-09  
Статус: accepted

### Контекст

`v0.3 Marketplace MVP` должен дать проверяемый поток покупки товара без подключения реального провайдера, выплат, ledger и юридически финального safe deal. При этом нельзя смешивать `Order`, `Payment` и `Deal` статусы, потому что дальше это повлияет на деньги, споры и выплаты.

### Решение

Использовать provider-agnostic mock flow:

- `POST /orders` создаёт `Payment` с `purpose=order`, `Order` и `Deal`;
- mock callback переводит `Payment` в `succeeded`, `Order` в `paid`, `Deal` в `held`;
- seller actions переводят deal в `seller_working` и `seller_submitted`;
- buyer confirmation завершает mock lifecycle как `Order.completed` и `Deal.completed`;
- restricted/risky categories остаются seeded, но недоступны для seller product creation до legal/payment review;
- реальные payouts, refunds, disputes, fiscalization и ledger movements не создаются в `v0.3`.

### Последствия

Marketplace можно тестировать end-to-end локально: категории, товары, checkout, buyer/seller кабинеты, отзывы и admin moderation. Production money flow остаётся заблокированным до provider/legal review и ledger/payout задач.

### Альтернативы

Сразу подключить real provider sandbox; хранить только order status без отдельного deal; отложить весь marketplace до payout/ledger.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/TASKS.md`
