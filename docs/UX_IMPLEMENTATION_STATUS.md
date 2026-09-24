# UX Implementation Status

## UX-TASK-044 — опубликованная тестовая главная, 24.09.2026

`PAGE-PLAYGROUND` на `https://playground.fanfuel.ru/`: `IMPLEMENTED`. Статический макет с фиктивными карточками и отключёнными торговыми действиями; карандашный Ойли, перетаскивание и настройки работают. `PAGE-HOME` и `PAGE-MARKETPLACE` не переписаны: их прежний статус `NEEDS_REWORK` сохраняется. Художественная оценка и перенос актора на реальные страницы ещё впереди.

## UX-TASK-043 — новое требование к Ойли поверх сайта, 23.09.2026

Дополнение: владелец запросил свободное перетаскивание Ойли на выбранную им карточку, скоростное растяжение и смятие самого векторного штриха. Слабое столкновение обрабатывается мягкой физикой, сильное по порогу скорости запускает авторский клип. Спецификация, tracker и задачи обновлены. В пакете `pencil-engine` создан изолированный стенд решётки и двух DOM-карточек; в production `OilyStage` этот механизм ещё не включён, художественная форма Ойли открыта для оценки.

Пользователь уточнил: Ойли должен быть actor, визуально взаимодействующим с DOM сайта, например падать от хедера к нижней поверхности первого экрана или ударяться о карточку товара. Это проектный UI-пилот на существующих `/` и `/marketplace`, связанный с `UX-TASK-038`; полная World-страница остаётся FUTURE. Сначала обновлены `PAGE_SPECS`, `UI_UX_TRACKER`, `USER_FLOWS`, `TASKS` и технический план `PENCIL_ENGINE_WEB_STAGE`. Текущий код `OilyStage` умеет якоря и CSS-перемещение, но сцены падения/столкновения и новый карандашный actor пока не реализованы. Следующий срез: один `intro-fall`, затем `bump → recover`, с проверкой кликов, scroll/resize, reduced-motion и производительности.

> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

Рабочий документ для ручного обновления UX-логики. Если новая логика придумана текстом, сначала добавить её сюда, затем обновить `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md` и `docs/TASKS.md`, и только потом менять код.

## Как пользоваться этим документом

- Если новая логика придумана, сначала добавить её сюда.
- Если страница должна измениться, добавить запись в раздел `Нужно обновить`.
- Если страница не должна создаваться сейчас, указать `DO_NOT_BUILD_YET`.
- Агент должен читать этот документ перед работой и не лезть в страницы, которые не входят в его задачу.
- Если page/spec/tracker расходятся с кодом, зафиксировать расхождение здесь или в `docs/DESIGN_AUDIT.md`.
- Записи должны ссылаться на `PAGE-ID`, `FLOW-ID`, `CMP-ID` или `UX-TASK-ID`.

## Реализовано

UX-TASK-034: PAGE-GAMING `/gaming` реализована как скрытый client-only эксперимент без публичной навигации, API, БД и реальных денег. Доступны match-3 поле, 12 уровней, локальный прогресс, цели, специальные фишки, усилители и суперсила.

