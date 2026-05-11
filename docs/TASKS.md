# TASKS.md

Backlog FanFuel. Новые задачи получают статус `planned`, затем переходят в `partial` или `completed` по мере реализации и проверки.

## Активный фокус

Короткая очередь после локальной реализации `v0.3 Marketplace MVP`:

1. `FF-0307` — стабилизировать Marketplace MVP проверками и smoke checklist.
2. `UX-TASK-007` — разделить `/me/profile` на account/settings и role-aware Studio/Seller/Buyer dashboards.
3. `UX-TASK-010` — проверить текущие web/admin/widget страницы на mobile и light/dark.
4. `FF-0105` — решить и выполнить upload avatar/banner flow или явно перенести его в storage milestone.
5. `FF-0401` — начинать Creator Store domain только после фиксации результатов пунктов выше в `docs/HANDOFF.md`.

## FF-0210: Внедрить дизайн-систему и глобальную темизацию

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Компоненты: apps/web, apps/admin, apps/widget, packages/ui, packages/i18n, services/api, infra/migrations, docs

### Цель

Создать базовую дизайн-систему FanFuel, поддержать `system/light/dark` темы и привести существующие `v0.2` страницы к semantic tokens.

### Что сделано

- Добавлены `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/DESIGN_AUDIT.md`.
- Добавлены CSS variables и shared UI primitives в `packages/ui`.
- Добавлен `ThemeSwitcher`.
- Web/admin/widget переведены на light/dark tokens.
- Добавлена таблица `user_preferences`.
- Добавлены `GET/PATCH /api/v1/me/preferences`.
- Добавлены i18n ключи для темы и новых public UI блоков.

### Acceptance criteria

- Existing pages не используют случайные hardcoded colors.
- Theme preference `system/light/dark` работает для guest и authenticated user.
- OBS widget поддерживает URL theme override.
- Документация обновлена.

### Проверка

- `npm run typecheck --workspaces --if-present`.
- `cd services && go test ./...`.

### Осталось

- Visual screenshot QA.
- Storybook/component gallery.
- Реальные marketplace/safe deal/dashboard pages в `v0.3+`.

## FF-0001: Создать dev Docker Compose

Статус: completed  
Версия: v0.0  
Приоритет: P0  
Компоненты: infra/docker, docker-compose.yml, docker-compose.dev.yml

### Цель

Поднять локальное окружение для PostgreSQL, Redis и будущих сервисов.

### Контекст

Разработка должна запускаться через Docker Compose на Linux VM и локально.

### Что нужно сделать

- Создать compose файлы.
- Добавить PostgreSQL и Redis.
- Добавить healthchecks.
- Подготовить места для web, admin, widget, api, ws, worker.

### Acceptance criteria

- `docker compose -f docker-compose.dev.yml up` поднимает зависимости.
- Healthchecks работают.
- Переменные берутся из `.env`.

### Зависимости

- `.env.example`.

### Что не делать

- Не добавлять реальные секреты.
- Не подключать реальные payment providers.

### Подсказки для ИИ-агента

Свериться с `docs/DEPLOYMENT.md` и обновить его, если команды изменятся.

### Проверка

Запустить compose и проверить `docker compose ps`.

### Возможные риски

- Конфликт портов.
- Неполный `.env`.

## FF-0002: Создать skeleton monorepo приложений

Статус: completed  
Версия: v0.0  
Приоритет: P0  
Компоненты: apps/web, apps/admin, apps/widget, packages/config

### Цель

Создать минимальные frontend приложения без production-функций.

### Контекст

Web должен быть на Next.js, widget на Vite, admin можно начать как отдельное приложение.

### Что нужно сделать

- Инициализировать `apps/web`.
- Инициализировать `apps/widget`.
- Инициализировать `apps/admin`.
- Включить TypeScript strict mode.
- Добавить shared config.

### Acceptance criteria

- Каждое приложение запускается локально.
- TypeScript strict включён.
- Нет hardcoded production text без i18n plan.

### Зависимости

- Решение по package manager.

### Что не делать

- Не строить полноценные экраны.
- Не добавлять платёжную логику.

### Подсказки для ИИ-агента

Сохранить виджеты лёгкими, без зависимости от Next.js.

### Проверка

Запустить dev commands и lint.

### Возможные риски

- Слишком тяжёлый widget bundle.

## FF-0003: Создать skeleton Go services

Статус: completed  
Версия: v0.0  
Приоритет: P0  
Компоненты: services/api, services/ws, services/worker

### Цель

Подготовить базовые Go сервисы с healthchecks.

### Контекст

API, WebSocket gateway и worker должны быть отдельными сервисами.

### Что нужно сделать

- Создать Go modules.
- Добавить `/healthz` и `/readyz`.
- Добавить config loading.
- Добавить structured logging.
- Подготовить graceful shutdown.

### Acceptance criteria

- `go test ./...` проходит.
- Health endpoints отвечают.
- Сервисы читают env vars.

### Зависимости

- `.env.example`.

### Что не делать

- Не реализовывать бизнес-логику.
- Не подключать реальных провайдеров.

### Подсказки для ИИ-агента

Следовать layering из `docs/ARCHITECTURE.md`.

### Проверка

`go test ./...`, ручной запрос `/healthz`.

### Возможные риски

- Несогласованная структура Go packages.

## FF-0004: Добавить миграционный инструмент

Статус: completed  
Версия: v0.0  
Приоритет: P0  
Компоненты: infra/migrations, services/api

### Цель

Подготовить управляемые миграции PostgreSQL.

### Контекст

БД должна быть audit-friendly и мигрироваться воспроизводимо.

### Что нужно сделать

- Выбрать migration tool.
- Создать команду migrate up/status.
- Добавить первую пустую или базовую миграцию.
- Описать команды в docs.

### Acceptance criteria

- Миграции применяются на чистую БД.
- Migration status доступен.
- Команды отражены в `docs/DEPLOYMENT.md`.

### Зависимости

- PostgreSQL из Docker Compose.

### Что не делать

- Не создавать все таблицы без review доменной модели.

### Подсказки для ИИ-агента

Новые таблицы сверять с `docs/DOMAIN_MODEL.md`.

### Проверка

Запустить migration up на dev БД.

### Возможные риски

- Выбор инструмента, неудобного для Go CI.

## FF-0005: Создать i18n skeleton

Статус: completed  
Версия: v0.0  
Приоритет: P0  
Компоненты: packages/i18n, apps/web, apps/admin, apps/widget

### Цель

Подготовить локализацию `ru/en` до появления экранов.

### Контекст

Русский основной, английский поддерживается; язык нельзя хардкодить.

### Что нужно сделать

- Создать структуру словарей.
- Добавить common/errors namespaces.
- Добавить helpers форматирования дат, чисел, валют.
- Подключить i18n к frontend skeleton.

### Acceptance criteria

- Есть `ru` и `en`.
- UI использует i18n helper.
- Money/date formatting не хардкодится.

### Зависимости

- Frontend skeleton.

### Что не делать

- Не писать весь copy заранее.

### Подсказки для ИИ-агента

Свериться с `docs/I18N.md`.

### Проверка

Unit tests для formatting helpers.

### Возможные риски

- Строки в компонентах появятся раньше словарей.

## FF-0006: Создать базовый UI kit skeleton

Статус: completed  
Версия: v0.0  
Приоритет: P1  
Компоненты: packages/ui, apps/web, apps/admin

### Цель

Подготовить общий набор primitives для web и admin.

### Контекст

UI должен быть единым и не перегруженным.

### Что нужно сделать

- Добавить Button, Input, Select, Modal, Toast skeleton.
- Настроить экспорт пакета.
- Добавить states: loading, disabled, error.
- Подключить к web/admin.

### Acceptance criteria

- Компоненты типизированы.
- Нет hardcoded user-facing text.
- Есть минимальные tests/story examples, если выбран инструмент.

### Зависимости

- Frontend skeleton.

### Что не делать

- Не строить дизайн-систему enterprise масштаба.

### Подсказки для ИИ-агента

Следовать `docs/UX_PLAN.md`.

### Проверка

Lint и component tests.

### Возможные риски

- Преждевременная абстракция.

## FF-0007: Настроить базовый CI outline

Статус: completed  
Версия: v0.0  
Приоритет: P1  
Компоненты: .github, packages/config

### Цель

Добавить минимальные проверки качества.

### Контекст

Проект будет развиваться несколькими агентами, нужен автоматический guardrail.

### Что нужно сделать

- Добавить lint/test workflow outline.
- Добавить secret scanning step, если доступен.
- Добавить Go tests.
- Добавить TypeScript checks.

### Acceptance criteria

- CI запускает базовые проверки.
- Команды описаны в `docs/TESTING.md`.

### Зависимости

- Skeleton apps/services.

### Что не делать

- Не добавлять real deploy secrets.

### Подсказки для ИИ-агента

CI может быть минимальным до появления production code.

### Проверка

Запустить команды локально.

### Возможные риски

- CI ломается из-за ещё не созданных приложений.

## FF-0008: Добавить seed data plan и dev fixtures

Статус: completed  
Версия: v0.0  
Приоритет: P2  
Компоненты: infra/scripts, infra/migrations, docs/DEPLOYMENT.md

