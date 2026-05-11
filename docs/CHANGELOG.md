# CHANGELOG.md

Все заметные изменения проекта фиксируются здесь.

Формат основан на Keep a Changelog, но записи ведутся на русском языке.

## [Unreleased]

### Added

- Создана документационная основа FanFuel.
- Добавлены `README.md`, `ROADMAP.md`, `AGENTS.md`.
- Добавлены продуктовые, архитектурные, доменные, API, платежные, i18n, deployment, security, testing и UX документы.
- Добавлены `SECRETS.template.md`, `.env.example`, `.gitignore`.
- Добавлен ADR-журнал и handoff-документ.
- Реализован `v0.0 Foundation`: npm workspaces, Next.js web skeleton, Vite admin/widget skeleton, shared packages `ui`, `i18n`, `sdk`, `types`.
- Добавлены Go-сервисы `api`, `ws`, `worker` с `/healthz`, `/readyz` и foundation endpoints.
- Добавлены Dockerfiles, `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.example.yml`.
- Добавлены PostgreSQL, Redis, MinIO, первая миграция `000001_foundation` и миграционные скрипты.
- Добавлен базовый GitHub Actions CI workflow.
- Реализован `v0.1 Auth + Profiles`: миграция `000002_auth_profiles`, пользователи, роли, профили, JWT/bcrypt auth, public creator page API и admin users API.
- Добавлены web страницы регистрации, входа, профиля и публичной страницы автора.
- Добавлена базовая admin users panel.
- Реализован `v0.2 Donate MVP`: миграция `000003_donate_mvp`, donation/payment/goals/widget schema, mock `PaymentProvider`, idempotent donation API, mock callbacks, Redis realtime events и OBS WebSocket widget.
- Добавлены donation form, donation goals, публичная история донатов, топ донатеров и studio controls для goals/widget token.
- Добавлена дизайн-система FanFuel: `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/DESIGN_AUDIT.md`.
- Добавлены semantic theme tokens, базовые UI primitives и `ThemeSwitcher` в `packages/ui`.
- Добавлена миграция `000004_user_preferences` и API `/api/v1/me/preferences` для сохранения темы пользователя.
- Добавлена UI/UX planning система: `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`, `docs/UI_STATES.md`, `docs/UX_WRITING.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`.
- Зафиксированы текущие UI routes, статусы страниц, UX-долги, future/DO_NOT_BUILD_YET ограничения и workflow для UI/UX задач.
- Реализован `v0.3 Marketplace MVP`: миграция `000005_marketplace_mvp`, категории, товары, seller product CRUD, public marketplace/product API, order + mock safe deal lifecycle, buyer/seller order actions, reviews и admin product moderation.
- Добавлены web страницы `/marketplace`, `/marketplace/products/[slug]`, `/checkout/[productId]`, `/buyer`, `/buyer/orders/[id]`, `/seller`, `/seller/products`, `/seller/products/new`, `/seller/orders`.
- Добавлен практический рабочий маршрут в `README.md`, активный фокус в `docs/TASKS.md` и задача `FF-0307` для стабилизации Marketplace MVP проверками.
- Улучшен дизайн текущих страниц: role-entry блок на главной, доступная mobile topbar-навигация, более стабильные web/admin/widget surfaces и i18n для новых homepage строк.
- Добавлены ролевые публичные страницы `/for-buyers`, `/for-streamers`, `/for-sellers` с i18n и semantic tokens.

### Changed

