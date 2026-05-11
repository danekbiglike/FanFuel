# AGENTS.md

Документ обязателен для всех людей и ИИ-агентов, работающих над FanFuel.

## Описание проекта

FanFuel — creator-commerce платформа для стримеров, зрителей и продавцов цифровых товаров. Она объединяет донаты, OBS-алерты, витрины авторов, безопасные цифровые покупки, промокоды, партнёрские рекомендации и marketplace.

Главная идея: зритель может не только задонатить, но и купить что-то полезное, одновременно поддержав любимого автора.

## Главный стек

- Frontend: Next.js + React + TypeScript.
- OBS widgets: Vite + React + TypeScript.
- Backend: Go.
- WebSocket gateway: Go.
- Database: PostgreSQL.
- Cache/queues/realtime state: Redis.
- Storage: S3/R2-compatible storage.
- Containers: Docker + Docker Compose.
- i18n: `ru` default, `en` supported.

## Структура репозитория

```txt
apps/web
apps/widget
apps/admin
apps/mobile-web
services/api
services/ws
services/worker
packages/ui
packages/sdk
packages/config
packages/types
packages/i18n
infra/docker
infra/nginx
infra/migrations
infra/scripts
docs
```

## Обязательные правила

### Правило 1

Перед изменением кода агент обязан прочитать:

- `README.md`;
- `ROADMAP.md`;
- `docs/ARCHITECTURE.md`;
- `docs/TASKS.md`;
- `docs/DOMAIN_MODEL.md`;
- `docs/PAYMENTS.md`;
- `docs/I18N.md`;
- `docs/SECURITY.md`.

### Правило 2

Если задача затрагивает платежи, выплаты, баланс, safe deal или налоги, агент обязан сначала обновить или проверить `docs/PAYMENTS.md` и не хардкодить провайдера.

### Правило 3

Если задача добавляет пользовательский текст, он должен быть добавлен в i18n-словари.

### Правило 4

Реальные секреты не добавлять в репозиторий.

### Правило 5

После завершения работы агент должен обновить `docs/CHANGELOG.md` или `docs/HANDOFF.md`.

### Правило 6

Если агент не уверен в юридической части, он должен пометить блок как `LEGAL_REVIEW_REQUIRED`, а не придумывать финальное юридическое решение.

### Правило 7

Все новые backend endpoints должны иметь описание в `docs/API_PLAN.md`.

### Правило 8

Все новые сущности БД должны быть описаны в `docs/DOMAIN_MODEL.md`.

### Правило 9

Все решения, которые могут повлиять на масштабируемость, безопасность или деньги, должны фиксироваться в `docs/DECISIONS.md` как ADR.

### Правило 10

Все новые страницы и компоненты обязаны поддерживать light/dark темы через semantic tokens. Запрещено хардкодить цвета, которые ломают одну из тем. Все пользовательские тексты должны идти через i18n.

## Правила работы

- Сначала понять задачу и прочитать релевантные документы.
- Не писать production-код, если задача явно просит только планирование.
- Не ломать публичные API без ADR и обновления документации.
- Не смешивать frontend UI text и i18n dictionaries.
- Не смешивать provider-specific платежную логику и домен.
- Не делать крупные рефакторы без необходимости.
- Уважать существующую структуру и стиль.
- После изменений запускать доступные проверки.
- Если проверку невозможно запустить, указать причину в handoff/final report.

# UI/UX workflow для агентов

