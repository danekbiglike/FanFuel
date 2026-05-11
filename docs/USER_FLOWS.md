# User Flows

Документ описывает основные пользовательские сценарии FanFuel. Каждый flow имеет статус реализации и привязан к страницам из `docs/PAGE_MAP.md`.

## Как читать статусы

- `IMPLEMENTED` — flow реализован и соответствует текущему spec.
- `PARTIAL` — основная логика есть, но UX или отдельные состояния неполные.
- `PLANNED` — должен быть реализован в ближайшей версии.
- `FUTURE` — нужен позже, сейчас не делать.
- `PAYMENT_REVIEW` — зависит от платёжной модели.
- `LEGAL_REVIEW` — зависит от юридической проверки.

## Покупатель

### FLOW-BUYER-HOME: Просмотр главной

ID: FLOW-BUYER-HOME  
Роль: guest, buyer  
Цель: понять, что FanFuel объединяет донаты, цифровые товары и поддержку автора.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS

Шаги:

1. Пользователь открывает `/`.
2. Приложение перенаправляет его на `/marketplace`.
3. Пользователь видит buyer-facing преимущества, фильтры, категории и товары.
4. Если нужна вводная про преимущества, пользователь открывает `/for-buyers`.

Состояния:

- Loading: не требуется для статического v0.2.
- Empty: dynamic marketplace preview скрыт, если нет данных.
- Error: ошибка дополнительных блоков не ломает страницу.

Ошибки:

- Нерабочая ссылка CTA.
- Root route возвращает generic landing вместо marketplace.

### FLOW-BUYER-SEARCH: Поиск товара

ID: FLOW-BUYER-SEARCH  
Роль: buyer, guest  
Цель: найти цифровой товар или услугу.  
Статус реализации: IMPLEMENTED  
MVP/Future: MVP v0.3  
Страницы: PAGE-MARKETPLACE

Шаги:

1. Пользователь открывает marketplace.
2. Вводит запрос или выбирает категорию.
3. Применяет фильтры.
4. Открывает карточку товара.
5. Гость и авторизованный пользователь могут начать поиск из верхней панели с любой страницы; запрос ведёт в `/marketplace?query=...`.

Состояния:

- Loading: skeleton grid.
- Empty: нет результатов, предложить сбросить фильтры.
- Error: retry без потери query.

Ошибки:

- Фильтр ломает mobile layout.
- Restricted category открывается без предупреждения.

### FLOW-BUYER-PRODUCT: Просмотр карточки товара

ID: FLOW-BUYER-PRODUCT  
Роль: buyer, guest  
Цель: понять товар, цену, продавца, условия и safe deal.  
Статус реализации: IMPLEMENTED  
MVP/Future: MVP v0.3  
Страницы: PAGE-PRODUCT

Шаги:

1. Пользователь открывает товар.
2. Смотрит медиа, цену, продавца и условия.
3. Проверяет safe deal и вклад автора, если есть attribution.
4. Нажимает купить.

Состояния:

- Loading: media/info skeleton.
- Empty: not found/hidden product.
- Error: product unavailable.

Ошибки:

- Цена или продавец спрятаны ниже CTA.
- Safe deal звучит как юридическая гарантия.

### FLOW-BUYER-BUY: Покупка товара

ID: FLOW-BUYER-BUY  
Роль: buyer  
Цель: оформить заказ и оплатить.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3 mock, v0.5 real payments  
Страницы: PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-ORDER

Шаги:

1. Buyer нажимает купить.
2. Система создаёт order draft.
3. Buyer проверяет состав заказа, цену, скидки и safe deal.
4. Buyer подтверждает оплату.
5. Система создаёт order/payment/deal idempotently.
6. Buyer попадает на страницу заказа.

Состояния:

- Payment pending.
- Payment failed.
- Order expired.
- Unauthorized/login required.

Ошибки:

- Повторный submit создаёт второй заказ.
- Payment status смешан с order/deal status.

### FLOW-BUYER-PROMO: Использование промокода стримера

ID: FLOW-BUYER-PROMO  
Роль: buyer  
Цель: применить промокод и увидеть скидку/attribution.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-CHECKOUT, PAGE-BUYER-PROMOCODES

Шаги:

1. Buyer вводит промокод на checkout.
2. Система валидирует код.
3. Buyer видит скидку и вклад автора.
4. Buyer оплачивает заказ.

Состояния:

- Invalid code.
- Expired code.
- Usage limit reached.
- Promo conflicts.

Ошибки:

- Скидка отображается без объяснения.
- Промокод обходит минимальную цену или комиссию.

### FLOW-BUYER-CREATOR-STORE: Покупка из витрины стримера

ID: FLOW-BUYER-CREATOR-STORE  
Роль: buyer, guest  
Цель: купить товар из витрины автора и поддержать его.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-CREATOR-STORE, PAGE-PRODUCT, PAGE-CHECKOUT

Шаги:

1. Buyer открывает витрину автора.
2. Выбирает товар.
3. Видит disclosure партнёрского товара.
4. Покупает через checkout.

Состояния:

- Empty store.
- Product hidden/unavailable.
- Attribution expired.

Ошибки:

- Неясно, что товар партнёрский.
- Не видно, какую поддержку получает автор.

### FLOW-BUYER-ORDER: Открытие заказа

ID: FLOW-BUYER-ORDER  
Роль: buyer  
Цель: увидеть статус заказа и следующий шаг.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-BUYER-ORDER

Шаги:

1. Buyer открывает заказ из checkout, истории или уведомления.
2. Видит order status, payment status и deal status.
3. Выполняет доступное действие.

Состояния:

- Loading timeline.
- Forbidden чужого заказа.
- Order cancelled/refunded.

Ошибки:

- Статусы показываются только цветом.
- Нет понятного next action.

### FLOW-BUYER-CONFIRM: Подтверждение получения

ID: FLOW-BUYER-CONFIRM  
Роль: buyer  
Цель: подтвердить выполнение заказа.  
Статус реализации: PARTIAL  
MVP/Future: v0.3 mock, v0.5 real provider/ledger  
Страницы: PAGE-BUYER-ORDER

Шаги:

1. Buyer проверяет результат.
2. Нажимает подтверждение.
3. Видит confirmation с последствиями.
4. Система меняет deal/order statuses и ledger.

Состояния:

- Confirmation required.
- Deadline expired.
- Already confirmed.

Ошибки:

- Подтверждение без объяснения влияет на payout.

### FLOW-BUYER-DISPUTE: Открытие спора

ID: FLOW-BUYER-DISPUTE  
Роль: buyer  
Цель: открыть спор в допустимый срок.  
Статус реализации: FUTURE  
MVP/Future: v0.7  
Страницы: PAGE-BUYER-ORDER, PAGE-BUYER-DISPUTE

Шаги:

1. Buyer выбирает "Открыть спор".
2. Видит сроки и требования к доказательствам.
3. Указывает причину и описание.
4. Прикладывает evidence.
5. Система переводит deal в disputed.

Состояния:

- Deadline passed.
- Evidence upload failed.
- Under review.

Ошибки:

- Обвинительный тон.
- Не объяснены сроки и доказательства.

### FLOW-BUYER-REVIEW: Оставление отзыва

ID: FLOW-BUYER-REVIEW  
Роль: buyer  
Цель: оставить отзыв после завершения заказа.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-BUYER-ORDER

Шаги:

1. Buyer видит completed order.
2. Открывает форму отзыва.
3. Ставит рейтинг и пишет текст.
4. Отзыв попадает в review/moderation policy.

Состояния:

- Already reviewed.
- Review pending/hidden.
- Validation error.

Ошибки:

- Отзыв доступен до completed order.

### FLOW-BUYER-HISTORY: Просмотр истории покупок

ID: FLOW-BUYER-HISTORY  
Роль: buyer  
Цель: найти прошлые покупки и статусы.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-BUYER-PURCHASES

Шаги:

1. Buyer открывает историю.
2. Фильтрует по статусу.
3. Открывает order page.

Состояния:

- Empty first purchase.
- Loading list.
- Error retry.

Ошибки:

- Таблица ломается на mobile.

## Стример

### FLOW-STREAMER-REGISTER: Регистрация как стример

