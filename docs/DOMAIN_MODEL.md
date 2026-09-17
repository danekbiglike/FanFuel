# DOMAIN_MODEL.md

## Общие правила модели данных

- Primary keys: UUID.
- Время: `created_at`, `updated_at`; `deleted_at` для soft delete там, где объект не должен физически удаляться.
- Деньги: только integer minor units, например копейки в `amount_minor`.
- Валюта: отдельное поле `currency`, ISO 4217, например `RUB`.
- Provider IDs: хранить отдельно от внутренних IDs.
- Финансовые движения: только через отдельные таблицы `payments`, `refunds`, `payouts`, `balance_transactions`.
- Webhooks: сохранять raw payload и результат обработки.
- Audit: все admin/manual/financial transitions пишутся в `audit_logs`.
- Idempotency: для опасных операций использовать `idempotency_key`.
- Статусы: хранить как строковые enum-like значения, валидировать на уровне приложения и миграций.

`v0.1` реализует начальную PostgreSQL схему для `User`, `Role`, `Profile`, `CreatorProfile`, `SellerProfile`, `BuyerProfile` и `AuditLog` в миграции `000002_auth_profiles`.

`v0.2` реализует схему Donate MVP в миграции `000003_donate_mvp`: `Payment`, `ProviderWebhook`, `Donation`, `DonationGoal`, `Widget` и техническую таблицу `idempotency_keys` для защиты повторной отправки `POST /donations`.

`v0.3` реализует Marketplace MVP в миграции `000005_marketplace_mvp`: `ProductCategory`, `Product`, `ProductMedia`, `Order`, `Deal`, `DealEvent`, `Review` и связь `idempotency_keys.order_id`. Refunds, payouts, wallets, balance ledger, disputes и real provider integrations остаются planned/review.

`v0.3.5` планирует промежуточный слой Universal Profile + Studio Skins: `DesignSkinPreset`, `Favorite`, `UserCollection`, `CollectionItem`, `StreamSession`, `CreatorMetricSnapshot`, `CreatorActivityEvent`, `CreatorChannelIntegration`, `CreatorDonationSettings`, `WidgetPreset`, `WidgetGroup`, `WidgetAlertRule`, расширение `CreatorStore`/`StoreItem` live-only правилами и статусы паузы/архива для creator/seller страниц. Production payments, payouts, ledger, refunds и disputes в этот слой не входят.

## Базовые типы статусов

### User status

- `active`;
- `blocked`;
- `pending_verification`;
- `deleted`.

### Product status

- `draft`;
- `pending_moderation`;
- `published`;
- `rejected`;
- `hidden`;
- `archived`.

### Order status

- `created`;
- `awaiting_payment`;
- `paid`;
- `in_progress`;
- `delivered`;
- `completed`;
- `disputed`;
- `cancelled`;
- `refunded`;
- `failed`.

### Deal status

- `created`;
- `awaiting_payment`;
- `paid`;
- `held`;
- `seller_working`;
- `seller_submitted`;
- `buyer_confirmed`;
- `auto_confirmed`;
- `disputed`;
- `resolved_to_buyer`;
- `resolved_to_seller`;
- `refunded`;
- `completed`;
- `cancelled`;
- `failed`.

### Payment status

- `created`;
- `pending`;
- `requires_action`;
- `succeeded`;
- `failed`;
- `cancelled`;
- `refunded`;
- `partially_refunded`.

### Payout status

- `created`;
- `pending_review`;
- `processing`;
- `succeeded`;
- `failed`;
- `cancelled`;
- `returned`.

## User

Назначение: базовая учётная запись.

Основные поля:

- `id`;
- `email`;
- `email_verified_at`;
- `password_hash`;
- `status`;
- `default_locale`;
- `time_zone`;
- `created_at`;
- `updated_at`;
- `deleted_at`.

Связи:

- one-to-many `roles`;
- one-to-one `profile`;
- optional one-to-one `creator_profile`;
- optional one-to-one `seller_profile`;
- optional one-to-one `buyer_profile`.

Статусы: `active`, `blocked`, `pending_verification`, `deleted`.

Ограничения:

- `email` unique case-insensitive;
- `password_hash` nullable только для OAuth-only аккаунтов в будущем;
- `default_locale` входит в supported locales.

Индексы:

- unique lower(`email`);
- `status`;
- `created_at`.

Бизнес-правила:

- один пользователь может иметь несколько ролей;
- блокировка пользователя должна блокировать опасные действия во всех ролях;
- удаление должно быть soft delete с учётом legal retention.

## EmailVerificationChallenge

Назначение: одноразовое подтверждение нового email до создания аккаунта.

Основные поля:

- `id` UUID;
- `email` — нормализованный email;
- `purpose` — в текущей версии только `registration`;
- `locale`;
- `code_digest` — HMAC digest, raw code не хранится;
- `attempt_count`, `max_attempts`;
- `expires_at`, `resend_available_at`;
- `verified_at`, `completed_at`, `invalidated_at`;
- `created_at`, `updated_at`.

Правила:

- активен только challenge без `verified_at`, `completed_at`, `invalidated_at`, с будущим `expires_at` и не исчерпанными попытками;
- создание нового challenge инвалидирует предыдущие активные challenge этого email/purpose;
- успешная проверка заполняет `verified_at` и выдаёт короткоживущий registration token;
- завершение регистрации блокирует строку challenge и атомарно заполняет `completed_at`;
- raw code, registration token и SMTP credentials не хранятся и не логируются;
- истёкшие строки подлежат фоновому cleanup после появления worker job.

Индексы: `lower(email), purpose, created_at DESC`; `expires_at` для cleanup.

## UserPreferences

Назначение: пользовательские настройки интерфейса, которые должны переживать вход с разных устройств.

Основные поля:

- `user_id`;
- `theme_preference`;
- `locale`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `user`.

Статусы: не нужны.

Ограничения:

- `user_id` primary key и foreign key на `users(id)` с `ON DELETE CASCADE`;
- `theme_preference` in `system`, `light`, `dark`;
- `locale` in `ru`, `en`.