### Цель

Подготовить тестовые данные для разработки.

### Контекст

Нужны buyer, creator, seller lite/pro, категории и mock товары.

### Что нужно сделать

- Описать seed сценарий.
- Добавить dev-only seed command.
- Создать fixtures без реальных данных.

### Acceptance criteria

- Seed можно выполнить повторно безопасно.
- Нет персональных реальных данных.

### Зависимости

- Initial schema.

### Что не делать

- Не использовать production данные.

### Подсказки для ИИ-агента

Seed должен быть idempotent.

### Проверка

Запустить seed дважды.

### Возможные риски

- Несогласованность fixtures с миграциями.

## FF-0101: Реализовать базовую auth модель

Статус: completed  
Версия: v0.1  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Создать регистрацию, логин и текущего пользователя.

### Контекст

Auth нужен для buyer, streamer, seller и admin flows.

### Что нужно сделать

- Таблицы `users`, `roles`, `profiles`.
- `POST /auth/register`.
- `POST /auth/login`.
- `POST /auth/logout`.
- `GET /auth/me`.
- Password hashing и rate limit.

### Acceptance criteria

- Пользователь регистрируется и входит.
- Ошибки имеют `i18n_key`.
- Роли сохраняются.

### Зависимости

- Migrations.

### Что не делать

- Не добавлять OAuth как обязательный flow.

### Подсказки для ИИ-агента

Session/JWT выбор зафиксировать ADR, если меняется.

### Проверка

- `cd services && go test ./...`.
- Ручной API/web flow после запуска compose.

### Возможные риски

- Enumeration через ошибки логина.

## FF-0102: Реализовать role/permission middleware

Статус: completed  
Версия: v0.1  
Приоритет: P0  
Компоненты: services/api

### Цель

Защитить endpoints по ролям.

### Контекст

Один пользователь может иметь несколько ролей.

### Что нужно сделать

- Permission middleware.
- Role checks.
- Admin-only guard.
- Audit для изменения ролей.

### Acceptance criteria

- Роль проверяется на backend.
- Admin endpoints недоступны без admin role.

### Зависимости

- Auth модель.

### Что не делать

- Не полагаться только на frontend.

### Подсказки для ИИ-агента

Permissions должны быть тестируемыми.

### Проверка

- `cd services && go test ./...`.
- Ручная проверка: admin endpoints без `admin` token возвращают forbidden.

### Возможные риски

- Privilege escalation.

## FF-0103: Реализовать profile и public creator page API

Статус: completed  
Версия: v0.1  
Приоритет: P0  
Компоненты: services/api, apps/web

### Цель

Дать автору публичную страницу.

### Контекст

Creator page нужна для Donate MVP и Creator Store.

### Что нужно сделать

- Таблицы `creator_profiles`, `buyer_profiles`, `seller_profiles`.
- API `GET /creators/{slug}`.
- API редактирования profile/studio profile.
- Базовая web страница автора.

### Acceptance criteria

- Creator slug уникален.
- Публичная страница открывается.
- Тексты через i18n.

### Зависимости

- Auth.
- i18n skeleton.

### Что не делать

- Не добавлять донат-форму в этой задаче.

### Подсказки для ИИ-агента

Сначала API contract, затем UI.

### Проверка

- `npm run typecheck`.
- `npm run build`.
- Ручной просмотр `/creators/{creator_slug}`.

### Возможные риски

- Slug collision.

## FF-0104: Создать базовую админку пользователей

Статус: completed  
Версия: v0.1  
Приоритет: P1  
Компоненты: apps/admin, services/api

### Цель

Админ должен видеть пользователей и роли.

### Контекст

Admin нужен до платежей и модерации.

### Что нужно сделать

- Admin login guard.
- Users list.
- User details.
- Status change endpoint.
- Audit log для status changes.

### Acceptance criteria

- Admin видит список users.
- Non-admin получает forbidden.
- Изменения пишутся в audit log.

### Зависимости

- Auth.
- Role middleware.

### Что не делать

- Не делать сложный CRM.

### Подсказки для ИИ-агента

Admin UI должен быть рабочим, но сдержанным.

### Проверка

- `npm run typecheck`.
- `npm run build`.
- Ручная проверка `apps/admin`.

### Возможные риски

- Утечка персональных данных в таблицах.

## FF-0105: Добавить upload avatar/banner flow

Статус: planned  
Версия: v0.1  
Приоритет: P1  
Компоненты: services/api, apps/web, storage

### Цель

Подготовить загрузку публичных медиа профиля.

### Контекст

Аватары и баннеры нужны creator page.

Примечание `v0.1`: задача оставлена planned и должна выполняться после отдельной file metadata/S3 signed URL задачи. Roadmap `v0.1` считается готовым без upload flow.

### Что нужно сделать

- File metadata model.
- Signed upload endpoint.
- MIME/size validation.
- Public bucket strategy.
- UI загрузки avatar/banner.

### Acceptance criteria

- Файл загружается через signed URL.
- Нельзя загрузить неподдерживаемый MIME.
- CDN/base URL не хардкодится.

### Зависимости

- S3/R2 abstraction.

### Что не делать

- Не хранить private digital files в public bucket.

### Подсказки для ИИ-агента

Свериться с `docs/SECURITY.md`.

### Проверка

Upload tests и manual upload.

### Возможные риски

- XSS через SVG.

## FF-0106: Добавить auth/profile frontend flows

Статус: completed  
Версия: v0.1  
Приоритет: P1  
Компоненты: apps/web, packages/i18n

### Цель

Сделать базовые страницы регистрации, входа и профиля.

### Контекст

Пользователь должен пройти первый путь без ручных API вызовов.

### Что нужно сделать

- Register page.
- Login page.
- Me/profile page.
- Role intent selection.
- Localized validation.

### Acceptance criteria

- Все тексты через i18n.
- Ошибки API отображаются локализованно.
- Mobile layout не ломается.

### Зависимости

- Auth API.

### Что не делать

- Не добавлять payment UI.

### Подсказки для ИИ-агента

Не делать маркетинговый лендинг вместо формы.

### Проверка

- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- Ручной auth/profile flow.

### Возможные риски

- Hardcoded strings.

## FF-0201: Реализовать donation domain и API

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Создать донат и связать его с payment.

### Контекст

Donate MVP начинается с mock payment.

### Что нужно сделать

- Таблицы `donations`, `donation_goals`, `payments`.
- `POST /donations`.
- Idempotency.
- Donation statuses.
- Validation limits.

### Acceptance criteria

- Донат создаётся один раз при повторе idempotency key.
- Payment создаётся через provider abstraction.
- Ошибки локализуемы.

### Зависимости

- Auth/profiles.
- Payment abstraction skeleton.

### Что не делать

- Не подключать реального провайдера.

### Подсказки для ИИ-агента

Payment success не должен устанавливаться до webhook/mock callback.

### Проверка

API tests и idempotency tests.

### Возможные риски

- Дубли донатов.

## FF-0202: Реализовать mock payment provider

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Компоненты: services/api, services/worker

### Цель

Дать безопасный тестовый payment flow.

### Контекст

MVP не должен зависеть от реального провайдера.

### Что нужно сделать

- `PaymentProvider` mock adapter.
- Success/failure сценарии.
- Mock webhook simulation.
- Idempotency behavior.

### Acceptance criteria

- Mock payment может успешно завершиться.
- Повторный webhook не дублирует результат.
- Provider-specific логика не протекает в домен.

### Зависимости

- Payment interfaces.

### Что не делать

- Не имитировать юридическую финальность.

### Подсказки для ИИ-агента

Добавить adapter contract tests.

### Проверка

Mock provider tests.

### Возможные риски

- Тестовый flow станет похож на production promise.

## FF-0203: Реализовать donation page UI

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Компоненты: apps/web, packages/i18n

### Цель

Покупатель может отправить донат со страницы автора.

### Контекст

Donation form должна быть простой и mobile-friendly.

### Что нужно сделать

- Donation form.
- Amount input.
- Message input.
- Anonymous option.
- Payment status screen.
- Error states.

### Acceptance criteria

- Донат проходит через API.
- Все тексты через i18n.
- Кнопка submit защищена от двойного клика.

### Зависимости

- Donation API.

### Что не делать

- Не делать сложный конструктор алертов.

### Подсказки для ИИ-агента

Использовать idempotency key на submit.

### Проверка

E2E mock donation.

### Возможные риски

- Двойная отправка формы.

## FF-0204: Реализовать OBS alert widget MVP

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Компоненты: apps/widget, services/ws, packages/sdk

### Цель

OBS widget получает alert о донате.

### Контекст

Widget работает как browser source с signed token.

### Что нужно сделать

- Widget connect URL.
- Token validation.
- WebSocket connection.
- Alert rendering.
- Reconnect and heartbeat.

### Acceptance criteria

- Донат вызывает alert в widget.
- Widget token read-only.
- Event dedupe по `event_id`.

### Зависимости

- WS gateway skeleton.
- Donation events.

### Что не делать

- Не давать widget менять настройки.

### Подсказки для ИИ-агента

Минимум зависимостей в bundle.

### Проверка

WebSocket test и ручной OBS/browser check.

