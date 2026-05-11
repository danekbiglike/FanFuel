# TESTING.md

## Цель

Тестовая стратегия FanFuel должна покрывать продуктовые сценарии, платежные переходы, realtime события, миграции и безопасность. Покрытие растёт по roadmap, но базовые проверки нужны с `v0.0`.

## Быстрый практический набор

Для большинства изменений после `v0.3` начинать с минимального набора:

```bash
npm run typecheck --workspaces --if-present
npm run lint
cd services && go test ./...
```

Если затронут frontend flow, добавить browser smoke соответствующей страницы. Если затронуты миграции или dev stack, добавить:

```powershell
.\infra\scripts\migrate.ps1 -ComposeFile docker-compose.yml
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Если проверку нельзя выполнить, записать причину в `docs/HANDOFF.md`.

## Проверка web через внешний dev-домен

Если Next.js dev-сервер показывается через тестовый домен или IP, нужно разрешить этот host для dev-ресурсов, иначе страница может отрисоваться без рабочей клиентской интерактивности. Для FanFuel текущий тестовый домен `danechka.com` уже добавлен в `apps/web/next.config.mjs`; дополнительные host можно указать через запятую:

```powershell
$env:NEXT_ALLOWED_DEV_ORIGINS="preview.example.com,192.0.2.10"
npm exec -- next dev --hostname 0.0.0.0 --port 3002
```

После изменения списка host dev-сервер нужно перезапустить. Browser smoke должен проверять не только HTTP 200, но и работу dropdown/search после гидратации.

## Проверка web API proxy

Web-клиент по умолчанию обращается к same-origin `/api/v1/*`. В dev это обрабатывает Next.js route proxy и серверно прокидывает запрос в Go API по `FANFUEL_INTERNAL_API_BASE_URL`, `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL` или `http://localhost:8080`.

Для проверки с телефона через `http://danechka.com:3002` достаточно открыть web-порт `3002`, если API доступен с машины, где запущен Next.js. Пробрасывать `8080` на телефон не требуется. Если `NEXT_PUBLIC_API_BASE_URL` специально указывает внешний не-localhost API origin, тогда этот origin должен быть доступен с телефона и иметь корректный CORS.

Минимальная smoke-проверка:

```powershell
Invoke-WebRequest http://localhost:3002/api/v1/categories
Invoke-WebRequest http://danechka.com:3002/api/v1/categories
```

## Типы тестов

### Unit tests

Покрывают:

- domain services;
- money calculations;
- status transitions;
- i18n helpers;
- validation;
- provider status mapping.

### Integration tests

Покрывают:

- repositories;
- PostgreSQL transactions;
- Redis queues/pubsub;
- provider adapters with mock server;
- file storage abstraction.

### API tests

Покрывают:

- auth;
- profiles;
- donations;
- orders;
- payments;
- disputes;
- admin actions;
- permission checks;
- error format.

### Payment provider mock tests

Покрывают:

- successful payment;
- failed payment;
- repeated webhook;
- partial refund;
- payout success/failure;
- idempotency conflict;
- provider timeout and retry.

### WebSocket tests

Покрывают:

- token validation;
- connection lifecycle;
- heartbeat;
- reconnect behavior;
- event envelope;
- event dedupe;
- room/channel access.

### Database migration tests

Покрывают:

- clean migration up;
- migration status;
- basic rollback in dev, если tool поддерживает;
- constraints;
- indexes;
- seed data.

### Frontend component tests

Покрывают:

- ключевые формы;
- UI states;
- i18n rendering;
- money/date formatting;
- role-based navigation.

### E2E tests

Покрывают:

- registration/login;
- create donation;
- OBS alert receive;
- create product;
- checkout order;
- safe deal confirm;
- dispute flow;
- admin moderation.

### Smoke tests

Проверяют после deploy:

- `/healthz`;
- `/readyz`;
- web loads;
- admin loads;
- widget loads;
- login;
- mock payment flow;
- WebSocket connect.

### Security checks

Проверяют:

- secret scanning;
- dependency audit;
- auth rate limit;
- permission tests;
- webhook signature tests;
- file upload restrictions;
- XSS basics.

## Тесты по этапам roadmap

### v0.0 Foundation

Добавить:

- CI outline;
- lint/format checks;
- migration smoke test;
- Docker Compose healthcheck test;
- i18n dictionary validation;
- secret scanning baseline.

### v0.1 Auth + Profiles

Добавить:

- auth unit/integration tests;
- password hashing tests;
- session/JWT tests;
- role permission tests;
- public profile API tests;
- admin user list permission tests.

Текущее покрытие после реализации `v0.1`:

- `cd services && go test ./...`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- manual smoke локально и на VM: register/login, `/auth/me`, public creator page, admin users list.

Тестовый долг:

- автоматизировать API integration tests с PostgreSQL;
- добавить frontend component/e2e tests для auth/profile/admin flows;
- добавить negative permission tests для non-admin tokens.

### v0.2 Donate MVP

Добавить:

- donation creation tests;
- mock payment success/failure tests;
- webhook idempotency tests;
- donation goal recalculation tests;
- OBS widget WebSocket event tests;
- alert dedupe tests.

### v0.3 Marketplace MVP

Добавить:

- product CRUD tests;
- moderation tests;
- category filtering tests;
- order creation tests;
- mock safe deal tests;
- review permission tests;
- file upload access tests.

Практический smoke перед переходом к `v0.4`:

- seller создаёт товар и отправляет его на публикацию;
- admin публикует или скрывает товар;
- buyer открывает marketplace/product page и оформляет checkout;
- mock payment callback переводит order/deal в ожидаемые статусы;
- seller переводит deal в работу и сдаёт результат;
- buyer подтверждает получение;
- buyer оставляет review;
- повторные опасные действия не создают дублей и не обходят permissions.

### v0.4 Creator Store + Partners

Добавить:

- store item tests;
- promo code validation tests;
- affiliate attribution tests;
- creator share calculation tests;
- analytics aggregation tests.

### v0.5 Real Payment Provider Integration

Добавить:

- provider adapter contract tests;
- webhook signature tests;
- status mapping tests;
- retry tests;
- refund tests;
- payout sandbox tests;
- fiscalization placeholder tests.

### v0.6 Seller Balance + Payouts

Добавить:

- ledger invariant tests;
- available balance tests;
- payout request tests;
- manual review tests;
- failed payout rollback tests;
- Seller Lite limits tests.

### v0.7 Disputes + Arbitration

Добавить:

- dispute open window tests;
- evidence permission tests;
- admin resolution tests;
- partial refund tests;
- deal status transition tests;
- notification tests.

### v0.8 Anti-fraud + Verification

Добавить:

- risk flag creation tests;
- limits tests;
- verification workflow tests;
- payout blocking tests;
- admin review queue tests.

### v0.9 Mobile Web / PWA

Добавить:

- responsive E2E checks;
- PWA manifest tests;
- service worker smoke tests;
- mobile checkout E2E;
- mobile dispute E2E.

### v1.0 Public Beta

Добавить:

- production smoke suite;
- backup restore rehearsal;
- monitoring alert checks;
- support workflow QA;
- legal placeholders verification;
- rollback rehearsal.

## Manual QA checklists

### Донат

- Открыть страницу автора.
- Создать донат.
- Пройти mock payment.
- Проверить историю.
- Проверить OBS alert.
- Проверить goal update.
- Повторить webhook и убедиться, что дубля нет.

### Покупка

- Открыть товар.
- Применить промокод.
- Проверить долю автора.
- Оформить order.
- Пройти mock payment.
- Проверить order/deal statuses.
- Подтвердить получение.
- Проверить ledger.

### Спор

- Создать order.
- Перевести продавца в submitted.
- Открыть dispute.
- Добавить evidence.
- Решить спор админом.
- Проверить refund/payout/ledger.

### Выплата

- Создать completed deal.
- Проверить available balance.
- Запросить payout.
- Одобрить admin.
- Пройти mock provider.
- Проверить paid_out ledger.

## Quality gates

- TypeScript strict mode.
- ESLint.
- Prettier.
- Go formatting.
- Go linting.
- Migration tests.
- Conventional commits или выбранный формат.
- CI checks.
- No hardcoded secrets.
- No hardcoded locale strings.
- No direct payment provider calls outside adapter layer.
