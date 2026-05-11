# API_PLAN.md

## Общие принципы API

- Основной протокол: REST.
- Realtime: WebSocket.
- Формат данных: JSON.
- Версионирование: `/api/v1`.
- Auth: session/JWT policy фиксируется отдельно, но API должен поддерживать bearer/session middleware.
- Все новые backend endpoints должны быть описаны в этом документе.
- Все user-facing ошибки должны иметь `i18n_key`.
- Опасные POST/PATCH операции должны поддерживать `Idempotency-Key`.

## Error format

## Web same-origin proxy в dev

`apps/web` содержит dev/runtime proxy `GET/POST/... /api/v1/*`, который прокидывает запросы к Go API через сервер Next.js. Это не новый бизнес API и не отдельный контракт: web-прокси повторяет существующие backend endpoints `/api/v1/*`, не обходит auth/permissions и передаёт только безопасные клиентские headers (`Accept`, `Accept-Language`, `Authorization`, `Content-Type`, `Idempotency-Key`).

Назначение proxy: внешний dev-домен или телефон открывают web на одном origin (`http://danechka.com:3002`), а браузерские запросы идут в `/api/v1/*` на этот же origin. Сервер Next.js уже сам обращается к `FANFUEL_INTERNAL_API_BASE_URL`/`API_BASE_URL`/`NEXT_PUBLIC_API_BASE_URL` или `http://localhost:8080`, поэтому телефон не должен иметь прямой доступ к `localhost:8080`.

Production может использовать тот же принцип через reverse proxy или отдельный API origin, но CORS/headers/limits должны настраиваться явно на уровне deployment.

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "i18n_key": "errors.validation.failed",
    "details": {
      "fields": {
        "email": "invalid_email"
      }
    },
    "request_id": "req_01H..."
  }
}
```

Правила:

- `code` стабилен, на английском.
- `message` технический fallback.
- `i18n_key` обязателен для ошибок, видимых пользователю.
- `details` не должен содержать секреты.
- `request_id` должен быть в логах.

## Pagination format

Запрос:

```txt
?limit=20&cursor=eyJpZCI6...
```

Ответ:

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "next_cursor": "eyJpZCI6...",
    "has_more": true
  }
}
```

Правила:

- cursor pagination по умолчанию;
- offset pagination допустима только для admin/debug таблиц с ограничениями;
- max `limit` задаётся конфигом.

## Idempotency strategy

Header:

```txt
Idempotency-Key: client-generated-uuid
```

Scope строится из:

- user ID;
- endpoint;
- method;
- business operation type.

Если тот же ключ приходит с другим body hash, API возвращает `409 idempotency_key_conflict`.

Обязательные endpoints:

- `POST /donations`;
- `POST /orders`;
- `POST /payments`;
- `POST /refunds`;
- `POST /seller/payouts`;
- `POST /deals/{id}/confirm`;
- `POST /deals/{id}/dispute`;

## Rate limiting strategy

Базовые buckets:

- anonymous public pages;
- auth endpoints;
- checkout/payment endpoints;
- widget token validation;
- WebSocket connections;
- admin actions;
- file signed URL generation.

Rate limits должны быть конфигурируемыми и учитывать IP, user ID, role, risk flags.

## Auth endpoints

`v0.1` реализует JWT access token через `Authorization: Bearer <token>`. Refresh/password reset остаются planned.

### POST `/api/v1/auth/register`

Назначение: регистрация пользователя.

Body:

- `email`;
- `password`;
- `display_name`;
- `role_intent`: `buyer`, `streamer`, `seller`;
- optional `locale`;
- optional `time_zone`.

Ответ:

- user;
- `access_token`;
- `token_type`;
- `expires_at`.

### POST `/api/v1/auth/login`

Назначение: вход.

Body:

- `email`;
- `password`.

### POST `/api/v1/auth/logout`

Назначение: завершение текущей сессии.

### POST `/api/v1/auth/refresh`

Статус: planned, не реализовано в `v0.1`.

### GET `/api/v1/auth/me`

Назначение: текущий пользователь, роли и базовые профили.

## Preferences endpoints

`v0.2 Design System Foundation` добавляет хранение пользовательской темы.