- Статус roadmap `v0.0` обновлён до implemented.
- Статус roadmap `v0.1` обновлён до implemented.
- Статус roadmap `v0.2` обновлён до implemented.
- Go backend перешёл на `go 1.25.0`, Dockerfiles используют `golang:1.25-alpine`.
- Web/admin/widget больше не вызывают `getDictionary("ru")` напрямую, locale берётся из public env и общего i18n helper.
- Существующие web/admin/widget экраны переведены на light/dark темы через `data-theme` и semantic tokens.
- Главная, auth, профиль/studio, публичная страница автора, admin users panel и OBS widget визуально приведены к Creator OS / Marketplace Pro / Control Room направлению.
- `AGENTS.md` дополнен UI/UX workflow: какие документы читать перед интерфейсными задачами, как работать со статусами и что делать при расхождении кода с документацией.
- `docs/TASKS.md` дополнен разделом `UI/UX tasks`.
- Главная, профиль, публичная страница автора и admin app обновлены под текущую дизайн-систему: skeleton/empty/error states, role links, moderation tabs и подтверждения опасных действий.
- Mock payment callback теперь поддерживает `payment.purpose=order` и переводит order/deal в provider-agnostic статусы без real provider SDK.
- `README.md`, `ROADMAP.md` и `docs/TESTING.md` актуализированы под текущий статус `v0.3 Marketplace MVP / implemented locally` и ближайшие практические проверки перед `v0.4`.
- `docs/UX_IMPLEMENTATION_STATUS.md` и `docs/DESIGN_AUDIT.md` обновлены результатами practical page design pass.
- Корневой web route `/` теперь ведёт в marketplace; topbar стал auth-aware, а auth pages перенаправляют уже вошедшего пользователя в marketplace.
- Страница входа web стала компактнее и визуально ближе к narrow auth layout.
- Залогиненная web topbar получила marketplace search, compact actions и меню аккаунта с role-aware ссылками без fake balance/future route переходов.
- Залогиненная web topbar на mobile удерживает элементы в одну строку; меню аккаунта разделено на категории, theme/language открываются как overlay-dropdown, а `/me/settings` и `/studio` отмечены в плане как страницы "скоро".
- Гостевая web topbar получила поиск, burger/dropdown menu с входом, регистрацией, публичными разделами, темой и языком; пункт покупок для гостя не показывается.
- Web dev-сервер разрешает тестовый внешний host `danechka.com` для Next.js dev-ресурсов через `allowedDevOrigins`; дополнительные host задаются через `NEXT_ALLOWED_DEV_ORIGINS`.
- Topbar search теперь сокращает placeholder только при реальной нехватке ширины, кнопка поиска выровнена по inset-отступам, а form controls защищены от dev hydration overlay из-за внешних injected attributes.
- Topbar search стал единым control с высотой соседних кнопок и встроенной правой кнопкой submit по смыслу YouTube search.
- Web-клиент в браузере по умолчанию использует same-origin `/api/v1/*`; Next.js route proxy прокидывает запросы к Go API, чтобы мобильный внешний dev-домен не обращался к `localhost` телефона.

### Security

- Добавлены правила запрета реальных секретов в Git.
- Добавлены шаблоны для секретов и доступов.
- Добавлен npm override для `postcss` и проверка `npm audit --audit-level=moderate`.
- Зафиксирован ADR для JWT access token в `v0.1`; admin role не выдаётся через публичный role intent.
- Зафиксирован ADR для mock payment callback и Redis events в Donate MVP.
- Зафиксирован ADR для semantic tokens, `data-theme` и хранения user preferences.
- Зафиксирован ADR для mock safe deal в Marketplace MVP; risky categories остаются restricted до legal/payment review.

### Verification

- `v0.1` проверен локально и на Oracle VM `fanfuel`: build, migrations, healthchecks, auth smoke, public creator smoke, admin users smoke.
- `v0.2` проверен локально и на Oracle VM `fanfuel`: build, migrations, healthchecks, donation idempotency smoke, mock payment callback, goal progress update и WebSocket `donation.alert.created`.
- `v0.3` локально проверен командами `npm run typecheck --workspaces --if-present`, `npm run lint`, `npm run build --workspaces --if-present`, `npm run test --workspaces --if-present`, `cd services && go test ./...`; миграции применены к dev-БД, docker compose stack пересобран, smoke `GET /healthz`, `GET /api/v1/categories`, web/admin/widget HTTP 200.
- Guest topbar menu проверено локально: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, CDP smoke на `http://localhost:3002/marketplace` для 1440/390/320 с проверкой one-line topbar, compact placeholder, отсутствия пункта покупок и overlay-dropdown темы/языка.
- Внешний dev-домен проверен через CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1`: React-гидратация есть, dropdown открывается, поиск отображается, предупреждения `Blocked cross-origin request` в логе dev-сервера нет.
- Topbar search polish проверен через CDP smoke на `http://danechka.com:3002/marketplace` при viewport 390px: placeholder остаётся длинным, если помещается; top/right/bottom inset search button = 5px; dev overlay не найден.
