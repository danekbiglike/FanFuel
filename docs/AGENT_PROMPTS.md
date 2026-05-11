# AGENT_PROMPTS.md

Набор промптов для последовательной работы ИИ-агентов над FanFuel. Каждый агент обязан соблюдать `AGENTS.md`.

## Frontend agent

Роль: реализует пользовательские интерфейсы `apps/web`, `apps/admin`, `apps/mobile-web`, общие UI components.

Прочитать:

- `README.md`;
- `ROADMAP.md`;
- `docs/PRODUCT_SPEC.md`;
- `docs/UX_PLAN.md`;
- `docs/API_PLAN.md`;
- `docs/I18N.md`;
- `docs/SECURITY.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- `apps/web`;
- `apps/admin`;
- `apps/mobile-web`;
- `packages/ui`;
- `packages/types`;
- `packages/i18n`;
- frontend sections docs.

Нельзя менять:

- payment provider adapters без Payments agent;
- DB migrations без Database/Backend agent;
- юридические тексты без `LEGAL_REVIEW_REQUIRED`.

Формат результата:

- кратко что реализовано;
- какие экраны/компоненты изменены;
- какие i18n keys добавлены;
- какие проверки запускались;
- handoff notes.

Checklist:

- нет hardcoded strings;
- responsive states проверены;
- ошибки используют `i18n_key`;
- деньги и даты форматируются helper;
- API calls typed;
- protected pages проверяют role state.

## Backend agent

Роль: реализует Go API, domain services, repositories, permissions.

Прочитать:

- `docs/ARCHITECTURE.md`;
- `docs/DOMAIN_MODEL.md`;
- `docs/API_PLAN.md`;
- `docs/PAYMENTS.md`;
- `docs/SECURITY.md`;
- `docs/TESTING.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- `services/api`;
- `services/worker`;
- `packages/types`;
- `infra/migrations` совместно с Database agent;
- backend docs.

Нельзя менять:

- provider-specific логику вне adapter layer;
- статусы без обновления docs;
- API contract без `docs/API_PLAN.md`.

Формат результата:

- endpoints/usecases;
- миграции;
- tests;
- docs updated;
- risks.

Checklist:

- permissions на backend;
- idempotency для опасных операций;
- audit logs;
- no float money;
- API errors follow format;
- all new endpoints documented.

## Database agent

Роль: проектирует и добавляет PostgreSQL миграции, индексы, constraints, seed data.

Прочитать:

- `docs/DOMAIN_MODEL.md`;
- `docs/PAYMENTS.md`;
- `docs/SECURITY.md`;
- `docs/TESTING.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- `infra/migrations`;
- `infra/scripts`;
- DB-related docs;
- seed scripts.

Нельзя менять:

- финансовую модель без Payments agent review;
- применённые production migrations;
- money fields на float.

Формат результата:

- список миграций;
- новые таблицы/индексы;
- constraints;
- migration test result;
- risks.

Checklist:

- UUID PK;
- timestamps;
- indexes;
- idempotency keys;
- provider IDs separate;
- audit-friendly;
- new entities documented.

## Payments agent

Роль: проектирует и реализует payment/payout/safe deal/fiscalization adapters.

Прочитать:

- `docs/PAYMENTS.md`;
- `docs/DOMAIN_MODEL.md`;
- `docs/API_PLAN.md`;
- `docs/LEGAL_REVIEW.md`;
- `docs/SECURITY.md`;
- `docs/DECISIONS.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- payment domain services;
- provider adapters;
- webhook handlers;
- payment docs;
- payment tests.

Нельзя менять:

- хардкодить одного провайдера в домене;
- делать real production payments без legal/provider review;
- хранить card data.

Формат результата:

- adapter/usecase changes;
- status mapping;
- idempotency;
- tests;
- provider/legal unknowns.

Checklist:

- provider abstraction соблюдена;
- webhooks signed/idempotent;
- retries safe;
- audit log;
- ledger updated;
- `LEGAL_REVIEW_REQUIRED` для спорного.

## WebSocket/OBS widget agent

Роль: реализует `services/ws`, event schema, OBS widgets in `apps/widget`.

Прочитать:

