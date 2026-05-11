# UX Implementation Status

Рабочий документ для ручного обновления UX-логики. Если новая логика придумана текстом, сначала добавить её сюда, затем обновить `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md` и `docs/TASKS.md`, и только потом менять код.

## Как пользоваться этим документом

- Если новая логика придумана, сначала добавить её сюда.
- Если страница должна измениться, добавить запись в раздел `Нужно обновить`.
- Если страница не должна создаваться сейчас, указать `DO_NOT_BUILD_YET`.
- Агент должен читать этот документ перед работой и не лезть в страницы, которые не входят в его задачу.
- Если page/spec/tracker расходятся с кодом, зафиксировать расхождение здесь или в `docs/DESIGN_AUDIT.md`.
- Записи должны ссылаться на `PAGE-ID`, `FLOW-ID`, `CMP-ID` или `UX-TASK-ID`.

## Реализовано

| ID          | Что реализовано                      | Где                                                                              | Версия | Статус      | Комментарий                                                                                                                                                                                            |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UX-IMPL-001 | Главная FanFuel                      | `apps/web /`                                                                     | v0.2   | PARTIAL     | Есть landing, но нужен v0.3 role/marketplace update.                                                                                                                                                   |
| UX-IMPL-002 | Вход                                 | `apps/web /auth/login`                                                           | v0.1   | PARTIAL     | Рабочая форма, нет reset/onboarding redirect.                                                                                                                                                          |
| UX-IMPL-003 | Регистрация с role intent            | `apps/web /auth/register`                                                        | v0.1   | PARTIAL     | Role intent есть, отдельного выбора роли/onboarding нет.                                                                                                                                               |
| UX-IMPL-004 | Публичная страница автора с донатами | `apps/web /creators/[slug]`                                                      | v0.2   | PARTIAL     | Есть донат, цели, история, top donors.                                                                                                                                                                 |
| UX-IMPL-005 | OBS donation alert widget            | `apps/widget /?token=`                                                           | v0.2   | PARTIAL     | Есть reconnect/dedupe/theme, нет settings preview.                                                                                                                                                     |
| UX-IMPL-006 | Базовая admin users panel            | `apps/admin /`                                                                   | v0.3   | PARTIAL     | Есть list/block/activate, confirmation и вкладка moderation товаров; filters/details позже.                                                                                                            |
| UX-IMPL-007 | ThemeSwitcher и semantic tokens      | `packages/ui`, web/admin/widget                                                  | v0.2   | PARTIAL     | Работает, но нужны icon/tooltips/design review.                                                                                                                                                        |
| UX-IMPL-008 | Marketplace MVP                      | `apps/web /marketplace`, `/marketplace/products/[slug]`, `/checkout/[productId]` | v0.3   | IMPLEMENTED | Каталог, карточка товара, checkout и mock safe deal.                                                                                                                                                   |
| UX-IMPL-009 | Buyer order MVP                      | `apps/web /buyer`, `/buyer/orders/[id]`                                          | v0.3   | IMPLEMENTED | Список заказов, timeline, confirm delivery и review.                                                                                                                                                   |
| UX-IMPL-010 | Seller marketplace MVP               | `apps/web /seller`, `/seller/products`, `/seller/products/new`, `/seller/orders` | v0.3   | IMPLEMENTED | Создание товара, модерация, товары и order actions.                                                                                                                                                    |
| UX-IMPL-011 | Marketplace как главная              | `apps/web /`, `/marketplace`                                                     | v0.3   | IMPLEMENTED | `/` перенаправляет в marketplace, на marketplace добавлены buyer benefits.                                                                                                                             |
| UX-IMPL-012 | Ролевые публичные лендинги           | `/for-buyers`, `/for-streamers`, `/for-sellers`                                  | v0.3   | IMPLEMENTED | Три страницы для покупателей, стримеров и продавцов с i18n и semantic tokens.                                                                                                                          |
| UX-IMPL-013 | Authenticated topbar                 | `apps/web AppTopBar`                                                             | v0.3   | PARTIAL     | Для вошедшего пользователя добавлены поиск, actions и меню аккаунта; notification flow позже.                                                                                                          |
| UX-IMPL-014 | Compact authenticated menu           | `apps/web AppTopBar`                                                             | v0.3   | PARTIAL     | Мобильный auth topbar держится в одну строку; меню разделено на категории, theme/language открываются overlay-dropdown.                                                                                |
| UX-IMPL-015 | Guest topbar menu                    | `apps/web AppTopBar`                                                             | v0.3   | PARTIAL     | Для гостя добавлены topbar search и dropdown menu с входом, регистрацией, публичными разделами, темой и языком.                                                                                        |
| UX-IMPL-016 | Topbar search polish                 | `apps/web AppTopBar`, `/marketplace`                                             | v0.3   | PARTIAL     | Search placeholder выбирается по фактической ширине поля, кнопка поиска выровнена по inset-отступам, form controls защищены от hydration warning из-за внешних injected attributes.                    |
| UX-IMPL-017 | Mobile external dev auth             | `apps/web AppTopBar`, `/auth/login`, `/auth/register`, `/api/v1/*`               | v0.3   | PARTIAL     | Topbar search стал единым контролом с вросшей кнопкой submit; auth forms защищены от injected attributes; web API calls идут через same-origin proxy, чтобы телефон не обращался к своему `localhost`. |

## Реализовано частично

