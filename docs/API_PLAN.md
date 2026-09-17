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

### POST `/api/v1/auth/identify`

Назначение: первый шаг единой авторизации для email.

Body: `email`.

Ответ всегда `200`: `next_action` со значением `login` или `register`. Endpoint не возвращает user id, status, roles или profile data. Развилка осознанно раскрывает наличие аккаунта; применяются rate limits по IP и нормализованному email, см. ADR-0024.

### POST `/api/v1/auth/email-verification/start`

Назначение: отправить одноразовый код для подтверждения нового email.

Body: `email`, optional `locale`.

Ответ: `challenge_id`, `expires_at`, `resend_available_at`, masked `email`. Код живёт 10 минут, предыдущий активный challenge инвалидируется, повторная отправка ограничена 60 секундами. Если email уже занят, возвращается conflict; UI возвращает пользователя к первому шагу.

### POST `/api/v1/auth/email-verification/verify`

Назначение: проверить одноразовый код и выдать право завершить регистрацию.

Body: `challenge_id`, `code`.

Ответ: `registration_token`, `expires_at`. Не более 5 неверных попыток. Код хранится только как HMAC digest, challenge нельзя проверить повторно после успеха/expiry/лимита.

### POST `/api/v1/auth/register`

Назначение: создать базовый аккаунт пользователя.

Body:

- `registration_token`;
- `password`;
- optional `locale`;
- optional `time_zone`.

Ответ:

- user;
- `access_token`;
- `token_type`;
- `expires_at`.

Правила:

- email берётся только из проверенного registration token; переданный клиентом email не принимается;
- challenge завершается в той же транзакции, что и создание пользователя; replay token не создаёт второй аккаунт;
- `email_verified_at` заполняется при создании, status равен `active`;
- публичная регистрация выдаёт только роль `buyer`;
- поля `display_name` и `role_intent` больше не принимаются (ADR-0022);
- профиль создаётся с временным `display_name` из local part email;
- `profile_name_confirmed_at` в ответе `user` равен `null`;
- следующий шаг — задать имя через `PATCH /api/v1/me/profile`, после чего backend заполняет `name_confirmed_at`;
- имя задаётся сразу после подтверждённой регистрации как следующий обязательный шаг.

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

Body:

- `display_name`;
- `slug`;
- `bio`.

Правила:

- auth required;
- `display_name` 2–80 символов;
- если `name_confirmed_at` пуст, успешное обновнение заполняет его — это завершает шаг `/auth/name`;
- публичные nickname/store address и будущий username этим endpoint не резервируются.

### GET `/api/v1/creators/{creator_slug}`

Публичная страница автора.

### PATCH `/api/v1/studio/profile`

Редактирование creator profile.

### PATCH `/api/v1/seller/profile`

Редактирование seller profile.

### POST `/api/v1/me/creator-profile`

Статус: planned для `v0.3.5`.

Назначение: включить режим автора для текущего пользователя или создать draft creator profile.

Правила:

- auth required;
- не выдаёт admin/support/moderator роли;
- повторный вызов идемпотентно возвращает существующий creator profile;
- пользовательский текст onboarding идёт через i18n.

### POST `/api/v1/me/seller-profile`

Статус: planned для `v0.3.5`.

Назначение: включить режим продавца для текущего пользователя или создать draft seller profile.

Правила:

- auth required;
- Seller Pro verification не запускается здесь;
- налоговые/юридические предупреждения остаются `LEGAL_REVIEW_REQUIRED` до review.

### POST `/api/v1/me/creator-profile/pause`

Статус: planned для `v0.3.5`.

Назначение: временно приостановить публичную страницу автора.

Правила:

- owner only;
- публичная страница показывает localized unavailable state;
- донаты/витрина блокируются, история не удаляется;
- действие пишется в audit log.

### POST `/api/v1/me/creator-profile/resume`

Статус: planned для `v0.3.5`.

Назначение: вернуть страницу автора из paused state.

### POST `/api/v1/me/creator-profile/archive`

Статус: planned для `v0.3.5`.

Назначение: архивировать страницу автора как soft delete.

Правила:

- owner only;
- не удаляет donations, orders, reviews, payments и audit logs;
- физическое удаление данных не входит в endpoint.

### POST `/api/v1/me/seller-profile/pause`

Статус: planned для `v0.3.5`.

Назначение: временно приостановить публичную страницу/режим продавца.

Правила:

- owner only;
- нельзя ломать active orders;
- если есть активные обязательства, endpoint возвращает blocked state с `i18n_key`.

### POST `/api/v1/me/seller-profile/resume`

Статус: planned для `v0.3.5`.

Назначение: вернуть seller profile из paused state.

### POST `/api/v1/me/seller-profile/archive`

Статус: planned для `v0.3.5`.

Назначение: архивировать страницу продавца как soft delete.

