# HANDOFF.md

Документ для передачи работы между агентами.

## Текущий статус

Статус: `v0.3 Marketplace MVP / implemented locally`.

Foundation, auth/profile слой, Donate MVP, Design System Foundation и Marketplace MVP подготовлены. `v0.3` проверен локально, миграции применены к dev-БД, docker compose stack пересобран и отвечает по web/admin/widget/API.

## Что уже сделано

- Создана структура monorepo.
- Созданы основные документы проекта.
- Зафиксирован roadmap `v0.0-v1.0`.
- Описаны продуктовые модули и MVP scope.
- Описана архитектура web/api/ws/worker/storage.
- Описана доменная модель.
- Описана payment provider abstraction.
- Описана i18n strategy.
- Описаны security, deployment и testing plans.
- Созданы правила для ИИ-агентов.
- Создан ADR-журнал.
- Добавлены npm workspaces и `package-lock.json`.
- Добавлены skeleton приложения `apps/web`, `apps/admin`, `apps/widget`.
- Добавлены shared packages `packages/ui`, `packages/i18n`, `packages/sdk`, `packages/types`.
- Добавлены Go-сервисы `services/api`, `services/ws`, `services/worker`.
- Добавлены healthchecks `/healthz` и `/readyz`.
- Добавлены Dockerfiles и Docker Compose.
- Добавлен базовый GitHub Actions CI outline.
- Добавлены PostgreSQL, Redis, MinIO.
- Добавлена миграция `000001_foundation`.
- Foundation stack поднят локально и на VM.
- Добавлена миграция `000002_auth_profiles`.
- Реализованы `users`, `user_roles`, `profiles`, `buyer_profiles`, `creator_profiles`, `seller_profiles`, `audit_logs`.
- Реализованы JWT/bcrypt auth endpoints, role guards и базовый rate limit для auth.
- Реализованы public profile/creator endpoints.
- Реализованы базовые admin users endpoints.
- Добавлены web страницы регистрации, входа, профиля и публичной страницы автора.
- Добавлена рабочая admin users panel.
- Добавлена миграция `000003_donate_mvp`.
- Реализованы `payments`, `donations`, `donation_goals`, `provider_webhooks`, `widgets`, `idempotency_keys`.
- Реализован `POST /api/v1/donations` с обязательным `Idempotency-Key`.
- Реализован mock `PaymentProvider` и dev-only mock callbacks success/fail.
- Реализована идемпотентная фиксация mock callbacks в `provider_webhooks`.
- Реализована публикация `donation.alert.created` и `donation.goal.updated` через Redis.
- Реализован WebSocket endpoint `/ws/alerts` с проверкой read-only widget token по БД.
- Реализована donation form на публичной странице автора.
- Добавлены donation goals, публичная история донатов и топ донатеров.
- Добавлены studio controls для создания goals и OBS widget token.
- Реализован OBS widget MVP с reconnect, heartbeat через WS gateway и event dedupe.
- Добавлена миграция `000005_marketplace_mvp`.
- Реализованы `product_categories`, `products`, `product_media`, `orders`, `deals`, `deal_events`, `reviews`.
- Реализованы marketplace endpoints: categories, public products/product, seller products, orders, buyer/seller order actions, reviews, admin product moderation.
- Mock `PaymentProvider` расширен на `payment.purpose=order`.
- Реализован mock safe deal lifecycle: `awaiting_payment` → `held` → `seller_working` → `seller_submitted` → `completed`.
- Добавлены web страницы marketplace/product/checkout/buyer/seller.
- Admin app получил product moderation queue и confirmation для admin actions.
- Предыдущие web/admin экраны обновлены под дизайн-систему через skeleton/empty/error states и semantic tokens.

## Что не сделано

- Upload avatar/banner flow `FF-0105`.
- Полная доменная схема PostgreSQL после Marketplace MVP.
- Полные i18n словари.
- Реальные payment providers.
- Refunds/payouts/fiscalization/disputes/ledger.
- CI pipeline.
- Полные тесты продуктовых сценариев.

## Известные проблемы

- Git-репозиторий в текущей папке не был инициализирован на момент создания документации.
- Платёжный провайдер не выбран.
- Юридическая модель не проверена.
- Restricted/risky категории marketplace требуют legal/payment review и остаются недоступными для seller product creation.
- На VM остались старые orphan containers `fanfuel-frontend` и `fanfuel-backend`; они не мешают текущему compose stack, но их можно убрать отдельной DevOps-задачей после подтверждения, что они больше не нужны.
- Mock callbacks dev-only и не заменяют provider webhook signature verification.
- Widget token rotation в `v0.2` сразу делает старый token недействительным; grace period не реализован.

## Следующие шаги

1. Инициализировать Git, если это нужно проекту.
2. Выполнить `FF-0307`: automated tests и browser smoke для Marketplace MVP.
3. Вынести Studio goals/widgets из `/me/profile` в отдельные `/studio/*` страницы.
4. Проверить mobile/light/dark текущих страниц по `UX-TASK-010`.
5. Решить, выполнять ли `FF-0105` до Creator Store или перенести в storage/file milestone.

## Важные решения

- Monorepo.
- Next.js для web.
- Vite для OBS widgets.
- Go для API/WS/worker.
- PostgreSQL для основной БД.
- Redis для cache/queues/realtime.
- S3/R2 для файлов.
- Payment provider abstraction mandatory.
- i18n mandatory.
- Docker-based deployment.
- JWT access token для `v0.1`, refresh/session слой требует отдельного ADR перед production.

## Ссылки на задачи

- `FF-0001`–`FF-0008`: Foundation.
- `FF-0101`–`FF-0104`, `FF-0106`: Auth + Profiles implemented.
- `FF-0105`: upload avatar/banner planned.
- `FF-0201`–`FF-0206`: Donate MVP implemented.
- `FF-0301`–`FF-0306`: Marketplace MVP implemented locally.
- `FF-0401`–`FF-0405`: Creator Store + Partners.
- `FF-0501`–`FF-0506`: Real Payment Provider Integration.
- `FF-0601`–`FF-0605`: Seller Balance + Payouts.
- `FF-0701`–`FF-0705`: Disputes + Arbitration.
- `FF-0801`–`FF-0805`: Anti-fraud + Verification.
- `FF-0901`–`FF-0904`: Mobile Web / PWA.
- `FF-1001`–`FF-1005`: Public Beta.