### GET `/api/v1/me/preferences`

Назначение: получить настройки текущего пользователя.

Auth: требуется bearer token.

Ответ:

```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "themePreference": "system",
  "locale": "ru",
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

Правила:

- если запись отсутствует, backend создаёт `system` и locale из `users.default_locale`;
- endpoint не возвращает секреты или provider data.

### PATCH `/api/v1/me/preferences`

Назначение: обновить настройки текущего пользователя.

Auth: требуется bearer token.

Body:

```json
{
  "themePreference": "dark",
  "locale": "ru"
}
```

Правила:

- `themePreference` допускает только `system`, `light`, `dark`;
- `locale` допускает только `ru`, `en`;
- PATCH может передавать одно поле;
- ошибки имеют `i18n_key`.

### POST `/api/v1/auth/password/forgot`

Статус: planned, не реализовано в `v0.1`.

### POST `/api/v1/auth/password/reset`

Статус: planned, не реализовано в `v0.1`.

## Profile endpoints

### GET `/api/v1/profiles/{slug}`

Публичный профиль пользователя.

### PATCH `/api/v1/me/profile`

Редактирование общего профиля.

### GET `/api/v1/creators/{creator_slug}`

Публичная страница автора.

### PATCH `/api/v1/studio/profile`

Редактирование creator profile.

### PATCH `/api/v1/seller/profile`

Редактирование seller profile.

## Creator endpoints

### GET `/api/v1/studio/overview`

Обзор для стримера.

### GET `/api/v1/studio/donations`

История донатов.

### GET `/api/v1/studio/goals`

Список целей.

### POST `/api/v1/studio/goals`

Создать donation goal.

### PATCH `/api/v1/studio/goals/{goal_id}`

Обновить цель.

### GET `/api/v1/studio/widgets`

Список виджетов.

### POST `/api/v1/studio/widgets`

Создать widget config.

### POST `/api/v1/studio/widgets/{widget_id}/rotate-token`

Ротация widget token.

Ответ `v0.2` при создании или ротации содержит token только один раз. Клиент строит OBS URL на базе widget app URL и `token`.

### GET `/api/v1/studio/store`

Получить витрину автора.

### PUT `/api/v1/studio/store`

Обновить витрину.

### POST `/api/v1/studio/store/items`

Добавить товар в витрину.

### DELETE `/api/v1/studio/store/items/{item_id}`

Скрыть/удалить товар из витрины.

### GET `/api/v1/studio/analytics`

Базовая аналитика.

## Donation endpoints

### POST `/api/v1/donations`

Создать донат.

Headers:

- `Idempotency-Key`.

Body:

- `creator_profile_id` или `creator_slug`;
- `amount_minor`;
- `currency`;
- `display_name`;
- `message`;
- `is_anonymous`;
- optional `donation_goal_id`;
- optional `promo_code`.

Ответ:

- donation;
- payment confirmation payload.

В `v0.2` payment confirmation payload указывает mock payment. Оплата завершается только через mock callback, а не в момент создания donation.

### POST `/api/v1/mock/payments/{payment_id}/succeed`

Dev-only mock callback для успешного завершения donation/order payment.

Правила:

- создаёт запись в `provider_webhooks`;
- повторный вызов идемпотентен;
- после успеха публикует `donation.alert.created` и, если нужно, `donation.goal.updated`.
- для `payment.purpose=order` в `v0.3` переводит order в `paid`, deal в `held` и возвращает `OrderDetail`.

### POST `/api/v1/mock/payments/{payment_id}/fail`

Dev-only mock callback для неуспешного завершения donation payment.

### GET `/api/v1/creators/{creator_slug}/donations`

Публичная история донатов с privacy rules.

### GET `/api/v1/creators/{creator_slug}/goals`

Публичные цели автора.

## Marketplace endpoints

`v0.3 Marketplace MVP` реализует минимальный mock-flow категорий, товаров, заказов, safe deal и отзывов. Реальные провайдеры, payouts, refunds, disputes и risky categories остаются planned/review.

### GET `/api/v1/categories`

Список категорий.

Query:

- `include_restricted=true` — dev/admin-like просмотр restricted категорий для предупреждений UI.

### GET `/api/v1/categories/{slug}`

Категория.

### GET `/api/v1/products`

Поиск и фильтрация товаров.

Параметры:

- `category`;
- `query`;
- `sort`: `new`, `price_asc`, `price_desc`;
- `limit`.
- `offset`.

Правило `v0.3`: public endpoint возвращает только `published` товары из active categories.

### GET `/api/v1/products/{product_id_or_slug}`

Карточка товара.

### POST `/api/v1/seller/products`

Создать товар.

Auth: роль `seller`.

Body:

- `category_id`;
- `kind`: `digital_asset`, `obs_pack`, `design_asset`, `coaching`, `digital_service`;
- `title`;
- optional `slug`;
- `description`;
- `terms`;
- `price_amount_minor`;
- `currency`;
- `delivery_type`: `manual`, `digital_file`, `session`;
- `affiliate_percent_bps`.

Правила:

- risky/restricted categories не принимаются без review;
- деньги только minor units;
- товар создаётся в `draft`.

### PATCH `/api/v1/seller/products/{product_id}`

Обновить товар.

Auth: роль `seller`.

Правило `v0.3`: обновлять можно `draft` или `rejected`; published/pending товары требуют отдельного lifecycle.

### POST `/api/v1/seller/products/{product_id}/submit`

Отправить на модерацию.

Результат: `pending_moderation`.

### DELETE `/api/v1/seller/products/{product_id}`

Soft delete/archive товара.

## Seller endpoints

### GET `/api/v1/seller/overview`

Обзор продавца.

### GET `/api/v1/seller/orders`

Заказы продавца.

### GET `/api/v1/seller/orders/{order_id}`

Детали заказа.

### POST `/api/v1/seller/orders/{order_id}/start`

Перевести deal в `seller_working`.

Правило `v0.3`: разрешено только из `order.status=paid` и `deal.status=held`.

### POST `/api/v1/seller/orders/{order_id}/submit`

Отметить выполнение.

Правило `v0.3`: переводит order в `delivered`, deal в `seller_submitted`.

### GET `/api/v1/seller/promocodes`

Промокоды продавца.

### POST `/api/v1/seller/promocodes`

Создать промокод.

### GET `/api/v1/seller/analytics`

Аналитика.

### GET `/api/v1/seller/balance`

Баланс.

### GET `/api/v1/seller/payouts`

История выплат.

### POST `/api/v1/seller/payouts`

Запрос выплаты.

Headers:

- `Idempotency-Key`.

### POST `/api/v1/seller/verification`

Начать/обновить Seller Pro verification.

## Buyer endpoints

### GET `/api/v1/buyer/orders`

История заказов.

### GET `/api/v1/buyer/orders/{order_id}`

Детали заказа.

### POST `/api/v1/buyer/orders/{order_id}/confirm`

Подтвердить получение.

Правило `v0.3`: mock-confirm завершает order/deal без ledger movements и не является production safe deal.

### POST `/api/v1/buyer/orders/{order_id}/dispute`

Открыть спор.

### GET `/api/v1/buyer/reviews`

Отзывы покупателя.

### POST `/api/v1/buyer/orders/{order_id}/review`

Оставить отзыв.

Правило: один отзыв на completed order, rating `1..5`.

### GET `/api/v1/buyer/favorites`

Избранное.

### POST `/api/v1/buyer/favorites`

Добавить в избранное.

## Order and checkout endpoints

### POST `/api/v1/orders`

Создать заказ.

Headers:

- `Idempotency-Key`.

Body:

- `product_id`;
- `quantity`;
- optional `creator_profile_id`;
- optional `promo_code`;
- `accepted_terms`.

Ответ:

- order;
- deal;
- payment confirmation payload.

Правила `v0.3`:

- требуется bearer token;
- требуется `Idempotency-Key`;
- заказ создаётся только по `published` товару;
- payment создаётся через provider abstraction с purpose `order`;
- deal создаётся в `awaiting_payment`;
- `terms_snapshot_json` фиксирует условия товара на момент заказа.

### GET `/api/v1/orders/{order_id}`

Детали заказа с проверкой доступа.

### POST `/api/v1/orders/{order_id}/cancel`

Отмена, если допустимо.

## Payment endpoints

### GET `/api/v1/payments/{payment_id}`

Статус платежа. Реализовано для Donate MVP.

### POST `/api/v1/payments/{payment_id}/refunds`

Создать refund, admin/support only на старте.

### POST `/api/v1/providers/{provider}/webhooks`

Webhook endpoint конкретного провайдера.

Правила:

- signature verification;
- raw event save;
- idempotent processing;
- no user auth, только provider signature.

## Dispute endpoints

### GET `/api/v1/disputes/{dispute_id}`

Детали спора.

### POST `/api/v1/disputes/{dispute_id}/messages`

Добавить сообщение.

### POST `/api/v1/disputes/{dispute_id}/evidence`

Добавить evidence.

### POST `/api/v1/disputes/{dispute_id}/resolve`

Admin only.

## File endpoints

### POST `/api/v1/files/signed-upload`

Создать signed upload URL.

Body:

- `purpose`;
- `mime_type`;
- `size_bytes`;
- `visibility`;
- `owner_type`;
- `owner_id`.

### POST `/api/v1/files/{file_id}/signed-download`

Создать signed download URL после проверки доступа.

## Admin endpoints

`v0.1` реализует минимальную админку пользователей. Все endpoints ниже требуют роль `admin`.

### GET `/api/v1/admin/users`

Список пользователей.

Query:

- `limit`;
- `offset`.

### GET `/api/v1/admin/users/{user_id}`

Детали пользователя, роли и базовые профили.

### PATCH `/api/v1/admin/users/{user_id}/status`

Изменение статуса пользователя.

Body:

- `status`: `active`, `blocked`, `pending_verification`, `deleted`.

### GET `/api/v1/admin/products`

Очередь товаров.

Query:

- `status`;
- `limit`;
- `offset`.

### POST `/api/v1/admin/products/{product_id}/approve`

Одобрить товар.

Правило `v0.3`: переводит `pending_moderation` в `published`, фиксирует `published_at`.

### POST `/api/v1/admin/products/{product_id}/reject`

Отклонить товар.

Body:

- optional `moderation_note`.

### GET `/api/v1/admin/orders`

Заказы.

### GET `/api/v1/admin/deals`

Safe deals.

### GET `/api/v1/admin/disputes`

Споры.

### POST `/api/v1/admin/disputes/{dispute_id}/resolve`

Решить спор.

### GET `/api/v1/admin/payments`

Платежи.

### GET `/api/v1/admin/payouts`

Выплаты.

### POST `/api/v1/admin/payouts/{payout_id}/approve`

Одобрить выплату.

### POST `/api/v1/admin/payouts/{payout_id}/reject`

Отклонить выплату.

### GET `/api/v1/admin/risk-flags`

Risk review queue.

### POST `/api/v1/admin/risk-flags/{flag_id}/resolve`

Закрыть risk flag.

### GET `/api/v1/admin/audit-logs`

Audit logs.

## WebSocket events

`v0.2` реализует widget endpoint:

```txt
GET /ws/alerts?token={widget_token}
```

Token создаётся/ротируется через studio widgets endpoints, хранится в БД только как hash и даёт read-only подписку на каналы автора.

Envelope:

```json
{
  "event_id": "evt_01H...",
  "event_type": "order.status_changed",
  "event_version": 1,
  "occurred_at": "2026-05-08T10:00:00Z",
  "channel": "order:uuid",
  "payload": {}
}
```

События:

- `donation.alert.created`;
- `donation.goal.updated`;
- `creator.store.purchase_created`;
- `order.status_changed`;
- `deal.status_changed`;
- `dispute.created`;
- `dispute.updated`;
- `payment.status_changed`;
- `payout.status_changed`;
- `admin.review_queue.updated`;
- `notification.created`.

Требования:

- event versioning;
- client dedupe by `event_id`;
- signed widget token;
- heartbeat/ping-pong;
- reconnect with backoff;
- no secrets in payload.

## API compatibility rules

- Не удалять поля без versioning.
- Новые поля должны быть backward-compatible.
- Breaking changes требуют ADR.
- Все новые endpoints добавлять в этот документ.
- Все новые сущности добавлять в `docs/DOMAIN_MODEL.md`.
