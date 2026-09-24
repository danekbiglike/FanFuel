# User Flows

## FLOW-PLAYGROUND-OILY — эксперимент с персонажем

Статус: `IMPLEMENTED` на `PAGE-PLAYGROUND`, `UX-TASK-044`. Посетитель открывает `playground.fanfuel.ru`, видит явно фиктивную витрину, хватает карандашного Ойли и отпускает на выбранной видимой карточке. Изменение настроек сразу меняет штрих или мягкость, сброс возвращает персонажа и параметры. Поиск, категории, вход и покупки недоступны; переход на основной сайт находится в footer. При reduced motion показывается неподвижный контур без автоматического падения.

## FLOW-OILY-SITE-STAGE — короткие визуальные сцены на marketplace

Статус: проектный UI-пилот `UX-TASK-038`/`UX-TASK-043` для `/` и `/marketplace`. При первом подходящем входе страница показывает обычные товары и навигацию, затем Ойли появляется от якоря хедера, касается нижней видимой поверхности первого экрана и переходит в idle. Пользователь хватает Ойли за контур, переносит на любую видимую разрешённую карточку и отпускает; быстрый рывок растягивает его сильнее медленного, слабый удар даёт упругое смятие, сильный включает подготовленный клип. Смена вкладки, скролл или исчезновение карточки обновляют/отменяют контакт без блокировки страницы. Карточки остаются кликабельными вне формы Ойли, их данные не меняются. Пользователь может скрыть Ойли. При reduced-motion показывается спокойная конечная поза. См. `docs/PENCIL_ENGINE_WEB_STAGE.md`.

> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

## FLOW-GAMING-LOCAL: Скрытая локальная match-3 игра

Версия: v0.3.5

Статус реализации: IMPLEMENTED

Страница: PAGE-GAMING

Task: UX-TASK-034

1. Владелец открывает `/gaming` по прямому URL.
2. Игра восстанавливает локальный прогресс или создаёт первый уровень.
3. Игрок меняет местами соседние фишки, выполняет цели и собирает заряд суперсилы.
4. При победе получает локальные игровые монеты и открывает следующий уровень.
5. При поражении повторяет уровень; публичные данные и backend не изменяются.

Альтернативы: игрок применяет локальный усилитель, покупает его за игровые монеты, сбрасывает только игровой прогресс или возвращается на главную FanFuel.

Документ описывает основные пользовательские сценарии FanFuel. Каждый flow имеет статус реализации и привязан к страницам из `docs/PAGE_MAP.md`.

## Как читать статусы

- `IMPLEMENTED` — flow реализован и соответствует текущему spec.
- `PARTIAL` — основная логика есть, но UX или отдельные состояния неполные.
- `PLANNED` — должен быть реализован в ближайшей версии.
- `FUTURE` — нужен позже, сейчас не делать.
- `PAYMENT_REVIEW` — зависит от платёжной модели.
- `LEGAL_REVIEW` — зависит от юридической проверки.

## Дизайн-обновление v0.3.5

### FLOW-AURORA-REFRESH-QA: обновление текущих экранов до FanFuel Aurora

ID: FLOW-AURORA-REFRESH-QA
Роль: product/design/agent
Цель: сначала привести существующие страницы к новой визуальной базе, чтобы последующие страницы профиля, Studio и витрины строились в одном стиле.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ME-PROFILE, PAGE-CREATOR-PUBLIC, PAGE-ADMIN-DASHBOARD, PAGE-WIDGET-ALERT

Шаги:

1. Агент фиксирует Aurora tokens и правила glass/material usage в дизайн-системе.
2. Обновляет shared primitives и текущие страницы без изменения маршрутов.
3. Проверяет, что warm/orange не является primary brand и не доминирует в logo, CTA, hero и бейджах одновременно.
4. Проверяет `ru`/`en`, light/dark, 320/390/768/1440, long strings и contrast.
5. Только после успешного pass начинает задачи профиля, Studio, витрины автора и виджетов.

Состояния:

- Dark Aurora.
- Light Aurora.
- Reduced motion.
- Empty marketplace.
- Product without media fallback.