## Что нельзя ломать

- Документированные payment abstractions.
- Разделение `Order`, `Deal`, `Payment`, `Payout`, `BalanceTransaction`.
- i18n requirement.
- No secrets in Git.
- Safe deal statuses.
- Provider-agnostic statuses.
- Audit log requirements.
- Юридические пометки `LEGAL_REVIEW_REQUIRED`.

## Проверки v0.0

Локально:

- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `npm audit --audit-level=moderate` — успешно, 0 vulnerabilities.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1` — успешно, повторный запуск идемпотентен.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.

Oracle VM `FanFuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`.

## Проверки v0.1

Локально:

- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1` — успешно, `000002_auth_profiles` применена, повторный запуск идемпотентен.
- Auth smoke: register/login/me — успешно.
- Creator smoke: `GET /api/v1/creators/{creator_slug}` — успешно.
- Admin smoke: list users, block/activate user — успешно, `audit_logs` заполнен.
- `web/admin/widget` — HTTP 200.

Oracle VM `fanfuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно, повторный запуск идемпотентен.
- Auth smoke: register/login/me — успешно.
- Creator smoke: `GET /api/v1/creators/vm-streamer` — успешно.
- Admin smoke: `GET /api/v1/admin/users` — успешно.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`, `000002_auth_profiles`.

## Проверки v0.2

Локально:

- `npm install` — успешно.
- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `npm audit --audit-level=moderate` — успешно, 0 vulnerabilities.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1 -ComposeFile docker-compose.yml` — успешно, `000003_donate_mvp` применена.
- Smoke Donate MVP: register streamer, create goal, create widget token, connect WS, create donation, repeat same `Idempotency-Key`, complete mock payment, receive `donation.alert.created`, verify public donations and goal progress — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.

Oracle VM `fanfuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно, `000003_donate_mvp` применена.
- Smoke Donate MVP внутри web container: register streamer, create goal, create widget token, connect WS, create donation, repeat same `Idempotency-Key`, complete mock payment, receive `donation.alert.created`, verify public donations and goal progress — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`, `000002_auth_profiles`, `000003_donate_mvp`.

## Handoff-запись 2026-05-09

Дата: 2026-05-09  
Агент: Codex  
Задача: обновить проект до `v0.2 Donate MVP`, проверить предыдущие этапы и запустить локально/на VM.  
Изменённые файлы: `services/api`, `services/ws`, `services/internal/platform/events`, `infra/migrations`, `apps/web`, `apps/widget`, `packages/types`, `packages/i18n`, `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: реализован Donate MVP с mock payment, idempotency, goals, public history/top donors, OBS WebSocket alerts и widget token flow.  
Проверки: локальные Go/TS/lint/build/audit/compose/migration/smoke; VM compose/migration/smoke/health/http.  
Что не проверено: полноценный browser visual QA и реальные OBS/browser source настройки.  
Риски: mock provider dev-only; real provider, webhook signatures, refunds, payouts и fiscalization остаются planned; VM содержит старые orphan containers `fanfuel-frontend` и `fanfuel-backend`.  
Следующие шаги: добавить automated tests для Donate MVP и готовить `v0.3 Marketplace MVP`.  
Связанные TASK-ID: `FF-0201`, `FF-0202`, `FF-0203`, `FF-0204`, `FF-0205`, `FF-0206`.

## Handoff-запись 2026-05-09: Design System Foundation

Дата: 2026-05-09  
Агент: Codex  
Задача: внедрить дизайн-систему FanFuel, light/dark/system темы, ThemeSwitcher и user preferences для существующих `v0.2` экранов.  
Изменённые файлы: `packages/ui`, `packages/types`, `packages/i18n/locales`, `apps/web`, `apps/admin`, `apps/widget`, `services/api/internal/app`, `infra/migrations/000004_user_preferences.*.sql`, `README.md`, `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/DESIGN_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: добавлены semantic tokens для light/dark, shared UI primitives, `ThemeSwitcher`, `ThemeProvider`, ранний theme script, guest localStorage/cookie, backend sync через `GET/PATCH /api/v1/me/preferences`, таблица `user_preferences`, i18n ключи, обновлён UI главной/auth/profile/creator/admin/widget, добавлен widget URL override `?theme=system|light|dark|transparent`.  
Проверки: `gofmt`; `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `cd services && go test ./...`; `rg`-проверка hardcoded colors в apps показала отсутствие случайных hex/bg-white/text-black/text-white вне token layer; dev servers на `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173` отвечают HTTP 200.  
Что не проверено: миграция `000004_user_preferences` не применялась к живой dev БД в compose; не выполнялся browser screenshot QA light/dark/mobile; не выполнялся ручной authenticated preferences smoke через API/UI.  
Риски: ThemeSwitcher использует текстовые short icons `OS/LT/DK` до подключения icon library; marketplace/safe deal/checkout/payout pages ещё planned и покрыты документацией/patterns, но не реальными экранами; визуальный regression suite отсутствует.  
Следующие шаги: применить миграцию в dev/staging, провести ручную QA-проверку обеих тем и mobile, добавить component gallery/fixtures перед `v0.3 Marketplace MVP`.  
Связанные TASK-ID: `FF-0210`.

## Handoff-запись 2026-05-09: UI/UX planning system