ID: FLOW-STREAMER-REGISTER  
Роль: streamer  
Цель: создать аккаунт с ролью streamer.  
Статус реализации: PARTIAL  
MVP/Future: v0.1, улучшение v0.3  
Страницы: PAGE-AUTH-REGISTER, PAGE-ONBOARDING, PAGE-STUDIO-DASHBOARD

Шаги:

1. Пользователь выбирает role intent streamer.
2. Создаёт аккаунт.
3. Сейчас попадает на `/me/profile`.
4. В v0.3 должен попасть в onboarding/Studio.
5. Пока отдельный `/studio` route не реализован, пункт Studio в меню помечается как "скоро" и не ведёт на future page.

Состояния:

- Validation errors.
- Role already exists.
- Unauthorized после истечения токена.

Ошибки:

- Нет отдельного onboarding.
- Пункт Studio в topbar ведёт в неготовый route вместо честного статуса "скоро".

### FLOW-STREAMER-PAGE: Создание публичной страницы

ID: FLOW-STREAMER-PAGE  
Роль: streamer  
Цель: заполнить публичный профиль автора.  
Статус реализации: PARTIAL  
MVP/Future: v0.1-v0.3  
Страницы: PAGE-ME-PROFILE, PAGE-STUDIO-PUBLIC-PAGE, PAGE-CREATOR-PUBLIC

Шаги:

1. Streamer редактирует title/description/status.
2. Сохраняет.
3. Открывает публичную страницу.

Состояния:

- Draft/hidden/published.
- Save error.
- Slug conflict.

Ошибки:

- Настройки смешаны с account/seller.
- Профиль, account settings и Studio остаются в одном route без явного разделения в навигации.

### FLOW-STREAMER-DONATIONS: Настройка донатов

ID: FLOW-STREAMER-DONATIONS  
Роль: streamer  
Цель: включить и проверить донаты.  
Статус реализации: PARTIAL  
MVP/Future: v0.2-v0.3  
Страницы: PAGE-STUDIO-DONATIONS, PAGE-CREATOR-DONATE, PAGE-CREATOR-PUBLIC

Шаги:

1. Streamer открывает Studio.
2. Проверяет публичную donor flow.
3. Смотрит историю донатов.

Состояния:

- No donations yet.
- Payment pending.
- Failed donation.

Ошибки:

- История доступна только на публичной странице, отдельной Studio page нет.

### FLOW-STREAMER-OBS: Настройка OBS-алерта

ID: FLOW-STREAMER-OBS  
Роль: streamer  
Цель: создать widget URL и подключить OBS alert.  
Статус реализации: PARTIAL  
MVP/Future: v0.2-v0.3  
Страницы: PAGE-STUDIO-WIDGETS, PAGE-WIDGET-ALERT, PAGE-WIDGET-PREVIEW

Шаги:

1. Streamer создаёт widget.
2. Копирует token URL, который показывается один раз.
3. Добавляет URL в OBS.
4. После доната widget получает alert.

Состояния:

- Token missing.
- Disconnected/reconnecting.
- Revoked widget.

Ошибки:

- Нет Studio preview.
- Token может быть потерян, нужен clear UX.

### FLOW-STREAMER-GOAL: Создание цели

ID: FLOW-STREAMER-GOAL  
Роль: streamer  
Цель: создать donation goal.  
Статус реализации: PARTIAL  
MVP/Future: v0.2-v0.3  
Страницы: PAGE-STUDIO-GOALS, PAGE-CREATOR-PUBLIC, PAGE-WIDGET-GOAL

Шаги:

1. Streamer вводит название, описание, цель и валюту.
2. Система создаёт goal.
3. Goal отображается публично.
4. После успешных донатов progress обновляется.

Состояния:

- Validation error.
- Empty goals.
- Completed goal.

Ошибки:

- Нет pause/archive/edit UX.

### FLOW-STREAMER-STORE: Добавление товаров в витрину

ID: FLOW-STREAMER-STORE  
Роль: streamer  
Цель: добавить собственные или партнёрские товары в витрину.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-STUDIO-STORE, PAGE-STUDIO-PARTNERS, PAGE-CREATOR-STORE

Шаги:

1. Streamer выбирает товар.
2. Настраивает позицию/подборку.
3. Видит disclosure и attribution.
4. Публикует витрину.

Состояния:

- Empty catalog.
- Product hidden.
- Partner disclosure required.

Ошибки:

- Неясная партнёрская природа товара.

### FLOW-STREAMER-PROMO: Создание промокода

ID: FLOW-STREAMER-PROMO  
Роль: streamer  
Цель: создать промокод для аудитории.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-STUDIO-PROMOCODES

Шаги:

1. Streamer задаёт код, период и условия.
2. Система проверяет конфликты.
3. Код становится активным.

Состояния:

- Code conflict.
- Expired.
- Usage limit.

Ошибки:

- Промокод обходит rules/commission.

### FLOW-STREAMER-ANALYTICS: Просмотр аналитики

ID: FLOW-STREAMER-ANALYTICS  
Роль: streamer  
Цель: понять донаты, продажи и вклад витрины.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-STUDIO-ANALYTICS

Шаги:

1. Streamer открывает analytics.
2. Смотрит donations/sales/conversion.
3. Фильтрует период.

Состояния:

- No data.
- Loading charts.
- Partial data.

Ошибки:

- Fake metrics без источника.

### FLOW-STREAMER-PAYOUT: Вывод средств

ID: FLOW-STREAMER-PAYOUT  
Роль: streamer  
Цель: запросить выплату.  
Статус реализации: PAYMENT_REVIEW  
MVP/Future: v0.6  
Страницы: PAGE-STUDIO-PAYOUTS

Шаги:

1. Streamer видит available/frozen/pending amounts.
2. Запрашивает выплату.
3. Видит статус review/processing/succeeded/failed.

Состояния:

- Payout pending.
- Payout failed.
- Frozen balance.

Ошибки:

- Баланс назван банковским счётом.
- Нет объяснения холда.

## Продавец

### FLOW-SELLER-REGISTER: Регистрация как продавец

ID: FLOW-SELLER-REGISTER  
Роль: seller  
Цель: создать аккаунт с ролью seller.  
Статус реализации: PARTIAL  
MVP/Future: v0.1-v0.3  
Страницы: PAGE-AUTH-REGISTER, PAGE-SELLER-DASHBOARD

Шаги:

1. Пользователь выбирает role intent seller.
2. Создаёт аккаунт.
3. Сейчас попадает в `/me/profile`.
4. В v0.3 должен попасть в seller onboarding.

Состояния:

- Validation errors.
- Seller profile draft.

Ошибки:

- Нет отдельного seller dashboard.

### FLOW-SELLER-PROFILE: Создание seller profile

ID: FLOW-SELLER-PROFILE  
Роль: seller  
Цель: заполнить профиль продавца.  
Статус реализации: PARTIAL  
MVP/Future: v0.1-v0.3  
Страницы: PAGE-ME-PROFILE, PAGE-SELLER-SETTINGS

Шаги:

1. Seller вводит display name, description, type.
2. Сохраняет.
3. В будущем видит moderation/verification status.

Состояния:

- Draft.
- Pending verification.
- Limited/blocked.

Ошибки:

- Seller Pro выбран без legal/verification flow.

### FLOW-SELLER-PRODUCT: Создание товара

ID: FLOW-SELLER-PRODUCT  
Роль: seller  
Цель: создать товар для marketplace.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-SELLER-PRODUCT-NEW, PAGE-SELLER-PRODUCTS

Шаги:

1. Seller открывает создание товара.
2. Выбирает разрешённую категорию.
3. Заполняет title, description, price, terms.
4. Загружает preview/media, если storage готов.
5. Отправляет на модерацию.

Состояния:

- Draft saved.
- Pending moderation.
- Rejected with reason.

Ошибки:

- Рискованная категория доступна без review.
- Цена хранится float.

### FLOW-SELLER-ORDER: Получение заказа

ID: FLOW-SELLER-ORDER  
Роль: seller  
Цель: увидеть новый заказ.  
Статус реализации: IMPLEMENTED  
MVP/Future: v0.3  
Страницы: PAGE-SELLER-ORDERS

Шаги:

1. Seller получает уведомление/order row.
2. Открывает детали.
3. Видит next action и deadline.

Состояния:

- New order.
- Awaiting payment.
- In progress.

Ошибки:

- Нет понятного статуса оплаты.