| ID          | Что реализовано                                      | Где                                                                                                                                                                           | Версия | Статус      | Комментарий                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-IMPL-001 | Главная FanFuel                                      | `apps/web /`                                                                                                                                                                  | v0.2   | PARTIAL     | Есть landing, но нужен v0.3 role/marketplace update.                                                                                                                                                                                                                                                                                                                                                                                                          |
| UX-IMPL-002 | Единая авторизация                                   | `apps/web /auth`, redirects `/auth/login`, `/auth/register`                                                                                                                   | v0.3.5 | IMPLEMENTED | Email-first flow: существующий email → пароль; новый → одноразовый код → новый пароль. Незаданное имя ведёт на `/auth/name`.                                                                                                                                                                                                                                                                                                                                  |
| UX-IMPL-003 | Подтверждённая базовая регистрация                   | `apps/web /auth`, `/auth/name`                                                                                                                                                | v0.3.5 | IMPLEMENTED | Аккаунт создаётся только после email code и одноразового registration token; роль не выбирается, имя платформы задаётся следующим шагом.                                                                                                                                                                                                                                                                                                                      |
| UX-IMPL-004 | Публичная страница автора с донатами                 | `apps/web /creators/[slug]`                                                                                                                                                   | v0.2   | PARTIAL     | Есть донат, цели, история, top donors.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| UX-IMPL-005 | OBS donation alert widget                            | `apps/widget /?token=`                                                                                                                                                        | v0.2   | PARTIAL     | Есть reconnect/dedupe/theme, нет settings preview.                                                                                                                                                                                                                                                                                                                                                                                                            |
| UX-IMPL-006 | Базовая admin users panel                            | `apps/admin /`                                                                                                                                                                | v0.3   | PARTIAL     | Есть list/block/activate, confirmation и вкладка moderation товаров; filters/details позже.                                                                                                                                                                                                                                                                                                                                                                   |
| UX-IMPL-007 | ThemeSwitcher и semantic tokens                      | `packages/ui`, web/admin/widget                                                                                                                                               | v0.2   | PARTIAL     | Работает, но нужны icon/tooltips/design review.                                                                                                                                                                                                                                                                                                                                                                                                               |
| UX-IMPL-008 | Marketplace MVP                                      | `apps/web /marketplace`, `/marketplace/products/[slug]`, `/checkout/[productId]`                                                                                              | v0.3   | IMPLEMENTED | Каталог, карточка товара, checkout и mock safe deal.                                                                                                                                                                                                                                                                                                                                                                                                          |
| UX-IMPL-009 | Buyer order MVP                                      | `apps/web /buyer`, `/buyer/orders/[id]`                                                                                                                                       | v0.3   | IMPLEMENTED | Список заказов, timeline, confirm delivery и review.                                                                                                                                                                                                                                                                                                                                                                                                          |
| UX-IMPL-010 | Seller marketplace MVP                               | `apps/web /seller`, `/seller/products`, `/seller/products/new`, `/seller/orders`                                                                                              | v0.3   | IMPLEMENTED | Создание товара, модерация, товары и order actions.                                                                                                                                                                                                                                                                                                                                                                                                           |
| UX-IMPL-011 | Marketplace как главная                              | `apps/web /`, `/marketplace`                                                                                                                                                  | v0.3   | IMPLEMENTED | `/` рендерит ту же marketplace-витрину без redirect, `/marketplace` остаётся прямым маршрутом каталога.                                                                                                                                                                                                                                                                                                                                                       |
| UX-IMPL-012 | Ролевые публичные лендинги                           | `/for-buyers`, `/for-streamers`, `/for-sellers`                                                                                                                               | v0.3   | IMPLEMENTED | Три страницы для покупателей, стримеров и продавцов с i18n и semantic tokens.                                                                                                                                                                                                                                                                                                                                                                                 |
| UX-IMPL-013 | Authenticated topbar                                 | `apps/web AppTopBar`                                                                                                                                                          | v0.3   | PARTIAL     | Для вошедшего пользователя добавлены поиск, actions и меню аккаунта; notification flow позже.                                                                                                                                                                                                                                                                                                                                                                 |
| UX-IMPL-014 | Compact authenticated menu                           | `apps/web AppTopBar`                                                                                                                                                          | v0.3   | PARTIAL     | Мобильный auth topbar держится в одну строку; меню разделено на категории, theme/language открываются overlay-dropdown.                                                                                                                                                                                                                                                                                                                                       |
| UX-IMPL-015 | Guest topbar menu                                    | `apps/web AppTopBar`                                                                                                                                                          | v0.3   | PARTIAL     | Для гостя добавлены topbar search и dropdown menu с входом, регистрацией, публичными разделами, темой и языком.                                                                                                                                                                                                                                                                                                                                               |
| UX-IMPL-016 | Topbar search polish                                 | `apps/web AppTopBar`, `/marketplace`                                                                                                                                          | v0.3   | PARTIAL     | Search placeholder выбирается по фактической ширине поля, кнопка поиска выровнена по inset-отступам, form controls защищены от hydration warning из-за внешних injected attributes.                                                                                                                                                                                                                                                                           |
| UX-IMPL-017 | Mobile external dev auth                             | `apps/web AppTopBar`, `/auth/login`, `/auth/register`, `/api/v1/*`                                                                                                            | v0.3   | PARTIAL     | Topbar search стал единым контролом с вросшей кнопкой submit; auth forms защищены от injected attributes; web API calls идут через same-origin proxy, чтобы телефон не обращался к своему `localhost`.                                                                                                                                                                                                                                                        |
| UX-IMPL-018 | Главная маркетплейса вместо лендинга                 | `apps/web /marketplace`                                                                                                                                                       | v0.3   | IMPLEMENTED | `/marketplace` стал мобильной главной маркетплейса: первый экран, поиск, объясняющие плашки, горизонтальные ленты товаров, подборки авторов, блоки категорий, блок доверия и нижняя лента товаров.                                                                                                                                                                                                                                                            |
| UX-IMPL-019 | Главная без redirect и мягкие empty states           | `apps/web /`, `/marketplace`, `infra/scripts/seed-dev.*`                                                                                                                      | v0.3   | IMPLEMENTED | `/` рендерит ту же витрину без redirect; marketplace hero убрал внутренний поиск/CRM-фильтры и Apply CTA; empty state получил действия; dev seed создаёт опубликованные товары.                                                                                                                                                                                                                                                                               |
| UX-IMPL-020 | Компактная creator-commerce витрина marketplace      | `apps/web /marketplace`, `apps/web /`                                                                                                                                         | v0.3.5 | IMPLEMENTED | `/marketplace` сокращён до витринной структуры: hero, быстрый поиск и категории, хит в витринах авторов, популярные товары, подборки авторов, блок пользы для трёх аудиторий, компактный SafeDeal, общий CTA и короткий FAQ. Полноценные лендинги стримеров/продавцов и расширенный SafeDeal не встраиваются в эту страницу.                                                                                                                                  |
| UX-IMPL-021 | Полировка компактной marketplace-витрины             | `apps/web /marketplace`, `apps/web /`                                                                                                                                         | v0.3.5 | IMPLEMENTED | Hero стал ниже и получил заголовок "Цифровые товары, которые поддерживают авторов"; поиск и категории разведены разными заголовками; product media получил категорийные cover templates; авторские подборки сокращены до двух компактных блоков; SafeDeal и final CTA оставлены в коротком витринном формате.                                                                                                                                                 |
| UX-IMPL-022 | Плотная маркет-витрина marketplace                   | `apps/web /marketplace`, `apps/web /`                                                                                                                                         | v0.3.5 | IMPLEMENTED | `/marketplace` переведён из compact landing в магазинную витрину: compact hero, рабочий поиск, 6 коротких категорий, "Популярно сейчас" выше "Хит в витринах авторов", добавлены полки новых товаров, OBS/алертов, игровых услуг и дизайна, а большие SafeDeal/FAQ/final CTA/role-value секции заменены trust-полосой.                                                                                                                                        |
| UX-IMPL-023 | Авторы в верхнем ритме marketplace                   | `apps/web /marketplace`, `apps/web /`                                                                                                                                         | v0.3.5 | IMPLEMENTED | После поиска добавлена полка "Популярные авторы", "Быстрые направления" опущены ниже "Хит в витринах авторов", product media больше не рендерит фейковые псевдо-скриншоты, карточки поддерживают будущие seller cover URL и показывают нейтральный градиент с category label, а категории получили единые outline SVG.                                                                                                                                        |
| UX-IMPL-024 | Marketplace без дублирующего поиска и шумных CTA     | `apps/web /marketplace`, `apps/web /`, `AppTopBar`                                                                                                                            | v0.3.5 | IMPLEMENTED | Второй большой поиск убран с `/marketplace`; hero "Найти автора" переводит topbar search в режим авторов; обычные карточки товаров открываются целиком без кнопки "Подробнее"; авторские CTA отделены от бейджей; хит показывает множественные витрины авторов.                                                                                                                                                                                               |
| UX-IMPL-025 | Честная навигация marketplace                        | `apps/web /marketplace`, `/marketplace/catalog`, `/marketplace/categories`, `/marketplace/category/[slug]`, `/marketplace/promocodes`, `/creators`, `/safe-deal`, `AppTopBar` | v0.3.5 | IMPLEMENTED | Быстрые направления на главной стали ссылками на страницы, а не скрытыми фильтрами/якорями; topbar search ведёт товары в каталог и авторов в `/creators`; hero copy возвращён к понятной формуле; featured-блок "Популярно в витринах авторов" открывает товар или список авторов; справа от хита больше нет объясняющей статьи; вместо trust-лендинга добавлен компактный блок "Как покупка поддерживает автора".                                            |
| UX-IMPL-026 | Creator-commerce механика в центре marketplace       | `apps/web /marketplace`, `apps/web /`, `AppTopBar`                                                                                                                            | v0.3.5 | IMPLEMENTED | Hero снова получил большой единый поиск с подсказками и demo покупки через витрину автора; topbar search на desktop скрыт до прокрутки ниже hero; блок "Покупка может быть поддержкой" поднят сразу после hero; категории расширены до 8 направлений; featured-блок показывает товар + авторов/промокоды; "Подборки авторов" переименованы в "Витрины авторов"; добавлены компактные блоки для авторов, продавцов, безопасности и финального выбора действия. |
| UX-IMPL-027 | Иерархия creator-commerce витрины `/marketplace`     | `apps/web /marketplace`, `apps/web /`, i18n                                                                                                                                   | v0.3.5 | IMPLEMENTED | Hero усилен крупнее и чище, быстрые направления стали тихой строкой под поиском, блок поддержки получил цепочку "Товар → Автор → Поддержка", категории получили примеры, product media — разные category preview для пустых cover slots, featured-блок явно говорит "Этот товар добавили 14 авторов", первая витрина автора стала featured, а safety cards переписаны простым пользовательским языком.                                                        |
| UX-IMPL-028 | Search-first creator-commerce система `/marketplace` | `apps/web /marketplace`, `apps/web /`, `AppTopBar`, i18n                                                                                                                      | v0.3.5 | IMPLEMENTED | Итерация UX-TASK-027 закрепила единый header 64px, убрала абстрактные фигуры категорий, стабилизировала product/category grids, сделала featured-блок цельным proof-module, усилила role sections и safety как разные визуальные паттерны.                                                                                                                                                                                                                    |
| UX-IMPL-029 | Product-discovery порядок `/marketplace`             | `apps/web /marketplace`, `apps/web /`, i18n                                                                                                                                   | v0.3.5 | IMPLEMENTED | Итерация UX-TASK-028 подняла товарные сценарии выше: compact flow вместо большой объясняющей секции, быстрый товарный вход с категориями и "Сейчас покупают", ранние компактные подборки авторов, затем proof-module и популярные товары.                                                                                                                                                                                                                     |