Дата: 2026-05-09  
Агент: Codex  
Задача: подробно продумать UI/UX FanFuel, создать карту страниц, page specs, user flows, tracker статусов и запреты на преждевременную разработку без массовой реализации новых страниц.  
Изменённые файлы: `README.md`, `AGENTS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`, `docs/UI_STATES.md`, `docs/UX_WRITING.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`, `docs/DESIGN_AUDIT.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: создан UI/UX source of truth; зафиксированы текущие routes `/`, `/auth/login`, `/auth/register`, `/me/profile`, `/creators/[slug]`, admin users panel и OBS alert widget; всем текущим и будущим страницам проставлены статусы; описаны сценарии buyer/streamer/seller/admin; добавлен workflow для агентов; future/DO_NOT_BUILD_YET страницы вынесены отдельно.  
Проверки: `Test-Path` для всех новых UI/UX документов; `npm run typecheck --workspaces --if-present`; `npm run lint`.  
Что не проверено: browser screenshot QA, mobile visual QA, markdown formatting через Prettier, Go tests не запускались, потому что backend-код не менялся.  
Риски: `PAGE_SPECS.md` содержит подробные specs для текущих/ближайших страниц и краткие specs для future pages; перед реализацией future page нужно раскрывать spec до полного формата. Marketplace/safe deal/payout/dispute UI остаются заблокированными roadmap/domain/legal/payment зависимостями.  
Следующие шаги: выполнить `UX-TASK-004`–`UX-TASK-010`, начиная с разделения `/me/profile`, role-aware navigation, states и mobile QA.  
Связанные TASK-ID: `UX-TASK-001`, `UX-TASK-002`, `UX-TASK-003`, `UX-TASK-004`, `UX-TASK-005`, `UX-TASK-006`, `UX-TASK-007`, `UX-TASK-008`, `UX-TASK-009`, `UX-TASK-010`.

## Handoff-запись 2026-05-09: Marketplace MVP v0.3

Дата: 2026-05-09  
Агент: Codex  
Задача: сделать апдейт `v0.3 Marketplace MVP` и обновить дизайн прошлых экранов по системе.  
Изменённые файлы: `services/api/internal/app`, `infra/migrations/000005_marketplace_mvp.*.sql`, `apps/web`, `apps/admin`, `packages/types`, `packages/i18n/locales`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DESIGN_AUDIT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`, `ROADMAP.md`.  
Что сделано: реализованы категории, товары, seller product CRUD, public marketplace/product pages, checkout, orders, mock safe deal lifecycle, buyer/seller dashboards, reviews, admin product moderation; старые home/profile/creator/admin экраны получили обновлённые states/navigation по дизайн-системе.  
Проверки: `gofmt -w services/api/internal/app`; `cd services && go test ./...`; `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `rg`-проверка русских строк в UI-коде и случайных цветов вне token layer; `infra/scripts/migrate.ps1 -ComposeFile docker-compose.yml`; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build api web admin widget ws worker`; smoke `GET /healthz`, `GET /api/v1/categories`, web `/marketplace`, admin `/`, widget `/`.  
Что не проверено: ручной browser smoke полного buyer/seller/admin order flow и screenshot QA light/dark/mobile ещё не запускались.  
Риски: mock safe deal не является production escrow/hold; ledger/refunds/payouts/disputes/fiscalization не реализованы; product media пока placeholder без signed file access; `/me/profile` всё ещё содержит mini studio до отдельного выноса.  
Следующие шаги: применить миграцию в dev DB, сделать browser smoke buyer/seller/admin flows, добавить automated tests для order/safe deal transitions, продолжить `UX-TASK-007` через отдельные `/studio/*` страницы.  
Связанные TASK-ID: `FF-0301`, `FF-0302`, `FF-0303`, `FF-0304`, `FF-0305`, `FF-0306`, `UX-TASK-004`, `UX-TASK-005`, `UX-TASK-006`, `UX-TASK-007`, `UX-TASK-008`, `UX-TASK-009`.

## Handoff-запись 2026-05-10: Практический маршрут и активный фокус

Дата: 2026-05-10  
Агент: Codex  
Задача: сделать проектную документацию удобнее и практичнее для следующего шага после `v0.3`.  
Изменённые файлы: `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/TESTING.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: README обновлён до статуса `v0.3 Marketplace MVP / implemented locally`; добавлен быстрый рабочий маршрут; в roadmap добавлен текущий практический фокус перед `v0.4`; в `TASKS.md` добавлен блок `Активный фокус` и новая задача `FF-0307` на стабилизацию Marketplace MVP проверками; в `TESTING.md` добавлен быстрый набор проверок и smoke checklist для `v0.3`.  
Проверки: проверено наличие изменённых документов через `Test-Path`; выполнен поиск ключевых новых блоков через `Select-String` и `rg`; `npx prettier --check README.md ROADMAP.md docs/TASKS.md docs/TESTING.md docs/CHANGELOG.md docs/HANDOFF.md` — успешно.  
Что не проверено: markdown rendering/formatting через отдельный formatter; product/browser smoke не запускался, потому что production-код не менялся.  
Риски: `FF-0307` пока только документационная задача; automated tests и browser smoke ещё нужно выполнить отдельной реализацией.  
Следующие шаги: выполнить `FF-0307`, затем продолжить `UX-TASK-007`, `UX-TASK-010` и решение по `FF-0105`.  
Связанные TASK-ID: `FF-0307`, `UX-TASK-007`, `UX-TASK-010`, `FF-0105`.

## Handoff-запись 2026-05-10: Practical Page Design Pass

Дата: 2026-05-10  
Агент: Codex  
Задача: улучшить дизайн текущих страниц, не создавая future routes и не меняя доменную логику.  
Изменённые файлы: `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/admin/src/styles.css`, `apps/widget/src/styles.css`, `packages/ui/src/styles.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DESIGN_AUDIT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: добавлены быстрые входы по ролям на главной; mobile topbar web теперь сохраняет навигацию через горизонтальный scroll; улучшены surfaces, hover/focus states, карточки товаров, order rows, формы, сообщения, admin rows и OBS widget alert; новые строки добавлены в `ru/en` i18n.  
Проверки: `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `npx prettier --check` для изменённых UI/i18n/docs файлов; HTTP smoke текущего docker stack: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173` — 200.  
Что не проверено: Playwright/screenshot QA на 320/390/768/1440; ручная проверка всех страниц в light/dark; полный browser smoke buyer/seller/admin marketplace flow.  
Риски: изменения в основном CSS могут дать мелкие visual regressions на редких ширинах; нужен отдельный `UX-TASK-010` screenshot pass.  
Следующие шаги: провести mobile/light/dark screenshot QA, затем продолжить `UX-TASK-007` и `FF-0307`.  
Связанные TASK-ID: `UX-TASK-010`, `UX-TASK-007`, `FF-0307`.

## Handoff-запись 2026-05-11: Marketplace-first auth и публичные страницы ролей