Ошибки:

- Glass применён ко всем карточкам и таблицам.
- Страница выглядит как adult/betting/casino/старый skin-shop.
- Redesign создаёт новые future routes или меняет layout slots скинов.
- Текст/бейджи ломаются на русском или английском.

## Пользовательский профиль и v0.3.5

### FLOW-USER-REGISTER: Регистрация базового аккаунта

ID: FLOW-USER-REGISTER
Роль: authenticated user
Цель: создать аккаунт и задать имя платформы без выбора роли.
Статус реализации: IMPLEMENTED
MVP/Future: v0.1, обновлено 2026-09-14
Страницы: PAGE-AUTH, PAGE-AUTH-NAME, PAGE-MARKETPLACE

Шаги:

1. Пользователь вводит email на `/auth`.
2. Для нового email получает одноразовый код и подтверждает владение адресом.
3. Задаёт новый пароль; аккаунт создаётся с заполненным `email_verified_at` и базовой ролью buyer.
4. Пользователь попадает на `/auth/name`.
5. Вводит имя на платформе.
6. Продолжает в marketplace или возвращается в сохранённый creator flow.

Состояния:

- Validation errors.
- API error.
- Expired token.
- Неверный/просроченный/исчерпавший попытки email code.
- Ошибка доставки письма и resend cooldown.
- Уже заданное имя.

Ошибки:

- Регистрация снова просит роль или имя.
- Имя платформы автоматически занимает публичный ник/адрес витрины.
- Вход пропускает незавершённый шаг имени.
- Аккаунт создаётся до подтверждения email.
- Код или registration token можно использовать повторно.

### FLOW-USER-PROFILE-HUB: Управление профилем пользователя

ID: FLOW-USER-PROFILE-HUB
Роль: authenticated user
Цель: управлять своим аккаунтом, избранным, отзывами, подборками и режимами автора/продавца.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-ME-FAVORITES, PAGE-ME-REVIEWS, PAGE-ME-COLLECTIONS

Шаги:

1. Пользователь открывает `/me/profile`.
2. Видит аватар, имя, entry points в настройки, избранное, отзывы и подборки.
3. Если не является автором/продавцом, видит действия "стать автором" и "стать продавцом".
4. Если уже автор/продавец, видит pause/resume и archive page actions.
5. Destructive actions требуют confirmation и объясняют последствия.

Состояния:

- Avatar upload pending.
- Role mode paused.
- Archive blocked by active obligations.
- Unauthorized.

Ошибки:

- Профиль снова становится dumping ground для Studio/Seller controls.
- Архивирование физически удаляет финансовую или order history.

### FLOW-USER-COLLECTIONS: Создание пользовательских подборок

ID: FLOW-USER-COLLECTIONS
Роль: authenticated user
Цель: создавать подборки товаров и авторов независимо от роли автора.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-ME-COLLECTIONS, PAGE-ME-FAVORITES, PAGE-CREATOR-STORE

Шаги:

1. Пользователь открывает свои подборки.
2. Создаёт подборку с visibility `private`, `public` или `unlisted`.
3. Добавляет published товары, авторов или продавцов.
4. При необходимости использует подборку в витрине автора, если имеет creator mode.

Состояния:

- Empty first collection.
- Hidden product removed from public view.
- Private collection.

Ошибки:

- Подборки доступны только авторам.
- Private подборка становится публичной без явного действия.

### FLOW-CREATOR-LIVE-STORE: Live-only витрина автора

ID: FLOW-CREATOR-LIVE-STORE
Роль: streamer, buyer, guest
Цель: показать карточки и подборки на витрине автора только во время прямой трансляции.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-STORE, PAGE-CREATOR-STORE, PAGE-CREATOR-PUBLIC

Шаги:

1. Автор открывает `/studio/store`.
2. Добавляет секцию товаров или подборку.
3. Выбирает `visibility_rule=live_only`.
4. Включает live-state вручную в MVP.
5. Зритель открывает публичную витрину и видит live-only блоки только при active live.

Состояния:

- Offline.
- Live.
- Paused creator page.
- Product hidden/unavailable.

