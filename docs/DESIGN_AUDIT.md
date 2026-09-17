# DESIGN_AUDIT.md

## Аудит 2026-05-16: Aurora direction review

Затрагивает: `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/UX_RULES.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/tasks/v0.3.5`.

Контекст: текущий marketplace/UI получил внешнюю критику за слишком сильную связку чёрного фона, оранжевого акцента и тяжёлых бейджей. Главный риск — нежелательное считывание как adult/betting/casino/старый skin-shop вместо безопасной creator-commerce платформы.

Принято в план:

- уйти от orange/black как primary-визуала;
- закрепить FanFuel Aurora как внутреннее направление: deep navy/graphite, violet/cyan, emerald support, warm/orange только как редкий статусный акцент;
- использовать glass как отдельный material layer для topbar/search/tabs/modal/hero preview/widget preview, а не как стиль всех карточек;
- обновить существующие страницы до новых v0.3.5 функций;
- усилить product media и карточки товара, чтобы marketplace выглядел живым и доверительным;
- отдельно держать публичные страницы более эмоциональными, а кабинеты/admin — рабочими и читаемыми.

Не принято как правило:

- переименовывать продукт в FunFuel или делать Aurora внешним названием бренда;
- копировать Apple Liquid Glass или строить весь интерфейс из blur/glass;
- добавлять декоративные gradient orbs/blobs/bokeh как фон;
- резко увеличивать все радиусы карточек до 20–24px;
- обещать safe deal как финальную гарантию без legal/payment review;
- строить новые profile/studio/store routes до обновления текущей визуальной базы.

Следующее действие:

- выполнить `FF-0348`, `FF-0349`, `FF-0350` как первые задачи `v0.3.5`, затем продолжить `FF-0351+`.

## Аудит 2026-05-10: Practical Page Design Pass

Затрагивает: `apps/web`, `apps/admin`, `apps/widget`, `packages/ui`, `packages/i18n`.

Что улучшено:

- Главная получила быстрые входы по ролям без создания новых future routes.
- Мобильная topbar-навигация web больше не скрывается полностью: secondary links доступны горизонтальной прокруткой.
- Общие web cards, product cards, forms, order rows и checkout panels стали стабильнее для длинных русских строк.
- Admin rows получили более читаемые hover/focus surfaces и full-width actions на mobile.
- OBS widget alert получил устойчивую framed surface, динамический размер текста и лучшую прозрачную тему.

Проверки:

- `npm run typecheck --workspaces --if-present` — успешно.
- `npm run lint` — успешно.
- `npm run build --workspaces --if-present` — успешно.
- `npm run test --workspaces --if-present` — успешно, тестовые scripts отсутствуют/не выводят отдельные suite.
- `npx prettier --check ...` для изменённых UI/i18n файлов — успешно.
- HTTP smoke существующего docker stack: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173` — 200.

Что не проверено:

- Screenshot QA 320/390/768/1440.
- Ручная проверка всех страниц в light/dark.
- Полный browser smoke buyer/seller/admin marketplace flow.

Риск:

- Это визуальный слой без Playwright screenshot baseline; возможны мелкие visual regressions на редких viewport widths.

Следующее действие:

- Закрывать `UX-TASK-010` отдельным screenshot QA pass.

Аудит текущего интерфейса FanFuel `v0.2 Donate MVP` перед внедрением дизайн-системы.

## Проверенные зоны

- `apps/web`: главная, регистрация, вход, профиль/mini studio, публичная страница автора и донат-форма.
- `apps/admin`: базовая панель пользователей.
- `apps/widget`: OBS donation alert widget.
- `packages/ui`: shared `Button` и CSS.
- `packages/i18n`: текущие `ru/en` словари.
- `services/api`: auth/profile/donate endpoints и готовность к user preferences.

## Найденные проблемы

- Цвета были зашиты hex-значениями в `apps/web`, `apps/admin`, `apps/widget` и `packages/ui`.
- Не было semantic tokens, поэтому dark theme нельзя было внедрить без точечных правок.
- `packages/ui` содержал только `Button`; компонентная база не покрывала формы, бейджи, панели, таблицы, dashboard и marketplace patterns.
- Не было глобального `ThemeProvider`, раннего применения темы и источника истины для выбора пользователя.
- `apps/admin` и `apps/widget` жили на собственных CSS-цветах и не разделяли визуальную основу с web.
- Главная страница выглядела как foundation-заглушка и не объясняла creator-commerce позиционирование.
- Профиль смешивал account settings, creator studio, donation goals и widgets в одну длинную колонку.
- Страница автора была функциональной, но не давала ощущения персональной streamer page.
- OBS widget был всегда тёмным и прозрачным, без явного URL-режима темы.
- Тексты для темы отсутствовали в i18n.
- В backend не было `user_preferences`, поэтому авторизованный пользователь не мог сохранять theme preference в БД.

## Что исправлено

- Добавлены CSS variables и semantic tokens для `light` и `dark`.
- Выбран `data-theme="light|dark"` на корневом элементе.
- Добавлены shared theme utilities: `system`, `light`, `dark`, cookie/localStorage, system media query.
- Добавлен `ThemeSwitcher` с доступным dropdown UI.
- Добавлены базовые UI primitives в `packages/ui`.
- Web, admin и widget переведены на shared tokens.
- Главная переработана в Creator OS landing с control-room preview.
- Auth screens получили общий top bar и theme switcher.
- Профиль получил отдельный блок `Внешний вид` и двухколоночный settings/studio layout.
- Публичная страница автора получила hero-блок, донат-форму сбоку и поддерживает обе темы.
- Admin panel стала ближе к control-room layout.
- OBS widget поддерживает `theme=system|light|dark|transparent`.
- Добавлена миграция `000004_user_preferences` и API `/api/v1/me/preferences`.

## Что осталось исправить

- Marketplace, checkout, orders, safe deal, disputes, payouts и полноценные dashboards ещё не реализованы как страницы. Для них добавлены правила и patterns, но не production UI.
- Нет визуальных screenshot-regression тестов.
- Нет Storybook или отдельной витрины компонентов.
- ThemeSwitcher пока использует текстовые short icons (`OS`, `LT`, `DK`), потому что icon library в проект не добавлена.
- Auth/session слой остаётся JWT/localStorage из `v0.1`; cookie session и CSRF strategy требуют отдельного ADR перед production.

## Компоненты для дальнейшей работы

- `Modal`, `Drawer`, `Toast`, `Table`, `Pagination` требуют сценарных тестов при появлении реальных flows.
- `ProductCard`, `OrderStatusCard`, `DealTimeline`, `DashboardPanel` сейчас заданы как primitives/patterns и должны получить реальные data-driven варианты в `v0.3+`.
- Для marketplace и financial statuses нужны fixture pages и ручная QA-проверка в обеих темах.

## UI/UX planning audit 2026-05-09

Аудит проведён перед созданием UI/UX tracker, page map, page specs и user flows. Массовая реализация новых страниц не выполнялась.

### Найденные текущие страницы и routes

| Приложение    | Route              | Файл                                        | Статус UX    |
| ------------- | ------------------ | ------------------------------------------- | ------------ |
| `apps/web`    | `/`                | `apps/web/src/app/page.tsx`                 | PARTIAL      |
| `apps/web`    | `/auth/login`      | `apps/web/src/app/auth/login/page.tsx`      | PARTIAL      |
| `apps/web`    | `/auth/register`   | `apps/web/src/app/auth/register/page.tsx`   | PARTIAL      |
| `apps/web`    | `/me/profile`      | `apps/web/src/app/me/profile/page.tsx`      | NEEDS_REWORK |
| `apps/web`    | `/creators/[slug]` | `apps/web/src/app/creators/[slug]/page.tsx` | PARTIAL      |
| `apps/admin`  | `/`                | `apps/admin/src/main.tsx`                   | PARTIAL      |
| `apps/widget` | `/?token=...`      | `apps/widget/src/main.tsx`                  | PARTIAL      |

### Найденные компоненты и layouts

- `AppTopBar` есть в `apps/web/src/components/app-chrome.tsx`; навигация пока не role-aware.
- `ThemeSettingsPanel` есть в профиле и использует shared theme context.
- `ThemeSwitcher` есть в `packages/ui`, web и admin.
- `packages/ui/src/components.tsx` содержит primitives: `Button`, `IconButton`, form controls, `Badge`, `Panel`, `Table`, `EmptyState`, `Skeleton`, `DashboardPanel`, `ProductCard`, `DealTimeline`, `WidgetPreviewContainer`.
- Dashboard layouts как полноценный pattern пока не реализованы: `/me/profile` временно выполняет роль account + studio + seller page.
- `apps/admin` использует собственный single-screen layout, но на shared tokens.
- `apps/widget` использует отдельный lightweight widget layout.

### Страницы, которые выглядят временно

- `/me/profile` — главный временный экран. Он смешивает account settings, theme settings, creator public page settings, donation goals, OBS widgets и seller profile.
- `apps/admin /` — рабочая users panel, но не полноценная admin IA; целевой route должен быть `/admin/users` внутри admin navigation.
- `/creators/[slug]` — функционально закрывает Donate MVP, но совмещает публичный профиль, donate flow, goals и donation history без отдельного donate route decision.

### Расхождения с целевым UX

- Marketplace routes отсутствуют, хотя продуктовое позиционирование уже говорит о marketplace.
- Buyer/Studio/Seller dashboards отсутствуют как отдельные страницы.
- Role switcher отсутствует, хотя доменная модель допускает несколько ролей у одного пользователя.
- Loading states в current pages чаще plain text, а не skeleton/structured state.
- Empty states частично есть только для donation history; нет единого pattern.
- Error states чаще общие для страницы/формы, а не привязаны к секции.
- Admin dangerous action `block/activate user` не имеет confirmation UI.
- Widget token setup не имеет отдельного preview/settings page.

### Дубли и смешение зон

- Profile fields, creator profile fields, seller profile fields и studio controls находятся в одной странице `/me/profile`.
- Public creator page и donate page сейчас один route; это допустимо для v0.2, но требует явного решения перед v0.3.
- UI kit primitives существуют, но текущие pages всё ещё часто используют inline markup/classes вместо shared сценарных компонентов.

### Hardcoded texts и i18n

- Поиск `rg -n "[А-Яа-яЁё]" apps/web apps/admin apps/widget packages/ui` не нашёл русских строк вне словарей/документации в проверенных UI app paths.
- В коде остаются technical literals: role values, currency codes, route paths, status keys, `FF`, theme short icons `OS/LT/DK`.
- Theme short icons требуют design review, но не являются пользовательским русским текстом.

### Цвета и темы

- Поиск hardcoded colors в `apps` не показал случайных hex/bg-white/text-black вне token layer.
- Hex/rgb значения сосредоточены в `packages/ui/src/styles.css` как semantic token definitions.
- Light/dark support есть, но screenshot QA по mobile/light/dark не проводился в рамках этого аудита.

### Отсутствующие состояния

- `PAGE-HOME`: нет dynamic loading/empty/error, потому что данные не грузятся; для future marketplace preview нужны states.
- `PAGE-AUTH-LOGIN`: нет forgot password state и structured Alert.
- `PAGE-AUTH-REGISTER`: нет post-register onboarding state.
- `PAGE-ME-PROFILE`: plain loading, общий error message, нет per-section empty/error.
- `PAGE-CREATOR-PUBLIC`: plain loading, not found есть, goals empty скрывается без явного next action.
- `PAGE-ADMIN-USERS`: нет empty users state, confirmation, detailed forbidden state.
- `PAGE-WIDGET-ALERT`: есть waiting/disconnected/token missing, но нет Studio preview/config states.

### Зафиксированные документы

- `docs/UI_UX_TRACKER.md` — главный tracker страниц, flows, компонентов и UX-долгов.
- `docs/PAGE_MAP.md` — карта страниц.
- `docs/PAGE_SPECS.md` — page specs.
- `docs/USER_FLOWS.md` — пользовательские сценарии.
- `docs/INFORMATION_ARCHITECTURE.md` — навигация и multi-role IA.
- `docs/UX_RULES.md` — UX правила.
- `docs/UI_STATES.md` — стандартные состояния.
- `docs/UX_WRITING.md` — тон и примеры текстов.
- `docs/UX_IMPLEMENTATION_STATUS.md` — ручной статус UX-логики.
- `docs/DO_NOT_BUILD_YET.md` — запрет преждевременной разработки.

### Рекомендации

1. В v0.3 начать с `RoleSwitcher` и dashboard layout, а не с десятков новых routes.
2. Вынести Studio widgets/goals из `/me/profile` по одному bounded task.
3. Подготовить marketplace foundation только после Product/Category/Order API.
4. Добавить structured loading/empty/error states на текущие pages.
5. Провести mobile screenshot QA для текущих web/admin/widget screens.

## Marketplace MVP audit 2026-05-09

Аудит после реализации `v0.3 Marketplace MVP` и дизайн-обновления предыдущих web/admin экранов.

### Что обновлено

- Главная получила явный вход в marketplace и role dashboards.
- `/marketplace`, `/marketplace/products/[slug]`, `/checkout/[productId]` реализованы на semantic tokens и i18n.
- `/buyer` и `/buyer/orders/[id]` показывают order/payment/deal statuses, timeline, confirm delivery и review.
- `/seller`, `/seller/products`, `/seller/products/new`, `/seller/orders` покрывают создание товара, moderation submit и order actions.
- `/me/profile` получил skeleton loading, role links, EmptyState для goals/widgets и seller links.
- `/creators/[slug]` получил skeleton loading и EmptyState для пустых goals/donations.
- `apps/admin` получил вкладки users/products, confirmation для опасных действий и product moderation queue.

### Оставшиеся UX-долги

- `/me/profile` всё ещё смешивает account, studio goals/widgets и seller settings; нужен отдельный `/studio/*` перенос.
- Admin products реализованы вкладкой root app, не отдельным route `/admin/products`.
- Не выполнялся browser screenshot QA на 320/390/768/1440 и в обеих темах.
- Product media остаётся placeholder без реальных изображений/файлов до storage/file задач.
- Mock safe deal copy остаётся осторожным и не заменяет legal/payment review.

## UX-TASK-029: обнаруженные расхождения

До изменения spec обещал поиск только в хэдере, но код содержал hero search и скрывал header search до прокрутки. Исправляется в рамках задачи. Существующие демонстрационные подборки авторов и промокоды требуют отдельной задачи на подключение реального domain; их данные не подтверждают действующие партнёрские отношения.

## UX-TASK-030: актуализация главной

Удалены демонстрационные подборки, чужие имена, промокоды, фиктивный social proof и нефункциональное избранное из главной. Товары берутся только из API, отсутствие данных не подменяется ассортиментом.

Обнаружено вне scope: существующий /marketplace/catalog принимает query в URL, но пока остаётся навигационной страницей без выдачи результатов. Передача запроса из хедера проверена; реализация полноценного поиска каталога требует отдельной задачи.

UX-TASK-031: обнаружена выдача draft авторов публичными GET и допустимость draft в разрешении адресата доната. В связи с созданием приватных черновиков разрешён только published; PublicProfile скрывает непубличный creator_profile. Provider/суммы/проведение платежей не меняются. Изменение доступа намеренное, чтобы черновик не был публичным до публикации.

## UX-TASK-033 — обнаруженные расхождения авторизации, 2026-09-15

- `validPassword` разрешает 128 Unicode-символов, а bcrypt отклоняет больше 72 UTF-8 байт; на web добавляется понятная проверка до отправки. Отдельная backend задача: согласовать политику длины, возвращать validation_failed вместо internal_error и проверить Unicode/grapheme boundaries.
- Публичный register возвращает conflict для существующего email; login и register различаются также по HTTP/timing. Нового API определения наличия аккаунта не добавляем. Отдельная security задача: выравнивание регистрации/восстановления с email verification и anti-enumeration.