| ID             | Что реализовано частично       | Где                               | Статус       | Нужно сделать                                                   |
| -------------- | ------------------------------ | --------------------------------- | ------------ | --------------------------------------------------------------- |
| UX-PARTIAL-001 | Mini Studio внутри профиля     | `/me/profile`                     | NEEDS_REWORK | Вынести в `/studio/*`.                                          |
| UX-PARTIAL-002 | Seller settings внутри профиля | `/me/profile`                     | NEEDS_REWORK | Вынести в `/seller/settings`.                                   |
| UX-PARTIAL-003 | Donation goals UI              | `/me/profile`, `/creators/[slug]` | PARTIAL      | Добавить отдельную `/studio/goals`, empty/loading/error states. |
| UX-PARTIAL-004 | Widget token UI                | `/me/profile`, `apps/widget`      | PARTIAL      | Добавить `/studio/widgets`, preview и token state.              |
| UX-PARTIAL-005 | Admin user/product moderation  | `apps/admin`                      | PARTIAL      | Filters, details, audit link и отдельные admin routes.          |

## Нужно обновить

| ID            | Что обновить                                                  | Затрагивает                                                                     | Приоритет | Связанные задачи                                                  |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| UX-UPDATE-001 | Разделить `/me/profile` на account/settings и role dashboards | PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD, PAGE-SELLER-DASHBOARD | P0        | UX-TASK-007, UX-TASK-013                                          |
| UX-UPDATE-002 | Добавить стандартные loading/empty/error states               | Current web/admin/widget pages                                                  | P1        | UX-TASK-008, частично закрыто для web/admin                       |
| UX-UPDATE-003 | Привести главную к расширенному spec v0.3                     | PAGE-HOME                                                                       | P1        | UX-TASK-004, закрыто                                              |
| UX-UPDATE-004 | Привести creator page к spec и решить отдельный donate route  | PAGE-CREATOR-PUBLIC, PAGE-CREATOR-DONATE                                        | P0        | UX-TASK-005, states закрыты; отдельный donate route не создавался |
| UX-UPDATE-005 | Подготовить marketplace IA/spec к реализации                  | PAGE-MARKETPLACE, PAGE-PRODUCT, PAGE-CHECKOUT                                   | P0        | UX-TASK-006, закрыто реализацией v0.3                             |
| UX-UPDATE-006 | Проверить mobile UX текущих страниц                           | Current web/admin/widget                                                        | P1        | UX-TASK-010                                                       |
| UX-UPDATE-007 | Обновить UX writing и i18n для новых states                   | All current/planned pages                                                       | P1        | UX-TASK-009                                                       |

## Нужно спроектировать

| ID            | Что спроектировать                   | Версия    | Статус         | Комментарий                             |
| ------------- | ------------------------------------ | --------- | -------------- | --------------------------------------- |
| UX-DESIGN-001 | RoleSwitcher и multi-role navigation | v0.3      | PLANNED        | См. `docs/INFORMATION_ARCHITECTURE.md`. |
| UX-DESIGN-002 | Dashboard layout pattern             | v0.3      | PLANNED        | Buyer/Studio/Seller/Admin.              |
| UX-DESIGN-003 | Marketplace product card             | v0.3      | PLANNED        | Цена, продавец, safe deal, attribution. |
| UX-DESIGN-004 | Checkout status model                | v0.3/v0.5 | PAYMENT_REVIEW | Не смешивать order/payment/deal.        |
| UX-DESIGN-005 | Admin moderation queues              | v0.3      | PLANNED        | Products, sellers, streamers.           |
| UX-DESIGN-006 | Dispute UX                           | v0.7      | FUTURE         | LEGAL_REVIEW_REQUIRED.                  |
| UX-DESIGN-007 | Payout UX                            | v0.6      | PAYMENT_REVIEW | Balance language and provider review.   |

## Не создавать сейчас

| ID         | Что не создавать                        | Статус           | Причина                           |
| ---------- | --------------------------------------- | ---------------- | --------------------------------- |
| UX-DNB-001 | Native iOS/Android apps                 | DO_NOT_BUILD_YET | Только после web/PWA и v1.0.      |
| UX-DNB-002 | Drag-and-drop редактор страниц стримера | DO_NOT_BUILD_YET | Высокая сложность, не MVP.        |
| UX-DNB-003 | Сложная рекламная биржа                 | DO_NOT_BUILD_YET | Не соответствует v0.3-v0.4 scope. |
| UX-DNB-004 | ML-рекомендации                         | DO_NOT_BUILD_YET | Нет данных и не MVP.              |
| UX-DNB-005 | Реальные выплаты UI                     | DO_NOT_BUILD_YET | До v0.6 payment/legal review.     |
| UX-DNB-006 | Dispute/arbitration UI                  | DO_NOT_BUILD_YET | До v0.7 domain/legal.             |
| UX-DNB-007 | Risky categories                        | DO_NOT_BUILD_YET | Legal/payment review required.    |

## Заблокировано

| ID             | Блок                        | Причина                      | Разблокировка                        |
| -------------- | --------------------------- | ---------------------------- | ------------------------------------ |
| UX-BLOCKED-001 | Password reset UI           | Нет backend reset token flow | Реализовать безопасный backend flow. |
| UX-BLOCKED-002 | Email/phone verification UI | Нет verification backend     | Добавить verification endpoints.     |
| UX-BLOCKED-003 | Real payment checkout UI    | Нет real provider review     | v0.5 provider/legal review.          |
| UX-BLOCKED-004 | Payout screens              | Нет wallet/payout domain     | v0.6 ledger/payout tasks.            |

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

Корневой route `/` стал marketplace-first входом через redirect на `/marketplace`. Вход и регистрация после успешной авторизации ведут в marketplace, а `/auth/login` и `/auth/register` перенаправляют уже авторизованного пользователя. Topbar показывает auth-links только гостю и профиль только авторизованному пользователю.

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