Индексы:

- primary key `user_id`.

Бизнес-правила:

- для нового пользователя создаётся `system`;
- если запись отсутствует у существующего пользователя, API создаёт её лениво;
- guest theme хранится локально и не является источником истины после авторизации.

## DesignSkinPreset

Назначение: безопасный preset визуального скина для сайта, публичных страниц и Studio preview.

Основные поля:

- `id`;
- `slug`;
- `name_i18n_key`;
- `description_i18n_key`;
- `status`;
- `token_overrides_json`;
- `density`;
- `radius_scale`;
- `preview_file_id`;
- `created_at`;
- `updated_at`.

Связи:

- optional file reference for preview.

Статусы:

- `draft`;
- `active`;
- `archived`.

Ограничения:

- `slug` unique;
- token overrides валидируются allowlist schema;
- preset не может содержать произвольный CSS/HTML/JS;
- должен поддерживать light/dark или явно наследовать base tokens.

Индексы:

- unique `slug`;
- `status`.

Бизнес-правила:

- скин меняет только semantic tokens, плотность, радиусы, тени и preview assets;
- скин не меняет layout slots, порядок контента, route structure или i18n keys;
- пользовательские/авторские настройки скина должны проходить schema validation.

## Role

Назначение: роль пользователя в системе.

Основные поля:

- `id`;
- `user_id`;
- `role`;
- `granted_by_user_id`;
- `created_at`.

Связи:

- many-to-one `user`;
- optional many-to-one `granted_by_user`.

Статусы: отдельный статус не нужен.

Ограничения:

- `role` in `buyer`, `streamer`, `seller`, `admin`, `support`, `moderator`;
- unique (`user_id`, `role`).

Индексы:

- `user_id`;
- `role`;
- (`role`, `created_at`).

Бизнес-правила:

- `admin` нельзя выдавать через публичный API;
- изменение ролей всегда пишется в audit log.

## Profile

Назначение: общие публичные данные пользователя.

Основные поля:

- `id`;
- `user_id`;
- `display_name`;
- `slug`;
- `name_confirmed_at` — внутренний маркер заполнения имени после регистрации;
- `avatar_file_id`;
- `bio`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `user`;
- optional file reference for avatar.

Статусы: наследует `User.status`.

Ограничения:

- `slug` unique;
- `display_name` required;
- avatar должен быть public-safe file.

Индексы:

- unique `slug`;
- `user_id`.

Бизнес-правила:

- slug нельзя менять часто без redirect policy;
- display name не должен использоваться как уникальный идентификатор.
- `name_confirmed_at` не входит в публичные profile responses; для текущего пользователя API возвращает его как `profile_name_confirmed_at`.
- имя на платформе, публичный ник/название витрины и будущий username — отдельные значения; нельзя автоматически приравнивать их друг к другу.

## CreatorProfile

Назначение: профиль стримера/автора.

Основные поля:

- `id`;
- `user_id`;
- `profile_id`;
- `creator_slug`;
- `status`;
- `title`;
- `description`;
- `banner_file_id`;
- `skin_preset_id`;
- `theme_config_json`;
- `live_status`;
- `donations_enabled`;
- `store_enabled`;
- `partner_disclosure_enabled`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `user`;
- one-to-one `creator_store`;
- one-to-many `donation_goals`;
- one-to-many `widgets`;
- one-to-many `widget_groups`;
- one-to-many `stream_sessions`;
- one-to-many `activity_events`;
- one-to-many `metric_snapshots`;
- one-to-many `channel_integrations`;
- one-to-one `donation_settings`;
- one-to-many `affiliate_attributions`.

Статусы:

- `draft`;
- `published`;
- `paused`;
- `hidden`;
- `archived`;
- `blocked`.

Ограничения:

- `creator_slug` unique;
- theme config валидируется schema;
- `live_status` in `offline`, `live`, `paused`;
- публичная страница недоступна при `blocked` и показывает временную недоступность при `paused`.

Индексы:

- unique `creator_slug`;
- `user_id`;
- `status`.

Бизнес-правила:

- партнёрские товары должны иметь disclosure;
- отключение donations не удаляет историю;
- archived creator page не удаляет донаты, заказы, отзывы, файлы и audit log.

## SellerProfile

Назначение: профиль продавца и настройки режима Seller Lite/Pro.

Основные поля:

- `id`;
- `user_id`;
- `seller_type`;
- `status`;
- `display_name`;
- `description`;
- `inn`;
- `legal_name`;
- `verification_status`;
- `hold_policy`;
- `payout_policy`;
- `rating_avg`;
- `rating_count`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `user`;
- one-to-many `products`;
- one-to-many `orders`;
- one-to-many `payouts`;
- one-to-many `wallets`.

Статусы:

- `draft`;
- `active`;
- `paused`;
- `archived`;
- `blocked`;
- `rejected`.

Ограничения:

- `seller_type` in `lite`, `pro`;
- `inn` required для Seller Pro;
- Seller Lite имеет лимиты.

Индексы:

- `user_id`;
- `seller_type`;
- `status`;
- `verification_status`.

Бизнес-правила:

- Seller Lite быстрее стартует, но имеет higher hold и lower limits;
- Seller Pro получает больше лимитов после verification;
- налоговые предупреждения не заменяют юридическую консультацию;
- archived seller page не удаляет товары, заказы, отзывы, платежи и audit log;
- pause/archive должны блокироваться или требовать явного состояния, если есть активные обязательства по заказам.

## BuyerProfile

Назначение: профиль покупателя.

Основные поля:

- `id`;
- `user_id`;
- `preferred_locale`;
- `notification_settings_json`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `user`;
- one-to-many `orders`;
- one-to-many `reviews`;
- one-to-many `disputes`.

Статусы: наследует `User.status`.

Ограничения:

- один buyer profile на пользователя.

Индексы:

- unique `user_id`.

Бизнес-правила:

- buyer profile создаётся автоматически при регистрации, если выбран buyer flow;
- пользователь может позже добавить streamer/seller роли.

