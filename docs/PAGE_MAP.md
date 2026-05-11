# Page Map

Карта страниц FanFuel фиксирует целевую информационную архитектуру. Наличие страницы в карте не означает разрешение немедленно создавать её в коде. Статус, версия и запреты на реализацию ведутся в `docs/UI_UX_TRACKER.md`.

## Текущие реализованные routes

| Приложение    | Route                          | Назначение                                       | Статус       |
| ------------- | ------------------------------ | ------------------------------------------------ | ------------ |
| `apps/web`    | `/`                            | Redirect на marketplace как главную точку входа  | IMPLEMENTED  |
| `apps/web`    | `/for-buyers`                  | Ролевой лендинг для покупателей                  | IMPLEMENTED  |
| `apps/web`    | `/for-streamers`               | Ролевой лендинг для стримеров                    | IMPLEMENTED  |
| `apps/web`    | `/for-sellers`                 | Ролевой лендинг для продавцов                    | IMPLEMENTED  |
| `apps/web`    | `/auth/login`                  | Вход                                             | PARTIAL      |
| `apps/web`    | `/auth/register`               | Регистрация                                      | PARTIAL      |
| `apps/web`    | `/me/profile`                  | Профиль, временный mini studio и seller settings | NEEDS_REWORK |
| `apps/web`    | `/creators/[slug]`             | Публичная страница автора с донат-формой         | PARTIAL      |
| `apps/web`    | `/marketplace`                 | Маркетплейс товаров                              | IMPLEMENTED  |
| `apps/web`    | `/marketplace/products/[slug]` | Карточка товара                                  | IMPLEMENTED  |
| `apps/web`    | `/checkout/[productId]`        | Checkout товара через mock safe deal             | IMPLEMENTED  |
| `apps/web`    | `/buyer`                       | Кабинет покупателя                               | IMPLEMENTED  |
| `apps/web`    | `/buyer/orders/[id]`           | Страница заказа покупателя                       | IMPLEMENTED  |
| `apps/web`    | `/seller`                      | Кабинет продавца                                 | IMPLEMENTED  |
| `apps/web`    | `/seller/products`             | Товары продавца                                  | IMPLEMENTED  |
| `apps/web`    | `/seller/products/new`         | Создание товара                                  | IMPLEMENTED  |
| `apps/web`    | `/seller/orders`               | Заказы продавца                                  | IMPLEMENTED  |
| `apps/admin`  | `/`                            | Admin users/product moderation panel             | PARTIAL      |
| `apps/widget` | `/?token=...`                  | OBS donation alert widget                        | PARTIAL      |

## Public Pages

| ID                        | Страница                            | Route                            | Версия | Статус         |
| ------------------------- | ----------------------------------- | -------------------------------- | ------ | -------------- |
| PAGE-HOME                 | Главная                             | `/`                              | v0.3   | IMPLEMENTED    |
| PAGE-FOR-STREAMERS        | Для стримеров                       | `/for-streamers`                 | v0.3   | IMPLEMENTED    |
| PAGE-FOR-SELLERS          | Для продавцов                       | `/for-sellers`                   | v0.3   | IMPLEMENTED    |
| PAGE-FOR-BUYERS           | Для покупателей                     | `/for-buyers`                    | v0.3   | IMPLEMENTED    |
| PAGE-MARKETPLACE          | Маркетплейс                         | `/marketplace`                   | v0.3   | IMPLEMENTED    |
| PAGE-MARKETPLACE-CATEGORY | Категория маркетплейса              | `/marketplace/categories/[slug]` | v0.3   | PLANNED        |
| PAGE-PRODUCT              | Карточка товара                     | `/marketplace/products/[slug]`   | v0.3   | IMPLEMENTED    |
| PAGE-CHECKOUT             | Checkout товара                     | `/checkout/[productId]`          | v0.3   | IMPLEMENTED    |
| PAGE-CREATOR-PUBLIC       | Публичная страница стримера         | `/creators/[slug]`               | v0.2   | PARTIAL        |
| PAGE-CREATOR-DONATE       | Донат-страница стримера             | `/creators/[slug]/donate`        | v0.2   | PARTIAL        |
| PAGE-CREATOR-STORE        | Публичная витрина стримера          | `/creators/[slug]/store`         | v0.4   | FUTURE         |
| PAGE-SAFE-DEAL            | Страница безопасной сделки/гарантий | `/safe-deal`                     | v0.5   | PAYMENT_REVIEW |
| PAGE-FAQ                  | FAQ                                 | `/faq`                           | v1.0   | PLANNED        |
| PAGE-TERMS                | Terms placeholder                   | `/legal/terms`                   | v1.0   | LEGAL_REVIEW   |
| PAGE-PRIVACY              | Privacy policy placeholder          | `/legal/privacy`                 | v1.0   | LEGAL_REVIEW   |

## Auth Pages