Дата: 2026-05-11  
Агент: Codex  
Задача: сделать страницу входа компактнее и понятнее, исправить auth-состояние верхней панели, отправлять уже вошедшего пользователя из `/auth/login` в marketplace и сделать marketplace главной точкой входа.  
Изменённые файлы: `apps/web/src/lib/api.ts`, `apps/web/src/components/app-chrome.tsx`, `apps/web/src/components/public-landing.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/for-buyers/page.tsx`, `apps/web/src/app/for-streamers/page.tsx`, `apps/web/src/app/for-sellers/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: `/` теперь редиректит на `/marketplace`; login/register получили компактную форму, верхнее центрирование и редирект в marketplace при уже валидной сессии; `AppTopBar` синхронизирует token state через `getMe`, `storage` и `fanfuel-auth-changed`, скрывает login/register для вошедших и профиль для гостей; добавлены публичные страницы `/for-buyers`, `/for-streamers`, `/for-sellers`; marketplace получил блок преимуществ для покупателей; все новые UI-строки добавлены в `ru/en` i18n.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; HTTP smoke на свежем dev-сервере `http://localhost:3002`: `/` даёт `307` на `/marketplace`, `/marketplace`, `/for-buyers`, `/for-streamers`, `/for-sellers`, `/auth/login` отвечают `200`; Chrome headless screenshots проверены для desktop login/marketplace и mobile `/for-streamers`.  
Что не проверено: полный ручной authenticated browser flow с реальным backend-пользователем; полный matrix light/dark/mobile по всем новым страницам; старый dev-сервер на `localhost:3000` во время проверки отдавал устаревшее состояние, поэтому smoke выполнялся на новом `localhost:3002`.  
Риски: auth-состояние шапки зависит от доступности `GET /api/v1/auth/me`; при битом или устаревшем токене клиент очищает token и показывает guest-навигацию; мобильная шапка теперь переносит публичные ссылки в две строки на узких экранах.  
Следующие шаги: выполнить ручной smoke входа/выхода с dev API, проверить light theme для новых публичных страниц и продолжить `FF-0307` стабилизационными browser smoke сценариями.  
Связанные TASK-ID: `UX-TASK-011`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-11: Authenticated marketplace topbar

Дата: 2026-05-11  
Агент: Codex  
Задача: приблизить залогиненную верхнюю панель к наброску пользователя: логотип, поиск, notification action и раскрывающееся меню аккаунта в стиле FanFuel.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: для авторизованного состояния `AppTopBar` получил marketplace search с переходом в `/marketplace?query=...`, compact actions, disabled notification placeholder и account dropdown; меню показывает профиль, покупки, продажи для seller role, настройки, theme switcher, язык и выход; пункты помощи/сообщений/финансов оставлены disabled, финансы не показывают fake balance и не ведут на future payout routes.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `GET http://localhost:8080/healthz` и `GET http://localhost:3002/marketplace` — 200; создан временный dev-пользователь `codex-topbar-...@example.test` через local API и проверены Chrome headless screenshots authenticated desktop/mobile с открытым меню; topbar search smoke из `/buyer` привёл на `/marketplace?query=obs`.  
Что не проверено: полный ручной click-through всех menu items в обычном браузере; light theme screenshot для нового dropdown; реальные notification/messages/finance flows, потому что домен/API ещё не готовы.  
Риски: notification button сейчас intentionally disabled до notification flow; пункт финансов disabled до wallet/payout/provider/legal review; `/me/profile` всё ещё временно принимает часть Studio/settings ссылок до `UX-TASK-007`.  
Следующие шаги: провести light/mobile screenshot QA в рамках `UX-TASK-010`, затем продолжить разделение `/me/profile` по `UX-TASK-007` и не включать финансы/выплаты без `docs/PAYMENTS.md` review.  
Связанные TASK-ID: `UX-TASK-012`, `UX-TASK-010`, `UX-TASK-007`, `FF-0307`.

## Handoff-запись 2026-05-11: Compact mobile account menu

Дата: 2026-05-11  
Агент: Codex  
Задача: исправить залогиненный topbar/menu на мобильных: всё в одну строку, меню плотнее, категории разделены, тема не раскрывается некорректно, profile/settings/studio разделены в планах.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: authenticated topbar на mobile удерживает логотип, поиск, уведомления и меню в одну строку; account dropdown стал уже и плотнее; пункты меню разнесены по категориям с разделителями и отступом подпунктов; theme/language controls вынесены в компактные dropdown-паттерны; `/me/settings` добавлен в план как отдельная страница, `/studio` оставлен planned и оба пункта меню помечены как "скоро".  
Проверки: `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://localhost:3002/marketplace` с streamer-token: viewport 390px и 320px, topbar one-line = true, nested theme menu = false, overflow rows = 0.  
Что не проверено: ручной click-through в обычном браузере; полный light/dark matrix для всех страниц; real notification/messages/finance flows, потому что домен/API ещё не готовы.  
Риски: пункты `/me/settings` и `/studio` сейчас intentionally disabled как "скоро", поэтому полноценное разделение страниц остаётся задачей `UX-TASK-007`; финансы остаются disabled до payment/provider/legal review.  
Следующие шаги: реализовать отдельные `/me/settings` и `/studio` по `UX-TASK-007`, затем провести полный `UX-TASK-010` screenshot QA.  
Связанные TASK-ID: `UX-TASK-013`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Preference dropdowns в account menu

Дата: 2026-05-11  
Агент: Codex  
Задача: поправить отступы account menu, вернуть аккуратный dropdown для темы и добавить dropdown смены языка `Русский`/`English`.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/i18n.ts`, `apps/web/src/app/layout.tsx`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: выровнен вертикальный ритм account menu; theme и language controls заменены на overlay-dropdown поверх меню; язык показывает `Русский` вместо `По-русски`, содержит `English`, сохраняется в localStorage/cookie и через `PATCH /api/v1/me/preferences`; topbar использует выбранную locale для своих подписей.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://localhost:3002/marketplace` с streamer token на 390px и 320px — topbar one-line, dropdown fits, overflow rows = 0, theme/language overlay fits; screenshot artifacts сохранены во временной папке.  
Что не проверено: полный ручной click-through в обычном браузере; полная локализация всех страниц от dropdown, потому что текущая i18n-архитектура страниц всё ещё использует `NEXT_PUBLIC_DEFAULT_LOCALE`/app helper без route-level LocaleProvider.  
Риски: language dropdown сохраняет preference и переводит topbar/menu, но остальной page copy останется на текущей app locale до отдельной задачи по глобальной runtime-locale архитектуре; notification/messages/finance остаются disabled по прежним ограничениям.  
Следующие шаги: при реализации `/me/settings` вынести туда полноценное управление locale/theme и отдельно решить глобальную локализацию страниц; продолжить `UX-TASK-007` и `UX-TASK-010`.  
Связанные TASK-ID: `UX-TASK-013`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Guest topbar dropdown menu