## Реализовано частично

| ID             | Что реализовано частично       | Где                               | Статус       | Нужно сделать                                                   |
| -------------- | ------------------------------ | --------------------------------- | ------------ | --------------------------------------------------------------- |
| UX-PARTIAL-001 | Mini Studio внутри профиля     | `/me/profile`                     | NEEDS_REWORK | Вынести в `/studio/*`.                                          |
| UX-PARTIAL-002 | Seller settings внутри профиля | `/me/profile`                     | NEEDS_REWORK | Вынести в `/seller/settings`.                                   |
| UX-PARTIAL-003 | Donation goals UI              | `/me/profile`, `/creators/[slug]` | PARTIAL      | Добавить отдельную `/studio/goals`, empty/loading/error states. |
| UX-PARTIAL-004 | Widget token UI                | `/me/profile`, `apps/widget`      | PARTIAL      | Добавить `/studio/widgets`, preview и token state.              |
| UX-PARTIAL-005 | Admin user/product moderation  | `apps/admin`                      | PARTIAL      | Filters, details, audit link и отдельные admin routes.          |

## Нужно обновить

| ID            | Что обновить                                                       | Затрагивает                                                                                                                                                                          | Приоритет | Связанные задачи                                                  |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------- |
| UX-UPDATE-001 | Разделить `/me/profile` на account/settings и role dashboards      | PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD, PAGE-SELLER-DASHBOARD                                                                                                      | P0        | UX-TASK-007, UX-TASK-013                                          |
| UX-UPDATE-002 | Добавить стандартные loading/empty/error states                    | Current web/admin/widget pages                                                                                                                                                       | P1        | UX-TASK-008, частично закрыто для web/admin                       |
| UX-UPDATE-003 | Привести главную к расширенному spec v0.3                          | PAGE-HOME                                                                                                                                                                            | P1        | UX-TASK-004, закрыто                                              |
| UX-UPDATE-004 | Привести creator page к spec и решить отдельный donate route       | PAGE-CREATOR-PUBLIC, PAGE-CREATOR-DONATE                                                                                                                                             | P0        | UX-TASK-005, states закрыты; отдельный donate route не создавался |
| UX-UPDATE-005 | Подготовить marketplace IA/spec к реализации                       | PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT                                                                                                                                        | P0        | UX-TASK-006, закрыто реализацией v0.3                             |
| UX-UPDATE-006 | Проверить mobile UX текущих страниц                                | Current web/admin/widget                                                                                                                                                             | P1        | UX-TASK-010                                                       |
| UX-UPDATE-007 | Обновить UX writing и i18n для новых states                        | All current/planned pages                                                                                                                                                            | P1        | UX-TASK-009                                                       |
| UX-UPDATE-008 | Подготовить v0.3.5 user profile hub                                | PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-ME-FAVORITES, PAGE-ME-REVIEWS, PAGE-ME-COLLECTIONS                                                                                           | P0        | FF-0352, FF-0353                                                  |
| UX-UPDATE-009 | Подготовить live-only creator store и Studio store settings        | PAGE-STUDIO-STORE, PAGE-CREATOR-STORE                                                                                                                                                | P0        | FF-0354                                                           |
| UX-UPDATE-010 | Подготовить widget rules и widget groups                           | PAGE-STUDIO-WIDGETS, PAGE-STUDIO-WIDGET-GROUPS, PAGE-WIDGET-PURCHASE                                                                                                                 | P0        | FF-0355, FF-0356                                                  |
| UX-UPDATE-011 | Подготовить Studio shell, статистику и события                     | PAGE-STUDIO-DASHBOARD, PAGE-STUDIO-STATISTICS, PAGE-STUDIO-EVENTS                                                                                                                    | P0        | FF-0357, FF-0358                                                  |
| UX-UPDATE-012 | Подготовить настройки донатов                                      | PAGE-STUDIO-DONATION-SETTINGS, PAGE-CREATOR-DONATE, PAGE-WIDGET-ALERT                                                                                                                | P0        | FF-0359                                                           |
| UX-UPDATE-013 | Подготовить продукты, подборки и каталог виджетов Studio           | PAGE-STUDIO-PRODUCTS, PAGE-STUDIO-COLLECTIONS, PAGE-STUDIO-WIDGETS                                                                                                                   | P0        | FF-0360, FF-0361                                                  |
| UX-UPDATE-014 | Обновить текущий дизайн под FanFuel Aurora до новых v0.3.5 страниц | PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ME-PROFILE, PAGE-CREATOR-PUBLIC, PAGE-ADMIN-DASHBOARD, PAGE-WIDGET-ALERT | P0        | FF-0348, FF-0349, FF-0350                                         |
| UX-UPDATE-015 | Закрепить marketplace-first контракт главной                       | PAGE-HOME, PAGE-MARKETPLACE                                                                                                                                                          | P0        | UX-TASK-036; блокер широких изменений главной                     |
| UX-UPDATE-016 | Выбрать живой визуальный язык вместо generic corporate UI          | Public/product/dashboard surfaces                                                                                                                                                    | P1        | UX-TASK-037; только после product review UX-TASK-036              |
| UX-UPDATE-017 | Прототипировать контекстного маскота без экономики                 | CMP-MASCOT, selected public states                                                                                                                                                   | P1        | UX-TASK-038; после UX-TASK-037                                    |
| UX-UPDATE-018 | Провести discovery FanFuel World                                   | PAGE-WORLD-HOME                                                                                                                                                                      | P2        | UX-TASK-039; FUTURE, production DO_NOT_BUILD_YET                  |

## Нужно спроектировать

| ID            | Что спроектировать                   | Версия    | Статус         | Комментарий                                                          |
| ------------- | ------------------------------------ | --------- | -------------- | -------------------------------------------------------------------- |
| UX-DESIGN-001 | RoleSwitcher и multi-role navigation | v0.3      | PLANNED        | См. `docs/INFORMATION_ARCHITECTURE.md`.                              |
| UX-DESIGN-002 | Dashboard layout pattern             | v0.3      | PLANNED        | Buyer/Studio/Seller/Admin.                                           |
| UX-DESIGN-003 | Marketplace product card             | v0.3      | PLANNED        | Цена, продавец, safe deal, attribution.                              |
| UX-DESIGN-004 | Checkout status model                | v0.3/v0.5 | PAYMENT_REVIEW | Не смешивать order/payment/deal.                                     |
| UX-DESIGN-005 | Admin moderation queues              | v0.3      | PLANNED        | Products, sellers, streamers.                                        |
| UX-DESIGN-006 | Dispute UX                           | v0.7      | FUTURE         | LEGAL_REVIEW_REQUIRED.                                               |
| UX-DESIGN-007 | Payout UX                            | v0.6      | PAYMENT_REVIEW | Balance language and provider review.                                |
| UX-DESIGN-008 | Skin-ready UI presets                | v0.3.5    | PLANNED        | Semantic tokens only, no arbitrary CSS.                              |
| UX-DESIGN-009 | User collections                     | v0.3.5    | PLANNED        | Any user can create collections.                                     |
| UX-DESIGN-010 | OBS widget groups                    | v0.3.5    | PLANNED        | Placement zones, not scene editor.                                   |
| UX-DESIGN-011 | Studio statistics and events         | v0.3.5    | PLANNED        | Chart filters, event feed and no fake metrics.                       |
| UX-DESIGN-012 | Donation settings controls           | v0.3.5    | PLANNED        | Amounts, message limits, audio/TTS, moderation and spam-filter.      |
| UX-DESIGN-013 | Bot integration states               | v0.3.5    | PLANNED        | YouTube/Twitch/Telegram connection status, error and revoked states. |