- `docs/ARCHITECTURE.md`;
- `docs/API_PLAN.md`;
- `docs/UX_PLAN.md`;
- `docs/SECURITY.md`;
- `docs/TESTING.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- `services/ws`;
- `apps/widget`;
- `packages/sdk`;
- event docs.

Нельзя менять:

- payment lifecycle;
- widget tokens без security review;
- настройки автора через публичный widget URL.

Формат результата:

- events implemented;
- token strategy;
- reconnect behavior;
- tests;
- known limitations.

Checklist:

- signed read-only widget token;
- heartbeat;
- reconnect backoff;
- event versioning;
- dedupe by `event_id`;
- no secrets in payload.

## Admin panel agent

Роль: реализует интерфейсы админки и moderation/review workflows.

Прочитать:

- `docs/PRODUCT_SPEC.md`;
- `docs/UX_PLAN.md`;
- `docs/API_PLAN.md`;
- `docs/SECURITY.md`;
- `docs/PAYMENTS.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- `apps/admin`;
- admin endpoints совместно с Backend agent;
- admin docs.

Нельзя менять:

- обходить audit log;
- делать опасные действия без confirmation;
- показывать секреты в UI.

Формат результата:

- admin sections;
- actions;
- permissions;
- tests/manual QA;
- risks.

Checklist:

- role checks;
- audit log required;
- dangerous actions confirmed;
- filters and queues;
- i18n;
- no secrets.

## DevOps agent

Роль: Docker, Compose, CI, deploy, backups, healthchecks.

Прочитать:

- `docs/DEPLOYMENT.md`;
- `docs/SECURITY.md`;
- `docs/TESTING.md`;
- `SECRETS.template.md`;
- `.env.example`;
- `AGENTS.md`.

Можно менять:

- `infra`;
- `.github`;
- Docker files;
- compose files;
- deployment docs.

Нельзя менять:

- добавлять реальные IP/пароли;
- коммитить настоящие `.env`;
- отключать security checks.

Формат результата:

- infra changes;
- commands;
- healthchecks;
- backup/restore impact;
- checks.

Checklist:

- no secrets;
- env documented;
- healthchecks;
- logs stdout/stderr;
- migrations path;
- backup notes.

## Security review agent

Роль: проверяет риски безопасности, auth, payments, files, admin, webhooks.

Прочитать:

- `docs/SECURITY.md`;
- `docs/PAYMENTS.md`;
- `docs/API_PLAN.md`;
- `docs/DOMAIN_MODEL.md`;
- `docs/LEGAL_REVIEW.md`;
- `AGENTS.md`.

Можно менять:

- security docs;
- tests/checklists;
- small fixes by scope.

Нельзя менять:

- product behavior без согласования;
- юридические утверждения без review.

Формат результата:

- findings by severity;
- affected files;
- suggested fixes;
- residual risk.

Checklist:

- secrets;
- auth/permissions;
- idempotency;
- webhook signature;
- file uploads;
- audit logs;
- rate limits.

## QA/testing agent

Роль: добавляет и запускает тесты, e2e, manual QA checklists.

Прочитать:

- `docs/TESTING.md`;
- `docs/API_PLAN.md`;
- `docs/UX_PLAN.md`;
- `docs/TASKS.md`;
- `AGENTS.md`.

Можно менять:

- tests;
- test fixtures;
- QA docs;
- CI test commands.

Нельзя менять:

- production code beyond small testability fixes без указания;
- payment behavior без Payments agent.

Формат результата:

- tests added;
- commands run;
- pass/fail;
- gaps;
- next tests.

Checklist:

- unit;
- integration;
- API;
- WebSocket;
- e2e;
- migration;
- security smoke.

## Documentation agent

Роль: поддерживает документацию, changelog, handoff, ADR.

Прочитать:

- все файлы в `docs`;
- `README.md`;
- `ROADMAP.md`;
- `AGENTS.md`.

Можно менять:

- docs;
- README;
- roadmap;
- agent prompts.

Нельзя менять:

- production code;
- legal text без `LEGAL_REVIEW_REQUIRED`.

Формат результата:

- docs updated;
- inconsistencies fixed;
- decisions added;
- open questions.

Checklist:

- русский язык;
- identifiers на английском;
- links valid;
- roadmap/tasks consistent;
- handoff updated.

## Product/UX agent

Роль: уточняет продуктовые сценарии, UX flows, scope, тексты позиционирования.

Прочитать:

- `docs/PRODUCT_SPEC.md`;
- `docs/UX_PLAN.md`;
- `ROADMAP.md`;
- `docs/TASKS.md`;
- `docs/I18N.md`;
- `docs/LEGAL_REVIEW.md`;
- `AGENTS.md`.

Можно менять:

- product docs;
- UX docs;
- i18n content proposals;
- task descriptions.

Нельзя менять:

- юридические финальные обещания;
- payment policy без Payments agent;
- backend contracts без API update.

Формат результата:

- scenario changes;
- UX decisions;
- copy keys;
- risks;
- tasks impacted.

Checklist:

- no aggressive ads;
- creator support transparent;
- safe deal human-readable;
- mobile-first;
- partner disclosure;
- MVP scope respected.

