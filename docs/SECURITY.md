# SECURITY.md

## Цель

Документ фиксирует базовые требования безопасности для FanFuel. Любые изменения, связанные с auth, платежами, выплатами, safe deal, файлами и админкой, должны учитывать этот документ.

## Секреты

Запрещено коммитить:

- реальные `.env`;
- пароли;
- API keys;
- JWT/session secrets;
- SSH keys;
- provider secrets;
- production IP и доступы;
- дампы БД с данными.

Разрешено коммитить:

- `.env.example`;
- `SECRETS.template.md`;
- `docs/SERVER_ACCESS.template.md`.

## Auth

Требования:

- password hashing через современный алгоритм;
- защита от enumeration;
- rate limiting auth endpoints;
- email verification после MVP;
- password reset tokens одноразовые и ограниченные по времени;
- session/JWT policy фиксируется в ADR перед реализацией;
- в `v0.1` используется JWT access token и bcrypt; refresh/session layer не реализован.

## Roles and permissions

Роли:

- `buyer`;
- `streamer`;
- `seller`;
- `admin`;
- `support`;
- `moderator`.

Правила:

- проверять permission на backend, не только в UI;
- admin роль нельзя выдать публичным API;
- опасные admin actions требуют audit log;
- один пользователь может иметь несколько ролей;
- blocked user не может выполнять финансовые или публичные действия.

## Password policy

Для MVP:

- минимальная длина;
- проверка распространённых слабых паролей желательна;
- rate limit login attempts;
- password reset через безопасный token.

Не хранить password в logs.

## Session/JWT policy

Текущее решение `v0.1`:

- `Authorization: Bearer <access_token>`;
- HS256 JWT, секрет только через `JWT_SECRET`;
- TTL через `ACCESS_TOKEN_TTL_MINUTES`;
- публичная регистрация не принимает роль `admin`;
- dev bootstrap admin разрешён только вне `production` и только для `ADMIN_BOOTSTRAP_EMAIL`, если админов ещё нет.

Варианты:

- JWT access + refresh token;
- server-side sessions;
- hybrid.

Требования независимо от выбора:

- short-lived access token;
- refresh rotation или server-side invalidation;
- secure cookies for browser sessions;
- CSRF защита для cookie-based auth;
- logout invalidates refresh/session;
- secrets rotation plan.

## CSRF/XSS

CSRF:

- нужен для cookie-based session;
- state-changing requests защищать token/origin checks.

CORS:

- в `development` API допускает dev origins для локальной машины и VM smoke-тестов;
- в `production` API должен принимать только `CORS_ALLOWED_ORIGINS`;
- нельзя добавлять wildcard production origins.

XSS:

- escape user content;
- sanitize rich text;
- CSP для production;
- не вставлять raw HTML без sanitizer;
- upload SVG ограничить или sanitizer/convert.

## Webhook signature verification

Provider webhooks:

- проверять подпись;
- проверять timestamp, если есть;
- сохранять raw body hash;
- dedupe by provider event ID;
- не доверять provider payload без проверки статуса, если операция критична.

## Widget token security

`v0.2` использует read-only OBS widget token для `/ws/alerts`.

Требования:

- token хранится в БД только как hash;
- widget token не даёт права менять настройки;
- token можно ротировать из studio;
- WebSocket gateway проверяет token на backend/DB, а не только в UI;
- token не логировать и не показывать повторно после создания/ротации.

## Idempotency

Опасные операции:

- create payment;
- create order;
- create donation;
- refund;
- payout;
- deal transitions;
- webhook processing.

Требования:

- idempotency key;
- request hash;
- stable response;
- conflict при разном body;
- retry-safe provider calls.

## Audit logs

Обязательны для:

- изменения ролей;
- блокировок;
- модерации товаров;
- manual payment/deal/order changes;
- dispute resolution;
- payout approval/rejection;
- risk flag resolution;
- provider settings changes.

Audit log append-only.

## Admin security

Требования:

- отдельные permissions;
- 2FA желательно до production;
- allowlist/VPN для production admin желательно;
- подтверждение опасных действий;
- audit log;
- read-only режим для support, где возможно.

## File upload security

Требования:

- signed upload URLs;
- MIME validation;
- file size limits;
- extension allowlist by purpose;
- private bucket for digital files and evidence;
- malware/virus review placeholder;
- image processing/sanitization for public images;
- no direct public access to private files.

## S3/R2 upload rules

Purposes:

- `avatar`;
- `banner`;
- `product_media`;
- `digital_file`;
- `dispute_evidence`;
- `alert_sound`;
- `overlay_asset`.

Правила:

- public только для safe preview/media;
- private для цифровых файлов и evidence;
- signed download только после permission check;
- download audit log для цифровых товаров;
- CDN base URL не хардкодить.

## Rate limiting

Нужно лимитировать:

- auth;
- donations;
- checkout/orders;
- payment creation;
- webhooks processing;
- signed URL creation;
- WebSocket connections;
- admin actions.

Rate limits должны учитывать risk flags и роль.

## Anti-fraud basics

MVP:

- лимиты Seller Lite;
- hold для новых продавцов;
- manual review payouts;
- risk flags;
- audit logs;
- suspicious activity queue;
- category restrictions.

Не делать:

- auto-ban без review для спорных случаев;
- ML scoring как обязательную часть MVP;
- рискованные категории без legal/payment review.

## Data privacy basics

Требования:

- минимизация данных;
- не хранить лишние документы;
- ограничивать доступ к evidence;
- удаление/анонимизация там, где возможно;
- retention policy для финансовых и legal данных;
- пользовательские экспорты в будущем.

## User preferences security

Настройки темы и locale не являются секретами, но всё равно относятся к пользовательским данным.

Требования:

- `/api/v1/me/preferences` доступен только текущему авторизованному пользователю;
- изменение preferences не должно позволять менять чужой `user_id`;
- backend валидирует `themePreference` и `locale`;
- не логировать bearer token при синхронизации темы;
- guest cookie/localStorage не использовать для auth или permission decisions.

## Payment security

Запрещено:

- хранить card data;
- логировать provider secrets;
- вызывать provider напрямую из домена;
- хардкодить provider statuses;
- принимать webhook без подписи;
- считать provider redirect достаточным подтверждением оплаты без webhook/status check.

## Security review checklist

- Нет ли секретов в diff?
- Все новые endpoints проверяют auth/permissions?
- Есть ли rate limit?
- Есть ли i18n key для ошибок?
- Опасные операции idempotent?
- Платёжная логика идёт через adapter?
- Admin actions пишутся в audit log?
- File uploads имеют limits и access control?
- Новые таблицы описаны в `docs/DOMAIN_MODEL.md`?