## Не создавать сейчас

| ID         | Что не создавать                        | Статус           | Причина                                                                                            |
| ---------- | --------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| UX-DNB-001 | Native iOS/Android apps                 | DO_NOT_BUILD_YET | Только после web/PWA и v1.0.                                                                       |
| UX-DNB-002 | Drag-and-drop редактор страниц стримера | DO_NOT_BUILD_YET | Высокая сложность, не v0.3.5 scope.                                                                |
| UX-DNB-003 | Сложная рекламная биржа                 | DO_NOT_BUILD_YET | Не соответствует v0.3-v0.4 scope.                                                                  |
| UX-DNB-004 | ML-рекомендации                         | DO_NOT_BUILD_YET | Нет данных и не MVP.                                                                               |
| UX-DNB-005 | Реальные выплаты UI                     | DO_NOT_BUILD_YET | До v0.6 payment/legal review.                                                                      |
| UX-DNB-006 | Dispute/arbitration UI                  | DO_NOT_BUILD_YET | До v0.7 domain/legal.                                                                              |
| UX-DNB-007 | Risky categories                        | DO_NOT_BUILD_YET | Legal/payment review required.                                                                     |
| UX-DNB-008 | Произвольный CSS/HTML для скинов        | DO_NOT_BUILD_YET | `v0.3.5` допускает только safe presets.                                                            |
| UX-DNB-009 | Production bot secrets/OAuth в UI       | DO_NOT_BUILD_YET | Боты YouTube/Twitch/Telegram требуют backend storage, platform/security review и masked status UI. |
| UX-DNB-010 | Статистика как доступный баланс         | DO_NOT_BUILD_YET | До wallet/ledger/payout этапов график является аналитикой, а не деньгами к выводу.                 |

## Заблокировано

| ID             | Блок                     | Причина                       | Разблокировка                                         |
| -------------- | ------------------------ | ----------------------------- | ----------------------------------------------------- |
| UX-BLOCKED-001 | Password reset UI        | Нет backend reset token flow  | Реализовать безопасный backend flow.                  |
| UX-BLOCKED-002 | Phone/username auth      | Нет identifier/recovery model | Спроектировать уникальность, verification и recovery. |
| UX-BLOCKED-003 | Real payment checkout UI | Нет real provider review      | v0.5 provider/legal review.                           |
| UX-BLOCKED-004 | Payout screens           | Нет wallet/payout domain      | v0.6 ledger/payout tasks.                             |

## Требует юридической проверки

| ID           | Область                         | Комментарий                         |
| ------------ | ------------------------------- | ----------------------------------- |
| UX-LEGAL-001 | Safe deal wording               | Не обещать абсолютную гарантию.     |
| UX-LEGAL-002 | Refund policy for digital goods | Нужен legal review до disputes.     |
| UX-LEGAL-003 | Seller Pro data collection      | Состав данных должен быть проверен. |
| UX-LEGAL-004 | Tax wording for sellers         | Не заменять консультацию.           |
| UX-LEGAL-005 | Privacy/Terms placeholders      | Только placeholders до review.      |

## Требует платёжной проверки

| ID         | Область                    | Комментарий                            |
| ---------- | -------------------------- | -------------------------------------- |
| UX-PAY-001 | Real payment provider flow | Нельзя хардкодить provider.            |
| UX-PAY-002 | Safe deal hold/capture     | Зависит от provider capabilities.      |
| UX-PAY-003 | Payout lifecycle           | Нужен PayoutProvider и ledger.         |
| UX-PAY-004 | Commission display         | Показывать только утверждённую модель. |
| UX-PAY-005 | Fiscalization copy         | LEGAL_REVIEW_REQUIRED.                 |

## Требует дизайн-проверки

| ID                   | Область                       | Комментарий                            |
| -------------------- | ----------------------------- | -------------------------------------- |
| UX-DESIGN-REVIEW-001 | ThemeSwitcher icons           | Сейчас текстовые `OS/LT/DK`.           |
| UX-DESIGN-REVIEW-002 | Creator page visual hierarchy | Нужны avatar/banner/media assets.      |
| UX-DESIGN-REVIEW-003 | Dashboard density             | Проверить, что panels не декоративные. |
| UX-DESIGN-REVIEW-004 | Mobile long Russian strings   | Нужны screenshots.                     |

## Последние изменения логики

## CHANGE-2026-05-15-001: План v0.3.5 Universal Profile + Studio Skins

Статус: PARTIAL
Затрагивает: PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-ME-FAVORITES, PAGE-ME-REVIEWS, PAGE-ME-COLLECTIONS, PAGE-STUDIO-STORE, PAGE-CREATOR-STORE, PAGE-STUDIO-WIDGETS, PAGE-STUDIO-WIDGET-GROUPS, PAGE-WIDGET-PURCHASE
Версия: v0.3.5
Приоритет: P0
Автор записи: Codex

### Новая логика

`v0.3.5` становится промежуточным этапом перед `v0.4`: профиль пользователя отделяется от Studio/Seller настроек; пользователи получают избранное, отзывы и подборки; авторы получают Studio store settings, live-only витрину, widget trigger rules и группы виджетов; skin-ready UI строится только через semantic tokens и schema-validated presets.

### Что нужно изменить

Обновить API/domain implementation tasks, добавить i18n keys, провести visual QA на `ru`/`en`, light/dark, 320/390/768/1440, и не начинать `v0.4` attribution/promocode layer до фиксации результатов `v0.3.5`.

### Что не нужно трогать

Не добавлять real payments, payouts, refunds, ledger, disputes, arbitrary CSS/HTML skins, drag-and-drop редактор страниц или production stream integrations.

### Какие страницы затрагивает

Профиль пользователя, settings, favorites, reviews, collections, Studio store, public creator store, Studio widgets, widget groups, purchase alert widget.

### Какие компоненты затрагивает

`SkinPreview`, `CollectionCard`, `WidgetPreviewContainer`, `WidgetGroupPreview`, `RoleSwitcher`, `ProductCard`, `Badge`, `EmptyState`, `Skeleton`.

### Acceptance criteria

- Профиль пользователя не является настройкой страницы стримера.
- Live-only секции витрины видны только при активной трансляции.
- Widget rules покрывают товар, группу товаров, подборку, purchase event и сумму доната.
- Widget groups поддерживают placement zones без публичного редактирования.
- Скины не меняют структуру страниц и не ломают i18n.

## CHANGE-2026-05-09-001: UI/UX source of truth

Статус: IMPLEMENTED
Затрагивает: `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`, `docs/UI_STATES.md`, `docs/UX_WRITING.md`, `docs/DO_NOT_BUILD_YET.md`
Версия: v0.2 planning, v0.3 preparation
Приоритет: P0
Автор записи: Codex

### Новая логика

Создана документационная система UI/UX статусов: страницы, сценарии, компоненты, долги, future/blocked items.

### Что нужно изменить

Перед интерфейсными задачами агенты должны сверяться с tracker/spec/status и не создавать future pages.

### Что не нужно трогать

Не создавать production pages для v0.4+ без отдельной задачи.

