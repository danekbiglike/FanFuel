# FanFuel

FanFuel — creator-commerce платформа для стримеров, зрителей и продавцов цифровых товаров. Она объединяет донаты, OBS-алерты, витрины авторов, безопасные цифровые покупки, промокоды, партнёрские рекомендации и маркетплейс товаров для игрового и creator-сообщества.

Главная идея: зритель может не только задонатить, но и купить что-то полезное, одновременно поддержав любимого автора.

## Позиционирование

FanFuel — донаты, цифровые товары и поддержка любимых авторов в одной платформе.

Платформа строится вокруг мягкой монетизации:

- зритель получает понятную и безопасную покупку;
- стример получает больше способов поддержки без навязчивой рекламы;
- продавец получает продажи через доверие и релевантные витрины авторов;
- платформа честно показывает, какую часть покупки получает автор.

## Основные модули

- **FanFuel Donate** — донат-страницы, OBS-алерты, цели сборов, виджеты, история донатов и выплаты.
- **FanFuel Market** — маркетплейс цифровых товаров и услуг: OBS-паки, алерты, виджеты, дизайн-ассеты, игровые услуги, коучинг и creator assets.
- **FanFuel Creator Store** — личная витрина автора с собственными и партнёрскими товарами, промокодами и подборками.
- **FanFuel Partners** — партнёрские ссылки, промокоды, CPA-модель, аналитика переходов и продаж.
- **FanFuel SafeDeal** — безопасная сделка с холдом оплаты, подтверждением, авто-подтверждением, спорами и арбитражем.
- **FanFuel Studio** — кабинет стримера.
- **FanFuel Seller** — кабинет продавца.
- **FanFuel Buyer** — кабинет покупателя.
- **FanFuel Admin** — админка платформы, модерация, платежи, выплаты, споры, антифрод и аудит.

## Технический стек

- Frontend: Next.js + React + TypeScript.
- OBS widgets: Vite + React + TypeScript.
- Backend: Go.
- WebSocket gateway: Go.
- Database: PostgreSQL.
- Cache, queues, realtime state: Redis.
- Storage: S3/R2-compatible storage.
- Containers: Docker + Docker Compose.
- Deployment target: Linux VM/server.
- API: REST для базовых операций, WebSocket для realtime-событий.
- Auth: JWT access token для `v0.1`, password hashing через bcrypt, session/refresh слой оставлен для отдельного решения.
- i18n: `ru` по умолчанию, `en` как поддерживаемая локаль.

## Структура репозитория

```txt
/
  apps/
    web/                 # основной сайт на Next.js
    widget/              # лёгкие OBS/alert-виджеты на Vite + React
    admin/               # админка
    mobile-web/          # будущий PWA/mobile-first web app
  services/
    api/                 # Go API
    ws/                  # Go WebSocket gateway
    worker/              # Go workers для очередей, выплат, писем, фоновых задач
  packages/
    ui/                  # общий UI kit
    sdk/                 # клиентский SDK для виджетов и интеграций
    config/              # общие eslint/tsconfig/prettier configs
    types/               # общие TypeScript-типы
    i18n/                # словари и shared i18n helpers
  internal/
    docs-drafts/         # черновики внутренних документов
  infra/
    docker/
    nginx/
    migrations/
    scripts/
  docs/
  .github/
```

## Локальный запуск

Foundation-слой `v0.0` уже содержит Docker Compose, skeleton приложений, Go-сервисы, PostgreSQL, Redis, MinIO, healthchecks и первую миграцию. Блок `v0.1` добавляет регистрацию, вход, роли, профили, публичную страницу автора и базовую админку пользователей.

Полный dev stack:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Миграции:

```bash
sh infra/scripts/migrate.sh docker-compose.yml
```

На Windows:

```powershell
.\infra\scripts\migrate.ps1 -ComposeFile docker-compose.yml
```

Адреса:

- `apps/web`: `http://localhost:3000`
- `apps/admin`: `http://localhost:3001`
- `apps/widget`: `http://localhost:5173`
- `services/api`: `http://localhost:8080`
- `services/ws`: `ws://localhost:8081`
- `services/worker`: `http://localhost:8082`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Dev-admin создаётся безопасным bootstrap-подходом: публичная регистрация не принимает роль `admin`, но в `development` первый пользователь с `ADMIN_BOOTSTRAP_EMAIL` получает admin role, если админов ещё нет. В production этот shortcut отключён.

Проверки:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
cd services && go test ./...
```

## Документация

- [ROADMAP.md](ROADMAP.md)
- [docs/roadmap/README.md](docs/roadmap/README.md)
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md)
- [docs/API_PLAN.md](docs/API_PLAN.md)
- [docs/PAYMENTS.md](docs/PAYMENTS.md)
- [docs/I18N.md](docs/I18N.md)
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- [docs/THEMING.md](docs/THEMING.md)
- [docs/UI_RULES.md](docs/UI_RULES.md)
- [docs/UI_UX_TRACKER.md](docs/UI_UX_TRACKER.md)
- [docs/PAGE_MAP.md](docs/PAGE_MAP.md)
- [docs/PAGE_SPECS.md](docs/PAGE_SPECS.md)
- [docs/USER_FLOWS.md](docs/USER_FLOWS.md)
- [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md)
- [docs/UX_RULES.md](docs/UX_RULES.md)
- [docs/UI_STATES.md](docs/UI_STATES.md)
- [docs/UX_WRITING.md](docs/UX_WRITING.md)
- [docs/UX_IMPLEMENTATION_STATUS.md](docs/UX_IMPLEMENTATION_STATUS.md)
- [docs/DO_NOT_BUILD_YET.md](docs/DO_NOT_BUILD_YET.md)
- [docs/DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/TASKS.md](docs/TASKS.md)
- [docs/tasks/README.md](docs/tasks/README.md)
- [docs/UX_PLAN.md](docs/UX_PLAN.md)
- [docs/TESTING.md](docs/TESTING.md)
- [AGENTS.md](AGENTS.md)

## Быстрый рабочий маршрут

После обязательного чтения документов из `AGENTS.md` для большинства задач достаточно держать рядом короткий маршрут:

1. Проверить актуальный статус в `docs/HANDOFF.md`, `ROADMAP.md`, `docs/roadmap/current-focus.md` и верхнем блоке `docs/TASKS.md`.
2. Взять одну задачу из блока `Активный фокус` в `docs/TASKS.md` или `docs/tasks/active-focus.md`, затем открыть только её файл в `docs/tasks/.../<TASK-ID>.md`.
3. Для UI-задач дополнительно свериться с `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/UX_IMPLEMENTATION_STATUS.md` и `docs/DO_NOT_BUILD_YET.md`.
4. Для API, БД, платежей, выплат, safe deal и безопасности свериться с `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md` и `docs/SECURITY.md`.
5. После работы обновить `docs/HANDOFF.md`; если изменение заметно для проекта, обновить `docs/CHANGELOG.md`.

## Статус проекта

Текущий статус: `v0.3 Marketplace MVP / implemented locally`.

В репозитории подготовлена архитектурная и продуктовая документация, monorepo foundation, базовые приложения, Go-сервисы, Docker Compose, healthchecks, auth/profile миграции, Donate MVP с mock payment, donation goals, публичной историей донатов, топом донатеров и OBS alert через WebSocket. Локально реализован Marketplace MVP: категории, товары, seller product CRUD, marketplace/product pages, checkout, orders, mock safe deal lifecycle, buyer/seller dashboards, reviews и admin product moderation. Реальные платежи, выплаты, ledger, refunds, disputes, фискализация и production safe deal ещё не реализованы.

## Секреты и доступы

Реальные токены, IP, пароли, ключи и доступы нельзя хранить в Git.

Можно коммитить:

- `.env.example`
- `SECRETS.template.md`
- `docs/SERVER_ACCESS.template.md`

Нельзя коммитить:

- `.env`
- `.env.local`
- `.env.production`
- `SECRETS.md`
- `SERVER_ACCESS.md`
- `docs/SERVER_ACCESS.md`

Эти файлы добавлены в `.gitignore`.