### FLOW-SELLER-FULFILL: Выполнение заказа

ID: FLOW-SELLER-FULFILL  
Роль: seller  
Цель: выполнить заказ и отправить результат.  
Статус реализации: PARTIAL  
MVP/Future: v0.3 mock, v0.5 safe deal  
Страницы: PAGE-SELLER-ORDERS

Шаги:

1. Seller принимает заказ.
2. Выполняет услугу/готовит файл.
3. Отмечает выполнение.
4. Buyer подтверждает или наступает auto-confirm.

Состояния:

- Seller working.
- Seller submitted.
- Auto-confirm pending.

Ошибки:

- Нет объяснения сроков.

### FLOW-SELLER-DISPUTE: Работа со спором

ID: FLOW-SELLER-DISPUTE  
Роль: seller  
Цель: ответить на спор.  
Статус реализации: FUTURE  
MVP/Future: v0.7  
Страницы: PAGE-SELLER-DISPUTES

Шаги:

1. Seller получает dispute notification.
2. Открывает спор.
3. Видит deadline и доказательства.
4. Отвечает и прикладывает evidence.

Состояния:

- Awaiting seller.
- Under review.
- Resolved.

Ошибки:

- Evidence доступно публично.

### FLOW-SELLER-AFFILIATE: Настройка партнёрского процента

ID: FLOW-SELLER-AFFILIATE  
Роль: seller  
Цель: предложить авторам партнёрскую долю.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-SELLER-AFFILIATE

Шаги:

1. Seller задаёт affiliate percent.
2. Система проверяет limits.
3. Creator может добавить товар в витрину.

Состояния:

- Percent invalid.
- Campaign paused.

Ошибки:

- Attribution не фиксируется snapshot.

### FLOW-SELLER-PROMO: Создание промокода

ID: FLOW-SELLER-PROMO  
Роль: seller  
Цель: создать промокод для товара/кампании.  
Статус реализации: FUTURE  
MVP/Future: v0.4  
Страницы: PAGE-SELLER-PROMOCODES

Шаги:

1. Seller создаёт code.
2. Настраивает скидку/лимит/период.
3. Видит usage.

Состояния:

- Duplicate code.
- Expired.
- Paused.

Ошибки:

- Скидка ломает расчёт комиссий.

### FLOW-SELLER-PAYOUT: Запрос выплаты

ID: FLOW-SELLER-PAYOUT  
Роль: seller  
Цель: запросить вывод доступных средств.  
Статус реализации: PAYMENT_REVIEW  
MVP/Future: v0.6  
Страницы: PAGE-SELLER-PAYOUTS

Шаги:

1. Seller видит available/frozen/pending amounts.
2. Создаёт payout request.
3. Видит review/processing status.

Состояния:

- Insufficient available balance.
- Pending review.
- Failed/returned.

Ошибки:

- Нет audit trail.
- Выплата обещана мгновенной без provider SLA.

### FLOW-SELLER-PRO: Переход на Seller Pro

ID: FLOW-SELLER-PRO  
Роль: seller  
Цель: запросить Seller Pro.  
Статус реализации: LEGAL_REVIEW  
MVP/Future: v0.8  
Страницы: PAGE-SELLER-VERIFY-PRO

Шаги:

1. Seller читает условия.
2. Заполняет проверенные поля.
3. Отправляет на review.
4. Admin approves/rejects.

Состояния:

- Pending review.
- Need more info.
- Rejected.

Ошибки:

- Сбор лишних персональных данных.

## Админ

### FLOW-ADMIN-MODERATE-PRODUCT: Модерация товара

ID: FLOW-ADMIN-MODERATE-PRODUCT  
Роль: admin/moderator  
Цель: принять или отклонить товар.  
Статус реализации: PARTIAL  
MVP/Future: v0.3  
Страницы: PAGE-ADMIN-PRODUCTS, PAGE-ADMIN-MODERATION

Шаги:

1. Admin открывает pending products.
2. Проверяет категорию, описание, медиа, terms.
3. Approve/reject с причиной.
4. Audit log фиксирует действие.

Состояния:

- Empty queue.
- Restricted category.
- Rejected reason required.

Ошибки:

- Одобрение рискованной категории без review.