### Какие страницы затрагивает

Все страницы из `docs/PAGE_MAP.md`.

### Какие компоненты затрагивает

Все компоненты из таблицы компонентов `docs/UI_UX_TRACKER.md`.

### Acceptance criteria

- Для текущих pages есть статусы.
- Для будущих pages есть `FUTURE`/`DO_NOT_BUILD_YET`.
- Для ручного добавления логики есть шаблон ниже.

### Комментарии для агента

Если задача просит "сделать страницу", сначала проверьте, не стоит ли у неё `FUTURE`, `PAYMENT_REVIEW`, `LEGAL_REVIEW` или `DO_NOT_BUILD_YET`.

## CHANGE-2026-05-09-002: Marketplace MVP UI

Статус: IMPLEMENTED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-BUYER-ORDER, PAGE-SELLER-DASHBOARD, PAGE-SELLER-PRODUCTS, PAGE-SELLER-PRODUCT-NEW, PAGE-SELLER-ORDERS, PAGE-ADMIN-PRODUCTS
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Добавлен data-driven marketplace UI поверх v0.3 API: каталог, товар, checkout, buyer/seller кабинеты, order timeline, seller actions, review и product moderation.

### Что нужно изменить

Дальше нужно вынести Studio goals/widgets из `/me/profile` и провести screenshot QA для light/dark/mobile.

### Что не нужно трогать

Не создавать disputes, payouts, real payment checkout и risky categories до соответствующих review.

### Какие страницы затрагивает

См. список PAGE-ID выше.

### Какие компоненты затрагивает

`ProductCard`, `Badge`, `EmptyState`, `Skeleton`, `Alert`, `StatCard`, `DealTimeline`, dashboard/list patterns.

### Acceptance criteria

- UI использует i18n и semantic tokens.
- Mock safe deal не выдаётся за production legal/payment модель.
- Buyer/seller/admin next actions видны без fake data.

### Комментарии для агента

`PAGE-ADMIN-PRODUCTS` реализована как вкладка root admin app, а не отдельный route.

## CHANGE-2026-05-10-001: Практический дизайн текущих страниц

Статус: IMPLEMENTED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ADMIN-DASHBOARD, PAGE-WIDGET-ALERT
Версия: v0.3
Приоритет: P1
Автор записи: Codex

### Новая логика

Добавлен практический UI pass для текущих страниц: мобильная навигация больше не исчезает полностью, главная получила быстрые входы по ролям, карточки/панели/списки стали плотнее и стабильнее, admin rows и widget alert стали лучше сканироваться.

### Что нужно изменить

Дальше нужен screenshot QA для 320/390/768/1440 и ручная проверка light/dark на текущем docker stack.

### Что не нужно трогать

Не создавать future pages, real payment UI, payouts, disputes, creator store и risky categories в рамках этого pass.

### Какие страницы затрагивает

Текущие web/admin/widget страницы, без новых routes.

### Какие компоненты затрагивает

`AppTopBar`, homepage role entries, global card/list/form styles, admin table rows, widget alert surface.

### Acceptance criteria

- Новые строки добавлены в `ru` и `en` словари.
- Цвета остаются на semantic tokens.
- Mobile navigation остаётся доступной.
- Сборка web/admin/widget проходит.

### Комментарии для агента

Это визуальный слой без изменения доменной логики и API.

## CHANGE-2026-05-11-001: Marketplace-first вход и auth topbar

Статус: IMPLEMENTED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS, PAGE-FOR-STREAMERS, PAGE-FOR-SELLERS, PAGE-AUTH-LOGIN, CMP-TOPBAR
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Корневой route `/` стал marketplace-first входом: сейчас он рендерит ту же витрину, что и `/marketplace`, без redirect. Вход и регистрация после успешной авторизации ведут в marketplace, а `/auth/login` и `/auth/register` перенаправляют уже авторизованного пользователя. Topbar показывает auth-links только гостю и профиль только авторизованному пользователю.

### Что нужно изменить

Провести browser screenshot QA для `/marketplace`, `/auth/login`, `/for-buyers`, `/for-streamers`, `/for-sellers` на mobile/light/dark.

### Что не нужно трогать

Не добавлять payouts, disputes, real payment UI, creator store и risky categories в рамках этого изменения.

### Какие страницы затрагивает

PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS, PAGE-FOR-STREAMERS, PAGE-FOR-SELLERS, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER.

### Какие компоненты затрагивает

`AppTopBar`, auth form layout, public role landing pattern, marketplace benefits block.

### Acceptance criteria

- `/` ведёт в marketplace.
- Auth topbar не показывает профиль гостю и не показывает вход/регистрацию авторизованному пользователю.
- Вход выглядит компактно и центрирован по ширине.
- Новые тексты добавлены в `ru` и `en`.

### Комментарии для агента

Проверки должны учитывать, что Git в рабочей папке может быть не инициализирован.

## CHANGE-2026-05-11-002: Authenticated topbar account menu

Статус: IMPLEMENTED
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Для авторизованного пользователя верхняя панель работает как compact marketplace shell: логотип ведёт в marketplace, поиск отправляет запрос в `/marketplace?query=...`, справа есть notification placeholder и меню аккаунта с профилем, покупками, продажами при seller role, настройками, темой, языком и выходом.

### Что нужно изменить

Позже добавить настоящий notification flow, локализацию locale switch через preferences и полноценный RoleSwitcher/dashboard IA по `UX-TASK-007`.

### Что не нужно трогать

Не показывать fake balance, не создавать real payouts UI, disputes, messages route или future finance pages до их review/status update.

### Какие страницы затрагивает

Все web-страницы с `AppTopBar`, особенно `/marketplace`.

### Какие компоненты затрагивает

`AppTopBar`, theme/language controls внутри account menu, authenticated topbar search.

### Acceptance criteria

- Вошедший пользователь видит поиск, notification placeholder и меню аккаунта вместо публичных auth-links.
- Поиск из topbar ведёт в marketplace query.
- Меню не уезжает за экран на mobile.
- Пункты без готового домена не ведут на future routes и не показывают fake money.

### Комментарии для агента

Финансовый пункт в меню оставлен disabled с review hint, потому что wallet/payout UI заблокирован до provider/legal review.

## CHANGE-2026-05-11-003: Compact mobile account menu

Статус: IMPLEMENTED
Затрагивает: CMP-TOPBAR, PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD, UX-TASK-007
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Authenticated topbar на mobile остаётся в одну строку: логотип, поиск, уведомления и меню. Account dropdown разделён на категории, подпункты имеют отступ, а theme/language controls открываются отдельными overlay-dropdown поверх меню, чтобы список не растягивался внутри account menu.

### Что нужно изменить

Реализовать отдельные `/me/settings` и `/studio` в рамках `UX-TASK-007`; сейчас пункты меню помечены как "скоро" и не ведут на future routes.

### Что не нужно трогать

Не создавать пустые pages для settings/studio без полноценного spec/данных, не включать finance/payout UI до review.

### Какие страницы затрагивает

PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD.

### Какие компоненты затрагивает

`AppTopBar`, authenticated account menu, topbar search.

### Acceptance criteria

- Mobile auth topbar остаётся одной строкой на 390px.
- Theme/language dropdown открываются поверх account menu и не ломают mobile layout.
- Profile, settings и Studio разделены в навигации и docs.
- Future пункты честно помечены как "скоро".

### Комментарии для агента

`/me/profile` остаётся текущим fallback, но не должен получать новые Studio/settings flows.