Ошибки:

- Live-only блоки видны offline.
- Пауза автора выглядит как 500/404 вместо понятного unavailable state.

### FLOW-STUDIO-STATISTICS: Просмотр статистики Studio

ID: FLOW-STUDIO-STATISTICS
Роль: streamer
Цель: увидеть динамику дохода по донатам и партнёрским товарам.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-DASHBOARD, PAGE-STUDIO-STATISTICS

Шаги:

1. Автор открывает `/studio`.
2. Переходит во вкладку статистики.
3. Выбирает период.
4. Фильтрует источник: все, донаты, партнёрские товары.
5. Смотрит график и summary за период.

Состояния:

- No data.
- Loading chart.
- Partial data.
- Error retry.

Ошибки:

- График показывает fake revenue.
- Статистика называется доступным балансом или ведёт к payout UI.

### FLOW-STUDIO-EVENTS: Последние события Studio

ID: FLOW-STUDIO-EVENTS
Роль: streamer
Цель: видеть события канала, донатов и партнёрских покупок в одном feed.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-EVENTS

Шаги:

1. Автор открывает `/studio/events`.
2. Выбирает подвкладку: все события, донаты, подписки на каналы, покупки партнёрских товаров.
3. Если канал не подключён, видит статус bot integration.
4. При активном боте видит подписки YouTube/Twitch/Telegram как события.

Состояния:

- Empty feed.
- Bot not connected.
- Integration error.
- Delayed ingestion.

Ошибки:

- UI показывает raw bot payload или secrets.
- Подписки на каналы выглядят как гарантированно realtime без учёта platform delays.

### FLOW-STUDIO-DONATION-SETTINGS: Настройка правил донатов

ID: FLOW-STUDIO-DONATION-SETTINGS
Роль: streamer
Цель: настроить суммы, сообщения, audio/TTS, модерацию и спам-фильтр.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-DONATION-SETTINGS, PAGE-CREATOR-DONATE, PAGE-WIDGET-ALERT

Шаги:

1. Автор открывает `/studio/donation-settings`.
2. Задаёт presets сумм и message max length.
3. Настраивает аудиосообщения по категориям и минимальной сумме.
4. Настраивает озвучку по категориям и минимальной сумме.
5. Выбирает moderation mode и spam-filter policy.
6. Проверяет mock donation preview.

Состояния:

- Validation error.
- Moderation hold.
- Spam blocked.
- Audio/TTS disabled.

Ошибки:

- Held donation уходит в OBS alert до модерации.
- Настройки доната меняют payment status или provider flow.

### FLOW-STUDIO-PRODUCTS-COLLECTIONS: Продукты и подборки автора

ID: FLOW-STUDIO-PRODUCTS-COLLECTIONS
Роль: streamer
Цель: выбрать товары для витрины и собрать авторские подборки.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-PRODUCTS, PAGE-STUDIO-COLLECTIONS, PAGE-STUDIO-STORE

Шаги:

1. Автор открывает `/studio/products`.
2. Выбирает published/eligible товары.
3. Открывает `/studio/collections`.
4. Собирает подборку из товаров или авторов.
5. Использует подборку как секцию витрины и при необходимости помечает её `live_only`.

Состояния:

- Empty product catalog.
- Product hidden/unavailable.
- Partner disclosure required.
- Empty collection.

Ошибки:

- Hidden product попадает в публичную витрину.
- Private user collection становится публичной без явного действия.

### FLOW-STUDIO-WIDGET-RULES: Настройка правил виджетов

ID: FLOW-STUDIO-WIDGET-RULES
Роль: streamer
Цель: настроить alert под товар, группу товаров, подборку или сумму доната.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-WIDGETS, PAGE-WIDGET-PREVIEW

Шаги:

1. Автор открывает `/studio/widgets`.
2. Создаёт widget или выбирает существующий.
3. Добавляет rule: product, product group, collection, purchase event или donation amount threshold.
4. Выбирает image/gif/animation asset.
5. Проверяет preview на mock event.

Состояния:

- Rule conflict.
- Asset upload failed.
- Preview unavailable.