Дата: 2026-05-11  
Агент: Codex  
Задача: сделать похожее burger/dropdown menu для неавторизованного пользователя, оставить поиск в topbar и обновить placeholder поиска под товары, услуги, категории и авторов.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: поиск вынесен в общий topbar для гостя и авторизованного пользователя; для гостя добавлено compact dropdown menu с входом, регистрацией, marketplace, ролевыми публичными страницами, темой и языком; пункт покупок для гостя не показывается; placeholder поиска показывает "Найти товар, услугу или автора" на широком экране и "Поиск" на mobile.  
Проверки: `npx prettier --write` для изменённых UI/i18n/docs файлов; `npm run typecheck` — успешно; `npm run lint` — успешно; `npm run build` — успешно; `npm run test` — успешно; CDP smoke на `http://localhost:3002/marketplace` для 1440/390/320 — topbar one-line, mobile placeholder compact, guest menu внутри viewport, есть вход/регистрация/тема/язык, нет "Покупок", theme/language overlay внутри viewport.  
Что не проверено: полный ручной click-through в обычном браузере; реальное расширение backend-поиска по авторам и категориям, потому что это отдельная marketplace/API задача.  
Риски: topbar search уже использует broad placeholder, но фактическая глубина поиска зависит от текущей реализации marketplace API/фильтра; language preference переводит topbar/menu, но глобальная runtime-locale архитектура страниц остаётся отдельной задачей.  
Следующие шаги: при необходимости расширить marketplace search backend/index на авторов и категории; продолжить `UX-TASK-007`, `UX-TASK-010` и стабилизационные browser smoke из `FF-0307`.  
Связанные TASK-ID: `UX-TASK-014`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Внешний dev-домен для web

Дата: 2026-05-11  
Агент: Codex  
Задача: исправить ситуацию, когда `danechka.com:3002/marketplace` отдаёт страницу через Next.js dev-сервер, но интерактивность работает некорректно из-за заблокированных dev-ресурсов.  
Изменённые файлы: `apps/web/next.config.mjs`, `.env.example`, `docs/TESTING.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: в `next.config.mjs` добавлен `allowedDevOrigins` для `127.0.0.1` и тестового host `danechka.com`; дополнительные host можно указать через `NEXT_ALLOWED_DEV_ORIGINS`. В `.env.example` добавлен пример переменной, а в `docs/TESTING.md` описана проверка web через внешний dev-домен и необходимость перезапуска dev-сервера после изменения allowlist. Dev-сервер на 3002 перезапущен с новым конфигом.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `npx prettier --check apps/web/next.config.mjs docs/TESTING.md docs/CHANGELOG.md docs/HANDOFF.md` — успешно; CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1` — React-гидратация есть, dropdown открывается, placeholder поиска виден; в dev-логе нет `Blocked cross-origin request`.  
Что не проверено: реальный внешний DNS/порт с другого устройства вне этой машины; HTTPS/proxy-сценарий для домена.  
Риски: `allowedDevOrigins` нужен только для Next.js dev-режима; production-показ домена должен идти через `next start`/reverse proxy и отдельную настройку origin/CORS. При добавлении нового тестового домена dev-сервер нужно перезапустить.  
Следующие шаги: если появится второй preview host, добавить его в `NEXT_ALLOWED_DEV_ORIGINS` через запятую и повторить browser smoke dropdown/search.

## Handoff-запись 2026-05-11: Topbar search polish и hydration guard

Задача: исправить dev hydration overlay на `danechka.com:3002`, выровнять кнопку поиска в topbar и не сокращать placeholder до "Поиск", когда длинный текст фактически помещается.

Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/marketplace/page.tsx`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

Что сделано: topbar search теперь измеряет фактическую ширину input и выбирает компактный placeholder только при нехватке места; search button стал inset-кнопкой с равными top/right/bottom отступами; на topbar и marketplace form controls добавлен точечный `suppressHydrationWarning`, чтобы browser/extension-injected attributes вроде `__gcruniqueid` не поднимали blocking dev overlay.

Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1` и viewport 390px — placeholder `Найти товар, услугу или автора`, ширина поля 278px, кнопка 34px, gaps top/right/bottom = 5px, dev overlay не найден.

Что не проверено: реальный iOS Safari с тем же набором расширений пользователя.

Риски: `suppressHydrationWarning` должен оставаться локальным guard для внешних атрибутов, а не способом скрывать настоящие SSR/client расхождения.

Следующие шаги: при повторении overlay на других формах проверить, какой атрибут добавляется браузером, и расширять guard только на конкретные затронутые controls.
Связанные TASK-ID: `FF-0307`, `UX-TASK-014`.

## Handoff-запись 2026-05-11: Topbar search control и mobile API proxy

Задача: выровнять поле поиска по высоте с topbar-кнопками, сделать кнопку поиска встроенной частью поля и починить mobile dev-сценарий, где auth/API работает с ПК, но ломается с телефона через `danechka.com:3002`.

Изменённые файлы: `.env.example`, `apps/web/src/app/api/v1/[...path]/route.ts`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/api.ts`, `docs/API_PLAN.md`, `docs/TESTING.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

Что сделано: topbar search получил ту же высоту, что соседние кнопки, а submit стал правым встроенным сегментом с divider; login/register forms защищены от внешних injected attributes через точечный `suppressHydrationWarning`; browser API client перешёл на same-origin `/api/v1/*` при localhost public base; добавлен Next.js route proxy `/api/v1/*`, который серверно прокидывает запросы к Go API через `FANFUEL_INTERNAL_API_BASE_URL`/`API_BASE_URL`/fallback `localhost:8080`.

Проверки: `npx prettier --check` для изменённых code/docs файлов — успешно; `.env.example` не форматировался Prettier, потому что у него нет parser; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; HTTP smoke `GET http://localhost:3002/api/v1/categories` — 200 через web proxy; `GET http://localhost:3002/marketplace` — 200.

Что не проверено: реальный iOS Safari с телефона и настоящий внешний DNS/port-forward после правки; нужно повторить ручной smoke на устройстве через `danechka.com:3002`.