### Возможные риски

- Утечка widget token.

## FF-0205: Реализовать donation goals

Статус: completed  
Версия: v0.2  
Приоритет: P1  
Компоненты: services/api, apps/web, services/ws

### Цель

Автор может создать цель сбора, а донаты обновляют прогресс.

### Контекст

Goal update нужен для публичной страницы и OBS widgets.

### Что нужно сделать

- CRUD donation goals.
- Recalculate current amount.
- WS event `donation.goal.updated`.
- UI goal block.

### Acceptance criteria

- Goal обновляется после paid donation.
- Refund корректирует сумму.
- WS событие отправляется.

### Зависимости

- Donation payment flow.

### Что не делать

- Не смешивать валюты без правила.

### Подсказки для ИИ-агента

Current amount должен быть пересчитываемым.

### Проверка

Unit tests для recalculation.

### Возможные риски

- Несовпадение агрегата и истории.

## FF-0206: Добавить историю донатов и топ донатеров

Статус: completed  
Версия: v0.2  
Приоритет: P2  
Компоненты: services/api, apps/web

### Цель

Показывать историю поддержки автора.

### Контекст

История и топ повышают социальное вовлечение.

### Что нужно сделать

- Public donation list with privacy.
- Top donors aggregation.
- Studio donation history.
- Anonymous handling.

### Acceptance criteria

- Anonymous донаты не раскрывают имя публично.
- Refunded donations учитываются корректно.

### Зависимости

- Donation domain.

### Что не делать

- Не показывать private buyer data.

### Подсказки для ИИ-агента

Админы могут видеть больше, публичная страница меньше.

### Проверка

API tests privacy.

### Возможные риски

- Утечка персональных данных.

## FF-0301: Реализовать product categories

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Компоненты: services/api, infra/migrations, apps/web

### Цель

Создать категории marketplace.

### Контекст

Категории должны учитывать legal risk.

### Что нужно сделать

- Таблица `product_categories`.
- API categories.
- Seed MVP categories.
- UI category navigation.

### Acceptance criteria

- Категории локализуются через i18n keys.
- Risky categories помечены restricted/legal review.

### Зависимости

- i18n.

### Что не делать

- Не включать аккаунты, ключи, пополнения в MVP.

### Подсказки для ИИ-агента

Свериться с `docs/LEGAL_REVIEW.md`.

### Проверка

API/category tests.

### Возможные риски

- Случайное открытие рискованных категорий.

## FF-0302: Реализовать seller product CRUD

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Компоненты: services/api, apps/web, infra/migrations

### Цель

Продавец может создать товар.

### Контекст

Marketplace MVP требует товаров, медиа и условий.

### Что нужно сделать

- Таблицы `products`, `product_media`.
- Seller product endpoints.
- Product form UI.
- Draft/pending moderation statuses.
- Price in minor units.

### Acceptance criteria

- Seller создаёт draft.
- Товар отправляется на модерацию.
- Цена не хранится float.

### Зависимости

- Seller profile.
- File upload.

### Что не делать

- Не публиковать товар без moderation.

### Подсказки для ИИ-агента

Product terms snapshot нужен для order.

### Проверка

API tests product CRUD.

### Возможные риски

- Некорректная цена или валюта.

## FF-0303: Реализовать marketplace listing и product page

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Компоненты: apps/web, services/api

### Цель

Покупатель может найти и открыть товар.

### Контекст

Marketplace должен быть полезным без перегруженной админки.

### Что нужно сделать

- Product listing API.
- Filters and sorting.
- Product page.
- Seller summary.
- Safe deal explanation.

### Acceptance criteria

- Published товары отображаются.
- Hidden/rejected товары не продаются.
- UI mobile-friendly.

### Зависимости

- Product CRUD.

### Что не делать

- Не делать recommendation engine.

### Подсказки для ИИ-агента

Показать формат поддержки автора, если есть attribution.

### Проверка

Frontend tests и API tests.

### Возможные риски

- Публичный доступ к hidden товару.

## FF-0304: Реализовать order и mock safe deal

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Покупатель может оформить заказ через mock safe deal.

### Контекст

Order, Deal и Payment должны быть раздельными.

### Что нужно сделать

- Таблицы `orders`, `deals`, `deal_events`.
- `POST /orders`.
- Mock safe deal flow.
- Status transitions.
- Terms snapshot.

### Acceptance criteria

- Order создаёт deal и payment.
- Deal status follows allowed transitions.
- Idempotency работает.

### Зависимости

- Product listing.
- Mock payment provider.

### Что не делать

- Не считать payment success завершением deal.

### Подсказки для ИИ-агента

Свериться с `docs/PAYMENTS.md`.

### Проверка

Integration tests order/deal.

### Возможные риски

- Смешивание статусов.

## FF-0305: Реализовать базовую модерацию товаров

Статус: completed  
Версия: v0.3  
Приоритет: P1  
Компоненты: apps/admin, services/api

### Цель

Админ может одобрить или отклонить товар.

### Контекст

Marketplace нельзя запускать без модерации.

### Что нужно сделать

- Admin products queue.
- Approve/reject endpoints.
- Moderation notes.
- Audit logs.

### Acceptance criteria

- Только admin/moderator меняет статус.
- Действие пишется в audit log.

### Зависимости

- Product CRUD.
- Admin permissions.

### Что не делать

- Не автоматизировать legal review.

### Подсказки для ИИ-агента

Risk categories требуют явной пометки.

### Проверка

Permission tests и admin manual QA.

### Возможные риски

- Публикация запрещённого товара.

## FF-0306: Реализовать отзывы

Статус: completed  
Версия: v0.3  
Приоритет: P2  
Компоненты: services/api, apps/web

### Цель

Покупатель может оставить отзыв после завершения заказа.

### Контекст

Отзывы нужны для доверия продавцам.

### Что нужно сделать

- Таблица `reviews`.
- Review endpoints.
- Product reviews UI.
- Seller rating aggregation.

### Acceptance criteria

- Один review на completed order.
- Rating 1..5.
- Seller rating обновляется.

### Зависимости

- Orders.

### Что не делать

- Не разрешать отзывы без покупки.

### Подсказки для ИИ-агента

Модерация отзывов может быть базовой.

### Проверка

Review API tests.

### Возможные риски

- Накрутка отзывов.

## FF-0307: Стабилизировать Marketplace MVP проверками

Статус: planned  
Версия: v0.3  
Приоритет: P0  
Компоненты: services/api, apps/web, apps/admin, packages/i18n, docs

### Цель

Превратить локально реализованный Marketplace MVP в удобную и воспроизводимо проверяемую основу перед `v0.4`.

### Контекст

`v0.3` уже содержит категории, товары, checkout, orders, mock safe deal, reviews и admin moderation. Главный долг сейчас — не новые фичи, а уверенность, что текущий flow не расползается при следующих задачах.

### Что нужно сделать

- Добавить automated tests для order creation, mock payment callback, safe deal transitions и review permission.
- Добавить negative permission tests для buyer/seller/admin действий.
- Зафиксировать browser smoke checklist для buyer/seller/admin marketplace flow в `docs/TESTING.md`.
- Провести ручной smoke и записать результат в `docs/HANDOFF.md`.
- Проверить, что UI тексты остаются в i18n, а статусы payment/order/deal не смешиваются.

### Acceptance criteria

- Marketplace flow можно проверить одной понятной последовательностью без чтения всего backlog.
- `cd services && go test ./...` покрывает критичные backend transitions.
- Frontend smoke покрывает `/marketplace`, product page, checkout, buyer order, seller order и admin moderation.
- Результаты проверок записаны в `docs/HANDOFF.md`.

### Зависимости

- `FF-0301`–`FF-0306`.
- Mock payment provider.
- `docs/TESTING.md`.

### Что не делать

- Не подключать реальные payment providers.
- Не добавлять ledger, payouts, refunds или disputes в рамках этой задачи.
- Не расширять marketplace категориями, требующими legal/payment review.

### Подсказки для ИИ-агента

Начинать с backend transition tests, затем добавить минимальный frontend smoke. Если browser automation недоступна, явно записать ручной checklist и что не удалось проверить.

### Проверка

- `cd services && go test ./...`.
- `npm run typecheck --workspaces --if-present`.
- `npm run lint`.
- Ручной browser smoke buyer/seller/admin marketplace flow.

### Возможные риски

- Тесты могут закрепить mock safe deal как production escrow, если не оставить явные пометки.
- Browser smoke может требовать seed data или подготовленного dev пользователя.

## FF-0401: Реализовать Creator Store domain

Статус: planned  
Версия: v0.4  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Автор может собрать витрину товаров.

### Контекст

Витрина связывает creator page и marketplace.

### Что нужно сделать

- Таблицы `creator_stores`, `store_items`.
- Store CRUD API.
- Store item ordering.
- Product availability checks.

### Acceptance criteria

- Автор добавляет published product.
- Hidden product не продаётся из store.
- Disclosure required for partner product.

### Зависимости

- Creator profiles.
- Products.

### Что не делать

- Не делать сложный recommendation engine.

### Подсказки для ИИ-агента

Store не должен копировать product полностью.

### Проверка

Store API tests.

### Возможные риски