Ошибки:

- Настройки меняются через public widget URL.
- Purchase alert раскрывает лишние персональные данные.

### FLOW-STUDIO-WIDGET-CATALOG: Каталог категорий виджетов

ID: FLOW-STUDIO-WIDGET-CATALOG
Роль: streamer
Цель: выбрать подходящий виджет под задачу без ручной настройки с нуля.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-WIDGETS, PAGE-STUDIO-WIDGET-GROUPS, PAGE-WIDGET-PREVIEW

Шаги:

1. Автор открывает `/studio/widgets`.
2. Выбирает категорию: оповещения, статистика, сбор средств, товары, цикличные промо, прочие.
3. Выбирает preset.
4. Настраивает supported events, assets и placement.
5. Проверяет preview.

Состояния:

- Unsupported event.
- Preset validation error.
- Preview no data.
- Reduced motion.

Ошибки:

- Widget preset принимает произвольный JS/HTML/CSS.
- Product widget раскрывает приватные данные заказа или покупателя.

### FLOW-STUDIO-WIDGET-GROUPS: Группы виджетов и зоны OBS

ID: FLOW-STUDIO-WIDGET-GROUPS
Роль: streamer
Цель: расположить разные типы алертов в разных местах OBS.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-STUDIO-WIDGET-GROUPS, PAGE-WIDGET-PURCHASE, PAGE-WIDGET-ALERT

Шаги:

1. Автор создаёт widget group.
2. Настраивает placement zones.
3. Назначает donation alerts в center.
4. Назначает sponsored purchase alerts в top_right.
5. Подключает read-only group URL в OBS.

Состояния:

- Token visible once.
- Revoked group.
- Zone overlap warning.

Ошибки:

- Group token используется как API auth token.
- UI превращается в полноценный drag-and-drop редактор сцены.

## Покупатель

### FLOW-BUYER-HOME: Просмотр главной

ID: FLOW-BUYER-HOME
Роль: guest, buyer
Цель: начать поиск и выбор обычного цифрового товара; при необходимости перейти во вкладку автора или продавца.
Статус реализации: NEEDS_REWORK
MVP/Future: v0.3.5, UX-TASK-036
Страницы: PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS

Шаги:

1. Пользователь открывает `/`.
2. Приложение открывает ту же marketplace-витрину, что и `/marketplace`, без redirect.
3. Покупательская вкладка выбрана по умолчанию независимо от ролей аккаунта.
4. В первом viewport пользователь видит marketplace-навигацию: поиск или путь к поиску, общие категории цифровых товаров и начало реального ассортимента.
5. Пользователь открывает категорию/товар либо переключается во вторичную вкладку автора/продавца без смены роли.
6. Creator attribution и поддержка автора показываются там, где есть реальные данные, и не вытесняют общий каталог.

Состояния:

- Loading: skeleton торговых блоков.
- Empty: честное пустое состояние с полезным действием, без fake products.
- Error: переключатель и навигация сохраняются, доступен retry.

Ошибки:

- Нерабочая ссылка CTA.
- Root route возвращает generic landing вместо marketplace.
- Покупательская вкладка превращается в презентацию для авторов/стримеров.
- Ассортимент описан только как creator/OBS товары.

### FLOW-BUYER-SEARCH: Поиск товара

ID: FLOW-BUYER-SEARCH
Роль: buyer, guest
Цель: найти цифровой товар или услугу.
Статус реализации: NEEDS_REWORK
MVP/Future: MVP v0.3.5, UX-TASK-036
Страницы: PAGE-MARKETPLACE

Шаги:

1. Пользователь открывает marketplace.
2. На первом экране использует один явный вход поиска или выбирает быстрое направление.
3. Поиск ведёт в `/marketplace/catalog?query=...`; он не применяет скрытый фильтр на главной и не дублируется второй формой.
4. Быстрое направление открывает явную страницу (`/marketplace/category/*`, `/creators`, `/marketplace/promocodes`) и не скроллит пользователя в другую секцию.
5. Открывает карточку товара, автора или витрину автора.
6. Гость и авторизованный пользователь могут начать поиск из верхней панели с любой страницы; точная desktop/mobile композиция фиксируется UX-TASK-036.

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
Статус реализации: SUPERSEDED_BY_UX_TASK_036
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
Статус реализации: PLANNED
MVP/Future: v0.3.5 live-only MVP, v0.4 attribution expansion
Страницы: PAGE-CREATOR-STORE, PAGE-PRODUCT, PAGE-CHECKOUT