Риски: proxy не заменяет production reverse proxy/CORS-политику; если в будущем `NEXT_PUBLIC_API_BASE_URL` укажет внешний не-localhost API origin, телефон должен иметь доступ к этому origin напрямую.

Следующие шаги: вручную открыть `http://danechka.com:3002/auth/login` на телефоне, проверить отсутствие hydration overlay и успешный login при запущенном Go API на машине с Next.js.
Связанные TASK-ID: `UX-TASK-016`, `FF-0307`.

## Handoff-запись 2026-05-11: Главная маркетплейса как мобильная витрина

Дата: 2026-05-11
Агент: Codex
Задача: переделать `/marketplace` из текстового лендинга в полноценную мобильную главную маркетплейса цифровых товаров и услуг.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/PAGE_SPECS.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `/marketplace` получил короткий торговый hero с поиском, быстрыми категориями и CTA; кликабельные плашки Safe deal/промокодов/проверенных продавцов; ленту "Популярно сейчас"; блок "Подборки авторов"; категории "Для стримеров" и "Игровые услуги"; блок доверия; нижнюю ленту новых товаров. Карточки товаров стали плотнее и показывают цену, продавца, рейтинг/нового продавца, safe deal и бейдж поддержки автора при наличии `affiliate_percent_bps`. Ленты используют реальные товары из marketplace API и не подставляют фиктивные товары при пустой БД.
Проверки: `npx prettier --write` и `npx prettier --check` для изменённых UI/i18n/docs файлов; `git diff --check` — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `GET http://localhost:8080/healthz` — `ok`; `GET http://localhost:3002/marketplace` — 200; CDP smoke на `http://localhost:3002/marketplace` при viewport 390x844 — горизонтального overflow нет, hero высотой 609px, `#popular-now` начинается на 784px и виден в первом экране, 3 explainer-плашки есть, клик по первой открывает объяснение.
Что не проверено: полный screenshot QA на 320/390/768/1440 в light/dark; визуальный вид лент с опубликованными товарами, потому что текущий `GET /api/v1/products` в dev вернул пустой список; реальный iOS/Android браузер.
Риски: при пустом marketplace API страница честно показывает пустые состояния вместо демо-товаров; авторские подборки используют существующий public creator route `/creators/[slug]`, но конкретные витрины будут полезны только после появления соответствующих профилей/товаров; игровые услуги остаются с `LEGAL_REVIEW_REQUIRED` и не должны расширяться в рискованные категории без legal/payment review; Safe deal в `v0.3` остаётся mock-сценарием.
Следующие шаги: добавить dev/seed-набор опубликованных товаров только как отдельное решение, затем провести screenshot QA mobile/light/dark и расширять поиск по авторам/категориям отдельной backend/API задачей.
Связанные TASK-ID: `UX-TASK-017`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-11: черновик Figma design map

Дата: 2026-05-11
Агент: Codex
Задача: создать Figma-карту текущего дизайна FanFuel и примеры базовых UI-паттернов.
Изменённые файлы: `docs/HANDOFF.md`; Figma-файл `FanFuel Design Map v0.3` (`https://www.figma.com/design/RiTvolqL6ooNxkgxb77gjy`).
Что сделано: создан новый Figma-файл; заведены страницы `00 Cover`, `01 Foundations`, `02 Components & Screens`; добавлены коллекции переменных `FanFuel / Color` с режимами Light/Dark и `FanFuel / Sizing`; добавлены 48 переменных на основе `packages/ui/src/styles.css` и sizing-токенов, 9 текстовых стилей и 3 effect styles.
Проверки: прочитаны обязательные проектные и UI/UX-документы; проверены доступные Inter fonts через Figma MCP; выполнен поиск существующих design system assets в Figma, результатов нет; Figma `_use_figma` подтвердил создание переменных и стилей.
Что не получилось проверить: визуальные секции карты, примеры Button/Input/Dropdown/Switch/Badge/ProductCard/Topbar/Modal и мини-экраны не удалось записать в Figma.
Риски: Figma MCP остановил дальнейшие записи лимитом Starter-плана; повторная попытка дорисовать карту через `_use_figma` также вернула `mcp_rate_limit_paywall`; текущий Figma-файл является foundation draft, а не полной дизайн-картой.
Следующие шаги: после сброса или увеличения лимита Figma MCP дорисовать визуальные страницы foundations, компонентные примеры, состояния, topbar/dropdown/switch/modal patterns, marketplace/buyer/seller/admin/widget mini-screens и developer rules.
Связанные TASK-ID: `FF-0210`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: разнесение roadmap и tasks по файлам

Дата: 2026-05-11
Агент: Codex
Задача: переделать roadmap и backlog так, чтобы агентам не нужно было читать весь монолитный список при каждой задаче.
Изменённые файлы: `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/roadmap/**`, `docs/tasks/**`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `ROADMAP.md` превращён в короткий индекс, а подробные разделы перенесены в `docs/roadmap/`; `docs/TASKS.md` превращён в короткий индекс с активным фокусом и ссылками на отдельные TASK-ID; все подробные задачи перенесены в `docs/tasks/` по папкам `v0.0`-`v1.0` и `ui-ux`; добавлены `README.md`-индексы для новых подпапок; основной README обновлён под новый маршрут чтения.
Проверки: `npx prettier --check README.md ROADMAP.md docs/TASKS.md "docs/roadmap/**/*.md" "docs/tasks/**/*.md" docs/CHANGELOG.md` — успешно; custom link check для новых индексов — успешно; `git diff --check -- README.md ROADMAP.md docs/TASKS.md docs/roadmap docs/tasks docs/CHANGELOG.md` — успешно.
Что не проверено: полный `git diff --check` по всему рабочему дереву остаётся заблокирован существующими trailing spaces в ранее добавленной Figma-записи `docs/HANDOFF.md`, не относящейся к этому сплиту.
Риски: при добавлении новой задачи теперь нужно обновлять и отдельный task-файл, и короткий индекс `docs/TASKS.md`; если старые инструкции будут ссылаться только на монолитный `docs/TASKS.md`, они всё равно попадут в индекс, но подробности нужно открывать по ссылке TASK-ID.
Следующие шаги: при следующей задаче использовать `docs/tasks/active-focus.md` и конкретный файл задачи; при планировании нового этапа добавлять отдельный файл в `docs/roadmap/`.
Связанные TASK-ID: документационная инфраструктура, отдельный TASK-ID не создавался.