## Favorite

Назначение: избранное пользователя для товаров, авторов, продавцов и подборок.

Основные поля:

- `id`;
- `user_id`;
- `entity_type`;
- `entity_id`;
- `created_at`.

Связи:

- many-to-one `user`;
- polymorphic reference by `entity_type`, `entity_id`.

Статусы: не нужны.

Ограничения:

- `entity_type` in `product`, `creator_profile`, `seller_profile`, `user_collection`;
- unique (`user_id`, `entity_type`, `entity_id`).

Индексы:

- `user_id`;
- (`entity_type`, `entity_id`);
- `created_at`.

Бизнес-правила:

- private/deleted сущности не должны показываться в public preview;
- избранное принадлежит пользователю, а не buyer role.

## Product

Назначение: цифровой товар или услуга продавца/автора.

Основные поля:

- `id`;
- `seller_profile_id`;
- `category_id`;
- `kind`;
- `status`;
- `title`;
- `slug`;
- `description`;
- `terms`;
- `price_amount_minor`;
- `currency`;
- `delivery_type`;
- `affiliate_percent_bps`;
- `safe_deal_required`;
- `moderation_note`;
- `published_at`;
- `created_at`;
- `updated_at`;
- `deleted_at`.

Связи:

- many-to-one `seller_profile`;
- many-to-one `product_category`;
- one-to-many `product_media`;
- one-to-many `store_items`;
- one-to-many `orders`;
- one-to-many `reviews`.

Статусы: `draft`, `pending_moderation`, `published`, `rejected`, `hidden`, `archived`.

Ограничения:

- price >= 0;
- currency required;
- affiliate percent в basis points;
- risky categories disabled до legal review.

Индексы:

- `seller_profile_id`;
- `category_id`;
- `status`;
- `published_at`;
- unique (`seller_profile_id`, `slug`).

Бизнес-правила:

- published товар должен пройти модерацию;
- изменение цены не меняет уже созданные orders;
- цифровые файлы должны быть private by default.

## ProductCategory

Назначение: дерево категорий marketplace.

Основные поля:

- `id`;
- `parent_id`;
- `slug`;
- `name_i18n_key`;
- `description_i18n_key`;
- `status`;
- `requires_legal_review`;
- `sort_order`;
- `created_at`;
- `updated_at`.

Связи:

- self-reference parent/children;
- one-to-many `products`.

Статусы:

- `active`;
- `hidden`;
- `restricted`.

Ограничения:

- `slug` unique;
- категории risky должны иметь `requires_legal_review=true`.

Индексы:

- unique `slug`;
- `parent_id`;
- `status`.

Бизнес-правила:

- нельзя публиковать товары в restricted категории без явного разрешения;
- названия категорий идут через i18n.

## ProductMedia

Назначение: медиа товара и приватные файлы доставки.

Основные поля:

- `id`;
- `product_id`;
- `kind`;
- `url`;
- `alt_text`;
- `visibility`;
- `sort_order`;
- `created_at`.

Связи:

- many-to-one `product`;
- optional future many-to-one file/storage object.

Статусы: статус берётся у file object после file metadata интеграции.

Ограничения:

- `kind` in `image`, `video`, `preview`, `digital_file`, `document`;
- `digital_file` должен быть private;
- MIME validation.

Индексы:

- `product_id`;
- (`product_id`, `sort_order`);
- `visibility`.

Бизнес-правила:

- скачивание private digital file требует successful order;
- каждое скачивание пишется в audit/download log.

## CreatorStore

Назначение: витрина автора.

Основные поля:

- `id`;
- `creator_profile_id`;
- `status`;
- `title`;
- `description`;
- `layout_config_json`;
- `default_visibility_rule`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `creator_profile`;
- one-to-many `store_items`;
- one-to-many `user_collections` through collection blocks.

Статусы:

- `draft`;
- `published`;
- `hidden`.

Ограничения:

- один store на creator profile на старте.

Индексы:

- unique `creator_profile_id`;
- `status`.

Бизнес-правила:

- hidden store не скрывает сам creator profile;
- порядок и подборки хранятся отдельно от product;
- live-only блоки показываются только при `CreatorProfile.live_status=live`.

## StoreItem

Назначение: элемент витрины автора.

Основные поля:

- `id`;
- `creator_store_id`;
- `product_id`;
- `collection_id`;
- `kind`;
- `status`;
- `visibility_rule`;
- `custom_title`;
- `custom_description`;
- `sort_order`;
- `featured`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one `creator_store`;
- optional many-to-one `product`;
- optional many-to-one `user_collection`.

Статусы:

- `active`;
- `hidden`;
- `removed`.

Ограничения:

- unique (`creator_store_id`, `product_id`);
- unique (`creator_store_id`, `collection_id`) when collection item;
- product должен быть published;
- `visibility_rule` in `always`, `live_only`, `offline_only`.

Индексы:

- `creator_store_id`;
- `product_id`;
- (`creator_store_id`, `sort_order`).

Бизнес-правила:

- партнёрский товар должен показывать disclosure;
- если product hidden, store item не должен продаваться;
- `live_only` item скрыт, пока автор offline или paused.

## UserCollection

Назначение: подборка товаров/авторов, которую может создать любой пользователь.

Основные поля:

- `id`;
- `owner_user_id`;
- `title`;
- `description`;
- `status`;
- `visibility`;
- `skin_preset_id`;
- `created_at`;
- `updated_at`;
- `deleted_at`.

Связи:

- many-to-one `user`;
- one-to-many `collection_items`;
- optional many-to-one `design_skin_preset`.

Статусы:

- `draft`;
- `published`;
- `hidden`;
- `archived`.

Ограничения:

- `visibility` in `private`, `public`, `unlisted`;
- title required;
- public collection items должны ссылаться только на public-safe сущности.

Индексы:

- `owner_user_id`;
- `status`;
- `visibility`;
- `created_at`.

Бизнес-правила:

- создание подборок не требует роли автора;
- public подборка может потребовать moderation позже;
- archived collection не удаляет историю ссылок в orders/analytics.

## CollectionItem

Назначение: элемент пользовательской подборки.

Основные поля:

- `id`;
- `collection_id`;
- `entity_type`;
- `entity_id`;
- `custom_note`;
- `sort_order`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one `user_collection`;
- polymorphic reference by `entity_type`, `entity_id`.

Статусы: наследуются от collection и target entity.

Ограничения:

- `entity_type` in `product`, `creator_profile`, `seller_profile`;
- unique (`collection_id`, `entity_type`, `entity_id`).

Индексы:

- `collection_id`;
- (`collection_id`, `sort_order`);
- (`entity_type`, `entity_id`).

Бизнес-правила:

- hidden product/creator не показывается публично через подборку;
- порядок элементов хранится отдельно от product sort.

## StreamSession

Назначение: состояние прямой трансляции автора для live-only витрин и realtime UI.

Основные поля:

- `id`;
- `creator_profile_id`;
- `status`;
- `source`;
- `external_stream_id`;
- `started_at`;
- `ended_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one `creator_profile`.

Статусы:

- `scheduled`;
- `live`;
- `paused`;
- `ended`;
- `cancelled`.

Ограничения:

- только одна active `live` session на creator profile;
- external stream fields nullable для ручного MVP.

Индексы:

- `creator_profile_id`;
- `status`;
- `started_at`.

Бизнес-правила:

- `v0.3.5` может начать с ручного live-state;
- внешние платформы требуют отдельной integration task;
- live-state не должен давать права на редактирование витрины без auth.

## CreatorMetricSnapshot

Назначение: агрегированный снимок статистики автора для Studio charts.

Основные поля:

- `id`;
- `creator_profile_id`;
- `period_start`;
- `period_end`;
- `granularity`;
- `source`;
- `gross_amount_minor`;
- `creator_amount_minor`;
- `currency`;
- `event_count`;
- `snapshot_status`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one `creator_profile`.

Статусы:

- `complete`;
- `partial`;
- `recalculation_required`.

Ограничения:

- `granularity` in `hour`, `day`, `week`, `month`;
- `source` in `donation`, `partner_product`, `store_purchase`, `all`;
- amounts хранятся только в minor units;
- currency required.

Индексы:

- `creator_profile_id`;
- (`creator_profile_id`, `period_start`, `granularity`);
- `source`;
- `snapshot_status`.

Бизнес-правила:

- статистика Studio не является `Wallet`, `BalanceTransaction` или payout balance;
- данные пересчитываются из source events и не создают финансовых движений;
- fake metrics запрещены даже для пустого состояния.

## CreatorActivityEvent

Назначение: единая лента последних событий Studio.

Основные поля:

- `id`;
- `creator_profile_id`;
- `event_type`;
- `source`;
- `source_entity_type`;
- `source_entity_id`;
- `external_event_id`;
- `payload_json`;
- `visibility`;
- `occurred_at`;
- `created_at`.

Связи:

- many-to-one `creator_profile`;
- optional source donation/order/channel integration by type/id.

Статусы: отдельный status не нужен; видимость управляется `visibility`.

Ограничения:

- `event_type` in `donation`, `channel_subscription`, `partner_purchase`, `store_purchase`, `widget`, `system`;
- `source` in `fanfuel`, `youtube`, `twitch`, `telegram`, `mock`, `manual`;
- payload schema versioned;
- unique (`source`, `external_event_id`) where external id exists.

Индексы:

- `creator_profile_id`;
- (`creator_profile_id`, `occurred_at`);
- `event_type`;
- `source`;
- (`source`, `external_event_id`).

Бизнес-правила:

- raw platform payload не показывается пользователю;
- событие не должно раскрывать лишние персональные данные покупателя или подписчика;
- feed должен уметь дедуплицировать bot/provider retries.

## CreatorChannelIntegration

Назначение: подключение внешнего канала автора для bot-backed событий подписок.

Основные поля:

- `id`;
- `creator_profile_id`;
- `platform`;
- `status`;
- `external_channel_id`;
- `display_name`;
- `bot_user_id`;
- `scopes_json`;
- `token_ref`;
- `last_sync_at`;
- `last_error_code`;
- `created_at`;
- `updated_at`;
- `revoked_at`.

Связи:

- many-to-one `creator_profile`;
- one-to-many `creator_activity_events`.

Статусы:

- `not_connected`;
- `connecting`;
- `active`;
- `paused`;
- `error`;
- `revoked`.

Ограничения:

- `platform` in `youtube`, `twitch`, `telegram`;
- token/secret хранится только как encrypted backend reference, не raw value;
- unique (`creator_profile_id`, `platform`, `external_channel_id`).

Индексы:

- `creator_profile_id`;
- `platform`;
- `status`;
- `last_sync_at`.

Бизнес-правила:

- подключение бота требует platform/security review перед production;
- UI показывает только masked status и не видит platform secrets;
- ingestion events должны иметь signature или trusted internal queue boundary.

## CreatorDonationSettings

Назначение: настройки донатов автора до публикации события в OBS и публичные списки.

Основные поля:

- `creator_profile_id`;
- `currency`;
- `amount_presets_json`;
- `min_amount_minor`;
- `max_amount_minor`;
- `message_max_length`;
- `link_policy`;
- `audio_enabled`;
- `audio_min_amount_minor`;
- `audio_allowed_categories_json`;
- `tts_enabled`;
- `tts_min_amount_minor`;
- `tts_allowed_categories_json`;
- `moderation_mode`;
- `spam_filter_config_json`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `creator_profile`.

Статусы: отдельный status не нужен.

Ограничения:

- primary key `creator_profile_id`;
- amounts в minor units;
- `moderation_mode` in `auto_approve`, `hold_for_review`, `blocked`;
- message length задаётся конфигом и валидируется backend-ом.

Индексы:

- primary key `creator_profile_id`.

Бизнес-правила:

- held/moderated donation не создаёт OBS alert до разрешения;
- settings не меняют `Payment.status` и не вызывают provider напрямую;
- audio/TTS provider secrets не хранятся в этих настройках.

## PromoCode

Назначение: промокод для скидки или attribution.

Основные поля:

- `id`;
- `code`;
- `owner_type`;
- `owner_id`;
- `product_id`;
- `creator_profile_id`;
- `discount_type`;
- `discount_value`;
- `max_uses`;
- `used_count`;
- `starts_at`;
- `ends_at`;
- `status`;
- `created_at`;
- `updated_at`.

Связи:

- optional product;
- optional creator profile;
- owner seller/creator/admin campaign.

Статусы:

- `active`;
- `paused`;
- `expired`;
- `archived`.

Ограничения:

- `code` unique case-insensitive;
- date range valid;
- usage limit не может быть отрицательным.

Индексы:

- unique lower(`code`);
- `owner_type`, `owner_id`;
- `product_id`;
- `creator_profile_id`;
- `status`.

Бизнес-правила:

- промокод не должен обходить минимальную цену/комиссию;
- конфликт скидок решается централизованно;
- использование промокода фиксируется в order.

## AffiliateLink

Назначение: партнёрская ссылка для автора/кампании.

Основные поля:

- `id`;
- `creator_profile_id`;
- `seller_profile_id`;
- `product_id`;
- `campaign_id`;
- `code`;
- `target_url`;
- `status`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- optional seller;
- optional product.

Статусы:

- `active`;
- `paused`;
- `archived`.

Ограничения:

- `code` unique;
- target URL должен быть внутренним или allowlisted.

Индексы:

- unique `code`;
- `creator_profile_id`;
- `seller_profile_id`;
- `product_id`;
- `status`.

Бизнес-правила:

- переходы должны быть аналитическими событиями;
- ссылка не должна раскрывать приватные token.

## AffiliateAttribution

Назначение: фиксация источника покупки/доната.

Основные поля:

- `id`;
- `buyer_user_id`;
- `creator_profile_id`;
- `seller_profile_id`;
- `product_id`;
- `order_id`;
- `donation_id`;
- `affiliate_link_id`;
- `promo_code_id`;
- `source`;
- `attribution_window_expires_at`;
- `created_at`.

Связи:

- optional buyer;
- optional order;
- optional donation;
- creator/seller/product.

Статусы: отдельный статус не нужен.

Ограничения:

- attribution должен относиться либо к order, либо к donation;
- нельзя задвоить attribution для одного order.

Индексы:

- `buyer_user_id`;
- `creator_profile_id`;
- `order_id`;
- `donation_id`;
- `affiliate_link_id`;
- `created_at`.

Бизнес-правила:

- last-click или другая модель фиксируется в ADR;
- attribution snapshot не меняется при будущих изменениях процента.

## Donation

Назначение: донат автору.

Основные поля:

- `id`;
- `creator_profile_id`;
- `buyer_user_id`;
- `payment_id`;
- `donation_goal_id`;
- `status`;
- `display_name`;
- `message`;
- `amount_minor`;
- `currency`;
- `is_anonymous`;
- `alert_sent_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- optional buyer;
- optional payment;
- optional goal.