| ID                 | Страница                     | Route                  | Версия | Статус       |
| ------------------ | ---------------------------- | ---------------------- | ------ | ------------ |
| PAGE-AUTH-LOGIN    | Вход                         | `/auth/login`          | v0.1   | PARTIAL      |
| PAGE-AUTH-REGISTER | Регистрация                  | `/auth/register`       | v0.1   | PARTIAL      |
| PAGE-AUTH-RESET    | Восстановление пароля        | `/auth/reset-password` | v0.3   | BLOCKED      |
| PAGE-AUTH-VERIFY   | Подтверждение почты/телефона | `/auth/verify`         | v0.3   | BLOCKED      |
| PAGE-AUTH-ROLE     | Выбор роли после регистрации | `/auth/role`           | v0.3   | PLANNED      |
| PAGE-ONBOARDING    | Onboarding                   | `/onboarding`          | v0.3   | PLANNED      |
| PAGE-ME-PROFILE    | Профиль аккаунта             | `/me/profile`          | v0.1   | NEEDS_REWORK |
| PAGE-ME-SETTINGS   | Настройки аккаунта           | `/me/settings`         | v0.3   | PLANNED      |

## Buyer Pages

| ID                    | Страница           | Route                  | Версия | Статус      |
| --------------------- | ------------------ | ---------------------- | ------ | ----------- |
| PAGE-BUYER-DASHBOARD  | Кабинет покупателя | `/buyer`               | v0.3   | IMPLEMENTED |
| PAGE-BUYER-PURCHASES  | История покупок    | `/buyer/purchases`     | v0.3   | PLANNED     |
| PAGE-BUYER-ORDER      | Страница заказа    | `/buyer/orders/[id]`   | v0.3   | IMPLEMENTED |
| PAGE-BUYER-DISPUTE    | Страница спора     | `/buyer/disputes/[id]` | v0.7   | FUTURE      |
| PAGE-BUYER-FAVORITES  | Избранное          | `/buyer/favorites`     | v0.4   | FUTURE      |
| PAGE-BUYER-PROMOCODES | Промокоды          | `/buyer/promocodes`    | v0.4   | FUTURE      |
| PAGE-BUYER-SETTINGS   | Настройки профиля  | `/buyer/settings`      | v0.3   | PLANNED     |

## Streamer Pages

| ID                      | Страница                     | Route                | Версия | Статус         |
| ----------------------- | ---------------------------- | -------------------- | ------ | -------------- |
| PAGE-STUDIO-DASHBOARD   | Streamer studio dashboard    | `/studio`            | v0.3   | PLANNED        |
| PAGE-STUDIO-PUBLIC-PAGE | Настройка публичной страницы | `/studio/page`       | v0.3   | PLANNED        |
| PAGE-STUDIO-DONATIONS   | Донаты                       | `/studio/donations`  | v0.3   | PLANNED        |
| PAGE-STUDIO-GOALS       | Цели                         | `/studio/goals`      | v0.2   | PARTIAL        |
| PAGE-STUDIO-ALERTS      | Алерты                       | `/studio/alerts`     | v0.3   | PLANNED        |
| PAGE-STUDIO-WIDGETS     | OBS widgets                  | `/studio/widgets`    | v0.2   | PARTIAL        |
| PAGE-STUDIO-STORE       | Витрина товаров              | `/studio/store`      | v0.4   | FUTURE         |
| PAGE-STUDIO-PARTNERS    | Партнёрские товары           | `/studio/partners`   | v0.4   | FUTURE         |
| PAGE-STUDIO-PROMOCODES  | Промокоды                    | `/studio/promocodes` | v0.4   | FUTURE         |
| PAGE-STUDIO-ANALYTICS   | Аналитика                    | `/studio/analytics`  | v0.4   | FUTURE         |
| PAGE-STUDIO-PAYOUTS     | Выплаты                      | `/studio/payouts`    | v0.6   | PAYMENT_REVIEW |
| PAGE-STUDIO-SETTINGS    | Настройки                    | `/studio/settings`   | v0.3   | PLANNED        |

## Seller Pages