Шаги:

1. Buyer открывает витрину автора.
2. Если автор live, видит live-only карточки и подборки.
3. Выбирает published товар.
4. Видит disclosure, если товар партнёрский.
5. Покупает через checkout.

Состояния:

- Offline/no live-only blocks.
- Empty store.
- Product hidden/unavailable.
- Attribution expired.

Ошибки:

- Неясно, что товар партнёрский.
- Live-only блоки видны offline.
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

### FLOW-STREAMER-REGISTER: Создание авторского черновика

ID: FLOW-STREAMER-REGISTER
Роль: streamer
Цель: после базовой регистрации создать черновик публичной страницы автора.
Статус реализации: PARTIAL
MVP/Future: v0.3.5
Страницы: PAGE-CREATE, PAGE-AUTH, PAGE-AUTH-NAME

Шаги:

1. Пользователь заполняет публичную анкету автора до авторизации.
2. Регистрирует базовый аккаунт без выбора роли.
3. Задаёт имя платформы.
4. Возвращается в /create и сохраняет черновик автора.

Состояния:

- Validation errors.
- Существующий creator profile.
- Unauthorized после истечения токена.

Ошибки:

- Регистрация снова просит роль стримера.
- Черновик автоматически публикуется без явного действия.

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
Цель: добавить собственные товары, подборки или базовые партнёрские блоки в витрину.
Статус реализации: PLANNED
MVP/Future: v0.3.5 live-only MVP, v0.4 attribution expansion
Страницы: PAGE-STUDIO-STORE, PAGE-STUDIO-PARTNERS, PAGE-CREATOR-STORE

Шаги:

1. Streamer открывает `/studio/store`.
2. Выбирает товар или пользовательскую подборку.
3. Настраивает позицию и `visibility_rule`.
4. Проверяет preview online/offline.
5. Публикует витрину.

Состояния:

- Empty catalog.
- Offline preview.
- Live-only hidden.
- Product hidden.
- Partner disclosure required.

Ошибки:

- Неясная партнёрская природа товара.
- Нет ручного live-state или он не отражается публично.

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

### FLOW-STREAMER-ANALYTICS: Расширенная аналитика

ID: FLOW-STREAMER-ANALYTICS
Роль: streamer
Цель: глубоко анализировать донаты, продажи, вклад витрины и долгосрочные тренды после базовой статистики v0.3.5.
Статус реализации: FUTURE
MVP/Future: v0.4
Страницы: PAGE-STUDIO-ANALYTICS

Шаги:

1. Streamer открывает расширенную analytics.
2. Смотрит donations/sales/conversion после накопления событий.
3. Фильтрует период и сегменты.

Состояния:

- No data.
- Loading charts.
- Partial data.

Ошибки:

- Fake metrics без источника.
- Дублирование базовой `/studio/statistics` без нового смысла.

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

### FLOW-SELLER-REGISTER: Включение режима продавца

ID: FLOW-SELLER-REGISTER
Роль: seller
Цель: включить режим продавца после создания базового аккаунта.
Статус реализации: PLANNED
MVP/Future: v0.3.5
Страницы: PAGE-AUTH, PAGE-AUTH-NAME, PAGE-ME-PROFILE

Шаги:

1. Пользователь регистрирует базовый аккаунт.
2. Задаёт имя платформы.
3. Из account hub явно включает режим продавца.
4. Заполняет отдельный seller profile.

Состояния:

- Validation errors.
- Seller profile draft.
- Повторное включение режима.

Ошибки:

- Регистрация создаёт seller profile без явного действия пользователя.
- Юридические/налоговые требования не проверены.

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