Статусы:

- `created`;
- `awaiting_payment`;
- `paid`;
- `failed`;
- `cancelled`;
- `refunded`.

Ограничения:

- amount > 0;
- message length limit;
- moderation filters.

Индексы:

- `creator_profile_id`;
- `buyer_user_id`;
- `payment_id`;
- `status`;
- `created_at`.

Бизнес-правила:

- alert отправляется только после confirmed payment;
- refunded donation должен корректировать goal totals;
- anonymous не скрывает данные от админов.

## DonationGoal

Назначение: цель сбора автора.

Основные поля:

- `id`;
- `creator_profile_id`;
- `status`;
- `title`;
- `description`;
- `target_amount_minor`;
- `current_amount_minor`;
- `currency`;
- `starts_at`;
- `ends_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- one-to-many donations.

Статусы:

- `draft`;
- `active`;
- `completed`;
- `paused`;
- `archived`.

Ограничения:

- target amount > 0;
- current amount recalculable from donations.

Индексы:

- `creator_profile_id`;
- `status`;
- `ends_at`.

Бизнес-правила:

- current amount должен пересчитываться при refund;
- нельзя смешивать валюты в одной цели без явного правила.

## Alert

Назначение: событие алерта для OBS/widget.

Основные поля:

- `id`;
- `creator_profile_id`;
- `donation_id`;
- `order_id`;
- `type`;
- `status`;
- `payload_json`;
- `sent_at`;
- `created_at`.

Связи:

- creator;
- optional donation;
- optional order.

Статусы:

- `created`;
- `queued`;
- `sent`;
- `failed`;
- `skipped`.

Ограничения:

- payload schema versioned;
- alert должен ссылаться на событие-источник.

Индексы:

- `creator_profile_id`;
- `type`;
- `status`;
- `created_at`.

Бизнес-правила:

- повторная доставка допускается, client должен dedupe по `event_id`;
- alert text локализуется на клиенте, если это UI text.

## WidgetPreset

Назначение: описывает доступный тип/preset виджета в Studio catalog.

Основные поля:

- `key`;
- `category`;
- `name_i18n_key`;
- `description_i18n_key`;
- `status`;
- `supported_event_types_json`;
- `schema_version`;
- `default_config_json`;
- `created_at`;
- `updated_at`.

Связи:

- referenced by widgets through `preset_key`.

Статусы:

- `active`;
- `hidden`;
- `deprecated`.

Ограничения:

- `category` in `alerts`, `statistics`, `fundraising`, `products`, `cyclic_promo`, `other`;
- config schema versioned;
- preset не может содержать произвольный JS/HTML/CSS.

Индексы:

- primary key `key`;
- `category`;
- `status`.

Бизнес-правила:

- presets управляют формой настроек и preview, но public widget URL остаётся read-only;
- statistics widget читает агрегаты, а не приватные финансовые таблицы;
- product widgets не раскрывают приватные order/customer data.

## Widget

Назначение: OBS/browser source виджет автора.

Основные поля:

- `id`;
- `creator_profile_id`;
- `widget_group_id`;
- `type`;
- `category`;
- `preset_key`;
- `status`;
- `name`;
- `config_json`;
- `token_hash`;
- `expires_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- optional many-to-one `widget_group`;
- optional reference to `widget_preset`;
- one-to-many `widget_alert_rules`.