## Handoff-запись 2026-05-11: полировка topbar logo/search

Дата: 2026-05-11
Агент: Codex
Задача: уменьшить левый визуальный отступ у лупы в topbar search и сделать `FF`-логотип такого же размера, как соседние блоки.
Изменённые файлы: `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `FF`-логотип увеличен до `40x40` на desktop и `38x38` на mobile, чтобы совпадать с высотой соседних topbar controls; search submit-сегмент сделан квадратным (`38x38` на desktop и `36x36` на mobile), а правый padding input уменьшен, чтобы лупа визуально стояла ровно внутри кнопки.
Проверки: `npx prettier --check apps/web/src/app/globals.css docs/CHANGELOG.md docs/HANDOFF.md` — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run test --workspaces --if-present` — успешно; Chrome DevTools Protocol smoke на `http://localhost:3002/marketplace` — на viewport `390x844` логотип и menu `38x38`, search height `38`, кнопка лупы `36x36`, horizontal overflow `0`; на viewport `1440x900` логотип/menu/search height `40`, кнопка лупы `38x38`, horizontal overflow `0`.
Что не проверено: полный screenshot QA light/dark и реальный мобильный браузер; `git diff --check` остаётся заблокирован старой Figma-записью в `docs/HANDOFF.md` с trailing spaces.
Риски: в рабочем дереве уже были несвязанные изменения `apps/web/src/app/globals.css`, marketplace/i18n/docs; эта правка ограничена topbar selectors и не должна трактоваться как полная проверка существующего большого diff.
Следующие шаги: при следующем визуальном QA проверить topbar на 320px и в обеих темах вместе с `UX-TASK-010`.
Связанные TASK-ID: `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-12: главная marketplace без redirect и CRM-фильтров

Дата: 2026-05-12
Агент: Codex
Задача: обновить главную marketplace по UX-замечаниям: `/` должен открывать ту же витрину без redirect, первый экран не должен выглядеть как CRM-фильтр, публичный UI не должен показывать внутренний `LEGAL_REVIEW_REQUIRED`, empty states должны быть спокойными, а для разработки нужны seed/mock товары.
Изменённые файлы: `apps/web/src/app/page.tsx`, `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `services/api/internal/app/marketplace_store.go`, `services/api/internal/app/slug.go`, `services/api/internal/app/slug_test.go`, `infra/scripts/seed-dev.sh`, `infra/scripts/seed-dev.ps1`, `docker-compose.dev.yml`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/UI_UX_TRACKER.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/tasks/ui-ux/README.md`, `docs/tasks/ui-ux/UX-TASK-011.md`, `docs/tasks/ui-ux/UX-TASK-018.md`, `docs/DEPLOYMENT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: корневой route `/` теперь рендерит тот же marketplace screen, что и `/marketplace`, без HTTP/client redirect; бренд в topbar ведёт на `/`; внутренний hero search и строка category/sort убраны полностью, поиск остался в topbar; первый экран стал ближе к референсу: CTA, быстрые категории, витринная карточка товара, объяснение покупки и компактные role tabs под trust-плашками; горизонтальные marketplace-ленты сбрасываются в начало после загрузки данных, без принудительного вертикального scroll страницы; hero CTA "Смотреть популярное" и "Подборки авторов" убраны; внутренний `LEGAL_REVIEW_REQUIRED` больше не выводится в публичном marketplace UI; старые дублирующие category bands удалены, а авторские подборки оставлены ближе к существующему компактному варианту; пустые списки показывают спокойный empty state с действиями "Стать продавцом" и "Все категории". Dev seed scripts теперь идемпотентно создают 3 seller profiles и 6 published mock products через реальные таблицы. В API исправлен баг, где пустой `category` превращался в slug `user` и `/api/v1/products` без фильтра возвращал пустой список. В `docker-compose.dev.yml` web proxy явно ходит к API по `http://api:8080`.
Проверки: `npx prettier --check` для затронутых TSX/CSS/JSON/Markdown/YAML файлов — успешно; `npm run typecheck --workspaces --if-present` и `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run test --workspaces --if-present` — успешно; `npm run build --workspaces --if-present` и `npm run build -w @fanfuel/web` — успешно; `cd services && go test ./...` — успешно; `git diff --check` — успешно; `.\infra\scripts\seed-dev.ps1 -ComposeFile docker-compose.yml` — первый рабочий запуск создал 3 sellers и 6 products, повторный запуск `INSERT 0 0`; SQL smoke подтвердил 6 published seed products; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` пересобрал API/web; `GET http://localhost:8080/api/v1/products` и `GET http://localhost:3000/api/v1/products` возвращают 6 товаров; `GET http://localhost:3000/` и `/marketplace` возвращают 200 без `NEXT_REDIRECT`, без `ff-market-search-panel`, без "Искать</button>", без "Применить" и без `LEGAL_REVIEW_REQUIRED`.
Что не проверено: полноценный screenshot QA в реальном браузере на 320/390/768/1440 и обеих темах; состояние абсолютно пустой БД после удаления seed-товаров проверено только логикой empty state, без отдельного сброса БД.
Риски: dev seed добавляет демонстрационные товары в локальную БД, поэтому для проверки пустого состояния нужно запускать отдельную чистую БД или удалить seed-товары; product media пока остаётся CSS-заглушкой, без реальных изображений товаров; line-ending warnings `LF will be replaced by CRLF` остаются особенностью текущей Windows git-настройки.
Следующие шаги: провести browser screenshot QA после seed на desktop/mobile light/dark; отдельно проверить пустую БД без seed; добавить реальные product media/preview assets отдельной задачей.
Связанные TASK-ID: `UX-TASK-018`, `UX-TASK-011`, `UX-TASK-017`, `FF-0307`.

## Handoff-запись 2026-05-12: компактные карточки marketplace