## Дополнение UX-TASK-026: сканирование `/marketplace`

## Дополнение UX-TASK-027: search-first creator-commerce путь `/marketplace`

ID: FLOW-MARKETPLACE-SEARCH-FIRST-CREATOR-COMMERCE
Роль: buyer / viewer / streamer / seller
Цель: пользователь за первые 5 секунд понимает, что FanFuel помогает найти товар или автора, купить безопасно и поддержать автора через витрину или промокод.
Статус реализации: IMPLEMENTED

Основной поток:

1. Пользователь открывает `/marketplace` и видит hero с большим поиском и demo покупки через витрину автора.
2. Пользователь может сразу искать товар, автора, OBS-пак или услугу; поиск ведёт в явный search/catalog scope.
3. Пользователь видит цепочку: находит товар, покупает через автора, автор получает поддержку.
4. Пользователь распознаёт ассортимент через категории с понятными иконками и примерами.
5. Пользователь видит featured-модуль, где товар добавили авторы в витрины, и может открыть товар или список авторов.
6. Пользователь сканирует крупные product cards и витрины авторов без перегруза бейджами.
7. Пользователь переходит к своему действию: найти товар, найти автора, создать страницу или разместить товар.

ID: FLOW-MARKETPLACE-CREATOR-HIERARCHY
Роль: buyer / viewer / streamer / seller
Цель: за первые секунды понять, что `/marketplace` — это маркетплейс цифровых товаров, где покупка может идти через автора, витрину или промокод.
Статус реализации: SUPERSEDED_BY_UX_TASK_036
MVP/Future: v0.3.5
Страницы: PAGE-MARKETPLACE, PAGE-HOME

Шаги:

1. Пользователь открывает `/marketplace`.
2. Видит крупный hero: "Покупай нужное. Поддерживай любимых." и hero search.
3. Под поиском распознаёт быстрые направления, но они не конкурируют с поиском.
4. В hero-card видит автора, цель, товар, промокод и мини-flow покупки.
5. Сразу после hero видит цепочку "Товар → Автор → Поддержка".
6. В категориях считывает ассортимент через названия и примеры.
7. В featured-блоке понимает, что товар добавили 14 авторов и покупка через витрину/промокод поддерживает выбранного автора.

Состояния:

- Нет товаров: компактный empty state без растягивания секций.
- Нет cover image: category preview вместо шумной заглушки.
- Есть cover image: реальное изображение продавца перекрывает category preview.

Ошибки:

- Быстрые направления выглядят как фильтры, но ведут как навигация без явного scope.
- Блок поддержки выглядит как обычные второстепенные карточки и не считывается как цепочка.
- SafeDeal описан внутренними provider/legal формулировками.

### FLOW-WORLD-VISIT: Первая сессия FanFuel World

ID: FLOW-WORLD-VISIT
Роль: user
Цель: познакомиться с домом маскота и одной короткой интерактивной активностью.
Статус реализации: FUTURE
MVP/Future: future / UX-TASK-039
Страницы: PAGE-WORLD-HOME

Discovery-сценарий:

1. Пользователь открывает прототип `world.fanfuel.ru` из явной необязательной точки входа.
2. Видит одну комнату/студию и маскота.
3. Выполняет одно безопасное взаимодействие и может открыть одну мини-игру.
4. Получает cosmetic-only реакцию без денежной ценности и без связи с суммой покупок/донатов.
5. Возвращается в основной FanFuel.

Стоп-линия: production route, account progress, валюта, случайные платные награды, multiplayer и marketplace rewards не создаются до product/security/privacy review и снятия `DO_NOT_BUILD_YET`.

## Дополнение UX-TASK-028: ранний товарный вход `/marketplace`

ID: FLOW-MARKETPLACE-PRODUCT-DISCOVERY-FIRST
Роль: buyer / viewer / streamer / seller
Цель: пользователь быстро видит ассортимент, но параллельно считывает авторские подборки и поддержку через витрины/промокоды.
Статус реализации: IMPLEMENTED

Основной поток:

1. Пользователь открывает `/marketplace`.
2. В hero он видит поиск и demo покупки через автора.
3. Сразу ниже он видит compact flow: товар найден, покупка через автора, автор получает поддержку.
4. Затем пользователь получает быстрый товарный вход: категории ведут на явные страницы, а "Сейчас покупают" показывает 3 компактных товара.
5. До обычного товарного грида пользователь видит подборки авторов с промокодом, целью и двумя товарами.
6. Proof-module показывает, что конкретный товар добавили 14 авторов, и объясняет покупку через витрину или промокод.
7. Популярные товары остаются обычным marketplace-сценарием после creator-commerce доказательств.

## FLOW-HOME-AUDIENCE — UX-TASK-029

Гость открывает главную → видит покупательский маркетплейс → ищет товар в хэдере или открывает категорию. Автор/продавец выбирает свой режим под хэдером → читает презентацию → переходит к базовой регистрации и следующему шагу имени. Переключение не меняет роль аккаунта.

## Уточнение FLOW-HOME-AUDIENCE — UX-TASK-030

Покупатель начинает с категорий или поиска в центре хедера. Новые товары загружаются из API; при ошибке повторная загрузка происходит на месте. Редакционные направления ведут на существующие категории. Автор изучает концепцию витрины и механику поддержки покупками, продавец — общий каталог и будущие авторские витрины. Все роли переключаются без навигации; «Маркет» и «Авторы» находятся рядом с аккаунтом справа.

## UX-TASK-031 — страница автора до регистрации

Версия: v0.3.5. Статус: IMPLEMENTED. Route: /create. По прямому запросу пользователя добавляется публичная анкета автора: название → описание → предпросмотр и авторизация. Данные сохраняются в sessionStorage текущей вкладки; email и пароль в черновик не входят. После входа возврат только на фиксированный /create, сохранение по явной кнопке. Новый авторский профиль создаётся как draft; существующий не перезаписывается этим сценарием. Покупатель может добавить роль автора. В хедере только вход, без отдельной регистрации/создания страницы; регистрация доступна вкладкой на auth-странице.

Acceptance criteria: ru/en, semantic light/dark, mobile/desktop, клавиатура, валидация полей, восстановление черновика, сохранение при ошибке API, обе auth-вкладки сохраняют контекст, успешное сохранение через API, без автопубликации.

### UX-TASK-031: необязательные шаги анкеты

По запросу пользователя: название → описание (можно пропустить) → аватар и баннер (необязательно, можно пропустить) → спонсорские товары (можно пропустить) → авторизация. Изображения хранятся только в IndexedDB браузера, привязаны к черновику вкладки; на сервер не отправляются. Выбор товаров из реального каталога с affiliate_percent_bps > 0, без вымышленных товаров или обещаний выплат. Публикация витрины и загрузка медиа на сервер не реализуются этой UI-итерацией; локальные дополнения не удаляются при сохранении названия/описания в аккаунт. Успешный экран явно сообщает об этом. При ошибке каталога доступны повтор и пропуск. Ввод, возврат, повторное открытие и смена auth-вкладки сохраняют локальный черновик.

## UX-TASK-033 — уточнение авторизации, 2026-09-15

Задача по отдельным формам завершена и замещена UX-TASK-035; старые auth routes оставлены только для совместимости.

Компактная auth-оболочка, доступные поля и отдельный шаг имени переиспользованы в едином сценарии.

## UX-TASK-035 — единая авторизация и подтверждение email, 2026-09-17

Сценарий регистрации: email → отправка кода → подтверждение кода → новый пароль → создание аккаунта → имя платформы. Сценарий входа: email существующего аккаунта → пароль. С каждого шага можно вернуться к email; `flow=creator` сохраняется. Новый аккаунт до подтверждения email не существует.


## UX-TASK-041

Автор → studio → независимые переключатели витрины/промо → дизайн и блоки → поиск товара → оценка цены и поддержки → сохранить → публичная витрина. Покупатель → вариант → точные аналоги → выбрать товар → storefront/promo → один получатель → подтверждённая сервером сумма → mock checkout. Продавец → черновик → identity + две ставки → просмотр остатка выручки → модерация.