- Продажа скрытого товара.

## FF-0402: Реализовать Creator Store UI

Статус: planned  
Версия: v0.4  
Приоритет: P0  
Компоненты: apps/web, packages/i18n

### Цель

Показать витрину на странице автора и управление в Studio.

### Контекст

Покупатель должен видеть долю автора.

### Что нужно сделать

- Store block on creator page.
- Studio store management.
- Add/remove/reorder items.
- Partner disclosure UI.

### Acceptance criteria

- Все тексты через i18n.
- Доля автора отображается понятно.
- Mobile layout работает.

### Зависимости

- Creator Store API.

### Что не делать

- Не превращать страницу автора в рекламную витрину.

### Подсказки для ИИ-агента

UX должен быть мягким и честным.

### Проверка

Frontend tests и manual QA.

### Возможные риски

- Агрессивная рекламность интерфейса.

## FF-0403: Реализовать PromoCode domain

Статус: planned  
Версия: v0.4  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Добавить промокоды для скидок и attribution.

### Контекст

Промокоды используются продавцами и авторами.

### Что нужно сделать

- Таблица `promo_codes`.
- Create/list/update endpoints.
- Validation dates/limits.
- Apply promo code in checkout.

### Acceptance criteria

- Code unique case-insensitive.
- Usage limits работают.
- Скидка не ломает минимальные суммы.

### Зависимости

- Orders.

### Что не делать

- Не разрешать stacking без явного правила.

### Подсказки для ИИ-агента

Скидка должна попадать в order snapshot.

### Проверка

Promo unit/API tests.

### Возможные риски

- Некорректный расчёт скидки.

## FF-0404: Реализовать Affiliate attribution

Статус: planned  
Версия: v0.4  
Приоритет: P0  
Компоненты: services/api, apps/web

### Цель

Связать продажу с автором и партнёрской ссылкой/промокодом.

### Контекст

Creator share должен фиксироваться на момент покупки.

### Что нужно сделать

- Таблицы `affiliate_links`, `affiliate_attributions`.
- Tracking endpoint.
- Attribution in checkout.
- Creator share snapshot.

### Acceptance criteria

- Order имеет корректную attribution.
- Повторная покупка не дублирует attribution.
- Модель attribution описана в docs/ADR при выборе.

### Зависимости

- Creator Store.
- Promo codes.

### Что не делать

- Не делать multi-level affiliate network.

### Подсказки для ИИ-агента

Last-click или другая модель должна быть зафиксирована.

### Проверка

Attribution tests.

### Возможные риски

- Споры о том, кому засчитана продажа.

## FF-0405: Добавить базовую аналитику для creator/seller

Статус: planned  
Версия: v0.4  
Приоритет: P1  
Компоненты: services/api, apps/web

### Цель

Показать продажи, донаты и переходы.

### Контекст

Аналитика помогает авторам и продавцам понимать результат.

### Что нужно сделать

- Analytics endpoints.
- Basic aggregates.
- Studio analytics page.
- Seller analytics page.

### Acceptance criteria

- Creator видит продажи из витрины.
- Seller видит продажи по авторам.
- Данные не раскрывают чужую приватную информацию.

### Зависимости

- Donations.
- Orders.
- Attribution.

### Что не делать

- Не делать сложный BI.

### Подсказки для ИИ-агента

Начать с простых агрегатов, позже snapshots.

### Проверка

Analytics tests на fixtures.

### Возможные риски

- Медленные запросы без индексов.

## FF-0501: Реализовать provider interfaces и registry

Статус: planned  
Версия: v0.5  
Приоритет: P0  
Компоненты: services/api, services/worker

### Цель

Сделать единый слой платёжных провайдеров.

### Контекст

Реальный провайдер ещё не выбран, домен не должен зависеть от него.

### Что нужно сделать

- Интерфейсы `PaymentProvider`, `PayoutProvider`, `SafeDealProvider`, `FiscalizationProvider`.
- Provider registry.
- Provider-agnostic statuses.
- Adapter contract tests.

### Acceptance criteria

- Домен вызывает только interfaces.
- Mock provider подключается через registry.
- Нет provider-specific условий в usecases.

### Зависимости

- Mock provider.
- Payment docs.

### Что не делать

- Не подключать production credentials.

### Подсказки для ИИ-агента

Сначала interfaces, потом adapters.

### Проверка

Unit tests registry и adapter contracts.

### Возможные риски

- Provider lock-in через доменные поля.

## FF-0502: Реализовать provider webhook pipeline

Статус: planned  
Версия: v0.5  
Приоритет: P0  
Компоненты: services/api, services/worker, infra/migrations

### Цель

Безопасно принимать и обрабатывать webhooks.

### Контекст

Webhooks подтверждают платежи, возвраты и выплаты.

### Что нужно сделать

- Таблица `provider_webhooks`.
- Endpoint `/providers/{provider}/webhooks`.
- Signature verification interface.
- Idempotent processing.
- Retry/dead-letter flow.

### Acceptance criteria

- Повтор webhook не меняет состояние дважды.
- Raw payload сохраняется безопасно.
- Failed webhook можно повторить.

### Зависимости

- Provider interfaces.

### Что не делать

- Не доверять webhook без подписи для real provider.

### Подсказки для ИИ-агента

Для mock можно имитировать signature.

### Проверка

Webhook integration tests.

### Возможные риски

- Двойное начисление денег.

## FF-0503: Подготовить tome adapter spike

Статус: planned  
Версия: v0.5  
Приоритет: P1  
Компоненты: services/api, docs/PAYMENTS.md

### Цель

Проверить применимость tome.ru как провайдера.

### Контекст

tome упомянут как возможный вариант, но требует provider review.

### Что нужно сделать

- Собрать требования API.
- Проверить платежи, refunds, payouts, safe deal.
- Описать status mapping draft.
- Пометить неизвестное как `PROVIDER_REVIEW_REQUIRED`.

### Acceptance criteria

- Есть spike report в docs или ADR.
- Нет production integration без проверки.

### Зависимости

- Доступ к документации провайдера.

### Что не делать

- Не хардкодить tome в домене.

### Подсказки для ИИ-агента

Если данных недостаточно, честно зафиксировать open questions.

### Проверка

Review `docs/PAYMENTS.md`.

### Возможные риски

- Провайдер не поддержит нужный flow.

## FF-0504: Подготовить ЮKassa/ЮMoney adapter spike

Статус: planned  
Версия: v0.5  
Приоритет: P1  
Компоненты: services/api, docs/PAYMENTS.md

### Цель

Проверить альтернативный provider path.

### Контекст

Нужен fallback, если tome не подходит.

### Что нужно сделать

- Проверить payment/refund/webhook/payout возможности.
- Описать ограничения.
- Описать fiscalization requirements.
- Подготовить adapter mapping draft.

### Acceptance criteria

- Документированы provider gaps.
- Нет прямой зависимости домена.

### Зависимости

- Provider docs/access.

### Что не делать

- Не делать production payout без legal review.

### Подсказки для ИИ-агента

Отдельно проверить marketplace/split/safe deal capabilities.

### Проверка

Review с Payments agent.

### Возможные риски

- Неподходящая модель выплат.

## FF-0505: Реализовать refunds MVP

Статус: planned  
Версия: v0.5  
Приоритет: P0  
Компоненты: services/api, services/worker, apps/admin

### Цель

Поддержать полный и частичный возврат через abstraction.

### Контекст

Refund нужен для disputes и support.

### Что нужно сделать

- Таблица `refunds`.
- Refund usecase.
- Admin refund action.
- Ledger correction.
- Mock provider refund.

### Acceptance criteria

- Refund total не превышает payment amount.
- Partial refund корректирует deal/order/balance.
- Action audit logged.

### Зависимости

- Payment provider pipeline.
- Balance transaction model.

### Что не делать

- Не обещать правила возврата без legal review.

### Подсказки для ИИ-агента

Refund receipt оставить placeholder.

### Проверка

Refund tests.

### Возможные риски

- Несогласованность ledger после partial refund.

## FF-0506: Реализовать safe deal lifecycle worker

Статус: planned  
Версия: v0.5  
Приоритет: P0  
Компоненты: services/worker, services/api

### Цель

Автоматизировать дедлайны safe deal.

### Контекст

Нужны auto-confirm и сроки ответа.

### Что нужно сделать

- Worker для `auto_confirm_at`.
- Configurable deadlines.
- Deal transition guards.
- Notifications.
- Audit/deal events.

### Acceptance criteria

- Auto-confirm срабатывает один раз.
- Disputed deal не auto-confirmed.
- Сроки не хардкодятся.

### Зависимости

- Deals.
- Notifications.

### Что не делать

- Не решать споры автоматически.

### Подсказки для ИИ-агента

Использовать transaction locks или safe retry.

### Проверка

Worker integration tests.

### Возможные риски

- Race conditions.

## FF-0601: Реализовать Wallet и BalanceTransaction

Статус: planned  
Версия: v0.6  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Создать ledger-like основу внутреннего баланса.

### Контекст

Seller balance нужен для холдов, выплат, возвратов и споров.

### Что нужно сделать

- Таблицы `wallets`, `balance_transactions`.
- Ledger service.
- Aggregates update.
- Invariant checks.