### FLOW-ADMIN-MODERATE-SELLER: Модерация продавца

ID: FLOW-ADMIN-MODERATE-SELLER  
Роль: admin/moderator  
Цель: проверить seller profile/status.  
Статус реализации: PLANNED  
MVP/Future: v0.3  
Страницы: PAGE-ADMIN-SELLERS

Шаги:

1. Admin открывает продавца.
2. Проверяет статус, жалобы, товары.
3. Ограничивает или активирует с причиной.

Состояния:

- Pending verification.
- Limited.
- Blocked.

Ошибки:

- Auto-ban без review.

### FLOW-ADMIN-DISPUTE: Обработка спора

ID: FLOW-ADMIN-DISPUTE  
Роль: admin/support  
Цель: принять решение по спору.  
Статус реализации: FUTURE  
MVP/Future: v0.7  
Страницы: PAGE-ADMIN-DISPUTES

Шаги:

1. Admin открывает dispute queue.
2. Читает timeline/evidence.
3. Принимает решение.
4. Система обновляет deal/refund/ledger.

Состояния:

- Under review.
- Awaiting party.
- Resolved to buyer/seller.

Ошибки:

- Решение без audit log.
- Финансовая корректировка без ledger.

### FLOW-ADMIN-PAYMENTS: Просмотр платежей

ID: FLOW-ADMIN-PAYMENTS  
Роль: admin  
Цель: видеть payment statuses и webhook processing.  
Статус реализации: PAYMENT_REVIEW  
MVP/Future: v0.5  
Страницы: PAGE-ADMIN-PAYMENTS

Шаги:

1. Admin открывает payments.
2. Фильтрует по status/provider purpose.
3. Открывает детали webhook/result.

Состояния:

- Pending.
- Failed.
- Webhook failed.

Ошибки:

- Provider status показан как доменный.
- Raw secrets видны в UI.

### FLOW-ADMIN-PAYOUTS: Просмотр выплат

ID: FLOW-ADMIN-PAYOUTS  
Роль: admin  
Цель: review payout requests.  
Статус реализации: PAYMENT_REVIEW  
MVP/Future: v0.6  
Страницы: PAGE-ADMIN-PAYOUTS

Шаги:

1. Admin видит pending payouts.
2. Проверяет risk flags/limits.
3. Approve/reject.
4. Audit log фиксирует решение.

Состояния:

- Pending review.
- Processing.
- Failed/returned.

Ошибки:

- Approve без confirmation.

### FLOW-ADMIN-BLOCK: Блокировка пользователя

ID: FLOW-ADMIN-BLOCK  
Роль: admin  
Цель: заблокировать или активировать пользователя.  
Статус реализации: PARTIAL  
MVP/Future: v0.1, улучшение v0.3  
Страницы: PAGE-ADMIN-USERS

Шаги:

1. Admin входит в admin app.
2. Загружает users.
3. Нажимает block/activate.
4. API меняет статус и пишет audit.

Состояния:

- Unauthorized.
- Forbidden.
- Loading list.
- Error update status.

Ошибки:

- Нет confirmation для опасного действия.

### FLOW-ADMIN-AUDIT: Просмотр audit log

ID: FLOW-ADMIN-AUDIT  
Роль: admin  
Цель: найти audit event.  
Статус реализации: PLANNED  
MVP/Future: v0.8  
Страницы: PAGE-ADMIN-AUDIT

Шаги:

1. Admin открывает audit log.
2. Фильтрует по entity/action/date.
3. Смотрит masked payload.

Состояния:

- Empty result.
- Forbidden.
- Large result pagination.

Ошибки:

- Возможность редактировать audit.

### FLOW-ADMIN-CATEGORIES: Настройка категорий

ID: FLOW-ADMIN-CATEGORIES  
Роль: admin  
Цель: управлять категориями marketplace.  
Статус реализации: PLANNED  
MVP/Future: v0.3  
Страницы: PAGE-ADMIN-CATEGORIES

Шаги:

1. Admin создаёт/редактирует категорию.
2. Указывает status active/hidden/restricted.
3. Для restricted фиксирует legal/payment review status.

Состояния:

- Restricted.
- Hidden.
- Validation error.

Ошибки:

- Категория риска становится active без review.