Перед любой задачей, связанной с интерфейсом, агент обязан прочитать:

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/DO_NOT_BUILD_YET.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/THEMING.md`
- `docs/UI_RULES.md`
- `docs/UX_RULES.md`

Агент не должен создавать страницы со статусом `FUTURE` или `DO_NOT_BUILD_YET`, если задача явно не требует изменить их статус.

Если пользователь добавил новую логику текстом в `docs/UX_IMPLEMENTATION_STATUS.md`, агент должен сначала обновить связанные specs, tracker и tasks, а потом менять код.

Если страница помечена как `IMPLEMENTED`, агент не должен её переписывать без явного требования.

Если страница помечена как `NEEDS_REWORK`, агент должен менять только описанные блоки и не трогать несвязанные части.

Если агент обнаружил расхождение между кодом и документацией, он должен:

1. зафиксировать расхождение в `docs/DESIGN_AUDIT.md` или `docs/UX_IMPLEMENTATION_STATUS.md`;
2. не исправлять его без связи с текущей задачей;
3. предложить отдельную задачу.

Все новые страницы должны получить:

- Page Spec;
- статус в `UI_UX_TRACKER`;
- route;
- версию;
- acceptance criteria;
- запись в `TASKS.md`.

## Правила документации

- Все документы, комментарии, инструкции, roadmap, задачи и описания — на русском языке.
- Код, переменные, API names, DB structures и technical identifiers — на английском языке.
- Новая функция должна иметь отражение в документации, если она меняет продукт, API, домен, платежи, безопасность или DevOps.
- Юридические формулировки без проверки помечать `LEGAL_REVIEW_REQUIRED`.

## Правила коммитов

Рекомендуемый формат: Conventional Commits.

Примеры:

```txt
docs: add payment architecture plan
feat(api): add donation creation endpoint
fix(ws): handle widget reconnect dedupe
chore(infra): add postgres healthcheck
```

Коммит не должен содержать:

- реальные секреты;
- production access data;
- дампы БД;
- временные личные файлы.

## Правила i18n

- Default locale: `ru`.
- Supported locales: `ru`, `en`.
- Не хардкодить пользовательские тексты в компонентах.
- Ошибки API должны иметь `i18n_key`.
- Деньги форматировать через shared helper.
- Даты форматировать с учётом locale/timezone.
- Юридические тексты хранить как документы/templates, а не в JSX.

## Правила платежей

- Все платежи через `PaymentProvider`.
- Все выплаты через `PayoutProvider`.
- Safe deal через domain service и provider abstraction.
- Fiscalization через `FiscalizationProvider`.
- Webhooks через `ProviderWebhookHandler`.
- Деньги хранить в minor units.
- Provider IDs хранить отдельно.
- Webhooks обрабатывать idempotently.
- Финансовые движения фиксировать в `balance_transactions`.
- Admin/manual corrections писать в `audit_logs`.

## Правила безопасности

- Не коммитить секреты.
- Проверять permissions на backend.
- Admin actions пишутся в audit log.
- Webhook signatures обязательны для реальных провайдеров.
- File upload через signed URLs.
- Private files не отдавать без permission check.
- Rate limiting для auth, checkout, payments, signed URLs и WebSocket.
- Не логировать raw secrets, passwords, tokens.

## Как запускать тесты

Точные команды появятся после `v0.0 Foundation`. План:

```bash
pnpm lint
pnpm test
go test ./...
docker compose -f docker-compose.dev.yml up --build
```

Если в задаче добавлен новый код:

- frontend: lint + tests;
- backend: gofmt + go test;
- DB: migration test;
- payments: mock provider tests;
- WebSocket: event/reconnect tests.

## Как добавлять новые модули

1. Проверить `ROADMAP.md` и `docs/TASKS.md`.
2. Описать доменные сущности в `docs/DOMAIN_MODEL.md`.
3. Описать endpoints в `docs/API_PLAN.md`.
4. Добавить i18n keys.
5. Добавить миграции.
6. Добавить тесты.
7. Обновить `docs/HANDOFF.md` или `docs/CHANGELOG.md`.

## Как работать с миграциями

- Миграции хранятся в `infra/migrations`.
- Не редактировать применённые production миграции.
- Финансовые таблицы менять только с явным планом миграции данных.
- Новая таблица должна быть описана в `docs/DOMAIN_MODEL.md`.
- UUID primary keys.
- `created_at`, `updated_at`, `deleted_at` по необходимости.
- Деньги не хранить float-типами.

## Как не ломать API

- Не удалять поля без versioning.
- Не менять смысл статусов без ADR.
- Новые поля должны быть backward-compatible.
- Breaking changes требуют ADR и обновления `docs/API_PLAN.md`.
- Ошибки сохраняют стабильный `code`.

## Что нельзя делать

- Нельзя добавлять реальные секреты.
- Нельзя хардкодить платёжного провайдера.
- Нельзя хранить деньги в float.
- Нельзя называть внутренний баланс банковским счётом.
- Нельзя добавлять рискованные категории в MVP без legal/payment review.
- Нельзя добавлять пользовательский текст без i18n.
- Нельзя обходить audit log для admin/financial actions.
- Нельзя подключать реальные платежи без provider/legal review.

## Handoff notes

После завершения работы агент должен обновить `docs/HANDOFF.md`:

- что сделано;
- какие файлы изменены;
- какие проверки запускались;
- что не получилось проверить;
- какие риски остались;
- какие задачи следующие;
- ссылки на `TASK-ID`.

Если изменение заметно для проекта, добавить запись в `docs/CHANGELOG.md`.