### Acceptance criteria

- Деньги не хранятся float.
- Posted transaction immutable.
- Available balance не уходит в минус.

### Зависимости

- Orders/deals/payments.

### Что не делать

- Не называть wallet банковским счётом.

### Подсказки для ИИ-агента

Свериться с `docs/PAYMENTS.md`.

### Проверка

Ledger unit/integration tests.

### Возможные риски

- Расхождение агрегатов и транзакций.

## FF-0602: Реализовать payout requests

Статус: planned  
Версия: v0.6  
Приоритет: P0  
Компоненты: services/api, apps/web, infra/migrations

### Цель

Продавец может запросить выплату.

### Контекст

Выплаты проходят через `PayoutProvider` и manual review policy.

### Что нужно сделать

- Таблица `payouts`.
- Seller payout endpoints.
- Payout UI.
- Available balance check.
- Idempotency.

### Acceptance criteria

- Payout amount <= available balance.
- Request moves funds to pending payout.
- UI показывает статусы.

### Зависимости

- Wallet/ledger.

### Что не делать

- Не делать реальные выплаты без provider review.

### Подсказки для ИИ-агента

Mock payout provider обязателен для тестов.

### Проверка

Payout API tests.

### Возможные риски

- Двойная заявка на вывод.

## FF-0603: Реализовать admin payout review

Статус: planned  
Версия: v0.6  
Приоритет: P0  
Компоненты: apps/admin, services/api

### Цель

Админ может одобрить или отклонить payout.

### Контекст

Manual review снижает риск fraud и 115-ФЗ проблем.

### Что нужно сделать

- Admin payouts queue.
- Approve/reject actions.
- Risk flag display.
- Audit log.

### Acceptance criteria

- Только admin может approve/reject.
- Все решения аудируются.
- Rejected payout возвращает средства по правилам.

### Зависимости

- Payout requests.
- Risk flags basic.

### Что не делать

- Не показывать секретные реквизиты без маскирования.

### Подсказки для ИИ-агента

Подумать о read-only support роли.

### Проверка

Admin permission tests.

### Возможные риски

- Ошибочная выплата high-risk seller.

## FF-0604: Реализовать Seller Lite/Pro limits

Статус: planned  
Версия: v0.6  
Приоритет: P1  
Компоненты: services/api, apps/web, apps/admin

### Цель

Разделить ограничения начинающих и проверенных продавцов.

### Контекст

Seller Lite имеет лимиты и повышенный hold, Seller Pro — verification.

### Что нужно сделать

- Limit policy config.
- Seller type checks.
- UI статуса продавца.
- Admin override.

### Acceptance criteria

- Lite limits применяются на API.
- Pro требует verification status.
- Лимиты не хардкодятся.

### Зависимости

- Seller profile.
- Payouts.

### Что не делать

- Не обещать налоговую безопасность.

### Подсказки для ИИ-агента

LEGAL_REVIEW_REQUIRED для текстов предупреждений.

### Проверка

Limit tests.

### Возможные риски

- Блокировка честных продавцов.

## FF-0605: Добавить базовую отчётность баланса

Статус: planned  
Версия: v0.6  
Приоритет: P2  
Компоненты: apps/web, services/api

### Цель

Продавец видит движения баланса.

### Контекст

Прозрачность снижает обращения в поддержку.

### Что нужно сделать

- Balance transactions endpoint.
- Filters by type/status.
- Balance page.
- Export placeholder.

### Acceptance criteria

- Продавец видит свои движения.
- Чужие движения недоступны.
- Суммы форматируются по локали.

### Зависимости

- Ledger.

### Что не делать

- Не делать бухгалтерский кабинет.

### Подсказки для ИИ-агента

Тексты про налоги осторожные.

### Проверка

Permission tests.

### Возможные риски

- Неправильная интерпретация баланса пользователем.

## FF-0701: Реализовать dispute domain

Статус: planned  
Версия: v0.7  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Покупатель может открыть спор по deal.

### Контекст

Спор удерживает выплату до решения.

### Что нужно сделать

- Таблицы `disputes`, `dispute_evidence`.
- Open dispute endpoint.
- Status workflow.
- Deadline validation.

### Acceptance criteria

- Спор открывается только в допустимый срок.
- Deal получает `disputed`.
- Payout блокируется.

### Зависимости

- Safe deal.
- File storage.

### Что не делать

- Не решать спор без админа.

### Подсказки для ИИ-агента

Evidence private by default.

### Проверка

Dispute API tests.

### Возможные риски

- Открытие спора после завершения без правила.

## FF-0702: Реализовать dispute evidence upload

Статус: planned  
Версия: v0.7  
Приоритет: P0  
Компоненты: services/api, apps/web, storage

### Цель

Стороны могут прикладывать доказательства.

### Контекст

Evidence может содержать приватные данные.

### Что нужно сделать

- Signed upload for evidence.
- Access checks.
- Evidence list UI.
- MIME/size validation.

### Acceptance criteria

- Evidence доступно только сторонам и админам.
- Файлы private.
- Upload auditable.

### Зависимости

- File abstraction.
- Dispute domain.

### Что не делать

- Не делать public evidence URLs.

### Подсказки для ИИ-агента

Не логировать содержимое evidence.

### Проверка

File permission tests.

### Возможные риски

- Утечка приватных доказательств.

## FF-0703: Реализовать dispute UI для buyer/seller

Статус: planned  
Версия: v0.7  
Приоритет: P1  
Компоненты: apps/web, packages/i18n

### Цель

Пользователи видят спор, сроки и действия.

### Контекст

Safe deal должен объясняться человеческим языком.

### Что нужно сделать

- Dispute page.
- Timeline.
- Evidence upload.
- Messages placeholder.
- Deadlines display.

### Acceptance criteria

- Тексты через i18n.
- Buyer/seller видят только свои споры.
- Deadlines понятны.

### Зависимости

- Dispute API.

### Что не делать

- Не писать юридические гарантии.

### Подсказки для ИИ-агента

`LEGAL_REVIEW_REQUIRED` для спорных формулировок.

### Проверка

E2E dispute open.

### Возможные риски

- Пользователь не понимает next step.

## FF-0704: Реализовать admin arbitration

Статус: planned  
Версия: v0.7  
Приоритет: P0  
Компоненты: apps/admin, services/api

### Цель

Админ принимает решение по спору.

### Контекст

Решение влияет на refund, payout и ledger.

### Что нужно сделать

- Admin dispute queue.
- Resolve to buyer/seller.
- Partial refund action.
- Audit log.
- Deal events.

### Acceptance criteria

- Решение меняет deal status.
- Ledger корректируется.
- Все действия аудируются.

### Зависимости

- Refunds.
- Ledger.

### Что не делать

- Не удалять evidence.

### Подсказки для ИИ-агента

Опасные действия требуют confirmation.

### Проверка

Admin arbitration tests.

### Возможные риски

- Ошибочная финансовая корректировка.

## FF-0705: Добавить dispute notifications

Статус: planned  
Версия: v0.7  
Приоритет: P1  
Компоненты: services/api, services/ws, services/worker

### Цель

Стороны получают уведомления о споре.

### Контекст

Сроки ответа важны для fair process.

### Что нужно сделать

- Notification records.
- WS events.
- Email placeholder.
- Deadline reminders.

### Acceptance criteria

- Buyer/seller получают событие.
- Payload не содержит секреты.
- Locale учитывается.

### Зависимости

- Notifications model.
- WS gateway.

### Что не делать

- Не отправлять push без consent strategy.

### Подсказки для ИИ-агента

Email templates через i18n.

### Проверка

Notification tests.

### Возможные риски

- Пропущенные дедлайны.

## FF-0801: Реализовать RiskFlag domain

Статус: planned  
Версия: v0.8  
Приоритет: P0  
Компоненты: services/api, infra/migrations

### Цель

Фиксировать подозрительную активность.

### Контекст

Risk flags нужны для manual review и anti-fraud.

### Что нужно сделать

- Таблица `risk_flags`.
- Create/list/resolve endpoints.
- Severity.
- Entity linking.

### Acceptance criteria

- High/critical flags видны админам.
- Resolution audit logged.
- Flags можно связать с seller/order/payout.

### Зависимости

- Admin.

### Что не делать

- Не делать auto-ban как default.

### Подсказки для ИИ-агента

Risk flag не является юридическим решением.

### Проверка

Risk flag API tests.

### Возможные риски

- Ложные срабатывания.

## FF-0802: Добавить Seller Pro verification workflow

Статус: planned  
Версия: v0.8  
Приоритет: P0  
Компоненты: services/api, apps/web, apps/admin

### Цель

Продавец может запросить Seller Pro статус.

### Контекст

Seller Pro даёт большие лимиты и требует проверки.

### Что нужно сделать

- Verification fields.
- Submit workflow.
- Admin review.
- Status display.
- Document upload placeholder.

### Acceptance criteria

- Pro требует ИНН или другой настроенный набор данных.
- Admin может approve/reject.
- Sensitive data protected.

### Зависимости

- Seller profile.
- File security.

### Что не делать

- Не собирать лишние документы.

### Подсказки для ИИ-агента

LEGAL_REVIEW_REQUIRED для состава данных.