Правила:

- owner only;
- не удаляет products, orders, reviews, payments и audit logs;
- blocked active orders возвращают понятную ошибку.

## Design skin endpoints

### GET `/api/v1/design/skins`

Статус: planned для `v0.3.5`.

Назначение: получить список активных безопасных skin presets.

Правила:

- public read;
- возвращает только schema-validated presets;
- preset содержит i18n keys и token override metadata, но не произвольный CSS/HTML.

## Creator endpoints

### GET `/api/v1/studio/overview`

Обзор для стримера.

### GET `/api/v1/studio/statistics`

Статус: planned для `v0.3.5`.

Назначение: получить агрегированную статистику автора для графика Studio.

Query:

- `period`;
- `granularity`: `hour`, `day`, `week`, `month`;
- `source`: `all`, `donation`, `partner_product`, `store_purchase`;
- optional `currency`.

Правила:

- auth required, creator owner only;
- суммы возвращаются только в minor units;
- endpoint не возвращает wallet balance, payout status или ledger movements;
- пустой период возвращает пустые серии, а не fake metrics.

### GET `/api/v1/studio/events`

Статус: planned для `v0.3.5`.

Назначение: получить ленту последних событий Studio.

Query:

- `event_type`: `all`, `donation`, `channel_subscription`, `partner_purchase`, `store_purchase`, `widget`, `system`;
- `source`: `fanfuel`, `youtube`, `twitch`, `telegram`, `mock`, `manual`;
- `limit`;
- `cursor`.

Правила:

- auth required, creator owner only;
- raw bot/provider payload не возвращается;
- события сортируются по `occurred_at desc`;
- payload schema versioned и не содержит secrets.

### GET `/api/v1/studio/channel-integrations`

Статус: planned для `v0.3.5`.

Назначение: список подключений ботов YouTube, Twitch и Telegram для channel subscription events.

Правила:

- auth required, creator owner only;
- возвращает masked status, platform, display name, last sync/error;
- не возвращает access token, refresh token, bot secret или raw scopes.

### POST `/api/v1/studio/channel-integrations/{platform}/connect`

Статус: planned для `v0.3.5`.

Назначение: начать подключение канала к bot/integration слою.

Правила:

- `platform` in `youtube`, `twitch`, `telegram`;
- OAuth/bot token storage только backend-side и encrypted reference;
- production подключение требует platform/security review;
- опасные повторные вызовы должны быть retry-safe.

### POST `/api/v1/studio/channel-integrations/{integration_id}/pause`

Статус: planned для `v0.3.5`.

Назначение: временно приостановить обработку событий интеграции.

### POST `/api/v1/studio/channel-integrations/{integration_id}/resume`

Статус: planned для `v0.3.5`.

Назначение: возобновить обработку событий интеграции.

### POST `/api/v1/studio/channel-integrations/{integration_id}/revoke`

Статус: planned для `v0.3.5`.

Назначение: отозвать подключение бота и прекратить ingestion событий.

Правила:

- revoke пишет audit log;
- raw tokens удаляются/инвалидируются по выбранной storage policy;
- прошлые `CreatorActivityEvent` не удаляются физически.

### GET `/api/v1/studio/donations`

История донатов.

### GET `/api/v1/studio/donation-settings`

Статус: planned для `v0.3.5`.

Назначение: получить настройки донатов автора.

Правила:

- auth required, creator owner only;
- возвращает amount presets, message limits, audio/TTS thresholds, moderation и spam-filter policy;
- amounts в minor units.

### PATCH `/api/v1/studio/donation-settings`

Статус: planned для `v0.3.5`.

Назначение: обновить настройки донатов автора.

Body:

- optional `amount_presets`;
- optional `min_amount_minor`;
- optional `max_amount_minor`;
- optional `message_max_length`;
- optional `audio_enabled`;
- optional `audio_min_amount_minor`;
- optional `audio_allowed_categories`;
- optional `tts_enabled`;
- optional `tts_min_amount_minor`;
- optional `tts_allowed_categories`;
- optional `moderation_mode`;
- optional `spam_filter_config`.

Правила:

- owner only;
- validation errors имеют `i18n_key`;
- настройки не меняют payment provider flow;
- `moderation_mode` in `auto_approve`, `hold_for_review`, `blocked`.

### GET `/api/v1/studio/goals`

Список целей.

### POST `/api/v1/studio/goals`

Создать donation goal.

### PATCH `/api/v1/studio/goals/{goal_id}`

Обновить цель.

### GET `/api/v1/studio/widgets`

Список виджетов.

### GET `/api/v1/studio/widget-presets`

Статус: planned для `v0.3.5`.

Назначение: список категорий и preset-типов виджетов для Studio catalog.

Query:

- optional `category`: `alerts`, `statistics`, `fundraising`, `products`, `cyclic_promo`, `other`.