Статусы:

- `active`;
- `disabled`;
- `revoked`.

Ограничения:

- token хранить только hash;
- `category` in `alerts`, `statistics`, `fundraising`, `products`, `cyclic_promo`, `other`;
- config schema versioned.

Индексы:

- `creator_profile_id`;
- `type`;
- `category`;
- `preset_key`;
- `status`;
- `expires_at`.

Бизнес-правила:

- widget token read-only;
- token rotation сразу выдаёт новый token и делает старый недействительным в `v0.2`; grace period требует отдельного решения перед production.

## WidgetGroup

Назначение: группа OBS/browser source виджетов с общим read-only token и зонами размещения.

Основные поля:

- `id`;
- `creator_profile_id`;
- `status`;
- `name`;
- `layout_config_json`;
- `token_hash`;
- `expires_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- one-to-many widgets;
- one-to-many widget alert rules.

Статусы:

- `active`;
- `disabled`;
- `revoked`.

Ограничения:

- token хранить только hash;
- layout config schema versioned;
- public group token read-only.

Индексы:

- `creator_profile_id`;
- `status`;
- `expires_at`.

Бизнес-правила:

- группа нужна для разных placement zones в OBS;
- token показывается только при создании или ротации;
- публичный URL группы не может менять настройки.

## WidgetAlertRule

Назначение: правило выбора алерта и ассетов для события доната или покупки.

Основные поля:

- `id`;
- `creator_profile_id`;
- `widget_id`;
- `widget_group_id`;
- `trigger_type`;
- `trigger_config_json`;
- `placement_zone`;
- `asset_file_id`;
- `animation_config_json`;
- `priority`;
- `status`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator;
- optional many-to-one widget;
- optional many-to-one widget group;
- optional file reference for image/gif/animation asset.

Статусы:

- `active`;
- `disabled`;
- `archived`.

Ограничения:

- `trigger_type` in `donation_amount`, `product`, `product_group`, `collection`, `purchase_event`;
- `placement_zone` in `center`, `top_right`, `top_left`, `bottom_right`, `bottom_left`, `custom`;
- config schema versioned.

Индексы:

- `creator_profile_id`;
- `widget_id`;
- `widget_group_id`;
- `trigger_type`;
- `status`;
- `priority`.

Бизнес-правила:

- более высокий priority выбирается первым при нескольких совпадениях;
- purchase alert payload не должен раскрывать лишние персональные данные;
- assets проходят file upload security rules.

## IdempotencyKey

Назначение: техническая защита опасных операций от дублей.

Основные поля:

- `id`;
- `scope`;
- `idempotency_key`;
- `request_hash`;
- `donation_id`;
- `order_id`;
- `payment_id`;
- `status`;
- `created_at`;
- `expires_at`.

Связи:

- optional donation;
- optional payment.

Ограничения:

- unique (`scope`, `idempotency_key`);
- повтор с другим `request_hash` возвращает конфликт.

Бизнес-правила:

- `POST /donations` и `POST /orders` требуют `Idempotency-Key`;
- idempotency key не должен содержать секреты или персональные данные.

## Order

Назначение: заказ товара/услуги.

Основные поля:

- `id`;
- `buyer_user_id`;
- `seller_profile_id`;
- `product_id`;
- `deal_id`;
- `payment_id`;
- `status`;
- `quantity`;
- `gross_amount_minor`;
- `discount_amount_minor`;
- `total_amount_minor`;
- `currency`;
- `terms_snapshot_json`;
- `creator_profile_id`;
- `promo_code`;
- `idempotency_key`;
- `created_at`;
- `updated_at`.

Связи:

- buyer;
- seller;
- product;
- deal;
- payment;
- optional creator attribution;
- optional promo code.

Статусы: см. `Order status`.

Ограничения:

- amount >= 0;
- product snapshot обязателен;
- order не должен зависеть от будущих изменений product.

Индексы:

- `buyer_user_id`;
- `seller_profile_id`;
- `product_id`;
- `deal_id`;
- `payment_id`;
- `status`;
- `created_at`.

Бизнес-правила:

- order status отражает пользовательский lifecycle;
- payment status и deal status не заменяют order status.

## Deal

Назначение: safe deal lifecycle.

Основные поля:

- `id`;
- `order_id`;
- `status`;
- `gross_amount_minor`;
- `seller_amount_minor`;
- `creator_amount_minor`;
- `platform_fee_minor`;
- `provider_fee_minor`;
- `currency`;
- `buyer_response_deadline_at`;
- `seller_response_deadline_at`;
- `auto_confirm_at`;
- `completed_at`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one order;
- one-to-many deal_events;
- optional dispute.

Статусы: см. `Deal status`.

Ограничения:

- суммы должны сходиться;
- дедлайны конфигурируются;
- только допустимые переходы статусов.

Индексы:

- unique `order_id`;
- `status`;
- `auto_confirm_at`;
- `created_at`.

Бизнес-правила:

- completed deal в `v0.3` только завершает mock lifecycle; production ledger movements добавляются в `v0.6`;
- disputed deal блокирует payout;
- auto-confirm выполняется worker по расписанию.

## DealEvent

Назначение: timeline событий safe deal.

Основные поля:

- `id`;
- `deal_id`;
- `actor_user_id`;
- `event_type`;
- `from_status`;
- `to_status`;
- `payload_json`;
- `created_at`.

Связи:

- many-to-one deal;
- optional actor user.

Статусы: не нужны.

Ограничения:

- event append-only;
- payload без секретов.

Индексы:

- `deal_id`;
- `event_type`;
- `created_at`.

Бизнес-правила:

- нельзя редактировать прошлые события;
- manual admin correction добавляет новый event.

## Dispute

Назначение: спор по заказу/safe deal.

Основные поля:

- `id`;
- `deal_id`;
- `opened_by_user_id`;
- `status`;
- `reason`;
- `description`;
- `resolution`;
- `resolved_by_user_id`;
- `resolved_at`;
- `created_at`;
- `updated_at`.

Связи:

- one-to-one/many-to-one deal;
- one-to-many evidence;
- users.

Статусы:

- `opened`;
- `awaiting_buyer`;
- `awaiting_seller`;
- `under_review`;
- `resolved_to_buyer`;
- `resolved_to_seller`;
- `closed`.

Ограничения:

- dispute можно открыть только в разрешённый период;
- resolution required при resolved status.

Индексы:

- `deal_id`;
- `opened_by_user_id`;
- `status`;
- `created_at`.

Бизнес-правила:

- dispute удерживает payout;
- решение админа создаёт deal event и audit log.

## DisputeEvidence

Назначение: доказательства в споре.

Основные поля:

- `id`;
- `dispute_id`;
- `uploaded_by_user_id`;
- `file_id`;
- `message`;
- `visibility`;
- `created_at`.

Связи:

- many-to-one dispute;
- many-to-one user;
- optional file.

Статусы: не нужны или file status.

Ограничения:

- private storage;
- MIME/file size validation;
- malware review placeholder.

Индексы:

- `dispute_id`;
- `uploaded_by_user_id`;
- `created_at`.

Бизнес-правила:

- evidence нельзя удалять без audit trail;
- доступ только сторонам спора и админам.

## Review

Назначение: отзыв покупателя.

Основные поля:

- `id`;
- `order_id`;
- `buyer_user_id`;
- `seller_profile_id`;
- `product_id`;
- `rating`;
- `text`;
- `status`;
- `created_at`;
- `updated_at`;

Связи:

- order;
- buyer;
- seller;
- product.

Статусы:

- `published`;
- `hidden`;
- `flagged`;
- `removed`.

Ограничения:

- rating 1..5;
- один review на order;
- review только после completed order.

Индексы:

- unique `order_id`;
- `seller_profile_id`;
- `product_id`;
- `status`;
- `created_at`.

Бизнес-правила:

- скрытие отзыва не удаляет audit;
- rating aggregates обновляются асинхронно.

## Wallet

Назначение: агрегированное представление внутреннего баланса продавца/автора.

Основные поля:

- `id`;
- `owner_type`;
- `owner_id`;
- `currency`;
- `frozen_amount_minor`;
- `available_amount_minor`;
- `pending_payout_amount_minor`;
- `paid_out_amount_minor`;
- `withheld_amount_minor`;
- `created_at`;
- `updated_at`.

Связи:

- owner seller/creator;
- one-to-many balance transactions.

Статусы: не нужны.

Ограничения:

- unique (`owner_type`, `owner_id`, `currency`);
- amounts >= 0, кроме корректировок в ledger, если разрешено.

Индексы:

- (`owner_type`, `owner_id`);
- `currency`.

Бизнес-правила:

- не называть wallet банковским счётом;
- aggregates должны сверяться с ledger;
- negative available balance запрещён.

## BalanceTransaction

Назначение: ledger-like запись финансового движения.

Основные поля:

- `id`;
- `wallet_id`;
- `type`;
- `direction`;
- `amount_minor`;
- `currency`;
- `status`;
- `source_type`;
- `source_id`;
- `idempotency_key`;
- `created_at`.

Связи:

- wallet;
- source payment/order/deal/refund/payout/manual adjustment.

Статусы:

- `pending`;
- `posted`;
- `reversed`;
- `failed`.

Ограничения:

- amount > 0;
- currency matches wallet;
- unique (`wallet_id`, `idempotency_key`) when key present.

Индексы:

- `wallet_id`;
- `type`;
- `status`;
- `source_type`, `source_id`;
- `created_at`.

Бизнес-правила:

- posted transaction нельзя редактировать, только reverse;
- все financial transitions должны иметь source.

## Payout

Назначение: выплата продавцу/автору.

Основные поля:

- `id`;
- `wallet_id`;
- `owner_type`;
- `owner_id`;
- `status`;
- `amount_minor`;
- `currency`;
- `provider`;
- `provider_payout_id`;
- `failure_code`;
- `failure_message`;
- `requested_by_user_id`;
- `approved_by_user_id`;
- `created_at`;
- `updated_at`;

Связи:

- wallet;
- owner seller/creator;
- users.

Статусы: см. `Payout status`.

Ограничения:

- amount <= available balance;
- provider payout id unique per provider;
- manual review for risky payouts.

Индексы:

- `wallet_id`;
- `owner_type`, `owner_id`;
- `status`;
- `provider`, `provider_payout_id`;
- `created_at`.

Бизнес-правила:

- payout не создаёт деньги, а переводит from available to pending/paid out;
- failed payout должен вернуть amount в available, если provider не списал средства.

## Payment

Назначение: платёж покупателя.

Основные поля:

- `id`;
- `status`;
- `purpose`;
- `amount_minor`;
- `currency`;
- `provider`;
- `provider_payment_id`;
- `idempotency_key`;
- `confirmation_url`;
- `paid_at`;
- `created_at`;
- `updated_at`.

Связи:

- optional donation;
- optional order;
- refunds.

Статусы: см. `Payment status`.

Ограничения:

- amount > 0;
- provider payment id unique per provider;
- purpose in `donation`, `order`.

Индексы:

- `status`;
- `purpose`;
- `provider`, `provider_payment_id`;
- `idempotency_key`;
- `created_at`.

Бизнес-правила:

- payment success не всегда означает completed order;
- provider status сохраняется отдельно в raw/events.

## Refund

Назначение: возврат платежа.

Основные поля:

- `id`;
- `payment_id`;
- `status`;
- `amount_minor`;
- `currency`;
- `reason`;
- `provider`;
- `provider_refund_id`;
- `idempotency_key`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one payment;
- optional dispute/deal/order.

Статусы:

- `created`;
- `processing`;
- `succeeded`;
- `failed`;
- `cancelled`.

Ограничения:

- refund total <= payment amount;
- currency matches payment.

Индексы:

- `payment_id`;
- `status`;
- `provider`, `provider_refund_id`;
- `idempotency_key`;
- `created_at`.

Бизнес-правила:

- partial refund должен корректировать ledger;
- refund receipt нужен после fiscalization integration, если применимо.

## ProviderWebhook

Назначение: хранение webhook events от провайдера.

Основные поля:

- `id`;
- `provider`;
- `provider_event_id`;
- `event_type`;
- `status`;
- `headers_json`;
- `payload_json`;
- `raw_body_hash`;
- `received_at`;
- `processed_at`;
- `error_message`.

Связи:

- optional payment/refund/payout/deal by parsed IDs.

Статусы:

- `received`;
- `processed`;
- `failed`;
- `ignored`.

Ограничения:

- unique (`provider`, `provider_event_id`);
- raw body хранить безопасно без секретов в логах.

Индексы:

- `provider`, `provider_event_id`;
- `event_type`;
- `status`;
- `received_at`.

Бизнес-правила:

- обработка должна быть idempotent;
- failed webhook попадает в retry/dead-letter flow.

## AuditLog

Назначение: журнал значимых действий.

Основные поля:

- `id`;
- `actor_user_id`;
- `actor_type`;
- `action`;
- `entity_type`;
- `entity_id`;
- `before_json`;
- `after_json`;
- `metadata_json`;
- `ip_hash`;
- `user_agent`;
- `created_at`.

Связи:

- optional user;
- any entity by type/id.

Статусы: не нужны.

Ограничения:

- append-only;
- без хранения raw secrets;
- персональные данные минимизировать.

Индексы:

- `actor_user_id`;
- `entity_type`, `entity_id`;
- `action`;
- `created_at`.

Бизнес-правила:

- admin actions mandatory;
- financial/manual corrections mandatory;
- audit log не редактируется через обычный API.

## RiskFlag

Назначение: антифрод и операционные флаги риска.

Основные поля:

- `id`;
- `entity_type`;
- `entity_id`;
- `flag_type`;
- `severity`;
- `status`;
- `reason`;
- `created_by`;
- `resolved_by_user_id`;
- `resolved_at`;
- `created_at`;
- `updated_at`.

Связи:

- any entity by type/id;
- optional users.

Статусы:

- `open`;
- `reviewing`;
- `resolved`;
- `dismissed`.

Ограничения:

- severity in `low`, `medium`, `high`, `critical`;
- high/critical блокируют автоматические выплаты по policy.

Индексы:

- `entity_type`, `entity_id`;
- `flag_type`;
- `severity`;
- `status`;
- `created_at`.

Бизнес-правила:

- risk flag не является юридическим решением;
- снятие high flag требует audit log.

## Notification

Назначение: уведомления пользователя.

Основные поля:

- `id`;
- `user_id`;
- `type`;
- `channel`;
- `status`;
- `i18n_key`;
- `payload_json`;
- `locale`;
- `read_at`;
- `sent_at`;
- `created_at`.

Связи:

- many-to-one user.

Статусы:

- `created`;
- `queued`;
- `sent`;
- `read`;
- `failed`;

Ограничения:

- payload без секретов;
- i18n key required for user-facing notification.

Индексы:

- `user_id`;
- `type`;
- `status`;
- `created_at`;
- `read_at`.

Бизнес-правила:

- realtime notification может ссылаться на persisted notification;
- email/push требуют consent policy.

## Начальная схема PostgreSQL

Минимальный набор таблиц для `v0.0-v0.3` и planned `v0.3.5`:

```txt
users
roles
profiles
creator_profiles
seller_profiles
buyer_profiles
design_skin_presets
favorites
user_collections
collection_items
product_categories
products
product_media
creator_stores
store_items
stream_sessions
creator_metric_snapshots
creator_activity_events
creator_channel_integrations
creator_donation_settings
promo_codes
affiliate_links
affiliate_attributions
donations
donation_goals
alerts
widget_presets
widgets
widget_groups
widget_alert_rules
orders
deals
deal_events
disputes
dispute_evidence
reviews
wallets
balance_transactions
payments
refunds
payouts
provider_webhooks
audit_logs
risk_flags
notifications
```

Таблицы для файлов могут быть добавлены как shared storage model:

```txt
files
file_access_logs
```

Рекомендуемые поля `files`:

- `id`;
- `bucket`;
- `object_key`;
- `original_name`;
- `mime_type`;
- `size_bytes`;
- `visibility`;
- `owner_type`;
- `owner_id`;
- `status`;
- `checksum`;
- `created_at`;
- `updated_at`;

## Финансовые инварианты

- `Payment.succeeded` не равен `Deal.completed`.
- `Order.completed` возможен только после завершения deal или отдельного правила для instant delivery.
- `available_amount_minor` не может стать отрицательным.
- `BalanceTransaction.posted` нельзя редактировать.
- Refund total не может превышать payment amount.
- Provider webhook не должен обрабатываться дважды.
- Creator share фиксируется snapshot на момент order.

## Индексы высокого приоритета

- `users`: lower email unique.
- `profiles`: slug unique.
- `creator_profiles`: creator_slug unique.
- `products`: seller/category/status/published_at.
- `orders`: buyer/seller/status/created_at.
- `deals`: status/auto_confirm_at.
- `payments`: provider/provider_payment_id unique.
- `payouts`: provider/provider_payout_id.
- `provider_webhooks`: provider/provider_event_id unique.
- `balance_transactions`: wallet/source/idempotency.
- `audit_logs`: entity/action/created_at.

UX-TASK-031: существующий CreatorProfile теперь также создаётся из публичной анкеты после авторизации через onboarding. Начальный статус draft, роль streamer выдаётся атомарно; публичная выдача только published. Новых сущностей/миграций нет.