| ID                       | Страница               | Route                        | Версия | Статус         |
| ------------------------ | ---------------------- | ---------------------------- | ------ | -------------- |
| PAGE-SELLER-DASHBOARD    | Seller dashboard       | `/seller`                    | v0.3   | IMPLEMENTED    |
| PAGE-SELLER-PRODUCTS     | Товары                 | `/seller/products`           | v0.3   | IMPLEMENTED    |
| PAGE-SELLER-PRODUCT-NEW  | Создание товара        | `/seller/products/new`       | v0.3   | IMPLEMENTED    |
| PAGE-SELLER-PRODUCT-EDIT | Редактирование товара  | `/seller/products/[id]/edit` | v0.3   | PLANNED        |
| PAGE-SELLER-ORDERS       | Заказы                 | `/seller/orders`             | v0.3   | IMPLEMENTED    |
| PAGE-SELLER-DEALS        | Сделки                 | `/seller/deals`              | v0.5   | PAYMENT_REVIEW |
| PAGE-SELLER-DISPUTES     | Споры                  | `/seller/disputes`           | v0.7   | FUTURE         |
| PAGE-SELLER-PROMOCODES   | Промокоды              | `/seller/promocodes`         | v0.4   | FUTURE         |
| PAGE-SELLER-AFFILIATE    | Партнёрская программа  | `/seller/partners`           | v0.4   | FUTURE         |
| PAGE-SELLER-ANALYTICS    | Аналитика              | `/seller/analytics`          | v0.4   | FUTURE         |
| PAGE-SELLER-PAYOUTS      | Выплаты                | `/seller/payouts`            | v0.6   | PAYMENT_REVIEW |
| PAGE-SELLER-SETTINGS     | Настройки продавца     | `/seller/settings`           | v0.3   | PLANNED        |
| PAGE-SELLER-VERIFY-PRO   | Верификация Seller Pro | `/seller/verification/pro`   | v0.8   | LEGAL_REVIEW   |

## Admin Pages

| ID                    | Страница            | Route               | Версия | Статус         |
| --------------------- | ------------------- | ------------------- | ------ | -------------- |
| PAGE-ADMIN-DASHBOARD  | Admin dashboard     | `/admin`            | v0.3   | PARTIAL        |
| PAGE-ADMIN-USERS      | Пользователи        | `/admin/users`      | v0.1   | PARTIAL        |
| PAGE-ADMIN-SELLERS    | Продавцы            | `/admin/sellers`    | v0.3   | PLANNED        |
| PAGE-ADMIN-STREAMERS  | Стримеры            | `/admin/streamers`  | v0.3   | PLANNED        |
| PAGE-ADMIN-PRODUCTS   | Товары              | `/admin/products`   | v0.3   | PARTIAL        |
| PAGE-ADMIN-CATEGORIES | Категории           | `/admin/categories` | v0.3   | PLANNED        |
| PAGE-ADMIN-ORDERS     | Заказы              | `/admin/orders`     | v0.3   | PLANNED        |
| PAGE-ADMIN-DEALS      | Сделки              | `/admin/deals`      | v0.5   | PAYMENT_REVIEW |
| PAGE-ADMIN-DISPUTES   | Споры               | `/admin/disputes`   | v0.7   | FUTURE         |
| PAGE-ADMIN-PAYOUTS    | Выплаты             | `/admin/payouts`    | v0.6   | PAYMENT_REVIEW |
| PAGE-ADMIN-PAYMENTS   | Платежи             | `/admin/payments`   | v0.5   | PAYMENT_REVIEW |
| PAGE-ADMIN-MODERATION | Модерация           | `/admin/moderation` | v0.3   | PLANNED        |
| PAGE-ADMIN-ANTIFRAUD  | Антифрод            | `/admin/anti-fraud` | v0.8   | FUTURE         |
| PAGE-ADMIN-AUDIT      | Аудит-лог           | `/admin/audit-log`  | v0.8   | PLANNED        |
| PAGE-ADMIN-SETTINGS   | Настройки платформы | `/admin/settings`   | v1.0   | FUTURE         |

## Widget Pages

| ID                           | Страница                | Route                              | Версия | Статус  |
| ---------------------------- | ----------------------- | ---------------------------------- | ------ | ------- |
| PAGE-WIDGET-ALERT            | Alert widget            | `/?token=...`                      | v0.2   | PARTIAL |
| PAGE-WIDGET-GOAL             | Donation goal widget    | `/goal?token=...`                  | v0.3   | PLANNED |
| PAGE-WIDGET-PURCHASE         | Purchase alert widget   | `/purchase-alert?token=...`        | v0.4   | FUTURE  |
| PAGE-WIDGET-FEED             | Activity feed widget    | `/activity-feed?token=...`         | v0.4   | FUTURE  |
| PAGE-WIDGET-PREVIEW          | Widget preview          | `/studio/widgets/preview`          | v0.3   | PLANNED |
| PAGE-WIDGET-SETTINGS-PREVIEW | Widget settings preview | `/studio/widgets/settings-preview` | v0.3   | PLANNED |

## Правила расширения карты

- Новая страница сначала получает `PAGE-ID`, route, версию и status в `docs/UI_UX_TRACKER.md`.
- Если страница будущая, её spec должен иметь `FUTURE` и явное `DO_NOT_BUILD_YET`.
- Если страница влияет на деньги, safe deal, выплаты или налоги, сначала сверить `docs/PAYMENTS.md`.
- Если страница добавляет пользовательский текст, сначала добавить i18n keys.
- Если page map и код расходятся, зафиксировать расхождение в `docs/DESIGN_AUDIT.md` или `docs/UX_IMPLEMENTATION_STATUS.md`.