Правила:

- возвращает i18n keys, supported event types и schema version;
- не возвращает произвольный JS/HTML/CSS;
- deprecated presets скрываются от новых виджетов, но старые виджеты продолжают работать по schema version.

### POST `/api/v1/studio/widgets`

Создать widget config.

### POST `/api/v1/studio/widgets/{widget_id}/rotate-token`

Ротация widget token.

Ответ `v0.2` при создании или ротации содержит token только один раз. Клиент строит OBS URL на базе widget app URL и `token`.

### GET `/api/v1/studio/widget-groups`

Статус: planned для `v0.3.5`.

Назначение: список групп виджетов автора.

### POST `/api/v1/studio/widget-groups`

Статус: planned для `v0.3.5`.

Назначение: создать группу виджетов с read-only token и layout zones.

Правила:

- token возвращается только один раз;
- layout config валидируется schema;
- public widget group URL read-only.

### PATCH `/api/v1/studio/widget-groups/{group_id}`

Статус: planned для `v0.3.5`.

Назначение: обновить имя, статус и layout zones группы.

### POST `/api/v1/studio/widget-groups/{group_id}/rotate-token`

Статус: planned для `v0.3.5`.

Назначение: ротировать read-only token группы.

### GET `/api/v1/studio/widgets/{widget_id}/rules`

Статус: planned для `v0.3.5`.

Назначение: получить правила выбора алертов для виджета.

### POST `/api/v1/studio/widgets/{widget_id}/rules`

Статус: planned для `v0.3.5`.

Назначение: создать правило для товара, группы товаров, подборки, purchase event или порога суммы доната.

Правила:

- trigger config валидируется schema;
- priority определяет выбор при нескольких совпадениях;
- upload assets идёт через signed file endpoints.

### PATCH `/api/v1/studio/widgets/{widget_id}/rules/{rule_id}`

Статус: planned для `v0.3.5`.

Назначение: обновить trigger, placement zone, asset или animation config.

### GET `/api/v1/studio/products`

Статус: planned для `v0.3.5`.

Назначение: список товаров, которые автор может добавить в витрину или подборку.

Query:

- `source`: `own`, `partner`, `all`;
- optional `category`;
- optional `status`;
- `limit`;
- `cursor`.

Правила:

- auth required, creator owner only;
- возвращает только published/eligible товары;
- hidden/rejected/private seller data не раскрываются;
- партнёрские товары возвращают disclosure metadata.

### POST `/api/v1/studio/products/{product_id}/select`

Статус: planned для `v0.3.5`.

Назначение: добавить товар в candidate list витрины автора или сразу в store section.

Правила:

- product должен быть eligible;
- duplicate select идемпотентен;
- partner disclosure обязателен для партнёрских товаров.

### DELETE `/api/v1/studio/products/{product_id}/select`

Статус: planned для `v0.3.5`.

Назначение: убрать товар из candidate list витрины автора без удаления product/order history.

### GET `/api/v1/studio/collections`

Статус: planned для `v0.3.5`.

Назначение: список авторских подборок для витрины.

Правила:

- auth required, creator owner only;
- может использовать `UserCollection`, но контекст применения creator/store фиксируется отдельно;
- private user collection не становится public без явного действия.

### POST `/api/v1/studio/collections`

Статус: planned для `v0.3.5`.

Назначение: создать авторскую подборку для витрины.

Body:

- `title`;
- optional `description`;
- `visibility`;
- optional `skin_preset_id`.

### PATCH `/api/v1/studio/collections/{collection_id}`

Статус: planned для `v0.3.5`.

Назначение: обновить название, описание, видимость, порядок или skin preset авторской подборки.

### POST `/api/v1/studio/collections/{collection_id}/items`

Статус: planned для `v0.3.5`.

Назначение: добавить товар, автора или продавца в авторскую подборку.

### DELETE `/api/v1/studio/collections/{collection_id}/items/{item_id}`

Статус: planned для `v0.3.5`.

Назначение: удалить элемент из авторской подборки.

### GET `/api/v1/studio/store`

Получить витрину автора.

### PUT `/api/v1/studio/store`

Обновить витрину.

### POST `/api/v1/studio/store/items`

Добавить товар в витрину.

### DELETE `/api/v1/studio/store/items/{item_id}`

Скрыть/удалить товар из витрины.

### POST `/api/v1/studio/store/sections`

Статус: planned для `v0.3.5`.

Назначение: создать секцию витрины автора из товаров или пользовательской подборки.

Правила:

- `visibility_rule` in `always`, `live_only`, `offline_only`;
- product должен быть `published`;
- partner disclosure обязателен для партнёрских товаров.

### PATCH `/api/v1/studio/store/sections/{section_id}`

Статус: planned для `v0.3.5`.

Назначение: обновить порядок, заголовок, описание и visibility rule секции.