### Проверка

Verification tests.

### Возможные риски

- Сбор лишних персональных данных.

## FF-0803: Реализовать лимиты Seller Lite

Статус: planned  
Версия: v0.8  
Приоритет: P0  
Компоненты: services/api, apps/admin

### Цель

Ограничить риск начинающих продавцов.

### Контекст

Lite sellers должны иметь оборотные и payout лимиты.

### Что нужно сделать

- Configurable limits.
- Enforcement in orders/payouts.
- Admin override.
- User-facing explanation.

### Acceptance criteria

- Лимит блокирует действие на backend.
- UI объясняет причину.
- Override аудируется.

### Зависимости

- Seller type.
- Risk flags.

### Что не делать

- Не хардкодить лимиты.

### Подсказки для ИИ-агента

Тексты через i18n и legal review для спорного.

### Проверка

Limit integration tests.

### Возможные риски

- Обход лимитов через повторные аккаунты.

## FF-0804: Добавить suspicious activity review queue

Статус: planned  
Версия: v0.8  
Приоритет: P1  
Компоненты: apps/admin, services/api

### Цель

Админ видит очередь подозрительных событий.

### Контекст

Manual review нужен до public beta.

### Что нужно сделать

- Admin risk queue.
- Filters by severity/type.
- Resolve/dismiss actions.
- Links to entity details.

### Acceptance criteria

- Queue показывает open flags.
- Действия auditable.
- Нет секретов в списке.

### Зависимости

- RiskFlag domain.

### Что не делать

- Не показывать лишние персональные данные.

### Подсказки для ИИ-агента

Сделать очередь рабочей, не декоративной.

### Проверка

Admin manual QA.

### Возможные риски

- Перегрузка админов шумом.

## FF-0805: Добавить audit log viewer

Статус: planned  
Версия: v0.8  
Приоритет: P1  
Компоненты: apps/admin, services/api

### Цель

Админ может просматривать audit logs.

### Контекст

Audit нужен для денег, споров и безопасности.

### Что нужно сделать

- Audit log list endpoint.
- Filters.
- Entity/action view.
- Sensitive data masking.

### Acceptance criteria

- Audit logs доступны только admin.
- Фильтры работают.
- Secrets не отображаются.

### Зависимости

- Audit log model.

### Что не делать

- Не разрешать редактирование audit logs.

### Подсказки для ИИ-агента

Append-only принцип обязателен.

### Проверка

Permission tests.

### Возможные риски

- Утечка данных через before/after payload.

## FF-0901: Подготовить PWA baseline

Статус: planned  
Версия: v0.9  
Приоритет: P0  
Компоненты: apps/web, apps/mobile-web

### Цель

Сделать web PWA-ready.

### Контекст

Нативные приложения не входят в MVP.

### Что нужно сделать

- Manifest.
- Icons.
- Service worker strategy.
- Installability checks.
- Offline fallback, если уместно.

### Acceptance criteria

- App installable where supported.
- Basic pages load correctly.
- No broken cache for auth/payment pages.

### Зависимости

- Stable web app.

### Что не делать

- Не делать native app.

### Подсказки для ИИ-агента

Checkout/payment не кэшировать опасно.

### Проверка

PWA audit.

### Возможные риски

- Некорректный cache sensitive pages.

## FF-0902: Адаптировать buyer mobile flows

Статус: planned  
Версия: v0.9  
Приоритет: P0  
Компоненты: apps/web, apps/mobile-web

### Цель

Покупателю удобно покупать и открывать споры с телефона.

### Контекст

Mobile-first важен после MVP.

### Что нужно сделать

- Mobile marketplace.
- Mobile product page.
- Mobile checkout.
- Mobile order/dispute pages.

### Acceptance criteria

- Основной flow проходит на mobile viewport.
- Текст не перекрывается.
- Формы удобны.

### Зависимости

- Marketplace/order/dispute.

### Что не делать

- Не скрывать важные safe deal условия.

### Подсказки для ИИ-агента

Проверить длинные русские строки.

### Проверка

Mobile E2E.

### Возможные риски

- Перегруженный checkout.

## FF-0903: Адаптировать studio/seller mobile flows

Статус: planned  
Версия: v0.9  
Приоритет: P1  
Компоненты: apps/web, apps/mobile-web

### Цель

Автор и продавец могут выполнять базовые действия с телефона.

### Контекст

Полные кабинеты сложны, но ключевые сценарии должны работать.

### Что нужно сделать

- Mobile Studio overview.
- Mobile Seller orders.
- Mobile payouts overview.
- Mobile notifications.

### Acceptance criteria

- Основные действия доступны.
- Таблицы адаптированы.
- Нет горизонтального хаоса.

### Зависимости

- Studio/Seller dashboards.

### Что не делать

- Не пытаться перенести всю admin-like плотность на телефон.

### Подсказки для ИИ-агента

Использовать списки и summary вместо широких таблиц.

### Проверка

Responsive QA.

### Возможные риски

- Потеря важных действий на mobile.

## FF-0904: Подготовить push notification strategy

Статус: planned  
Версия: v0.9  
Приоритет: P2  
Компоненты: docs, services/worker, apps/web

### Цель

Описать и подготовить push-уведомления.

### Контекст

Push может иметь технические и юридические ограничения.

### Что нужно сделать

- Strategy document section.
- Consent flow plan.
- Notification types.
- Provider choice placeholder.
- Legal review marks.

### Acceptance criteria

- Push не включён без consent.
- Спорные тексты помечены `LEGAL_REVIEW_REQUIRED`.

### Зависимости

- Notification model.

### Что не делать

- Не включать массовые push без политики.

### Подсказки для ИИ-агента

Можно начать с in-app notifications.

### Проверка

Docs review.

### Возможные риски

- Нарушение требований согласия.

## FF-1001: Подготовить production deployment

Статус: planned  
Версия: v1.0  
Приоритет: P0  
Компоненты: infra, docs/DEPLOYMENT.md

### Цель

Развернуть controlled production environment.

### Контекст

Public Beta требует стабильного deployment.

### Что нужно сделать

- Production compose example.
- Nginx TLS outline.
- Healthchecks.
- Logs.
- Rollback plan.

### Acceptance criteria

- Production deploy reproducible.
- Secrets outside Git.
- Rollback documented.

### Зависимости

- Staging stable.

### Что не делать

- Не коммитить реальные доступы.

### Подсказки для ИИ-агента

Серверные доступы только в `SERVER_ACCESS.md` вне Git.

### Проверка

Staging rehearsal.

### Возможные риски

- Невозможность быстро откатиться.

## FF-1002: Настроить backups и restore rehearsal

Статус: planned  
Версия: v1.0  
Приоритет: P0  
Компоненты: infra/scripts, docs/DEPLOYMENT.md

### Цель

Проверить восстановление данных.

### Контекст

Backup без restore test не считается готовым.

### Что нужно сделать

- PostgreSQL backup script.
- S3/R2 metadata/object strategy.
- Restore checklist.
- Rehearsal on staging.

### Acceptance criteria

- Restore test выполнен.
- Результат записан в handoff.
- Backups encrypted или защищены.

### Зависимости

- Production-like staging.

### Что не делать

- Не хранить backups в репозитории.

### Подсказки для ИИ-агента

Сверить ledger после restore.

### Проверка

Restore rehearsal.

### Возможные риски

- Потеря private files.

## FF-1003: Подготовить support и moderation workflows

Статус: planned  
Версия: v1.0  
Приоритет: P0  
Компоненты: apps/admin, docs/PRODUCT_SPEC.md, docs/LEGAL_REVIEW.md

### Цель

Описать и проверить операционные процессы.

### Контекст

После public beta появятся споры, жалобы и выплаты.

### Что нужно сделать

- Support queues.
- Moderation queues.
- Dispute SOP.
- Payout review SOP.
- Category policy placeholders.

### Acceptance criteria

- Админ понимает next action.
- Спорные юридические места помечены.
- Workflows связаны с admin UI.

### Зависимости

- Admin disputes/payouts/risk queues.

### Что не делать

- Не обещать автоматический арбитраж.

### Подсказки для ИИ-агента

Описывать человечески, без юридической самоуверенности.

### Проверка

Manual dry run.

### Возможные риски

- Недостаточная поддержка пользователей.

## FF-1004: Провести legal/payment readiness review

Статус: planned  
Версия: v1.0  
Приоритет: P0  
Компоненты: docs/LEGAL_REVIEW.md, docs/PAYMENTS.md

### Цель

Не запускать деньги и категории без проверки.

### Контекст

FanFuel связан с платежами, выплатами, налогами и цифровыми товарами.

### Что нужно сделать

- Проверить legal questions.
- Проверить provider constraints.
- Обновить forbidden/restricted categories.
- Подтвердить fiscalization flow.
- Подтвердить payout flow.

### Acceptance criteria

- Все critical LEGAL_REVIEW_REQUIRED закрыты или отложены.
- MVP categories approved.
- Payment provider path approved.

### Зависимости

- Юрист.
- Провайдер.

### Что не делать

- Не заменять review мнением агента.

### Подсказки для ИИ-агента

Фиксировать вопросы, не придумывать ответы.

### Проверка