## CHANGE-2026-05-11-004: Guest topbar dropdown menu

Статус: IMPLEMENTED
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Гостевая верхняя панель стала ближе к залогиненной структуре: логотип ведёт в marketplace, поиск доступен сразу в topbar, справа открывается dropdown menu с входом, регистрацией, публичными разделами, темой и языком. Покупки для гостя не добавляются в меню, потому что доступ к гостевому заказу должен идти по ссылке из письма.

### Что нужно изменить

Провести screenshot QA для guest/auth topbar на 320/390/768/1440 и проверить, что длинный placeholder заменяется на компактный "Поиск" на mobile.

### Что не нужно трогать

Не создавать историю покупок гостя, аккаунтные страницы для гостя, notification flow, messages, finance/payout или real payment UI.

### Какие страницы затрагивает

PAGE-MARKETPLACE и все web-страницы с `AppTopBar`.

### Какие компоненты затрагивает

`AppTopBar`, guest dropdown menu, topbar search, theme/language overlay-dropdown.

### Acceptance criteria

- Гость видит поиск, кнопку меню, вход и регистрацию в dropdown.
- В гостевом меню нет пункта покупок.
- Theme и language controls работают тем же overlay-паттерном, что в account menu.
- Topbar остаётся одной строкой на mobile.
- Новые строки добавлены в `ru` и `en`.

### Комментарии для агента

Topbar search ведёт в `/marketplace?query=...`; расширение поиска по авторам/категориям должно делаться отдельной API/marketplace задачей, если backend ещё ищет только товары.

## CHANGE-2026-05-11-005: Topbar search polish и hydration guard

Статус: IMPLEMENTED
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Topbar search больше не сокращает placeholder только по mobile breakpoint. Компонент измеряет фактическую доступную ширину input и оставляет "Найти товар, услугу или автора", если строка помещается; компактное "Поиск" используется только при реальной нехватке места. Search button выровнен как inset-кнопка с одинаковыми отступами сверху, справа и снизу. Для topbar и marketplace form controls добавлен точечный hydration guard от внешних browser-injected attributes вроде `__gcruniqueid`.

### Что нужно изменить

Провести ручную проверку на реальном iOS Safari без dev overlay и с включёнными пользовательскими расширениями.

### Что не нужно трогать

Не расширять backend search по авторам/категориям в рамках этого polish-pass; это отдельная marketplace/API задача.

### Какие страницы затрагивает

PAGE-MARKETPLACE и все web-страницы с `AppTopBar`.

### Какие компоненты затрагивает

`AppTopBar`, topbar search, marketplace toolbar form controls.

### Acceptance criteria

- На 390px длинный placeholder остаётся, если он помещается.
- Кнопка поиска имеет одинаковые inset-отступы сверху, справа и снизу.
- Внешние injected attributes на form/input/select не вызывают blocking hydration overlay в dev.

## CHANGE-2026-05-11-006: Topbar search как единый control и mobile API proxy

Статус: IMPLEMENTED
Затрагивает: CMP-TOPBAR, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Topbar search визуально работает как один control: поле имеет ту же высоту, что соседние topbar-кнопки, а кнопка поиска встроена правым сегментом с разделителем, по смыслу как YouTube search submit.

На auth forms добавлен точечный hydration guard от внешних browser-injected attributes. Browser API calls в web по умолчанию идут на same-origin `/api/v1/*`; Next.js route proxy серверно прокидывает их к Go API, чтобы мобильный браузер на внешнем dev-домене не обращался к своему `localhost:8080`.

### Acceptance criteria

- Search field и соседние topbar buttons имеют одинаковую высоту на desktop и mobile.
- Search submit выглядит частью поля, а не отдельной маленькой кнопкой внутри.
- `/auth/login` и `/auth/register` не показывают hydration overlay из-за `__gcruniqueid`/похожих injected attributes.
- С телефона через `danechka.com:3002` web auth/API calls работают без прямого проброса API-порта на телефон, если Go API доступен машине с Next.js.

### Комментарии для агента

Hydration guard не должен использоваться как общий способ скрывать реальные SSR/client расхождения; здесь он ограничен контролами, куда браузер/расширение добавляет сторонний атрибут до React hydration.

## CHANGE-2026-05-11-007: Главная маркетплейса как витрина товаров

Статус: IMPLEMENTED
Затрагивает: PAGE-MARKETPLACE, PAGE-HOME, FLOW-BUYER-HOME, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Главные точки входа `/` и `/marketplace` больше не выглядят как текстовый лендинг: первый экран показывает короткий торговый hero без внутренней search-form, быстрые категории, объяснения Safe deal/промокодов/проверенных продавцов, витринную карточку товара и начало товарной ленты.

### Что нужно изменить

Провести screenshot QA на 320/390/768/1440 в light/dark и при пустом marketplace API проверить, что пустое состояние остаётся честным и не показывает фиктивные товары.

### Что не нужно трогать

Не создавать future routes `/creators`, creator store, promo pages, real safe deal page, real payment UI, payouts, disputes или risky categories без обновления статусов и review.

### Какие страницы затрагивает

PAGE-MARKETPLACE и корневой PAGE-HOME как один marketplace screen без redirect.

### Какие компоненты затрагивает

`ProductCard`, marketplace filters, product shelf pattern, category action blocks, trust cards.

### Acceptance criteria

- На первом экране видны покупка цифровых товаров, поддержка авторов, safe deal и следующие действия.
- Товары в лентах берутся из API; при отсутствии товаров показывается empty state.
- User-facing строки добавлены в `ru` и `en`.
- Цвета используют semantic tokens и работают в light/dark.

## CHANGE-2026-05-12-001: Главная marketplace без redirect и CRM-фильтров

Статус: IMPLEMENTED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, FLOW-BUYER-HOME, FLOW-BUYER-SEARCH
Версия: v0.3
Приоритет: P0
Автор записи: Codex

### Новая логика

Корневой route `/` рендерит тот же marketplace screen, что и `/marketplace`, без HTTP/client redirect. Внутренний hero-блок поиска на marketplace убран: поиск остаётся в topbar, а первый экран показывает CTA, быстрые категории, витринную карточку товара и компактный блок ролей.

### Что нужно изменить

Провести screenshot QA на 320/390/768/1440 в light/dark после запуска dev seed, отдельно проверить пустую БД без seed и отсутствие горизонтального overflow.

### Что не нужно трогать

Не добавлять fake products во frontend и не открывать risky categories без legal/payment review.

### Какие страницы затрагивает

PAGE-HOME и PAGE-MARKETPLACE.

### Какие компоненты затрагивает

`AppTopBar`, marketplace hero, product shelves, empty state, dev seed scripts.

### Acceptance criteria

- `/` открывает marketplace-витрину без смены URL.
- На первом экране нет кнопки "Применить", нет внутренней кнопки "Искать" и нет hero CTA, выглядящих как переход на отдельные страницы.
- `LEGAL_REVIEW_REQUIRED` не выводится в публичном marketplace UI.
- Empty state предлагает "Стать продавцом" и "Все категории".
- Dev seed scripts создают опубликованные товары идемпотентно.

## CHANGE-2026-05-15-002: Расширение Studio v0.3.5