Дата: 2026-05-12
Агент: Codex
Задача: убрать hero-кнопки "Смотреть товары" и "Все категории", перестроить порядок данных в карточках, оставить горизонтальное листание только на мобильных ширинах и усилить авторский блок подборок.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: hero CTA удалены; карточки товаров и hero-товар показывают цену, рейтинг со звездой, название, продавца и плашки в новом порядке; desktop-ряды товаров стали CSS grid без горизонтального overflow, mobile-ряды остались свайпаемыми; карточки уплотнены по высоте; аватар и ник автора в подборках увеличены и выровнены по центру высоты блока.
Проверки: frontend форматирование, typecheck, lint, build и browser smoke выполнялись после правки.
Что не проверено: полный ручной screenshot QA light/dark на всех ширинах и реальный мобильный браузер.
Риски: карточки стали плотнее, поэтому после появления настоящих длинных названий товаров нужен отдельный визуальный regression pass.
Следующие шаги: проверить marketplace на 320/390/768/1440 в light/dark и при большем числе реальных товаров.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: визуальная доводка hero marketplace

Дата: 2026-05-12
Агент: Codex
Задача: довести hero и мобильные ленты marketplace по замечаниям: акцентный перенос "поддерживай авторов", меньший отступ после подзаголовка, выравнивание hero-карточек по заголовку, скрытие секционных orange-eyebrow плашек, mobile-only свайп-подсказки и отсутствие hover-подъёма на touch-устройствах.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: заголовок hero разбит на две строки через i18n-ключи `marketplaceTitlePrimary`/`marketplaceTitleAccent`, акцентная строка окрашена в primary token; отступ после подзаголовка уменьшен; right-side hero карточки выровнены по верхней границе заголовка на desktop; секционные плашки `Хиты`/`Авторы`/`Почему удобно`/`Новое` оставлены в JSX-комментариях; мобильные author collections показывают аватар и ник автора первым элементом горизонтальной ленты, а товарную карточку справа подрезают как affordance; для свайпа добавлена малозаметная стрелка, hover-подъём карточек отключён для touch/coarse pointer.
Проверки: `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/`: desktop title line break `true`, accent color primary, hero aside delta from h1 `0`, секционных `.ff-status` нет; mobile overflow X `0`, `.ff-market-author-inline` display `grid`, `.ff-market-author-side` display `none`, author tile первый в shelf, стрелка `→` есть, первая товарная карточка в author shelves подрезана справа.
Что не проверено: полный ручной screenshot QA light/dark на 320/390/768/1440 и реальный мобильный браузер; long-title regression на большом каталоге.
Риски: подсказка-стрелка добавлена CSS-псевдоэлементом для всех mobile product shelves, поэтому при будущей ленте с очень малым числом товаров может потребоваться условное скрытие; hover reset рассчитан на `hover: none`/`pointer: coarse`, desktop touch-экраны тоже получат поведение mobile.
Следующие шаги: пройти полный visual QA marketplace в light/dark и проверить реальные изображения товаров, когда появятся product media.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: бейджи и адаптивные карточки marketplace

Дата: 2026-05-12
Агент: Codex
Задача: исправить обрезание цены, перенос карточек, размер loading skeleton, смысловые бейджи Safe deal/поддержки автора/товара от автора и мобильный вид авторских подборок.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/src/format.ts`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `formatMoney` получил опцию `trimZeroFraction`, marketplace-карточки используют её для цен без `,00`; product meta переведён на flex, чтобы цена не ужималась; desktop product shelves и нижняя feed-сетка ограничены одной видимой строкой и скрывают лишние карточки вместо переноса; `ff-market-shelf-skeleton` получил высоту реальной карточки; Safe deal стал зелёным бейджем со shield-иконкой; поддержка автора показывается только в author collections через жёлто-оранжевый бейдж `автору`; в общих карточках support-бейдж убран, добавлен бейдж `От автора` для `seller_type=pro` и `verification_status=approved`; mobile author tile потерял рамку/фон, product cards в author collections вернулись к стандартной ширине; свайп-подсказка заменена на edge fade + тонкий chevron без кнопочного контейнера.
Проверки: `npx prettier --write packages/i18n/src/format.ts apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/i18n` — успешно; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/marketplace` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/marketplace`: desktop row height `220`, visible tile rows `1`, popular support badges `[]`, feed support count `0`, author support sample `автору`, prices без `[,.]00`, Safe deal имеет `.ff-market-badge-icon-safe`; mobile overflow X `0`, author border `0px`, author background transparent, product flex-basis `170px`, first product not cut, second product cut, swipe chevron `›` and fade width `34px`.
Что не проверено: ручной screenshot QA light/dark на 320/390/768/1440 и реальный мобильный браузер; отдельный сценарий creator storefront пока не реализован в текущем marketplace screen.
Риски: признак `От автора` построен по доступной MVP-модели `seller_type=pro` + `verification_status=approved`, потому что отдельного поля verified creator у public product summary пока нет; если доменная модель различит seller verification и creator verification, условие нужно заменить на явный backend-флаг.
Следующие шаги: добавить явный `is_creator_verified`/`seller_has_creator_profile` в public product summary, если бейдж `От автора` станет продуктовым контрактом, и пройти visual QA после реальных product media.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: исправление clipping marketplace-карточек

Дата: 2026-05-12
Агент: Codex
Задача: исправить визуальную регрессию, где карточки marketplace стали обрезать нижний контент и hover-подъём клиповался сверху.
Изменённые файлы: `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: высота карточки увеличена до `228px`, preview area переведена с `4/3` на `16/9`, desktop shelves больше не используют vertical clipping, лишние product/skeleton карточки скрываются через `nth-of-type` на desktop/tablet breakpoint'ах, feed grid скрывает лишние карточки без второго ряда, hover transform у marketplace product tile отключён, чтобы карточка не выезжала под обрезку.
Проверки: `npx prettier --write apps/web/src/app/globals.css docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/marketplace` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/marketplace`: на `930x900` popular/author rows имеют height `228`, visible rows `1`, visible count `4`, `overflowY=visible`, `contentCut=false` для карточек, seller и badges видны; hover transform `none`, `clippedTop=false`; на `1466x980` author row visible count `6`, rows `1`, seller виден.
Что не проверено: ручной screenshot QA в обеих темах и реальный мобильный браузер.
Риски: количество видимых карточек теперь задано CSS breakpoint'ами, а не измерением фактической ширины контейнера; для будущего идеального поведения можно заменить на container queries или вычисляемый shelf limit.
Следующие шаги: после появления реальных product media пройти visual QA на 930/1024/1280/1440 и mobile widths.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Шаблон handoff-записи

```txt
Дата:
Агент:
Задача:
Изменённые файлы:
Что сделано:
Проверки:
Что не проверено:
Риски:
Следующие шаги:
Связанные TASK-ID:
```