Документированное approval/decision.

### Возможные риски

- Блокирующие требования провайдера.

## FF-1005: Подготовить controlled launch checklist

Статус: planned  
Версия: v1.0  
Приоритет: P0  
Компоненты: docs, apps/admin, infra

### Цель

Запустить public beta ограниченно и управляемо.

### Контекст

Нужен контроль категорий, продавцов, платежей и поддержки.

### Что нужно сделать

- Launch checklist.
- First categories list.
- First creators/sellers onboarding.
- Monitoring checklist.
- Incident contacts template.

### Acceptance criteria

- Есть Go/No-Go checklist.
- Есть rollback plan.
- Есть support owner.

### Зависимости

- Production deployment.
- Legal/payment readiness.

### Что не делать

- Не открывать рискованные категории.

### Подсказки для ИИ-агента

Controlled launch лучше broad launch.

### Проверка

Launch dry run.

### Возможные риски

- Слишком широкий запуск без поддержки.

# UI/UX tasks

## UX-TASK-001: Создать UI/UX документацию и tracker статусов

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Затрагивает: docs

### Цель

Создать источник истины по страницам, статусам, сценариям, состояниям и запретам на преждевременную разработку.

### Что нужно сделать

- Создать `docs/UI_UX_TRACKER.md`.
- Создать `docs/PAGE_MAP.md`.
- Создать `docs/PAGE_SPECS.md`.
- Создать `docs/USER_FLOWS.md`.
- Создать `docs/INFORMATION_ARCHITECTURE.md`.
- Создать `docs/UX_RULES.md`.
- Создать `docs/UI_STATES.md`.
- Создать `docs/UX_WRITING.md`.
- Создать `docs/UX_IMPLEMENTATION_STATUS.md`.
- Создать `docs/DO_NOT_BUILD_YET.md`.

### Что не нужно делать

- Не создавать production routes для будущих страниц.
- Не менять UI код текущих страниц.

### Acceptance criteria

- Для текущих страниц проставлены статусы.
- Для будущих страниц указано, что их не нужно создавать сейчас.
- Есть механизм ручного добавления UX-логики.
- Следующие агенты понимают, какие документы читать перед UI-задачами.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/DO_NOT_BUILD_YET.md`

### Комментарии для агента

Задача выполнена как документационная. Если документы меняются, синхронизировать tracker/spec/tasks.

## UX-TASK-002: Сверить текущие страницы с UI/UX tracker

Статус: completed  
Версия: v0.2  
Приоритет: P0  
Затрагивает: `apps/web`, `apps/admin`, `apps/widget`, `packages/ui`, docs

### Цель

Зафиксировать фактические routes, компоненты и расхождения текущей реализации с целевым UX.

### Что нужно сделать

- Найти текущие routes.
- Найти текущие компоненты и layouts.
- Проверить hardcoded UI text.
- Проверить hardcoded colors вне token layer.
- Записать выводы в `docs/DESIGN_AUDIT.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`.

### Что не нужно делать

- Не исправлять найденные UX-долги без отдельной задачи.

### Acceptance criteria

- Текущие страницы имеют статус `PARTIAL` или `NEEDS_REWORK`.
- Главные UX-долги перечислены.

### Связанные документы

- `docs/DESIGN_AUDIT.md`
- `docs/UI_UX_TRACKER.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Аудит показал, что `/me/profile` является главным временным экраном и требует разделения.

## UX-TASK-003: Поддерживать UI/UX tracker после каждой UI-задачи

Статус: planned  
Версия: v0.3  
Приоритет: P0  
Затрагивает: docs

### Цель

Сделать tracker живым документом, а не одноразовым аудитом.

### Что нужно сделать

- Обновлять статус страницы после изменений.
- Добавлять новые `PAGE-ID`, `FLOW-ID`, `CMP-ID`.
- Фиксировать расхождения в `docs/DESIGN_AUDIT.md` или `docs/UX_IMPLEMENTATION_STATUS.md`.

### Что не нужно делать

- Не менять статусы future pages без причины и задачи.

### Acceptance criteria

- Любая новая UI page отражена в tracker/spec/tasks.
- Future pages не появляются в коде случайно.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Это постоянный процесс для всех будущих UI задач.

## UX-TASK-004: Привести главную страницу к spec v0.3

Статус: completed  
Версия: v0.3  
Приоритет: P1  
Затрагивает: PAGE-HOME, `apps/web/src/app/page.tsx`, i18n

### Цель

Уточнить главную страницу как вход в creator-commerce, не превращая её в generic SaaS landing.

### Что нужно сделать

- Добавить role-aware входы для buyer/streamer/seller.
- Подготовить marketplace preview без fake products.
- Объяснить safe deal осторожно и без юридических обещаний.
- Проверить mobile.

### Что не нужно делать

- Не создавать marketplace внутри главной.
- Не добавлять future pages без routes/spec.

### Acceptance criteria

