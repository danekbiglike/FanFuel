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

## CreatorProfile

Назначение: профиль стримера/автора.

Основные поля:

- `id`;
- `user_id`;
- `profile_id`;
- `creator_slug`;
- `title`;
- `description`;
- `banner_file_id`;
- `theme_config_json`;
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
- one-to-many `affiliate_attributions`.

Статусы:

- `draft`;
- `published`;
- `hidden`;
- `blocked`.

Ограничения:

- `creator_slug` unique;
- theme config валидируется schema;
- публичная страница недоступна при `blocked`.

Индексы:

- unique `creator_slug`;
- `user_id`;
- `status`.

Бизнес-правила:

- партнёрские товары должны иметь disclosure;
- отключение donations не удаляет историю.

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
- налоговые предупреждения не заменяют юридическую консультацию.

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
- `created_at`;
- `updated_at`.

Связи:

- one-to-one `creator_profile`;
- one-to-many `store_items`.

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
- порядок и подборки хранятся отдельно от product.

## StoreItem

Назначение: элемент витрины автора.

Основные поля:

- `id`;
- `creator_store_id`;
- `product_id`;
- `kind`;
- `status`;
- `custom_title`;
- `custom_description`;
- `sort_order`;
- `featured`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one `creator_store`;
- many-to-one `product`.

Статусы:

- `active`;
- `hidden`;
- `removed`.

Ограничения:

- unique (`creator_store_id`, `product_id`);
- product должен быть published.

Индексы:

- `creator_store_id`;
- `product_id`;
- (`creator_store_id`, `sort_order`).

Бизнес-правила:

- партнёрский товар должен показывать disclosure;
- если product hidden, store item не должен продаваться.

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

## Widget

Назначение: OBS/browser source виджет автора.

Основные поля:

- `id`;
- `creator_profile_id`;
- `type`;
- `status`;
- `name`;
- `config_json`;
- `token_hash`;
- `expires_at`;
- `created_at`;
- `updated_at`.

Связи:

- many-to-one creator.

Статусы:

- `active`;
- `disabled`;
- `revoked`.

Ограничения:

- token хранить только hash;
- config schema versioned.

Индексы:

- `creator_profile_id`;
- `kind`;
- `status`;
- `expires_at`.

Бизнес-правила:

- widget token read-only;
- token rotation сразу выдаёт новый token и делает старый недействительным в `v0.2`; grace period требует отдельного решения перед production.

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

Минимальный набор таблиц для `v0.0-v0.3`:

```txt
users
roles
profiles
creator_profiles
seller_profiles
buyer_profiles
product_categories
products
product_media
creator_stores
store_items
promo_codes
affiliate_links
affiliate_attributions
donations
donation_goals
alerts
widgets
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