Статус: PLANNED
Затрагивает: PAGE-STUDIO-DASHBOARD, PAGE-STUDIO-STATISTICS, PAGE-STUDIO-EVENTS, PAGE-STUDIO-DONATION-SETTINGS, PAGE-STUDIO-STORE, PAGE-STUDIO-WIDGETS, PAGE-STUDIO-PRODUCTS, PAGE-STUDIO-COLLECTIONS
Версия: v0.3.5
Приоритет: P0
Автор записи: Codex

### Новая логика

Studio в `v0.3.5` планируется как полноценный кабинет автора с вкладками: статистика, последние события, настройка донатов, витрина автора, виджеты, продукты и подборки. Статистика показывает график дохода по источникам, события включают донаты, channel subscriptions через ботов и партнёрские покупки, а донаты получают настройки сумм, сообщений, audio/TTS, модерации и spam-filter.

### Что нужно изменить

Добавить Studio shell, новые routes/specs, API для statistics/events/channel integrations/donation settings/products/collections/widget presets и domain entities `CreatorMetricSnapshot`, `CreatorActivityEvent`, `CreatorChannelIntegration`, `CreatorDonationSettings`, `WidgetPreset`.

### Что не нужно трогать

Не делать payout/balance UI, real provider integrations, arbitrary widget code, production bot secrets в frontend или fake analytics.

### Какие страницы затрагивает

PAGE-STUDIO-DASHBOARD, PAGE-STUDIO-STATISTICS, PAGE-STUDIO-EVENTS, PAGE-STUDIO-DONATION-SETTINGS, PAGE-STUDIO-STORE, PAGE-STUDIO-WIDGETS, PAGE-STUDIO-WIDGET-GROUPS, PAGE-STUDIO-PRODUCTS, PAGE-STUDIO-COLLECTIONS.

### Какие компоненты затрагивает

`StudioTabs`, `EarningsSourceChart`, `ActivityEventFeed`, `DonationSettingsPanel`, `WidgetCatalog`, `WidgetPreviewContainer`, `WidgetGroupPreview`.

### Acceptance criteria

- Studio не возвращается в `/me/profile`.
- График дохода не называется балансом и строится только по реальным source events.
- Bot integrations показывают masked status и не раскрывают secrets.
- Donation settings применяются до публикации OBS alerts.
- Products/collections связаны с витриной и не обходят product moderation.

## CHANGE-2026-05-16-001: FanFuel Aurora как первый шаг v0.3.5

Статус: PLANNED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ME-PROFILE, PAGE-CREATOR-PUBLIC, PAGE-ADMIN-DASHBOARD, PAGE-WIDGET-ALERT, CMP-TOPBAR, CMP-PRODUCT-CARD, CMP-SKIN-PREVIEW
Версия: v0.3.5
Приоритет: P0
Автор записи: Codex

### Новая логика

Перед созданием новых страниц `v0.3.5` нужно обновить уже существующий дизайн под FanFuel Aurora. Цель — уйти от доминирующего orange/black визуала и закрепить creator-commerce образ: deep navy/graphite, violet/cyan primary, emerald support, warm/orange только для редких статусных акцентов, дозированный glass и живые product media.

### Что нужно изменить

Сначала зафиксировать Aurora tokens и material rules, затем обновить shared UI primitives и текущие public/marketplace/account/dashboard/widget поверхности. После этого новые задачи профиля, Studio, витрины и виджетов должны использовать уже обновлённую базу.

### Что не нужно трогать

Не делать произвольные CSS/HTML скины, не копировать Apple Liquid Glass, не добавлять glass на все карточки и таблицы, не возвращать orange как primary CTA/logo/hero одновременно, не строить новые future routes в рамках визуального pass.

### Какие страницы затрагивает

PAGE-HOME, PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT, PAGE-BUYER-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ME-PROFILE, PAGE-CREATOR-PUBLIC, PAGE-ADMIN-DASHBOARD, PAGE-WIDGET-ALERT.

### Какие компоненты затрагивает

`TopBar`, `Button`, `Badge`, `Tabs`, `ProductCard`, `Card`, `Panel`, `DashboardPanel`, `WidgetPreviewContainer`, `ThemeSwitcher`, будущий `SkinPreview`.

### Acceptance criteria

- Orange/warm не является primary brand и не доминирует на первом экране.
- Glass используется только на allowlisted слоях и проходит contrast QA.
- Существующие страницы работают в `ru`/`en`, light/dark и mobile 320/390 без поломки структуры.
- Product cards имеют стабильную сетку, понятные media slots и не выглядят как пустые заглушки.
- Admin/Studio/dashboard surfaces остаются рабочими и не превращаются в промо-лендинг.

### Комментарии для агентов

2026-05-16 выполнен первый кодовый pass `FF-0349`/`FF-0350`: обновлены shared Aurora tokens, material/glass primitives, web topbar/marketplace hero/product media/badges, admin shell и OBS widget alert. Новые маршруты `v0.3.5` не создавались. До закрытия `FF-0350` ещё нужен screenshot QA `ru/en`, light/dark и 320/390/768/1440.

## Шаблон записи

```md
## CHANGE-YYYY-MM-DD-001: Название изменения

Статус:
Затрагивает:
Версия:
Приоритет:
Автор записи:

### Новая логика

### Что нужно изменить

### Что не нужно трогать

### Какие страницы затрагивает

### Какие компоненты затрагивает

### Acceptance criteria

### Комментарии для агента
```

## UX-TASK-036: marketplace-first контракт главной — 2026-09-20

Статус: PLANNED
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, FLOW-BUYER-HOME, FLOW-BUYER-SEARCH
Приоритет: P0

### Новая логика

`/` и `/marketplace` считаются одной marketplace-first поверхностью для обычного покупателя. Покупатель всегда выбран по умолчанию; автор и продавец доступны вторичными вкладками. Общий каталог цифровых товаров не ограничивается creator/OBS use cases. Большие role/platform landing блоки не возвращаются в покупательский режим.

### Текущее расхождение

Структура и переключатель реализованы частично, но накопленные creator-commerce/landing решения позволяют странице снова читаться как лендинг или marketplace только для стримеров. Поэтому PAGE-HOME, PAGE-MARKETPLACE и связанные buyer flows переведены в `NEEDS_REWORK` до product review.

### Что нужно изменить

Обновить только главную marketplace-поверхность по `docs/tasks/ui-ux/UX-TASK-036.md`, добавить regression QA и не затрагивать несвязанные IMPLEMENTED страницы.

### Следующие этапы

После закрытия UX-TASK-036: UX-TASK-037 (живой визуальный язык), затем UX-TASK-038 (маскот). UX-TASK-039 (`world.fanfuel.ru`) остаётся FUTURE/discovery и не разрешает production route.

## UX-TASK-029: Главная с переключателем аудитории (v0.3.5)

Исторический spec для PAGE-HOME и PAGE-MARKETPLACE. Статус: SUPERSEDED_BY_UX_TASK_036.

- Под хэдером по центру расположен ползунок «Я покупатель / Я автор / Я продавец». По умолчанию покупатель, переключение меняет содержимое без навигации и назначения account roles.
- Покупатель: компактный заголовок, категории, товары, затем авторские подборки; особенности платформы передаются спокойной подписью и деталями карточек. Большие объяснения, презентации ролей и общий CTA убраны из покупательского режима.
- Автор: презентация пользы, донатов, целей и OBS, путь начала работы; витрины и партнёрские возможности обозначены как планируемые. Продавец: товары, модерация, заказы, отзывы и будущий канал через авторов.
- В хэдере поиск доступен сразу; ссылки «Для авторов», «Для продавцов», «Безопасность» удалены. На мобильном поиск открывается штатной кнопкой.
- Acceptance criteria: три режима на одном URL, один H1 в активном режиме, клавиатура и видимый фокус, ru/en, light/dark, reduced motion, отсутствие горизонтального переполнения на 320/390px. Старые ролевые URL сохраняются.