### PATCH `/api/v1/studio/live-state`

Статус: planned для `v0.3.5`.

Назначение: ручное управление live-state автора до внешних stream-интеграций.

Body:

```json
{
  "status": "live"
}
```

Правила:

- `status` in `offline`, `live`, `paused`;
- изменение публикует realtime event, если WS слой включён;
- live-state не даёт права на редактирование без auth.

### GET `/api/v1/studio/analytics`

Статус: future для `v0.4+`.

Назначение: расширенная аналитика после базовой `/api/v1/studio/statistics`.

Правила:

- не дублировать базовый график v0.3.5;
- не возвращать payout/balance данные до wallet/ledger этапов.

## Internal bot ingestion endpoints

### POST `/api/v1/internal/bot-events`

Статус: planned для `v0.3.5`.

Назначение: принять событие от trusted bot/worker слоя и создать `CreatorActivityEvent`.

Auth: service-to-service signature или internal queue boundary.

Body:

- `platform`: `youtube`, `twitch`, `telegram`;
- `external_channel_id`;
- `external_event_id`;
- `event_type`: `channel_subscription`;
- `occurred_at`;
- `payload`.

Правила:

- не публичный пользовательский endpoint;
- signature/trusted boundary mandatory;
- idempotent by (`platform`, `external_event_id`);
- raw secrets не сохранять в payload;
- rate limiting и dead-letter strategy обязательны для production.

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

Профильные потребительские endpoints в `v0.3.5` должны жить в `/api/v1/me/*`, потому что избранное, отзывы и подборки принадлежат пользователю, а не отдельной buyer role.

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

Статус: legacy planned alias; для `v0.3.5` использовать `/api/v1/me/favorites`.

### POST `/api/v1/buyer/favorites`

Добавить в избранное.

Статус: legacy planned alias; для `v0.3.5` использовать `/api/v1/me/favorites`.

### GET `/api/v1/me/favorites`

Статус: planned для `v0.3.5`.

Назначение: список избранного текущего пользователя.

Query:

- `entity_type`;
- `limit`;
- `cursor`.

### POST `/api/v1/me/favorites`

Статус: planned для `v0.3.5`.

Назначение: добавить товар, автора, продавца или подборку в избранное.

Body:

- `entity_type`;
- `entity_id`.

Правила:

- owner only;
- duplicate add идемпотентен;
- hidden/private target возвращает not found или forbidden без раскрытия лишних данных.

### DELETE `/api/v1/me/favorites/{favorite_id}`

Статус: planned для `v0.3.5`.

Назначение: убрать элемент из избранного.

### GET `/api/v1/me/reviews`

Статус: planned для `v0.3.5`.

Назначение: отзывы, оставленные текущим пользователем.

Правила:

- owner only;
- показывает published/hidden/flagged statuses для автора отзыва;
- не раскрывает moderation internals сверх разрешённого.

### GET `/api/v1/me/collections`

Статус: planned для `v0.3.5`.

Назначение: список подборок текущего пользователя.

### POST `/api/v1/me/collections`

Статус: planned для `v0.3.5`.

Назначение: создать подборку пользователя.

Body:

- `title`;
- optional `description`;
- `visibility`: `private`, `public`, `unlisted`;
- optional `skin_preset_id`.

### PATCH `/api/v1/me/collections/{collection_id}`

Статус: planned для `v0.3.5`.

Назначение: обновить название, описание, видимость, порядок или skin preset подборки.

### POST `/api/v1/me/collections/{collection_id}/items`

Статус: planned для `v0.3.5`.

Назначение: добавить товар, автора или продавца в подборку.

### DELETE `/api/v1/me/collections/{collection_id}/items/{item_id}`

Статус: planned для `v0.3.5`.

Назначение: удалить элемент из подборки.

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
- `donation.moderation_held`;
- `creator.live_state_changed`;
- `creator.metric_snapshot.updated`;
- `creator.activity.created`;
- `creator.channel_integration.updated`;
- `widget.group.updated`;
- `creator.store.purchase_created`;
- `purchase.alert.created`;
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

## UX-TASK-031: POST /api/v1/studio/onboarding

Авторизованный пользователь передаёт title (2–80 символов), description (до 1000). Транзакционно добавляет собственную роль streamer и creator_profile со статусом draft. Повторный запрос возвращает существующий профиль без перезаписи. Ответ CurrentUser; стандартные unauthorized/validation/forbidden. Не принимает user_id, role или status.

UX-TASK-031: обнаружена выдача draft авторов публичными GET и допустимость draft в разрешении адресата доната. В связи с созданием приватных черновиков разрешён только published; PublicProfile скрывает непубличный creator_profile. Provider/суммы/проведение платежей не меняются. Изменение доступа намеренное, чтобы черновик не был публичным до публикации.