- Главная за 5 секунд объясняет FanFuel.
- Тексты через i18n.
- Light/dark/mobile проверены.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/UX_WRITING.md`
- `docs/UX_RULES.md`

### Комментарии для агента

Если добавляется ссылка на marketplace, сначала убедиться, что route готов или ссылка скрыта.

## UX-TASK-005: Привести публичную страницу стримера к spec

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: PAGE-CREATOR-PUBLIC, PAGE-CREATOR-DONATE, `apps/web/src/app/creators/[slug]/page.tsx`

### Цель

Улучшить текущую creator page без добавления creator store до v0.4.

### Что нужно сделать

- Добавить structured loading/empty/error states.
- Улучшить donation form feedback.
- Зафиксировать решение: отдельный `/donate` route или embedded flow.
- Подготовить место для avatar/banner после storage задачи.

### Что не нужно делать

- Не добавлять витрину товаров.
- Не подключать реальные платежи.

### Acceptance criteria

- Donate MVP не ломается.
- Empty goals/donations выглядят осмысленно.
- Payment status понятен.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/UI_STATES.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Сохранять mock provider как dev-only паттерн.

## UX-TASK-006: Спроектировать marketplace page foundations перед реализацией

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: PAGE-MARKETPLACE, PAGE-MARKETPLACE-CATEGORY, PAGE-PRODUCT, PAGE-CHECKOUT

### Цель

Подготовить marketplace UI к реализации после Product/Category/Order API.

### Что нужно сделать

- Уточнить product card.
- Уточнить filters/search/sort.
- Уточнить product page.
- Уточнить checkout states.
- Обновить i18n keys.

### Что не нужно делать

- Не создавать статические fake pages.
- Не включать risky categories.

### Acceptance criteria

- Marketplace pages имеют готовые specs и states.
- Реализация начинается только после API/domain задач.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/DOMAIN_MODEL.md`
- `docs/API_PLAN.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Marketplace — v0.3 priority, но порядок должен быть domain/API first.

## UX-TASK-007: Привести dashboard layout к spec

Статус: partial  
Версия: v0.3  
Приоритет: P0  
Затрагивает: PAGE-ME-PROFILE, PAGE-BUYER-DASHBOARD, PAGE-STUDIO-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ADMIN-DASHBOARD

### Цель

Разделить текущий `/me/profile` на понятные role contexts и dashboard patterns.

### Что нужно сделать

- Спроектировать `RoleSwitcher`.
- Подготовить shared dashboard layout.
- Зафиксировать отдельные routes `/me/settings` и `/studio` как ближайшие страницы "скоро".
- Вынести Studio goals/widgets из `/me/profile`.
- Вынести seller settings в seller section.
- Сохранить `/me/profile` как account/settings fallback.

### Что не нужно делать

- Не переписывать все dashboards сразу.
- Не добавлять payouts/disputes/store до их версий.

### Acceptance criteria

- Пользователь с несколькими ролями понимает, где находится.
- `/me/profile` перестаёт быть dumping ground.
- Mobile navigation работает.

### Связанные документы

- `docs/INFORMATION_ARCHITECTURE.md`
- `docs/PAGE_SPECS.md`
- `docs/UI_UX_TRACKER.md`

### Комментарии для агента

Реализовывать по частям, начиная со Studio widgets/goals.

## UX-TASK-008: Добавить стандартные empty/loading/error states

Статус: completed  
Версия: v0.3  
Приоритет: P1  
Затрагивает: current pages, `packages/ui`

### Цель

Сделать текущие страницы устойчивыми и понятными при загрузке, пустых данных и ошибках.

### Что нужно сделать

- Заменить plain loading на skeleton там, где layout известен.
- Добавить EmptyState для goals/widgets/donations/users.
- Добавить секционные errors.
- Проверить unauthorized/forbidden states.

### Что не нужно делать

- Не добавлять новые функции вместе со states.

### Acceptance criteria

- Current pages не показывают пустые зоны без объяснения.
- Ошибки не раскрывают raw backend details.

### Связанные документы

- `docs/UI_STATES.md`
- `docs/UX_RULES.md`

### Комментарии для агента

Начать с `/me/profile`, `/creators/[slug]`, `apps/admin`.

## UX-TASK-009: Обновить UX writing и i18n для новых состояний

Статус: completed  
Версия: v0.3  
Приоритет: P1  
Затрагивает: `packages/i18n`, current/future UI

### Цель

Привести тексты ошибок, empty states, safe deal, донатов и marketplace к единому тону.

### Что нужно сделать

- Добавить ru/en keys для states.
- Убрать технические тексты из UI.
- Пометить legal/payment тексты.

### Что не нужно делать

- Не писать финальные legal documents.

### Acceptance criteria

- Нет новых user-facing строк вне i18n.
- Тон соответствует `docs/UX_WRITING.md`.

### Связанные документы

- `docs/UX_WRITING.md`
- `docs/I18N.md`

### Комментарии для агента

Русский default, английский поддерживается.

## UX-TASK-010: Проверить mobile UX текущих страниц

Статус: planned  
Версия: v0.3  
Приоритет: P1  
Затрагивает: `apps/web`, `apps/admin`, `apps/widget`

### Цель

Проверить, что текущие страницы не ломаются на mobile и в обеих темах.

### Что нужно сделать

- Проверить 320/390/768/1440 viewports.
- Проверить long Russian strings.
- Проверить forms, buttons, widget preview.
- Записать результаты в `docs/DESIGN_AUDIT.md`.

### Что не нужно делать

- Не переписывать visual style без конкретных багов.

### Acceptance criteria

- Нет перекрытия текста.
- Нет горизонтального хаоса в таблицах/формах.
- Light/dark работают.

### Связанные документы

- `docs/DESIGN_AUDIT.md`
- `docs/UI_RULES.md`
- `docs/UX_RULES.md`

### Комментарии для агента

При возможности использовать Playwright screenshots.

## UX-TASK-011: Сделать marketplace главной точкой входа и поправить auth navigation

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS, PAGE-FOR-STREAMERS, PAGE-FOR-SELLERS, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER, CMP-TOPBAR

### Цель

Убрать generic landing с `/`, сделать marketplace главным входом, добавить три ролевых лендинга и исправить навигацию после авторизации.

### Что сделано

- `/` перенаправляет на `/marketplace`.
- Marketplace получил buyer-facing benefits block перед каталогом.
- Добавлены `/for-buyers`, `/for-streamers`, `/for-sellers`.
- Topbar показывает вход/регистрацию только гостю и профиль только авторизованному пользователю.
- `/auth/login` и `/auth/register` перенаправляют уже авторизованного пользователя на marketplace.
- Auth layout сделан компактнее.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не добавлялись payouts, disputes, real payment UI, creator store и risky categories.
- Не менялись backend endpoints и доменная модель.

### Acceptance criteria

- При открытии `/` пользователь попадает в marketplace.
- После входа верхняя панель не показывает кнопки входа и регистрации.
- Гость не видит кнопку профиля.
- Страница входа визуально компактная, не съезжает вниз и не растягивает форму.
- Ролевые лендинги используют semantic tokens и i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Нужен отдельный screenshot QA pass по `UX-TASK-010`, потому что Playwright/mobile проверка в рамках задачи не выполнялась.

## UX-TASK-012: Сделать залогиненную верхнюю панель ближе к marketplace shell

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Сделать authenticated topbar похожим на рабочую панель маркетплейса: логотип, поиск, notification placeholder и меню аккаунта вместо набора больших nav-ссылок.

### Что сделано

- Для авторизованного пользователя добавлен topbar search, который ведёт в `/marketplace?query=...`.
- Добавлен compact actions block с notification placeholder.
- Добавлено меню аккаунта с профилем, покупками, продажами для seller role, настройками, темой, языком и выходом.
- Пункты без готового домена оставлены disabled без перехода на future routes.
- Финансы показаны только как disabled review item, без fake balance и без обещаний выплат.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не создавались страницы сообщений, финансов, выплат или помощи.
- Не добавлялись fake notifications, fake balance и real payout UI.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- Вошедший пользователь видит поиск и меню аккаунта.
- Гость продолжает видеть публичную навигацию.
- Поиск из topbar открывает marketplace с query.
- Меню аккаунта не уезжает за экран на mobile.
- Все новые тексты идут через i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Настоящий notification center, messages и finance/payout sections требуют отдельных domain/API задач и review.

## UX-TASK-013: Доуплотнить authenticated topbar и меню аккаунта

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: CMP-TOPBAR, PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD

### Цель

Исправить mobile layout залогиненного topbar и сделать account menu структурным, без вложенных dropdown-сломов и без переходов на неготовые страницы.

### Что сделано

- Authenticated topbar на mobile оставлен в одну строку: логотип, поиск, уведомления, меню пользователя.
- Account menu разделено на категории: аккаунт, маркетплейс, поддержка, FanFuel Studio, настройки.
- Подпункты меню получили небольшой отступ слева.
- Theme control внутри меню работает как компактный dropdown поверх меню, без `OS/LT/DK`-сегмента и без растягивания списка.
- Language control внутри меню работает как dropdown с вариантами "Русский" и "English"; выбор сохраняется в locale preferences.
- `/me/settings` добавлен в план как отдельная страница "скоро".
- `/studio` явно оставлен planned/"скоро" до реализации полноценной Studio.

### Что не делалось

- Не создавались пустые routes `/me/settings` и `/studio`.
- Не включались notifications, messages, finance или payout flows.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- На мобильной ширине topbar не переносит элементы на вторую строку.
- Theme и language dropdown открываются поверх account menu и не ломают mobile layout.
- Profile, settings и Studio разделены в IA/docs.
- Все новые строки добавлены в i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Следующий настоящий шаг — реализация `UX-TASK-007` с отдельными страницами и route guards.

## UX-TASK-014: Сделать гостевое topbar menu похожим на auth shell

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Заменить публичную навигацию гостя на компактный topbar с поиском и dropdown menu, чтобы структура гостя и авторизованного пользователя была предсказуемой.

### Что сделано

- Поиск в верхней панели доступен гостю и авторизованному пользователю.
- Placeholder поиска стал "Найти товар, услугу или автора" на широком экране и "Поиск" на mobile.
- Гостевое dropdown menu содержит вход, регистрацию, marketplace и ролевые публичные страницы.
- Пункт покупок не добавлен для гостя, потому что гостевой заказ должен открываться по ссылке из письма.
- Theme и language controls в гостевом меню используют overlay-dropdown, как в account menu.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не создавались guest purchases/history pages.
- Не добавлялись notification, messages, finance, payouts или real payment UI.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- Гость видит поиск, burger/dropdown menu, вход и регистрацию.
- В гостевом меню нет пункта покупок.
- Topbar остаётся одной строкой на mobile.
- Theme и language dropdown не растягивают меню внутри.
- Все новые тексты идут через i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Расширение поиска по авторам/категориям должно проверяться отдельно на уровне marketplace API/индекса, если текущий backend ищет только товары.

## UX-TASK-015: Отполировать topbar search на mobile

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Исправить mobile search в верхней панели после гостевого меню: убрать ложное сокращение placeholder на 390px, выровнять кнопку поиска внутри поля и убрать dev hydration overlay, вызванный внешними browser-injected attributes.

### Что сделано

- Placeholder topbar search выбирается по фактической доступной ширине input, а не только по breakpoint.
- Search button выровнен как inset-кнопка с одинаковыми отступами сверху, справа и снизу.
- На topbar search и marketplace toolbar form controls добавлен точечный `suppressHydrationWarning` для внешнего `__gcruniqueid`/похожих injected attributes.

### Что не делалось

- Не расширялся backend search по авторам и категориям.
- Не менялась marketplace API-логика и структура данных.

### Acceptance criteria

- На 390px "Найти товар, услугу или автора" остаётся, если строка помещается.
- На узких ширинах placeholder всё ещё может стать "Поиск", если места реально мало.
- Search button не выглядит смещённой вправо.
- Dev overlay не блокирует тестовый просмотр из-за стороннего атрибута на form controls.

## UX-TASK-016: Сделать topbar search единым control и починить mobile auth API

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: CMP-TOPBAR, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER, FLOW-BUYER-SEARCH

### Цель

Выровнять topbar search по высоте с соседними кнопками и сделать search submit встроенным правым сегментом поля. Убрать mobile dev hydration overlay на auth pages и исключить ситуацию, когда телефон пытается отправить API-запросы на свой `localhost:8080`.

### Что сделано

- Topbar search получил фиксированную высоту, совпадающую с topbar buttons: 40px на desktop и 38px на mobile.
- Кнопка поиска встроена в поле правым сегментом с border divider и без отдельной inset-плашки.
- На login/register forms и controls добавлен `suppressHydrationWarning` для внешних injected attributes.
- Добавлен web route proxy `/api/v1/*`, который серверно прокидывает запросы к Go API через `FANFUEL_INTERNAL_API_BASE_URL`/`API_BASE_URL`/fallback `localhost:8080`.
- Browser API client использует same-origin `/api/v1/*`, если public API base указывает на localhost.

### Acceptance criteria

- Поле поиска и соседние кнопки topbar одинаковой высоты на mobile и desktop.
- Search submit выглядит как часть поля, а не отдельная кнопка внутри.
- Auth pages не показывают blocking hydration overlay из-за injected attributes.
- На телефоне через внешний dev-домен web может логиниться без прямого доступа телефона к `localhost:8080`, если API доступен Next.js dev-серверу.