## UX-TASK-030: полная переработка режимов главной

Статус: SUPERSEDED_BY_UX_TASK_036. Версия: v0.3.5. Маршруты: `/`, `/marketplace`.
Пользователь отклонил содержание и визуальную подачу всех трёх режимов UX-TASK-029, но одобрил переключатель. Разрешена полная переработка содержимого.

- Сохранить переключатель аудитории и смену режимов на одном URL.
- Хэдер: поиск по центру окна, «Маркет» и «Авторы» в правой группе рядом со входом/профилем. На узких экранах не допускать пересечения элементов.
- Покупатель: торговая навигация по цифровым товарам и услугам, компактные категории, реальные карточки товаров, редакционные направления покупок. Убрать вымышленные авторские подборки, промокоды и показатели продаж. Одно понятное состояние ошибки/пустого каталога с полезным действием.
- Автор: центр презентации — витрина, рекомендации и покупки как способ поддержки; показать механику покупатель/продавец/автор и отдельно донаты, цели, OBS. Не представлять разрабатываемую партнёрскую систему как действующую.
- Продавец: показать общий каталог и будущий канал через авторов, обязанности продавца, путь от товара до выполненного заказа. Визуальная композиция отличается от авторской.
- Не расширять ассортимент рискованными категориями; API, БД и платёжную модель не менять.
- Acceptance criteria: ru/en, light/dark, mobile 320/390px, desktop, клавиатурные tabs, reduced motion, поиск с реальным переходом, отсутствие фиктивных товаров/доходов и работающий retry загрузки.

## UX-TASK-031 — страница автора до регистрации

Версия: v0.3.5. Статус: IMPLEMENTED. Route: /create. По прямому запросу пользователя добавляется публичная анкета автора: название → описание → предпросмотр и авторизация. Данные сохраняются в sessionStorage текущей вкладки; email и пароль в черновик не входят. После входа возврат только на фиксированный /create, сохранение по явной кнопке. Новый авторский профиль создаётся как draft; существующий не перезаписывается этим сценарием. Покупатель может добавить роль автора. В хедере только вход, без отдельной регистрации/создания страницы; регистрация доступна вкладкой на auth-странице.

Acceptance criteria: ru/en, semantic light/dark, mobile/desktop, клавиатура, валидация полей, восстановление черновика, сохранение при ошибке API, обе auth-вкладки сохраняют контекст, успешное сохранение через API, без автопубликации.

### UX-TASK-031: необязательные шаги анкеты

По запросу пользователя: название → описание (можно пропустить) → аватар и баннер (необязательно, можно пропустить) → спонсорские товары (можно пропустить) → авторизация. Изображения хранятся только в IndexedDB браузера, привязаны к черновику вкладки; на сервер не отправляются. Выбор товаров из реального каталога с affiliate_percent_bps > 0, без вымышленных товаров или обещаний выплат. Публикация витрины и загрузка медиа на сервер не реализуются этой UI-итерацией; локальные дополнения не удаляются при сохранении названия/описания в аккаунт. Успешный экран явно сообщает об этом. При ошибке каталога доступны повтор и пропуск. Ввод, возврат, повторное открытие и смена auth-вкладки сохраняют локальный черновик.

### UX-TASK-031: единая кнопка необязательного шага

Отдельная ссылка «Пропустить» удалена. Основная кнопка пустого описания, оформления без картинок или подборки без товаров называется «Пропустить». При добавлении данных название меняется на «Продолжить» через стирание/печать, при удалении всех данных — обратно. Первый обязательный шаг всегда «Продолжить». Обе надписи выполняют переход вперёд. Ширина фиксируется по длиннейшей надписи, accessible name сразу содержит целевое действие; prefers-reduced-motion отключает эффект. При смене шага печать не запускается.

### UX-TASK-031: навигация по шагам

Названия шагов центрированы под номерами в равных колонках и доступны как кнопки (в том числе с клавиатуры). На узком экране лента прокручивается горизонтально, подписи не скрываются. После заполнения обязательного названия можно перейти на любой шаг. Переходы меняют только активный шаг, без очистки описания, картинок и выбранных товаров. Во время сохранения/чтения файлов навигация временно заблокирована.

### UX-TASK-031: переработка мобильной анкеты

По прямому запросу пользователя: компактная шапка, выбор шага через доступный select вместо горизонтальной ленты, сворачиваемый предпросмотр перед формой, поля и действия по ширине экрана. Desktop сохраняет колонки и кнопки шагов. Данные остаются в родительском состоянии. Acceptance: 320/390/768/1280 px, без горизонтального переполнения, все пять шагов доступны, предпросмотр открывается/закрывается, light/dark, ввод от 16px и touch targets от 44px.

### UX-TASK-031: единый Select и строка мобильных шагов

По запросу пользователя все нативные select в web переводятся на общий компонент дизайн-системы: semantic surface/border/focus, собственный список, клавиатура и disabled. В анкете возвращается строка из пяти кликабельных шагов на всех ширинах; на узком экране равные колонки, перенос длинных названий и touch targets от 44px, без горизонтальной прокрутки.

## UX-TASK-033 — уточнение авторизации, 2026-09-15

Задача улучшила отдельные формы и была замещена UX-TASK-035. `/auth/login` и `/auth/register` теперь перенаправляют на PAGE-AUTH.

Компактная оболочка, доступные поля, theme/locale и отдельный шаг имени переиспользованы в PAGE-AUTH.

## UX-TASK-035 — единая авторизация и подтверждение email, 2026-09-17

Реализованы PAGE-AUTH и встроенное PAGE-AUTH-VERIFY: email-first развилка, одноразовый код для нового адреса, одноразовый registration token и создание аккаунта только после подтверждения. Старые auth routes сохранены redirect-маршрутами. Mobile/desktop и light/dark проверены визуально; телефон и username остаются отдельной будущей задачей.


## UX-TASK-041 — IN_PROGRESS

Расхождение с утверждённым рисунком: гладкий SVG вместо графита, разреженная композиция, повторяющиеся плитки и чрезмерно высокий empty-state. Связанные specs/tasks обновлены перед реализацией. Согласованы источник отчислений (продавец) и выбор одного получателя.

## UX-TASK-041 — IMPLEMENTED_LOCAL, 22.09.2026

Выполнено по последнему запросу владельца и ответам о финансировании поддержки: дизайн, /studio, storefront media/design, независимый promo, seller editor, exact grouping/search, quote/один автор, cart attribution, проверяемый mock order snapshot. Specs/tracker/tasks обновлены до и после реализации. Production storage/settlement и полная игра не включены. Детали готовых алгоритмов и будущих адаптеров: MARKETPLACE_ALGORITHMS.md. Product review остаётся открытым.

## UX-TASK-042 — новая обратная связь владельца

NEEDS_REWORK: четыре маркетинговые карточки не соответствуют живому дизайну; направления каталога слишком узки; активная роль должна обводиться рукой; Ойли должен быть одним перемещаемым актёром, видимым сразу на главной. Сначала обновлены PAGE_SPECS, UI_UX_TRACKER и TASKS; реализация ограничена перечисленными блоками. Рискованные способы доставки остаются gated.
