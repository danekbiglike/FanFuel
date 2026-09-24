# Page Specs

## Дополнение к PAGE-HOME / PAGE-MARKETPLACE: живой графический ритм

Маршруты: `/`, `/marketplace`. Версия: v0.3.5 / Experience. TASK-ID: `UX-TASK-040`. После удаления звездочек и стрелок выбранная категория, переходы между смысловыми секциями, карточки без медиа и пустые состояния получают дозированные неровные карандашные линии. У каждой категории заглушки свой контурный мотив; подпись честно сообщает об отсутствии обложки. Крупное название товара не дублируется внутри медиа. В light/dark сохраняются контраст и читаемость, на 390/1440 px нет наложения на цену, подпись или действия. При reduced motion и Save-Data рисунки остаются статичными.

## PAGE-PLAYGROUND: тестовая главная Ойли

Route: `https://playground.fanfuel.ru/`. Версия: `playground-v0.1`. Статус: `IMPLEMENTED`. TASK-ID: `UX-TASK-044`. Отдельная статическая сборка обслуживается тем же nginx FanFuel VM и не меняет реальный маршрут `/`.

Страница показывает демонстрационный header, hero и четыре фиктивные карточки. Вход и поиск отключены; категории не являются ссылками, карточки не открывают checkout. Страница явно сообщает, что это макет. Доступны ru/en и light/dark через semantic tokens.

Ойли рисуется карандашными контурами поверх страницы. Пользователь может схватить и отпустить его на любой видимой карточке; модель деформируется от скорости рывка и контакта. Панель позволяет менять кисть, толщину, насыщенность, зерно, нажим, его размах, неровность, сужение, мягкость тела и силу покадрового зерна. Есть сброс. Слой персонажа не перехватывает ввод вне его видимого силуэта.

Acceptance criteria: HTTPS и корректный сертификат; основной домен без регрессии; без API/покупок/аккаунтов; перетаскивание мышью и touch, клавиатурный сдвиг, контакты с карточками и полом; настройка в реальном времени; отсутствие горизонтального переполнения на 390 и 1440 px; reduced-motion даёт статический кадр; нет runtime-ошибок; noindex и ограничивающий CSP. Художественное принятие контура не входит в технический статус страницы.

## Дополнение к PAGE-HOME / PAGE-MARKETPLACE: SiteStage Ойли

Маршруты: `/`, `/marketplace`. Версия: brand/experience pilot. Статус: `DESIGN_REVIEW`; текущие страницы остаются `NEEDS_REWORK`, а их торговая структура сохраняется. TASK-ID: `UX-TASK-038`, `UX-TASK-043`. Это добавление к существующему `OilyStage`, без нового route и без FanFuel World.

Сцена первого появления привязана к смысловой точке у хедера и видимой нижней поверхности первого экрана. Ойли проходит короткую последовательность `intro-fall → land → idle` один раз за согласованный период посещения. После появления пользователь может схватить Ойли и отпустить на любой видимой разрешённой карточке. Быстрое движение растягивает корпус, слабое падение смягчается деформацией, сильный удар запускает подготовленную реакцию по скорости контакта. Карточка остаётся товарной ссылкой; реакция не меняет цену, контент или layout. При отсутствии поверхности, вне viewport или под модальным окном взаимодействие спокойно завершается. Никакой реакции столкновения на checkout и финансовых состояниях.

Acceptance criteria пилота: один actor без дубликатов при переключении вкладок и навигации; корректные поверхности после scroll/resize и загрузки карточек; произвольная видимая карточка принимает Ойли после drag/drop, а клик по остальной её площади работает; быстрый и медленный захват дают различимое растяжение; мягкий и сильный контакт различаются по скорости; нет перекрытия CTA, цены и фокуса; пользователь может скрыть Ойли; доступные подписи `ru/en`, управление с клавиатуры, light/dark, видимый фокус; reduced-motion/static fallback без падения и удара; скриншоты/QA на 320/390/768/1440; отдельно измерены подготовка карандашного слоя, время кадра и память на слабом устройстве. Техническая модель и границы: `docs/PENCIL_ENGINE_WEB_STAGE.md`.

> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

Источник истины для целевого UI/UX страниц FanFuel. Если страница есть в `docs/PAGE_MAP.md`, она должна иметь spec здесь или в таблице кратких specs. Страница со статусом `FUTURE`, `PAYMENT_REVIEW`, `LEGAL_REVIEW` или пометкой `DO_NOT_BUILD_YET` не создаётся в коде без отдельной задачи на изменение статуса.

## PAGE-GAMING: Скрытый игровой режим

Статус: NEEDS_REWORK

Версия: v0.3.5

Route: `/gaming`

Task: `UX-TASK-034`

### Назначение страницы

Личный автономный раздел с небольшими web-играми, не связанный с публичным marketplace и кабинетами.

### Основные блоки

- компактная игровая шапка с возвратом на FanFuel и пометкой локального режима;
- прогресс уровня, очки, ходы и локальные монеты;
- поле match-3 `8 × 8`;
- цели уровня и заряд суперсилы;
- панель усилителей;
- состояния победы, поражения, паузы и первого запуска.

### Данные и хранение

Только локальное состояние браузера: открытый уровень, монеты, инвентарь усилителей и лучший результат. Сетевые запросы, API-контракты и новые доменные сущности не нужны.

### UX/UI правила

- route не появляется в публичной навигации и поиске;
- монеты явно называются игровыми и не имеют денежной ценности;
- фишки различаются символом и формой, а не только цветом;
- управление доступно мышью, touch и клавиатурой;
- анимации каскадов отключаются или сокращаются при `prefers-reduced-motion`;
- используются semantic tokens FanFuel, light/dark и ru/en.

### Acceptance criteria

- допустимые и недопустимые обмены обрабатываются предсказуемо;
- каскады, специальные фишки, цели, победа и поражение работают без backend;
- прогресс восстанавливается после reload;
- mobile layout не имеет горизонтального переполнения на 320/390 px;
- страница не имитирует казино, ставки, реальные выплаты или публичный игровой сервис.

## Общие правила для всех Page Specs

- Все пользовательские тексты идут через `packages/i18n`.
- Все цвета и состояния идут через semantic tokens из `packages/ui`.
- Loading, Empty, Error, Unauthorized, Forbidden, Mobile и Desktop состояния должны быть спроектированы до реализации.
- Для финансовых действий нужен confirmation и provider-agnostic status.
- Юридические формулировки помечать `LEGAL_REVIEW_REQUIRED`.
- Платёжные формулировки и flows сверять с `docs/PAYMENTS.md`.

## Дополнение v0.3.5: Aurora Refresh текущих экранов

Этот блок фиксирует первый шаг `v0.3.5`: перед созданием новых страниц профиля, Studio, витрины автора и виджетов нужно обновить уже существующие экраны под FanFuel Aurora. Это визуальный и компонентный pass без изменения маршрутов и без открытия future-функций.

Затрагиваемые страницы:

- PAGE-HOME и PAGE-MARKETPLACE как единая marketplace-витрина;
- PAGE-PRODUCT и PAGE-CHECKOUT;
- PAGE-BUYER-DASHBOARD и PAGE-BUYER-ORDER;
- PAGE-SELLER-DASHBOARD, PAGE-SELLER-PRODUCTS, PAGE-SELLER-ORDERS;
- PAGE-ME-PROFILE как временный account hub до разделения;
- PAGE-CREATOR-PUBLIC;
- PAGE-ADMIN-DASHBOARD/текущий admin root;
- PAGE-WIDGET-ALERT.

Требования:

- убрать orange/black как основной визуальный образ; warm/orange оставить только для редких статусов;
- использовать violet/cyan primary, emerald support и deep navy/graphite surfaces через semantic tokens;
- применить glass только для topbar/search/tabs/modal/hero preview/widget preview/sticky summary;
- сохранить существующую IA и route structure;
- не добавлять новые public routes, real payment UI, payouts, disputes, произвольные скины или fake analytics;
- проверить `ru`/`en`, light/dark, mobile 320/390/768/1440 и длинные строки.

Acceptance criteria:

- первый экран marketplace не считывается как adult/betting/casino/skin-shop;
- product card показывает реальный media slot, цену, продавца, safe deal, рейтинг/социальное доказательство и аккуратный support signal;
- dashboard/admin экраны остаются плотными и рабочими, без промо-стекла на таблицах;
- стекло не ухудшает контраст и отключаемо/упрощаемо через token layer;
- новые задачи `FF-0351+` используют обновлённую Aurora-базу.

## Дополнение v0.3.5: Universal Profile + Studio Skins

Этот блок фиксирует новые specs для `v0.3.5`. Они не разрешают real payments, payouts, disputes, arbitrary CSS/HTML skins или drag-and-drop редактор страниц.

### PAGE-ME-PROFILE: Профиль пользователя

Статус: NEEDS_REWORK
Route: `/me/profile`
Раздел: Auth
Роль пользователя: authenticated, multi-role
Версия появления: v0.3.5
Не создавать до: —
Связанные задачи: `FF-0352`, `FF-0353`

Назначение: личная страница пользователя, а не настройка страницы стримера.

Основные блоки:

- аватар и публичное имя пользователя;
- entry в настройки аккаунта: имя, пароль, locale/theme/skin preference;
- избранное;
- мои отзывы;
- мои подборки;
- действия "стать автором" и "стать продавцом";
- для существующих ролей: pause/resume author mode, pause/resume seller mode, archive author/seller page.

Acceptance criteria:

- Studio goals/widgets/store не находятся внутри `/me/profile`;
- destructive role lifecycle actions требуют confirmation;
- pause показывает публичное состояние временной недоступности через i18n;
- archive не удаляет orders, payments, donations, reviews и audit logs.

### PAGE-ME-FAVORITES: Избранное пользователя

Статус: PLANNED
Route: `/me/favorites`
Раздел: Auth
Роль пользователя: authenticated
Версия появления: v0.3.5
Связанные задачи: `FF-0353`

Назначение: единый список сохранённых товаров, авторов, продавцов и подборок.

Состояния: loading skeleton, empty first save, unavailable target, error retry.

Acceptance criteria:

- избранное принадлежит пользователю, не buyer role;
- private/hidden targets не раскрываются;
- карточки работают в light/dark и на mobile.

### PAGE-ME-REVIEWS: Мои отзывы

Статус: PLANNED
Route: `/me/reviews`
Раздел: Auth
Роль пользователя: authenticated
Версия появления: v0.3.5
Связанные задачи: `FF-0353`

Назначение: показать отзывы, которые пользователь оставил после покупок.

Acceptance criteria:

- видны статусы published/hidden/flagged без лишних moderation internals;
- отзыв ведёт к заказу или товару, если доступ разрешён;
- пустое состояние объясняет, что отзывы появляются после завершённых заказов.

### PAGE-ME-COLLECTIONS: Мои подборки

Статус: PLANNED
Route: `/me/collections`
Раздел: Auth
Роль пользователя: authenticated
Версия появления: v0.3.5
Связанные задачи: `FF-0353`

Назначение: дать любому пользователю создавать подборки товаров/авторов.

Основные блоки:

- список подборок;
- создание/редактирование title, description, visibility;
- элементы подборки;
- public/private/unlisted state;
- optional skin preview.

Acceptance criteria:

- создание подборок не требует роли автора;
- hidden products/creators не показываются публично через подборку;
- длинные названия подборок не ломают карточки и списки.

### PAGE-STUDIO-DASHBOARD: Studio shell

Статус: PLANNED
Route: `/studio`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0357`, `FF-0358`, `FF-0359`, `FF-0360`, `FF-0361`

Назначение: отдельный рабочий кабинет автора, а не блок внутри профиля пользователя.

Основные вкладки:

- статистика;
- последние события;
- настройка донатов;
- витрина автора;
- виджеты;
- продукты;
- подборки.

Acceptance criteria:

- `/studio` не содержит account settings, password settings или seller-only controls;
- вкладки работают как стабильная IA на desktop/mobile;
- вкладки не исчезают из-за длинных русских/английских подписей;
- страницы Studio используют один shell и semantic tokens.

### PAGE-STUDIO-STATISTICS: Статистика Studio

Статус: PLANNED
Route: `/studio/statistics`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0357`

Назначение: показать динамику дохода автора по событиям платформы.

Основные блоки:

- график динамики дохода;
- фильтр периода;
- фильтр источника: все источники, донаты, партнёрские товары;
- summary cards по выбранному периоду;
- empty state без fake metrics.

Acceptance criteria:

- деньги отображаются из minor units через shared money formatter;
- график не называется доступным балансом и не ведёт к выплатам;
- при отсутствии событий есть честное пустое состояние;
- loading/error states не ломают layout графика.

### PAGE-STUDIO-EVENTS: Последние события

Статус: PLANNED
Route: `/studio/events`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0358`

Назначение: единая лента событий автора.

Подвкладки:

- все события;
- донаты;
- подписки на каналы;
- покупки партнёрских товаров.

Основные блоки:

- feed событий с временем, источником и типом;
- статус подключённых ботов YouTube, Twitch и Telegram;
- empty state для неподключённых каналов;
- retry/error state для ingestion задержек.

Acceptance criteria:

- channel subscription events приходят только через backend/bot integration слой;
- UI не показывает raw platform payload или secrets;
- feed поддерживает дедупликацию событий;
- покупки партнёрских товаров не раскрывают лишние данные покупателя.

### PAGE-STUDIO-DONATION-SETTINGS: Настройка донатов

Статус: PLANNED
Route: `/studio/donation-settings`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0359`

Назначение: управлять правилами донатов до попадания события в публичную страницу и OBS.

Основные блоки:

- presets сумм и min/max;
- настройки сообщения: максимальная длина, ссылки, repeated text;
- аудиосообщения: категории и минимальная сумма;
- озвучка: категории, минимальная сумма, moderation mode;
- модерация: auto-approve, hold-for-review, blocked;
- spam-filter policy.

Acceptance criteria:

- настройки валидируются backend-ом;
- held/moderated donation не уходит в OBS alert до разрешения;
- thresholds используют minor units и currency;
- все тексты и ошибки идут через i18n.

### PAGE-STUDIO-STORE: Настройки витрины автора

Статус: PLANNED
Route: `/studio/store`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0354`, `FF-0360`

Назначение: настроить витрину автора в Studio.

Основные блоки:

- статус витрины;
- внешний вид витрины через safe skin preset и semantic tokens;
- секции товаров и подборок;
- порядок секций;
- visibility rule: `always`, `live_only`, `offline_only`;
- ручной live-state MVP;
- preview public store.

Acceptance criteria:

- live-only секции видны публично только при `live`;
- paused/archived creator page не принимает публичные действия;
- partner disclosure виден, если используется партнёрский товар;
- скин витрины не меняет структуру, порядок обязательных блоков и i18n keys;
- нет drag-and-drop page builder.

### PAGE-STUDIO-PRODUCTS: Продукты для витрины

Статус: PLANNED
Route: `/studio/products`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0360`

Назначение: выбрать продукты, которые автор может использовать в своей витрине.

Основные блоки:

- список eligible products;
- фильтры: свои товары, партнёрские товары, категория, статус доступности;
- disclosure для партнёрских товаров;
- действие добавить в витрину или подборку.

Acceptance criteria:

- hidden/rejected/unavailable products нельзя добавить в публичную витрину;
- партнёрский товар явно помечен;
- автор не видит private seller data;
- выбор продукта синхронизируется с `/studio/store`.

### PAGE-STUDIO-COLLECTIONS: Подборки автора

Статус: PLANNED
Route: `/studio/collections`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0360`

Назначение: собрать подборки автора для витрины и live-only блоков.

Основные блоки:

- список авторских подборок;
- создание/редактирование подборки;
- добавление товаров и авторов;
- порядок элементов;
- preview в скине витрины.

Acceptance criteria:

- подборка имеет owner и visibility;
- подборку можно использовать как секцию витрины автора;
- hidden products не показываются публично;
- длинные названия не ломают карточки.

### PAGE-STUDIO-WIDGETS: Виджеты и правила алертов

Статус: PLANNED
Route: `/studio/widgets`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0355`, `FF-0356`, `FF-0361`

Назначение: выбрать тип виджета, создать виджет под конкретные события и настроить его ассеты.

Основные категории:

- оповещения;
- статистика;
- сбор средств;
- товары;
- цикличные промо;
- прочие preset-типы.

Основные trigger rules:

- конкретный товар;
- группа товаров;
- подборка;
- покупка спонсорского товара;
- сумма доната или порог суммы.

Acceptance criteria:

- preview использует mock events;
- каждый preset показывает supported events и ограничения;
- image/gif/animation assets идут через безопасный file flow;
- public widget URL read-only;
- `prefers-reduced-motion` учитывается.

### PAGE-STUDIO-WIDGET-GROUPS: Группы виджетов

Статус: PLANNED
Route: `/studio/widget-groups`
Раздел: Creator
Роль пользователя: streamer/creator
Версия появления: v0.3.5
Связанные задачи: `FF-0356`

Назначение: сгруппировать виджеты и зоны размещения для OBS.

Основные блоки:

- список групп;
- создание группы;
- зоны placement: center, top_right, top_left, bottom_right, bottom_left, custom;
- preview группы;
- token create/rotate visible once.

Acceptance criteria:

- донаты можно расположить в центре;
- purchase/sponsored alerts можно расположить справа сверху;
- group token не даёт менять настройки;
- нет drag-and-drop редактора OBS-сцены.

### PAGE-CREATOR-STORE: Публичная витрина стримера

Статус: PLANNED
Route: `/creators/[slug]/store`
Раздел: Public
Роль пользователя: guest, buyer, streamer
Версия появления: v0.3.5
Связанные задачи: `FF-0354`

Назначение: показать товары и подборки автора с live-only правилами.

Acceptance criteria:

- live-only карточки и подборки появляются только во время прямой трансляции;
- offline state не выглядит как ошибка;
- hidden/unavailable products не продаются;
- структура страницы не меняется от выбранного скина.

### PAGE-WIDGET-PURCHASE: Purchase alert widget

Статус: PLANNED
Route: `apps/widget /purchase-alert?token=...`
Раздел: Widget
Роль пользователя: OBS/browser source
Версия появления: v0.3.5
Связанные задачи: `FF-0355`, `FF-0356`

Назначение: показать покупку товара или спонсорского товара в OBS.

Acceptance criteria:

- payload не раскрывает лишние персональные данные покупателя;
- token read-only;
- alert route поддерживает dedupe и reconnect;
- placement управляется Studio group config.

## PAGE-HOME: Главная

Статус: IMPLEMENTED
Route: `/`
Раздел: Public
Роль пользователя: guest, buyer, creator, seller
Версия текущего spec: v0.3.5, UX-TASK-036
Не создавать до: —
Связанные документы: `README.md`, `ROADMAP.md`, `docs/UX_PLAN.md`, `docs/UI_UX_TRACKER.md`
Связанные компоненты: `AppTopBar`, `Button`, `Badge`, `Panel`, `ThemeSwitcher`

### Назначение страницы

Открывать FanFuel сразу как marketplace обычных цифровых товаров. Creator-commerce механики усиливают покупку, но не превращают главную в лендинг для авторов или магазин только для стримеров.

### Пользовательская цель

Сразу искать и выбирать цифровые товары, видеть реальные категории, продавцов и условия. При желании пользователь переключается на вкладки автора или продавца, не покидая страницу.

### Бизнес-цель

Довести покупателя до поиска, категории и карточки товара; отдельно объяснить авторам и продавцам их пути во вторичных вкладках.

### Когда пользователь попадает сюда

При открытии корневого URL, из бренда в topbar, из внешних ссылок.

### Основные блоки страницы

- `/` рендерит ту же marketplace-поверхность, что и `/marketplace`, без HTTP/client redirect.
- Под хэдером расположен доступный переключатель `Покупатель / Автор / Продавец`; начальное состояние всегда `Покупатель`, независимо от ролей аккаунта.
- Покупательский режим начинается с торговой навигации: поиск или явный путь к поиску, общие категории цифровых товаров, реальные товарные карточки и редакционные направления.
- Товары для стримеров, OBS и creator assets остаются важным направлением, но не определяют весь ассортимент.
- Вкладки автора и продавца содержат краткие специализированные пути и честно обозначают ещё не реализованные возможности.
- Большой platform explainer, role-first hero, длинная цепочка маркетинговых секций и общий финальный CTA не входят в покупательский режим.

### Основные действия пользователя

- Искать товар.
- Открыть категорию или товар.
- Переключить вкладку аудитории.
- Войти или открыть профиль из хедера.

### Данные, которые нужны странице

- Категории и реальные опубликованные товары из marketplace API.
- i18n copy для трёх режимов и состояний.
- Никаких frontend-only fake products, fake metrics, fake reviews, fake promocodes или fake collections.

### Состояния страницы

#### Loading

Skeleton торговых блоков без подмены страницы лендингом.

#### Empty

Показать честное пустое состояние с переходом к категориям или seller onboarding, не фальшивые товары.

#### Error

Сохранить навигацию, переключатель и retry; не заменять ошибку маркетинговым лендингом.

#### Success

Не применяется.

#### Unauthorized

Не применяется.

#### Forbidden

Не применяется.

#### Mobile

Первый экран должен показывать marketplace-навигацию и начало реального ассортимента без горизонтального overflow.

#### Desktop

Не фиксировать hero в схему `copy + декоративный preview`; композиция должна приоритизировать поиск, категории и реальные товары.

### UX-правила

Не использовать агрессивную монетизационную риторику. Не обещать safe deal как абсолютную гарантию. Не давить поддержкой автора на покупку.

### UI-правила

Semantic tokens, light/dark и доступность обязательны. Не превращать страницу в generic SaaS landing, промо авторов или streamer-only каталог.

### Что уже реализовано

Корневой route `/` уже переиспользует marketplace screen, переключатель аудиторий и часть торговых блоков. По обратной связи продуктовый контракт считается выполненным лишь частично.

### Что нужно изменить

Выполнить UX-TASK-036: убрать landing/streamer-only дрейф, закрепить обычного покупателя и общий ассортимент, синхронизировать `/` и `/marketplace`, затем провести product review и regression QA.

### Что не нужно делать сейчас

Не возвращать generic SaaS landing, общую презентацию FanFuel или каталог только для авторов/стримеров. Не начинать полный визуальный редизайн до UX-TASK-037.

### Acceptance criteria

- За 5 секунд обычный покупатель понимает, что перед ним marketplace цифровых товаров, а не лендинг.
- Покупатель выбран по умолчанию; вкладки автора и продавца доступны с клавиатуры и не назначают роли.
- В первом viewport видны поиск/путь к поиску, категории или реальные товары.
- Минимум одно видимое направление каталога не зависит от creator/streamer use case.
- Нет фиктивных товаров, метрик, отзывов, промокодов и подборок.
- `ru/en`, light/dark, reduced motion и 320/390/768/1440 работают с данными, empty и error.

### Зависимости

Marketplace API для динамических блоков.

### Комментарии для будущих агентов

Если добавляете новый блок с пользовательским текстом, сначала обновите i18n и tracker.

## PAGE-AUTH: Единая авторизация

Статус: IMPLEMENTED. Route: `/auth`. Версия: v0.3.5. TASK-ID: UX-TASK-035.

Цель: убрать выбор между отдельными страницами входа/регистрации и провести пользователя по одному email-first сценарию. Первый шаг принимает только email. Существующий аккаунт продолжает парольным входом; новый email проходит отправку и проверку одноразового кода, затем создание пароля и аккаунта. Имя платформы остаётся на `/auth/name`.

Состояния: проверка текущей сессии; email; password login; send code; code verification; create password; loading; inline validation; rate limit; expired/invalid/exhausted code; email delivery failure; account-created race; success. С каждого шага можно безопасно вернуться к email; пароль/код/token не попадают в URL или browser storage.

Mobile: одна колонка, input text от 16px, touch target от 44px, CTA не перекрывается клавиатурой. Desktop: narrow auth surface. Light/dark только через semantic tokens; все тексты ru/en. `autocomplete=username/current-password/new-password/one-time-code` выбирается по текущему шагу.

Acceptance criteria: новый аккаунт нельзя создать без подтверждённого email; повтор/expiry/лимит кода обрабатываются явно; `flow=creator` сохраняется; старые `/auth/login` и `/auth/register` redirect на `/auth`; телефон/username не обещаются до backend поддержки.

## PAGE-AUTH-LOGIN: Вход

Статус: DEPRECATED
Route: `/auth/login`
Раздел: Auth
Роль пользователя: guest
Версия появления: v0.1
Не создавать до: —
Связанные документы: `docs/SECURITY.md`, `docs/I18N.md`

Runtime-контракт: route не рендерит отдельную форму и перенаправляет на PAGE-AUTH, сохраняя поддерживаемый `flow=creator`. Остальная секция ниже оставлена как историческая спецификация до объединения auth flow.
Связанные компоненты: `AppTopBar`, `Button`, `Input`, `Alert`

### Назначение страницы

Совместимый redirect на `/auth` с сохранением `flow=creator`.

### Пользовательская цель

Ввести email/password и попасть в нужный кабинет.

### Бизнес-цель

Снизить friction входа и не раскрывать данные о существовании аккаунта.

### Когда пользователь попадает сюда

Из topbar, после unauthorized state, при попытке открыть закрытую страницу.

### Основные блоки страницы

- Заголовок.
- Email/password форма.
- CTA входа.
- Ссылка на регистрацию.
- Future: восстановление пароля.

### Основные действия пользователя

- Войти.
- Перейти к регистрации.
- Future: восстановить пароль.

### Данные, которые нужны странице

- Auth API `/api/v1/auth/login`.
- i18n ошибки API.

### Состояния страницы

#### Loading

Disabled submit + label loading.

#### Empty

Не применяется.

#### Error

Показывать локализованную ошибку рядом с формой.

#### Success

Если имя платформы задано, пользователь попадает в marketplace или creator flow. Если имя не задано — на `/auth/name`. Уже авторизованный пользователь получает такой же редирект.

#### Unauthorized

Это сама unauthorized entry page.

#### Forbidden

Не применяется.

#### Mobile

Форма одна колонка, label видимый, кнопки не переполняют ширину.

#### Desktop

Narrow auth layout.

### UX-правила

Не различать "email не найден" и "пароль неверный" в публичном тексте.

### UI-правила

Label обязателен, placeholder не заменяет label.

### Что уже реализовано

Форма email/password, loading submit, i18n ошибки, компактный auth layout, учёт шага имени и redirect уже авторизованного пользователя.

### Что нужно изменить

Добавить forgot password после backend flow, role-aware next step после onboarding, Alert component и skeleton/focus QA.

### Что не нужно делать сейчас

Не добавлять OAuth без отдельного решения.

### Acceptance criteria

- Ошибки не раскрывают лишние данные.
- После входа пользователь попадает в понятный next step.
- Тексты через i18n.

### Зависимости

Password reset и session policy.

### Комментарии для будущих агентов

Не менять auth storage policy без ADR.

## PAGE-AUTH-REGISTER: Регистрация

Статус: DEPRECATED
Route: `/auth/register`
Раздел: Auth
Роль пользователя: guest
Версия появления: v0.1
Не создавать до: —
Связанные документы: `docs/SECURITY.md`, `docs/I18N.md`, `docs/API_PLAN.md`
Связанные компоненты: `AppTopBar`, `Button`, `Input`, `Alert`

Runtime-контракт: route не рендерит отдельную форму и перенаправляет на PAGE-AUTH, сохраняя поддерживаемый `flow=creator`. Остальная секция ниже оставлена как историческая спецификация до объединения auth flow.

### Назначение страницы

Совместимый redirect на `/auth` с сохранением `flow=creator`.

### Пользовательская цель

Быстро зарегистрироваться по email и паролю.

### Бизнес-цель

Снизить friction регистрации и не заставлять пользователя выбирать роль до знакомства с продуктом.

### Когда пользователь попадает сюда

Из главной, checkout, protected routes или creator flow.

### Основные блоки страницы

- Email/password форма.
- CTA создания аккаунта.
- Ссылка на вход.

### Основные действия пользователя

- Создать аккаунт.
- Перейти во вход.

### Данные, которые нужны странице

- Auth API `/api/v1/auth/register`.
- i18n ошибки API.

### Состояния страницы

#### Loading

Disabled submit + loading label.

#### Empty

Не применяется.

#### Error

Локализованные validation/API errors.

#### Success

Переход на `/auth/name`. В creator flow параметр `flow=creator` сохраняется.

#### Unauthorized

Не применяется.

#### Forbidden

Публичная регистрация не может выдать admin/support/moderator.

#### Mobile

Форма одна колонка, поля и кнопка читаемы.

#### Desktop

Narrow auth layout.

### UX-правила

Не просить роль, имя платформы, публичный ник или username на этом шаге.

### UI-правила

Форма остаётся минимальной; onboarding не встраивается в регистрацию.

### Что уже реализовано

Email/password, базовая роль buyer, переход на шаг имени, i18n ошибки.

### Что нужно изменить

Отдельная форма регистрации больше не развивается: подтверждение email реализовано внутри PAGE-AUTH.

### Что не нужно делать сейчас

Не добавлять admin/support/moderator как публичные варианты.

### Acceptance criteria

- Public registration не выдаёт admin.
- Регистрация не содержит выбор роли.
- После создания аккаунта пользователь попадает на шаг имени.
- Тексты и ошибки через i18n.

### Зависимости

PAGE-AUTH и email verification backend реализованы; раздел сохранён только для истории deprecated route.

### Комментарии для будущих агентов

Роли автора/продавца включаются отдельными mode activation flows, а не регистрацией.

## PAGE-AUTH-NAME: Имя после регистрации

Статус: NEEDS_REWORK
Route: `/auth/name`
Раздел: Auth
Роль пользователя: authenticated
Версия появления: v0.1
Не создавать до: —
Связанные документы: `docs/SECURITY.md`, `docs/I18N.md`, `docs/API_PLAN.md`
Связанные компоненты: `AppTopBar`, `Button`, `Input`, `Alert`

### Назначение страницы

Задать имя пользователя на платформе после создания базового аккаунта.

### Пользовательская цель

Понять, как FanFuel будет обращаться к пользователю, и продолжить к своей цели.

### Бизнес-цель

Убрать выбор роли и имя из регистрации, но не оставлять аккаунт без понятного имени.

### Когда пользователь попадает сюда

Сразу после регистрации, а также после входа, если `profile_name_confirmed_at` ещё не заполнен.

### Основные блоки страницы

- Заголовок и объяснение смысла имени.
- Поле имени.
- CTA продолжения.
- Локализованная ошибка.

### Основные действия пользователя

- Ввести имя.
- Сохранить имя и продолжить.

### Данные, которые нужны странице

- `GET /api/v1/auth/me`.
- `PATCH /api/v1/me/profile`.
- Текущие `slug` и `bio`, которые передаются без изменений.

### Состояния страницы

#### Loading

Submit disabled до завершения проверки сессии.

#### Empty

Поле пустое, submit заблокирован браузерной валидацией.

#### Error

Локализованная ошибка рядом с формой.

#### Success

Имя сохраняется, `name_confirmed_at` заполняется, пользователь переходит в marketplace или обратно в creator flow.

#### Unauthorized

Редирект на login с сохранением `flow=creator`.

#### Mobile

Одна колонка, видимый label, кнопка не переполняет ширину.

#### Desktop

Narrow auth layout.

### UX-правила

Страница явно объясняет, что имя платформы не занимает публичный ник и не создаёт адрес витрины.

### UI-правила

Использовать существующий auth layout и semantic tokens; не добавлять выбор роли.

### Что уже реализовано

Обязательный шаг имени, сохранение через profile API, редиректы регистрации/входа, i18n ru/en.

### Что нужно изменить

Не менять смысл имени платформы; подтверждение email уже выполняется до создания аккаунта внутри PAGE-AUTH.

### Acceptance criteria

- После регистрации пользователь попадает на `/auth/name`.
- Вход не пропускает шаг, пока имя не сохранено.
- Имя не смешивается с публичным ником и адресом витрины.
- Все тексты через i18n.

### Зависимости

PAGE-AUTH с подтверждением email реализована.

### Комментарии для будущих агентов

Не добавлять сюда role selection или username/slug выбор.

## PAGE-ME-PROFILE: Профиль и временный mini studio

Статус: NEEDS_REWORK
Route: `/me/profile`
Раздел: Auth
Роль пользователя: authenticated, multi-role
Версия появления: v0.1
Не создавать до: —
Связанные документы: `docs/INFORMATION_ARCHITECTURE.md`, `docs/UI_UX_TRACKER.md`
Связанные компоненты: `AppTopBar`, `ThemeSettingsPanel`, `Panel`, `Button`, `GoalCard`, `WidgetPreviewContainer`

### Назначение страницы

Сейчас страница служит временным центром аккаунта, studio controls и seller settings.

### Пользовательская цель

Отредактировать профиль, тему, публичную страницу автора, цели, widgets или seller profile.

### Бизнес-цель

На v0.1-v0.2 дать рабочий MVP без полноценной IA кабинетов.

### Когда пользователь попадает сюда

После login/register, из topbar, из unauthorized redirects.

### Основные блоки страницы

- Sidebar с ролями.
- Theme settings.
- Account profile form.
- Creator profile form.
- Donation goals form/list.
- Widget create/rotate token.
- Seller profile form.

### Основные действия пользователя

- Сохранить профиль.
- Выйти.
- Открыть публичную страницу.
- Создать цель.
- Создать/ротировать widget token.
- Обновить seller profile.

### Данные, которые нужны странице

- `/api/v1/auth/me`.
- `/api/v1/me/profile`.
- `/api/v1/me/preferences`.
- `/api/v1/studio/profile`.
- `/api/v1/studio/goals`.
- `/api/v1/studio/widgets`.
- `/api/v1/seller/profile`.

### Состояния страницы

#### Loading

Сейчас plain text. Нужно заменить на skeleton layout.

#### Empty

Для целей/widgets показывать EmptyState с next action.

#### Error

Ошибка сейчас общая; нужна привязка к секции.

#### Success

Success message не должен перекрывать следующую форму.

#### Unauthorized

Показывать login CTA.

#### Forbidden

Для отсутствующей роли не показывать секцию, но объяснять где добавить роль в будущем.

#### Mobile

Sidebar уходит вверх, формы одна колонка, token input не ломает layout.

#### Desktop

Двухколоночный settings layout допустим только временно.

### UX-правила

Не добавлять новые крупные функции сюда. Новые Studio/Seller/Buyer flows должны получать отдельные pages.

### UI-правила

Сохранить semantic tokens, заменить inline list patterns на shared components постепенно.

### Что уже реализовано

Рабочие profile/studio/seller forms, создание goals/widgets, theme settings.

### Что нужно изменить

Разделить на `/buyer`, `/studio`, `/seller`, `/me/settings` или equivalent по IA v0.3. В текущем topbar `/me/settings` и `/studio` показываются как "скоро", пока отдельные страницы не реализованы.

### Что не нужно делать сейчас

Не переписывать весь кабинет без UX-TASK-007.

### Acceptance criteria

- `/me/profile` остаётся стабильным временным fallback.
- Новые flows не добавляются в эту страницу.
- Нет регрессии v0.2 Donate MVP.

### Зависимости

Role switcher, dashboard layout, route guards.

### Комментарии для будущих агентов

Эта страница является главным UX-долгом текущей реализации.

## PAGE-CREATOR-PUBLIC: Публичная страница стримера

Статус: PARTIAL
Route: `/creators/[slug]`
Раздел: Public
Роль пользователя: guest, buyer, streamer
Версия появления: v0.2
Не создавать до: —
Связанные документы: `docs/PAYMENTS.md`, `docs/DOMAIN_MODEL.md`, `docs/UI_STATES.md`
Связанные компоненты: `AppTopBar`, `Button`, `Panel`, `Badge`, `GoalCard`, `DonationCard`

### Назначение страницы

Публичная страница автора, где зритель может понять автора и поддержать его донатом.

### Пользовательская цель

Открыть автора, увидеть цели, отправить донат, посмотреть историю поддержки.

### Бизнес-цель

Доказать Donate MVP и подготовить основу для creator store.

### Когда пользователь попадает сюда

По ссылке автора, из marketplace/store, из donation alert/share.

### Основные блоки страницы

- Creator hero: avatar/banner/title/description/status.
- Donation form.
- Donation goals.
- Donation history.
- Top donors.
- Future: creator store, promo codes, partner disclosure.

### Основные действия пользователя

- Отправить донат.
- Выбрать цель.
- Включить анонимность.
- Завершить mock payment в dev.
- Future: открыть товар из витрины.

### Данные, которые нужны странице

- `/api/v1/creators/{slug}`.
- `/api/v1/creators/{slug}/goals`.
- `/api/v1/creators/{slug}/donations`.
- `/api/v1/donations`.
- `/api/v1/mock/payments/{id}/succeed` только dev.

### Состояния страницы

#### Loading

Skeleton creator hero + donation form placeholder.

#### Empty

Нет целей: не показывать пустой блок или показать мягкий текст. Нет донатов: EmptyState с "Пока нет донатов".

#### Error

Если creator не найден, показать not found state и ссылку на главную.

#### Success

После успешного доната показать payment status и обновить историю/цель.

#### Unauthorized

Донат разрешён guest, если backend policy позволяет.

#### Forbidden

Blocked/hidden creator не должен принимать донаты.

#### Mobile

Donation form после hero, sticky CTA допустим только после QA.

#### Desktop

Hero/content слева, donation form справа.

### UX-правила

Донат должен быть быстрым. Mock payment помечать как dev-only в будущем UI, если остаётся доступен.

### UI-правила

Не делать страницу похожей на casino/gaming neon. Автор должен быть главным объектом первого viewport.

### Что уже реализовано

Creator hero, donation form, goals, history, top donors, mock payment completion.

### Что нужно изменить

Добавить banner/avatar upload flow после storage, улучшить loading/empty/error states, вынести donate route decision.

### Что не нужно делать сейчас

Не добавлять store blocks до v0.4 и marketplace domain.

### Acceptance criteria

- Донат создаётся idempotently.
- Payment status понятен.
- Цели обновляются после successful payment.
- Пустые states не выглядят как ошибка.

### Зависимости

Storage upload, marketplace, real payment provider review.

### Комментарии для будущих агентов

Публичная страница автора не должна стать dumping ground для всех creator features.

## PAGE-CREATOR-DONATE: Донат-страница стримера

Статус: PARTIAL
Route: `/creators/[slug]/donate`
Раздел: Public
Роль пользователя: guest, buyer
Версия появления: v0.2
Не создавать до: отдельный route только после UX decision
Связанные документы: `docs/PAYMENTS.md`, `docs/UX_RULES.md`
Связанные компоненты: `Button`, `Input`, `Select`, `Alert`, `WidgetPreviewContainer`

### Назначение страницы

Сфокусированный donate flow без витрины и длинного профиля автора.

### Пользовательская цель

Быстро отправить донат и понять статус оплаты.

### Бизнес-цель

Увеличить conversion donation flow для ссылок из OBS/соцсетей.

### Когда пользователь попадает сюда

По прямой donate-ссылке автора, из CTA публичной страницы.

### Основные блоки страницы

- Мини hero автора.
- Сумма/валюта.
- Имя/анонимность.
- Сообщение.
- Выбор цели.
- Preview alert, если доступен.
- Payment status.

### Основные действия пользователя

Отправить донат, завершить оплату, вернуться к автору.

### Данные, которые нужны странице

Creator summary, active goals, donation/payment APIs.

### Состояния страницы

#### Loading

Skeleton формы и creator summary.

#### Empty

Если нет целей, select показывает "Без цели".

#### Error

Validation у поля; payment error отдельным Alert.

#### Success

Спасибо + статус оплаты + ссылка на автора.

#### Unauthorized

Guest donation допустим по policy.

#### Forbidden

Donations disabled/creator blocked.

#### Mobile

Форма одна колонка, CTA виден без перекрытия.

#### Desktop

Narrow checkout-like layout.

### UX-правила

Один главный CTA. Ошибки оплаты писать человеческим языком.

### UI-правила

Не добавлять marketplace recommendations в donate flow.

### Что уже реализовано

Логика доната реализована внутри `/creators/[slug]`.

### Что нужно изменить

Решить, нужен ли отдельный route в v0.3 или оставить embedded flow.

### Что не нужно делать сейчас

Не создавать route без задачи и redirect strategy.

### Acceptance criteria

Если route создаётся, он использует тот же domain flow и не дублирует бизнес-логику.

### Зависимости

Donate MVP, payment provider abstraction.

### Комментарии для будущих агентов

Статус `PARTIAL` означает "flow есть", а не "route существует".

## PAGE-MARKETPLACE: Маркетплейс

Статус: IMPLEMENTED
Route: `/marketplace`
Раздел: Marketplace
Роль пользователя: guest, buyer
Версия текущего spec: v0.3.5, UX-TASK-036
Не создавать до: реализовано в v0.3
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/API_PLAN.md`, `docs/UX_RULES.md`
Связанные компоненты: `AppTopBar`, `ProductCard`, `Tabs`, `Badge`, `EmptyState`, `Skeleton`, `Pagination`

### Назначение страницы

Дать обычному покупателю общий каталог цифровых товаров и услуг с понятными продавцами, условиями и аккуратной creator attribution там, где она реально есть.

### Пользовательская цель

Найти товар, сравнить условия, открыть карточку.

### Бизнес-цель

Запустить marketplace foundations без рискованных категорий и без рекламной биржи.

### Когда пользователь попадает сюда

Из главной, role landing, creator store, поиска и topbar search.

### Основные блоки страницы

- Общий переключатель `Покупатель / Автор / Продавец`, покупатель по умолчанию.
- В покупательском режиме: компактная marketplace-навигация, поиск/переход к поиску, реальные категории, реальные product shelves/cards и редакционные направления покупок.
- Ассортимент описывается как цифровые товары в целом; creator/OBS assets — одна из категорий.
- Creator attribution, поддержка автора и safe deal показываются в релевантном контексте карточки/товара, а не как длинная обязательная презентация до каталога.
- Вкладка автора: краткий путь к витрине, рекомендациям, донатам, целям и OBS с честной маркировкой planned-функций.
- Вкладка продавца: краткий путь от публикации товара к заказу, модерации и будущему каналу через авторов.
- Loading, empty, error и search no results.
- Legal/category warning для restricted категорий без показа внутренних маркеров пользователю.

### Основные действия пользователя

Искать через доступный в первом viewport вход, открыть товар, перейти в категорию или переключить аудиторию. Фильтры живут в каталоге, а не скрыто на главной.

### Данные, которые нужны странице

Категории, список товаров, данные продавца, цена, рейтинг, формат выдачи, признак safe deal.

### Состояния страницы

#### Loading

Skeleton grid.

#### Empty

Пояснить, что в категории пока нет товаров, и предложить изменить фильтр.

#### Error

Retry action, не скрывать navigation.

#### Success

Главная маркетплейса загружена: первый экран, поиск, ленты, блоки категорий, карточки доверия и товарная лента.

#### Unauthorized

Browsing allowed for guests.

#### Forbidden

Restricted category hidden or explained.

#### Mobile

Первый экран показывает переключатель, marketplace-навигацию и начало реального ассортимента. Никакая role-презентация не выталкивает товары ниже экрана.

#### Desktop

Композиция приоритизирует торговую навигацию и реальные товары. Не закреплять обязательную схему `copy + demo автора`; не дублировать поиск.

### UX-правила

Карточка товара показывает media slot 16:10, category label, название, короткое описание, цену, продавца, рейтинг/нового продавца и максимум 1-2 бейджа. Партнёрская/авторская поддержка показывается отдельным бейджем только при наличии данных `affiliate_percent_bps`.

### UI-правила

Не показывать фиктивные товары. Если нет данных API, страница показывает честное пустое состояние.

### Что уже реализовано

Реализованы общий screen для `/` и `/marketplace`, API-загрузка товаров, marketplace destinations, product cards, состояния и переключатель аудитории. Текущая композиция считается частично соответствующей: накопленные creator-commerce/landing блоки допускают неверное чтение главной.

### Что нужно изменить

Выполнить UX-TASK-036 и product review. После стабилизации позже улучшить мобильные фильтры и destination routes. `/safe-deal` остаётся коротким пользовательским объяснением без provider-specific обещаний; подробные правила требуют payment/legal review.

### Что не нужно делать сейчас

Не делать статический каталог без backend. Не возвращать landing-first или streamer-only структуру. Не создавать creator store, реальный promo flow или real safe deal page без изменения статуса и зависимостей.

### Acceptance criteria

- `/marketplace` и `/` имеют одинаковый marketplace-first контракт.
- Покупатель выбран по умолчанию, author/seller tabs вторичны и доступны.
- Общий ассортимент не ограничен creator/streamer товарами.
- Поиск и категории доступны в первом viewport, реальные товары появляются без длинной презентации платформы.
- Empty/error/loading states есть; risky categories недоступны без review.
- Product review и regression QA UX-TASK-036 пройдены.

### Зависимости

ProductCategory, Product, seller profile, moderation.

### Комментарии для будущих агентов

Marketplace — ближайший крупный UX milestone, но не должен появляться как набор заглушек.

## PAGE-PRODUCT: Карточка товара

Статус: IMPLEMENTED
Route: `/marketplace/products/[slug]`
Раздел: Marketplace
Роль пользователя: guest, buyer
Версия появления: v0.3
Не создавать до: реализовано в v0.3
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UX_WRITING.md`
Связанные компоненты: `ProductCard`, `Badge`, `Panel`, `OrderStatusCard`, `Alert`

### Назначение страницы

Показать товар, условия, продавца и процесс покупки.

### Пользовательская цель

Понять, что покупает, кто продавец, сколько стоит, какие условия и как защищена покупка.

### Бизнес-цель

Конвертировать просмотр в безопасный order.

### Когда пользователь попадает сюда

Из marketplace, категории, creator store, promo link.

### Основные блоки страницы

- Медиа/preview.
- Название, цена, CTA.
- Seller card.
- Terms/delivery.
- Safe deal explanation.
- Creator support attribution, если есть.
- Reviews.
- Similar products позже.

### Основные действия пользователя

Купить, применить промокод позже, открыть seller profile, открыть reviews.

### Данные, которые нужны странице

Product snapshot, seller summary, category, media, price, rating, safe_deal_required, affiliate percent.

### Состояния страницы

#### Loading

Skeleton media + info.

#### Empty

Не применяется.

#### Error

Not found/hidden/restricted states.

#### Success

Data loaded, CTA enabled.

#### Unauthorized

Guest может смотреть, покупка может потребовать login по policy.

#### Forbidden

Restricted product/category.

#### Mobile

CTA не перекрывает legal/safe deal text.

#### Desktop

Sticky purchase summary допустим.

### UX-правила

Цена и условия видны до CTA. Safe deal объясняется процессом.

### UI-правила

Не скрывать продавца и delivery terms в accordion по умолчанию.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Добавить после Product API.

### Что не нужно делать сейчас

Не создавать fake product page.

### Acceptance criteria

- Покупатель видит цену, продавца, условия и safe deal.
- CTA один главный.
- Тексты через i18n.

### Зависимости

Products, reviews, checkout/order.

### Комментарии для будущих агентов

Юридические слова про гарантии помечать `LEGAL_REVIEW_REQUIRED`.

## PAGE-CHECKOUT: Checkout товара

Статус: IMPLEMENTED
Route: `/checkout/[productId]`
Раздел: Marketplace
Роль пользователя: buyer
Версия появления: v0.3
Не создавать до: реализовано в v0.3
Связанные документы: `docs/PAYMENTS.md`, `docs/SECURITY.md`
Связанные компоненты: `OrderStatusCard`, `DealTimeline`, `Alert`, `Button`, `Badge`

### Назначение страницы

Безопасно оформить покупку товара.

### Пользовательская цель

Проверить состав заказа, цену, скидку, вклад автору и оплатить.

### Бизнес-цель

Создать order/payment/deal без дублей и путаницы статусов.

### Когда пользователь попадает сюда

После CTA покупки на product/creator store.

### Основные блоки страницы

- Order summary.
- Price breakdown.
- Promo code.
- Creator support attribution.
- Safe deal explanation.
- Payment method/confirmation.
- Terms acknowledgement.

### Основные действия пользователя

Применить промокод, подтвердить заказ, оплатить, вернуться к товару.

### Данные, которые нужны странице

Order draft, product snapshot, seller, creator attribution, promo validation, payment status.

### Состояния страницы

#### Loading

Skeleton order summary.

#### Empty

Order draft expired: предложить вернуться к товару.

#### Error

Payment/order errors с retry.

#### Success

Переход на order page.

#### Unauthorized

Login/register inline или redirect.

#### Forbidden

Blocked user/product unavailable.

#### Mobile

Price summary виден до кнопки оплаты.

#### Desktop

Two-column checkout layout.

### UX-правила

Финансовое действие требует явного подтверждения.

### UI-правила

Не показывать provider-specific details, если они не нужны пользователю.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Спроектировать после API order draft.

### Что не нужно делать сейчас

Не подключать реальные платежи до v0.5 review.

### Acceptance criteria

- Idempotency key используется для создания order/payment.
- Деньги форматируются helper.
- Status payment/deal/order не смешиваются.

### Зависимости

Order, PaymentProvider, SafeDeal mock.

### Комментарии для будущих агентов

Если меняется money breakdown, обновить `docs/PAYMENTS.md` и ADR.

## PAGE-BUYER-ORDER: Страница заказа

Статус: IMPLEMENTED
Route: `/buyer/orders/[id]`
Раздел: Buyer
Роль пользователя: buyer
Версия появления: v0.3
Не создавать до: реализовано в v0.3 mock lifecycle
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UI_STATES.md`
Связанные компоненты: `OrderStatusCard`, `DealTimeline`, `Alert`, `Button`

### Назначение страницы

Показать покупателю статус заказа и следующий шаг.

### Пользовательская цель

Понять, что происходит с заказом, что нужно сделать и какие сроки.

### Бизнес-цель

Снизить поддержку и подготовить safe deal/dispute lifecycle.

### Когда пользователь попадает сюда

После checkout, из истории покупок, из уведомлений.

### Основные блоки страницы

- Order summary.
- Status card.
- Safe deal timeline.
- Seller/contact rules.
- Files/delivery result.
- Actions: confirm, open dispute, review.

### Основные действия пользователя

Подтвердить получение, открыть спор, оставить отзыв, скачать файл если разрешено.

### Данные, которые нужны странице

Order, deal, payment, product snapshot, seller, deadlines, allowed actions.

### Состояния страницы

#### Loading

Skeleton status/timeline.

#### Empty

Order not found.

#### Error

Retry и request id.

#### Success

Status loaded and next action clear.

#### Unauthorized

Login required.

#### Forbidden

Order belongs to another user.

#### Mobile

Timeline compact, actions sticky only if не перекрывает сроки.

#### Desktop

Summary + timeline + side actions.

### UX-правила

Пользователь всегда видит следующий шаг и deadline.

### UI-правила

Статус не передаётся только цветом.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Добавить в v0.3 после order API.

### Что не нужно делать сейчас

Не делать dispute UI до v0.7.

### Acceptance criteria

- Buyer видит только свой заказ.
- Order/deal/payment statuses разделены.
- Опасные действия подтверждаются.

### Зависимости

Order lifecycle, deal events, file access.

### Комментарии для будущих агентов

Если добавляется download, проверить private file permissions.

## PAGE-STUDIO-DASHBOARD: Studio shell

Статус: PLANNED
Route: `/studio`
Раздел: Creator
Роль пользователя: streamer
Версия появления: v0.3.5
Не создавать до: v0.3.5 Studio shell task
Связанные документы: `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`
Связанные компоненты: `StudioTabs`, `DashboardPanel`, `StatCard`, `EmptyState`

### Назначение страницы

Единый рабочий кабинет автора: статистика, последние события, настройка донатов, витрина, виджеты, продукты и подборки.

### Пользовательская цель

Быстро понять состояние поддержки, событий и витрины, затем перейти к нужной вкладке Studio.

### Бизнес-цель

Сделать creator retention и подготовить creator-commerce workflows без смешивания с пользовательским профилем.

### Когда пользователь попадает сюда

После регистрации как streamer, из role switcher, из topbar или из `/me/profile` после включения режима автора.

### Основные блоки страницы

- Studio tab navigation.
- Быстрый overview: доход за период, последние события, активная цель.
- Статус ботов YouTube/Twitch/Telegram.
- Статус витрины и live-state.
- Widget connection status.
- Setup/checklist tasks.

### Основные действия пользователя

Открыть статистику, события, настройки донатов, витрину, виджеты, продукты или подборки.

### Данные, которые нужны странице

Current user, creator profile, metric summary, activity events, goals, widgets, store status, integration statuses.

### Состояния страницы

#### Loading

Dashboard skeleton panels.

#### Empty

Новый стример: checklist setup.

#### Error

Retry per panel.

#### Success

Overview loaded.

#### Unauthorized

Login required.

#### Forbidden

Нет роли streamer: предложить добавить роль/onboarding.

#### Mobile

Panels one column; sidebar becomes mobile nav.

#### Desktop

Sidebar + dashboard grid.

### UX-правила

Dashboard начинается с статуса автора и next actions, а глубокие графики живут во вкладке статистики.

### UI-правила

Не перегружать control-room стилем; вкладки должны оставаться стабильными при длинных переводах.

### Что уже реализовано

Часть функций есть в `/me/profile`.

### Что нужно изменить

Вынести Studio из профиля и разложить функции по вкладкам v0.3.5.

### Что не нужно делать сейчас

Не добавлять payouts, real balance, disputes, произвольный page builder или arbitrary widget code.

### Acceptance criteria

- Автор видит next action.
- Статистика, события, донаты, витрина, виджеты, продукты и подборки доступны за один переход.
- `/me/profile` не дублирует новую логику.

### Зависимости

Role switcher, dashboard layout, Studio metrics/events/settings APIs.

### Комментарии для будущих агентов

Это одна из первых UI задач v0.3.5 после отделения `/me/profile`.

## PAGE-SELLER-DASHBOARD: Seller dashboard

Статус: IMPLEMENTED
Route: `/seller`
Раздел: Seller
Роль пользователя: seller
Версия появления: v0.3
Не создавать до: реализовано в v0.3
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UX_RULES.md`
Связанные компоненты: `Sidebar`, `DashboardPanel`, `StatCard`, `Table`, `Badge`

### Назначение страницы

Рабочий центр продавца: товары, заказы, модерация, первые продажи.

### Пользовательская цель

Понять, что нужно сделать, чтобы товар был опубликован и продавался.

### Бизнес-цель

Запустить supply side marketplace без операционного хаоса.

### Когда пользователь попадает сюда

После seller onboarding, из role switcher.

### Основные блоки страницы

- Setup checklist.
- Product moderation status.
- Recent orders.
- Seller profile status.
- Future: balance/payout summary.

### Основные действия пользователя

Создать товар, открыть заказы, обновить seller profile.

### Данные, которые нужны странице

Seller profile, product summary, order summary, moderation queue status.

### Состояния страницы

#### Loading

Dashboard skeleton.

#### Empty

Новый seller: создать первый товар.

#### Error

Retry per panel.

#### Success

Dashboard loaded.

#### Unauthorized

Login required.

#### Forbidden

Нет роли seller: предложить onboarding.

#### Mobile

Checklist above metrics.

#### Desktop

Sidebar + dense panels.

### UX-правила

Не показывать payout/balance как доступные, пока они не реализованы.

### UI-правила

Статусы модерации бейджами.

### Что уже реализовано

Seller profile fields есть в `/me/profile`.

### Что нужно изменить

Создать dashboard после product domain.

### Что не нужно делать сейчас

Не добавлять выплаты до v0.6.

### Acceptance criteria

- Seller понимает next action.
- Нет fake revenue metrics.
- Empty state ведёт к созданию товара.

### Зависимости

Products, moderation, seller profile.

### Комментарии для будущих агентов

Не смешивать Seller Lite/Pro legal copy без review.

## PAGE-ADMIN-USERS: Пользователи

Статус: PARTIAL
Route: `/admin/users` целевой, сейчас `apps/admin /`
Раздел: Admin
Роль пользователя: admin
Версия появления: v0.1
Не создавать до: —
Связанные документы: `docs/SECURITY.md`, `docs/DOMAIN_MODEL.md`
Связанные компоненты: `TopBar`, `Table`, `Badge`, `Modal`, `Alert`

### Назначение страницы

Просмотр пользователей и управление базовым статусом.

### Пользовательская цель

Админ находит пользователя и блокирует/активирует при необходимости.

### Бизнес-цель

Минимальная операционная безопасность до marketplace.

### Когда пользователь попадает сюда

После входа в admin app.

### Основные блоки страницы

- Admin login guard.
- Users list.
- Role tags.
- Status.
- Actions block/activate.
- Future: filters, user details, audit link.

### Основные действия пользователя

Войти, загрузить пользователей, заблокировать/активировать, выйти.

### Данные, которые нужны странице

`/api/v1/admin/users`, `/api/v1/admin/users/{id}/status`.

### Состояния страницы

#### Loading

Table skeleton, disabled actions.

#### Empty

Нет пользователей: показать explanation.

#### Error

Forbidden/unauthorized/API errors separately.

#### Success

Status updated + reload.

#### Unauthorized

Login form.

#### Forbidden

Показать, что нужна admin role.

#### Mobile

Table превращается в summary rows.

#### Desktop

Admin table with filters.

### UX-правила

Блокировка пользователя — опасное действие, нужна confirmation.

### UI-правила

Не показывать лишние персональные данные в таблице.

### Что уже реализовано

Login, list, roles, status, block/activate.

### Что нужно изменить

Добавить confirmation, filters, details, audit link, route alignment.

### Что не нужно делать сейчас

Не добавлять CRM или bulk actions.

### Acceptance criteria

- Non-admin получает forbidden.
- Status change auditable.
- Опасное действие подтверждается.

### Зависимости

Audit log viewer для ссылок.

### Комментарии для будущих агентов

Текущий Vite admin screen работает, но IA admin ещё не оформлена.

## PAGE-WIDGET-ALERT: Alert widget

Статус: PARTIAL
Route: `apps/widget /?token=...`
Раздел: Widget
Роль пользователя: OBS browser source
Версия появления: v0.2
Не создавать до: —
Связанные документы: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`
Связанные компоненты: `WidgetPreviewContainer`, widget CSS tokens

### Назначение страницы

Показать OBS alert при успешном донате.

### Пользовательская цель

Стример видит алерт в OBS без ручного обновления.

### Бизнес-цель

Доказать realtime donation loop.

### Когда пользователь попадает сюда

OBS Browser Source открывает URL с token.

### Основные блоки страницы

- Connection status.
- Waiting state.
- Live donation alert.
- Optional transparent/panel theme.

### Основные действия пользователя

Пользователь не действует в widget; настройка только в Studio.

### Данные, которые нужны странице

Widget token, WebSocket `/ws/alerts`, realtime events.

### Состояния страницы

#### Loading

Waiting/connecting label.

#### Empty

Нет alert: waiting state.

#### Error

Token missing/disconnected.

#### Success

Live alert rendered.

#### Unauthorized

Missing/invalid token.

#### Forbidden

Revoked/disabled widget token.

#### Mobile

Не основной сценарий, но preview должен быть responsive.

#### Desktop

OBS canvas safe area.

### UX-правила

Widget read-only. Token не логировать и не показывать повторно после создания.

### UI-правила

Анимации должны уважать reduced motion; transparent mode должен читаться поверх OBS.

### Что уже реализовано

WebSocket connect, reconnect, event dedupe, theme query.

### Что нужно изменить

Добавить studio preview/settings, configurable alert variants, better error states.

### Что не нужно делать сейчас

Не добавлять публичное редактирование настроек через widget URL.

### Acceptance criteria

- Alert появляется только после confirmed payment event.
- Reconnect работает.
- Duplicate event не дублирует alert.

### Зависимости

Widget settings API, preview fixtures.

### Комментарии для будущих агентов

Новые widget pages должны оставаться лёгкими и не тянуть Next.js.

## Краткие specs для остальных страниц

Эти specs краткие, потому что страницы ещё не должны реализовываться или зависят от будущих доменных слоёв. Перед началом работы по любой из них нужно раскрыть spec до полного формата выше.

| ID                            | Статус         | Route                              | Роль пользователя  | Назначение и основные блоки                                        | Состояния и UX-правила                                 | Что уже реализовано                                                     | Что не делать сейчас                      | Acceptance criteria                  | Зависимости                  |
| ----------------------------- | -------------- | ---------------------------------- | ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------ | ---------------------------- |
| PAGE-FOR-STREAMERS            | IMPLEMENTED    | `/for-streamers`                   | guest/streamer     | Объяснить донаты, OBS, страницу автора, мягкую монетизацию.        | Static loading не нужен; mobile hero с одним CTA.      | Ролевой landing с preview flow и CTA регистрации.                       | Не делать generic SaaS.                   | Стример понимает next action.        | i18n, role onboarding.       |
| PAGE-FOR-SELLERS              | IMPLEMENTED    | `/for-sellers`                     | guest/seller       | Объяснить продажи через авторов, Seller Lite/Pro, модерацию.       | LEGAL_REVIEW для налоговых формулировок.               | Ролевой landing с preview flow и осторожным текстом про выплаты/review. | Не обещать выплаты/налоги.                | Seller понимает ограничения MVP.     | seller profile, marketplace. |
| PAGE-FOR-BUYERS               | IMPLEMENTED    | `/for-buyers`                      | guest/buyer        | Объяснить безопасную покупку, поддержку автора, историю заказов.   | Safe deal без абсолютных гарантий.                     | Ролевой landing про преимущества marketplace и buyer order path.        | Не делать страховые обещания.             | Buyer понимает, что покупает.        | marketplace/order.           |
| PAGE-MARKETPLACE-CATEGORY     | PLANNED        | `/marketplace/categories/[slug]`   | guest/buyer        | Breadcrumbs, category description, filters, product grid.          | Empty category, restricted category warning.           | Нет.                                                                    | Не включать risky categories.             | Фильтры работают на mobile.          | categories/products.         |
| PAGE-CREATOR-STORE            | PLANNED        | `/creators/[slug]/store`           | guest/buyer        | Live-only витрина автора, карточки и подборки.                     | Offline/live/paused states.                            | Нет.                                                                    | Не делать сложную партнёрскую сеть.       | Live-only блоки видны только live.   | CreatorStore, StoreItem.     |
| PAGE-SAFE-DEAL                | PAYMENT_REVIEW | `/safe-deal`                       | guest/buyer/seller | Объяснить hold, confirmation, disputes, refunds.                   | LEGAL_REVIEW_REQUIRED для гарантий.                    | Нет.                                                                    | Не обещать абсолютную защиту.             | Текст проверен legal/payment.        | provider/legal review.       |
| PAGE-FAQ                      | PLANNED        | `/faq`                             | all                | Ответы по донатам, покупкам, ролям, поддержке.                     | Search/no result future.                               | Нет.                                                                    | Не писать финальный legal copy.           | FAQ покрывает support top questions. | support workflows.           |
| PAGE-TERMS                    | LEGAL_REVIEW   | `/legal/terms`                     | all                | Legal placeholder.                                                 | Clearly marked placeholder.                            | Нет.                                                                    | Не писать финальный договор.              | LEGAL_REVIEW_REQUIRED виден в docs.  | legal review.                |
| PAGE-PRIVACY                  | LEGAL_REVIEW   | `/legal/privacy`                   | all                | Privacy placeholder.                                               | Clearly marked placeholder.                            | Нет.                                                                    | Не писать финальную политику.             | LEGAL_REVIEW_REQUIRED виден в docs.  | legal review.                |
| PAGE-AUTH-RESET               | BLOCKED        | `/auth/reset-password`             | guest              | Email request, token form, success.                                | Token expired/error states.                            | Нет.                                                                    | Не делать UI без backend.                 | Flow one-time and limited.           | password reset backend.      |
| PAGE-AUTH-VERIFY              | IMPLEMENTED    | `/auth` (inline state)             | guest              | Код подтверждения нового email до создания аккаунта.               | Pending/expired/resend/exhausted states.               | Реализовано в PAGE-AUTH.                                                | Телефон не добавлять без отдельного flow. | Verification status clear.           | SMTP configuration.          |
| PAGE-AUTH-ROLE                | PLANNED        | `/auth/role`                       | authenticated      | Выбор/добавление роли после регистрации.                           | Multi-role explanation.                                | Нет.                                                                    | Не добавлять admin role.                  | Роль ведёт в нужный onboarding.      | role APIs.                   |
| PAGE-ONBOARDING               | PLANNED        | `/onboarding`                      | authenticated      | Checklist by role.                                                 | Empty/new user states.                                 | Нет.                                                                    | Не строить длинный wizard без данных.     | User reaches next dashboard.         | role switcher.               |
| PAGE-ME-SETTINGS              | PLANNED        | `/me/settings`                     | authenticated      | Account preferences, theme, locale, notifications, security links. | Save/error/unauthorized; mobile compact settings list. | Нет; часть настроек временно в `/me/profile`.                           | Не смешивать Studio/Seller controls.      | Settings separated from profile.     | user preferences.            |
| PAGE-ME-FAVORITES             | PLANNED        | `/me/favorites`                    | authenticated      | User-owned saved products/creators/collections.                    | Empty first save, unavailable target.                  | Нет.                                                                    | Не дублировать buyer-only логику.         | Saved items scoped to user.          | Favorite.                    |
| PAGE-ME-REVIEWS               | PLANNED        | `/me/reviews`                      | authenticated      | Reviews authored by current user.                                  | Empty, hidden/flagged state.                           | Нет.                                                                    | Не раскрывать moderation internals.       | User sees own reviews.               | Review.                      |
| PAGE-ME-COLLECTIONS           | PLANNED        | `/me/collections`                  | authenticated      | User-created collections.                                          | Empty first collection, private/public states.         | Нет.                                                                    | Не делать социальную сеть.                | Any user can create collections.     | UserCollection.              |
| PAGE-BUYER-DASHBOARD          | IMPLEMENTED    | `/buyer`                           | buyer              | Overview orders, statuses, mock totals.                            | Empty first purchase.                                  | Да.                                                                     | Не добавлять fake recommendations.        | Next action clear.                   | orders.                      |
| PAGE-BUYER-PURCHASES          | PLANNED        | `/buyer/purchases`                 | buyer              | Purchases list with statuses.                                      | Empty/history, filters.                                | Нет.                                                                    | Не показывать чужие orders.               | Buyer sees own purchases.            | orders.                      |
| PAGE-BUYER-DISPUTE            | FUTURE         | `/buyer/disputes/[id]`             | buyer              | Dispute timeline/evidence/deadlines.                               | LEGAL_REVIEW wording.                                  | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.                 | Buyer sees deadlines/evidence.       | disputes, files.             |
| PAGE-BUYER-FAVORITES          | PLANNED        | `/buyer/favorites`                 | buyer              | Alias/entry to user-owned favorites.                               | Empty favorites.                                       | Нет.                                                                    | Не дублировать `/me/favorites`.           | Saved items list.                    | Favorite.                    |
| PAGE-BUYER-PROMOCODES         | FUTURE         | `/buyer/promocodes`                | buyer              | Active/used promo codes.                                           | Expired/empty states.                                  | Нет.                                                                    | Не делать до PromoCode.                   | Promo status clear.                  | PromoCode.                   |
| PAGE-BUYER-SETTINGS           | PLANNED        | `/buyer/settings`                  | buyer              | Buyer profile, locale, notifications.                              | Save/error/unauthorized.                               | Частично в `/me/profile`.                                               | Не смешивать seller/studio.               | Settings scoped to buyer.            | user preferences.            |
| PAGE-STUDIO-DASHBOARD         | PLANNED        | `/studio`                          | streamer           | Studio shell with tabs.                                            | Empty setup, forbidden, mobile tabs.                   | Частично в `/me/profile`.                                               | Не смешивать account settings.            | Studio IA stable.                    | creator profile.             |
| PAGE-STUDIO-STATISTICS        | PLANNED        | `/studio/statistics`               | streamer           | Earnings chart with source filters.                                | No data, loading chart, error retry.                   | Нет.                                                                    | Не показывать fake balance.               | Metrics traceable.                   | CreatorMetricSnapshot.       |
| PAGE-STUDIO-EVENTS            | PLANNED        | `/studio/events`                   | streamer           | Recent events feed with subtabs.                                   | Empty integrations, delayed events.                    | Нет.                                                                    | Не показывать raw bot payload.            | Events deduped.                      | CreatorActivityEvent.        |
| PAGE-STUDIO-DONATION-SETTINGS | PLANNED        | `/studio/donation-settings`        | streamer           | Amounts, message limits, audio/TTS, moderation, spam filter.       | Validation, hold-for-review.                           | Нет.                                                                    | Не менять payment statuses.               | Donation rules applied.              | CreatorDonationSettings.     |
| PAGE-STUDIO-PUBLIC-PAGE       | PLANNED        | `/studio/page`                     | streamer           | Public title/description/status/avatar/banner.                     | Preview, hidden/blocked states.                        | Частично в `/me/profile`.                                               | Не делать drag-and-drop editor.           | Public page settings clear.          | storage upload.              |
| PAGE-STUDIO-DONATIONS         | PLANNED        | `/studio/donations`                | streamer           | Donation list, filters, totals.                                    | Empty, loading, error.                                 | API есть, UI нет.                                                       | Не добавлять payouts.                     | Creator sees donation history.       | studio donations API.        |
| PAGE-STUDIO-GOALS             | PARTIAL        | `/studio/goals`                    | streamer           | Goals list/create/edit/pause.                                      | Empty first goal, validation.                          | Частично в `/me/profile`.                                               | Не добавлять complex campaigns.           | Goal lifecycle clear.                | goals API.                   |
| PAGE-STUDIO-ALERTS            | PLANNED        | `/studio/alerts`                   | streamer           | Alert style settings, preview.                                     | Preview fallback.                                      | Нет.                                                                    | Не делать custom designer.                | Alert preview before OBS.            | widget config.               |
| PAGE-STUDIO-WIDGETS           | PLANNED        | `/studio/widgets`                  | streamer           | Widget catalog, presets, trigger rules, token create/rotate.       | Token visible once, rule conflict, revoked state.      | Частично в `/me/profile`.                                               | Не показывать token повторно.             | OBS setup understandable.            | widgets API.                 |
| PAGE-STUDIO-WIDGET-GROUPS     | PLANNED        | `/studio/widget-groups`            | streamer           | Widget groups and placement zones.                                 | Token visible once, zone overlap warning.              | Нет.                                                                    | Не делать drag-and-drop scene editor.     | Alerts can be placed by type.        | WidgetGroup.                 |
| PAGE-STUDIO-STORE             | PLANNED        | `/studio/store`                    | streamer           | Manage creator store appearance and live-only sections.            | Empty store setup, offline/live preview.               | Нет.                                                                    | Не делать сложную партнёрскую сеть.       | Store sections ordered.              | marketplace.                 |
| PAGE-STUDIO-PRODUCTS          | PLANNED        | `/studio/products`                 | streamer           | Select eligible products for creator store.                        | Empty catalog, hidden product.                         | Нет.                                                                    | Не обходить moderation.                   | Product eligibility clear.           | Product, StoreItem.          |
| PAGE-STUDIO-COLLECTIONS       | PLANNED        | `/studio/collections`              | streamer           | Build author collections for store sections.                       | Empty collection, hidden target.                       | Нет.                                                                    | Не смешивать private user collections.    | Collections reusable.                | UserCollection.              |
| PAGE-STUDIO-PARTNERS          | FUTURE         | `/studio/partners`                 | streamer           | Partner products and attribution.                                  | Empty partner catalog.                                 | Нет.                                                                    | Не делать ad exchange.                    | Disclosure clear.                    | AffiliateLink.               |
| PAGE-STUDIO-PROMOCODES        | FUTURE         | `/studio/promocodes`               | streamer           | Creator promo codes.                                               | Expired/usage states.                                  | Нет.                                                                    | До PromoCode domain не делать.            | Promo use transparent.               | PromoCode.                   |
| PAGE-STUDIO-ANALYTICS         | FUTURE         | `/studio/analytics`                | streamer           | Advanced analytics after v0.3.5 statistics.                        | No data state.                                         | Нет.                                                                    | Не дублировать `/studio/statistics`.      | Metrics traceable.                   | analytics snapshots.         |
| PAGE-STUDIO-PAYOUTS           | PAYMENT_REVIEW | `/studio/payouts`                  | streamer           | Balance/payout requests.                                           | Pending/failed/held states.                            | Нет.                                                                    | Не делать до v0.6 review.                 | Money states accurate.               | wallet/payout provider.      |
| PAGE-STUDIO-SETTINGS          | PLANNED        | `/studio/settings`                 | streamer           | Creator settings, privacy, notifications.                          | Save/error states.                                     | Частично в `/me/profile`.                                               | Не смешивать account settings.            | Scoped settings.                     | user/creator APIs.           |
| PAGE-SELLER-PRODUCTS          | IMPLEMENTED    | `/seller/products`                 | seller             | Products list, moderation statuses.                                | Empty first product.                                   | Да.                                                                     | Не делать risky categories.               | Seller sees product status.          | products.                    |
| PAGE-SELLER-PRODUCT-NEW       | IMPLEMENTED    | `/seller/products/new`             | seller             | Product creation form.                                             | Validation, draft save.                                | Да.                                                                     | Не автопубликовать без moderation.        | Product draft created.               | products/categories.         |
| PAGE-SELLER-PRODUCT-EDIT      | PLANNED        | `/seller/products/[id]/edit`       | seller             | Edit product details.                                              | Published/pending restrictions.                        | Нет.                                                                    | Не менять old order snapshots.            | Changes versioned/safe.              | products.                    |
| PAGE-SELLER-ORDERS            | IMPLEMENTED    | `/seller/orders`                   | seller             | Orders queue.                                                      | Empty and action states.                               | Да.                                                                     | Не смешивать payouts.                     | Seller sees next action.             | orders.                      |
| PAGE-SELLER-DEALS             | PAYMENT_REVIEW | `/seller/deals`                    | seller             | Safe deal statuses.                                                | Held/disputed/deadline states.                         | Нет.                                                                    | Не делать до v0.5.                        | Deal status clear.                   | safe deal.                   |
| PAGE-SELLER-DISPUTES          | FUTURE         | `/seller/disputes`                 | seller             | Dispute queue and evidence.                                        | Deadline states.                                       | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.                 | Seller sees response deadline.       | disputes.                    |
| PAGE-SELLER-PROMOCODES        | FUTURE         | `/seller/promocodes`               | seller             | Promo code creation and usage.                                     | Limit/expired states.                                  | Нет.                                                                    | Не делать до PromoCode.                   | Promo conflicts handled.             | PromoCode.                   |
| PAGE-SELLER-AFFILIATE         | FUTURE         | `/seller/partners`                 | seller             | Partner percent/campaigns.                                         | Empty creator partners.                                | Нет.                                                                    | Не делать ad exchange.                    | Attribution transparent.             | affiliate model.             |
| PAGE-SELLER-ANALYTICS         | FUTURE         | `/seller/analytics`                | seller             | Sales/product/creator analytics.                                   | No data state.                                         | Нет.                                                                    | No fake metrics.                          | Metrics sourced.                     | orders/events.               |
| PAGE-SELLER-PAYOUTS           | PAYMENT_REVIEW | `/seller/payouts`                  | seller             | Available/frozen/pending payout.                                   | Pending/rejected/failed.                               | Нет.                                                                    | Не называть банковским счётом.            | Ledger matches UI.                   | wallet/payouts.              |
| PAGE-SELLER-SETTINGS          | PLANNED        | `/seller/settings`                 | seller             | Seller profile and policies.                                       | Save/error states.                                     | Частично в `/me/profile`.                                               | Не добавлять Pro verification здесь.      | Settings scoped.                     | seller profile.              |
| PAGE-SELLER-VERIFY-PRO        | LEGAL_REVIEW   | `/seller/verification/pro`         | seller             | Pro request and document placeholders.                             | Pending/rejected states.                               | Нет.                                                                    | Не собирать лишние данные.                | LEGAL_REVIEW before fields.          | legal/file security.         |
| PAGE-ADMIN-DASHBOARD          | PLANNED        | `/admin`                           | admin              | Overview queues and risks.                                         | Empty queues.                                          | Частично root admin app.                                                | Не делать vanity metrics.                 | Admin sees priority queues.          | admin APIs.                  |
| PAGE-ADMIN-SELLERS            | PLANNED        | `/admin/sellers`                   | admin              | Seller moderation/list.                                            | Empty/filter states.                                   | Нет.                                                                    | Не блокировать без audit.                 | Seller actions auditable.            | seller profiles.             |
| PAGE-ADMIN-STREAMERS          | PLANNED        | `/admin/streamers`                 | admin              | Creator moderation/list.                                           | Empty/filter states.                                   | Нет.                                                                    | Не менять public pages без audit.         | Actions auditable.                   | creator profiles.            |
| PAGE-ADMIN-PRODUCTS           | PARTIAL        | `/admin/products`                  | admin              | Product moderation.                                                | Pending/rejected states.                               | Частично в root admin app.                                              | Не approve risky categories.              | Moderation reason captured.          | products/categories.         |
| PAGE-ADMIN-CATEGORIES         | PLANNED        | `/admin/categories`                | admin              | Category management.                                               | Restricted/legal flags.                                | Нет.                                                                    | Не открывать risky categories.            | Flags visible.                       | category model.              |
| PAGE-ADMIN-ORDERS             | PLANNED        | `/admin/orders`                    | admin              | Order lookup/read-only.                                            | Not found/permission.                                  | Нет.                                                                    | Не добавлять manual money changes.        | Data minimal.                        | orders.                      |
| PAGE-ADMIN-DEALS              | PAYMENT_REVIEW | `/admin/deals`                     | admin              | Deal overview/actions later.                                       | Held/disputed states.                                  | Нет.                                                                    | Не менять money statuses без review.      | Provider-agnostic.                   | safe deal/ledger.            |
| PAGE-ADMIN-DISPUTES           | FUTURE         | `/admin/disputes`                  | admin              | Arbitration queue.                                                 | Evidence/deadline states.                              | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.                 | Decision audited.                    | disputes/refunds.            |
| PAGE-ADMIN-PAYOUTS            | PAYMENT_REVIEW | `/admin/payouts`                   | admin              | Payout review queue.                                               | Pending/processing/failed.                             | Нет.                                                                    | Не approve real payouts.                  | Audit mandatory.                     | payout provider.             |
| PAGE-ADMIN-PAYMENTS           | PAYMENT_REVIEW | `/admin/payments`                  | admin              | Payment list/status.                                               | Provider webhook states.                               | Нет.                                                                    | Не показывать secrets.                    | Status mapping clear.                | payment provider.            |
| PAGE-ADMIN-MODERATION         | PLANNED        | `/admin/moderation`                | admin              | Unified moderation queues.                                         | Empty queues.                                          | Нет.                                                                    | Не делать auto-ban.                       | Next action visible.                 | products/profiles.           |
| PAGE-ADMIN-ANTIFRAUD          | FUTURE         | `/admin/anti-fraud`                | admin              | Risk flags queue.                                                  | Severity/open/resolved.                                | Нет.                                                                    | Не делать ML scoring.                     | Manual review clear.                 | RiskFlag.                    |
| PAGE-ADMIN-AUDIT              | PLANNED        | `/admin/audit-log`                 | admin              | Audit log viewer.                                                  | Empty/filter/no access.                                | Нет.                                                                    | Не редактировать audit.                   | Mask sensitive data.                 | audit logs.                  |
| PAGE-ADMIN-SETTINGS           | FUTURE         | `/admin/settings`                  | admin              | Platform settings.                                                 | Confirmation states.                                   | Нет.                                                                    | Не хранить provider secrets в UI.         | Dangerous changes confirmed.         | provider config policy.      |
| PAGE-WIDGET-GOAL              | PLANNED        | `/goal?token=...`                  | OBS                | Donation goal overlay.                                             | Waiting/no goal/reconnect.                             | Нет.                                                                    | Не делать без goal config.                | Goal updates realtime.               | goals WS event.              |
| PAGE-WIDGET-PURCHASE          | FUTURE         | `/purchase-alert?token=...`        | OBS                | Purchase alert.                                                    | Waiting/live/error.                                    | Нет.                                                                    | DO_NOT_BUILD_YET до purchase events.      | Purchase event dedupe.               | marketplace events.          |
| PAGE-WIDGET-FEED              | FUTURE         | `/activity-feed?token=...`         | OBS                | Activity feed overlay.                                             | Empty/feed overflow.                                   | Нет.                                                                    | Не делать unified feed без model.         | Events ordered/deduped.              | activity model.              |
| PAGE-WIDGET-PREVIEW           | PLANNED        | `/studio/widgets/preview`          | streamer           | Studio preview of widgets.                                         | Mock event states.                                     | Нет.                                                                    | Не использовать real token in preview.    | Preview matches OBS.                 | widget config.               |
| PAGE-WIDGET-SETTINGS-PREVIEW  | PLANNED        | `/studio/widgets/settings-preview` | streamer           | Settings preview panel.                                            | Save/error preview.                                    | Нет.                                                                    | Не делать drag-and-drop editor.           | Changes visible before save.         | widget config.               |

## Дополнение PAGE-MARKETPLACE: UX-TASK-026

Статус: IMPLEMENTED
Версия: v0.3.5
Связанные задачи: `UX-TASK-026`

Цель итерации: не менять структуру `/marketplace`, а усилить иерархию уже выбранного направления "marketplace-first, creator mechanic visible".

Требования:

- Первый экран должен визуально доминировать: H1 крупнее, lead короче и яснее, главный поиск заметнее быстрых направлений.
- Быстрые направления под поиском — тихая навигационная строка, а не набор конкурирующих CTA.
- Hero demo показывает автора, цель, товар, промокод, безопасную сделку и короткую цепочку "зритель покупает → продавец выполняет → автор получает поддержку".
- Блок "Покупка может быть поддержкой" должен выглядеть как цепочка "Товар → Автор → Поддержка", а не как второстепенный набор одинаковых карточек.
- Категории должны содержать пример товара/сценария, чтобы пользователь быстрее считывал ассортимент.
- Product cards показывают реальные cover image, если они есть; если cover отсутствует, показывается category preview по типу товара.
- Featured-блок должен явно объяснять ценность: "Этот товар добавили 14 авторов" и "Покупка через витрину или промокод поддерживает выбранного автора".
- Витрины авторов: первая витрина может быть крупной featured-карточкой, следующие — компактнее.
- Safety-блок говорит пользовательским языком: оплата внутри заказа, рейтинг, условия заказа, спор.

## Дополнение PAGE-MARKETPLACE: UX-TASK-027

Статус: IMPLEMENTED
Версия: v0.3.5
Связанные задачи: `UX-TASK-027`

Цель итерации: структурно перепрошить `/marketplace` без визуального ребрендинга. Страница должна не просто показывать ассортимент, а доказывать, что FanFuel связывает покупателя, автора и продавца через витрины, промокоды и безопасную покупку.

Требования:

- Header: sticky glass bar 64px, бренд FanFuel, nav `Маркет`, `Авторы`, `Для авторов`, `Для продавцов`, `Безопасность`, справа `Войти` и `Создать страницу`.
- Hero: H1 `Покупай нужное. Поддерживай любимых.`, большой поиск, три быстрых действия и тихая строка направлений. Справа demo покупки через витрину автора с целью, товаром, промокодом, безопасной сделкой и мини-flow.
- Механика поддержки: отдельный блок сразу после hero как цепочка из трёх шагов, а не набор второстепенных карточек.
- Категории: 8 стабильных карточек с иконками, описанием и примерами; без абстрактных фигур и нестабильного absolute-декора.
- Featured: один proof-module `Популярно в витринах авторов`, где главное доказательство — товар добавили 14 авторов, а покупка через витрину или промокод поддерживает выбранного автора.
- Product cards: 4/3/2/1 колонки, media 16:10, category label, title, short description, price, rating, seller, максимум два бейджа.
- Витрины авторов: каждая витрина показывает автора, цель, промокод, три товара и CTA `Открыть страницу`; первая витрина может быть крупнее, остальные компактнее.
- Для авторов/продавцов: отдельные крупные секции с mockup страницы автора и схемой `Товар продавца → Каталог FanFuel → Витрины авторов → Заказы`.
- Безопасность: пользовательский язык вместо абстрактного SafeDeal — оплата внутри заказа, рейтинг, условия заказа, спор.

## Дополнение PAGE-MARKETPLACE: UX-TASK-028

Статус: IMPLEMENTED
Версия: v0.3.5
Связанные задачи: `UX-TASK-028`

Цель итерации: переставить `/marketplace` в сторону раннего product discovery без отката в обычный каталог. Новый порядок: hero с поиском и demo, compact flow поддержки, быстрый товарный вход, подборки авторов, proof-module "Популярно в витринах авторов", популярные товары, role sections, безопасность и финальный CTA.

Acceptance criteria:

- После hero пользователь сразу видит компактную механику покупки через автора и товарный вход: категории + "Сейчас покупают".
- "Подборки авторов" стоят до обычного блока популярных товаров и показывают конкретные товары, промокод и цель автора.
- Категории не содержат абстрактных декоративных форм и не меняют shape при resize.
- Product cards остаются кликабельными целиком и не показывают повторяющиеся CTA.
- Быстрые направления ведут на route, а не применяют скрытые фильтры на главной.

## PAGE-WORLD-HOME: FanFuel World

Статус: FUTURE
Route: `https://world.fanfuel.ru/`
Раздел: World
Версия: future / discovery
Не создавать до: UX-TASK-039, product/security/privacy review, снятие `DO_NOT_BUILD_YET`

### Назначение страницы

Будущий отдельный дом/студия маскота с лёгкими взаимодействиями и мини-играми, не заменяющий marketplace и кабинеты FanFuel.

### Первый допустимый vertical slice

- одна личная комната;
- базовое взаимодействие с маскотом;
- одна короткая мини-игра;
- несколько cosmetic-only предметов без денежной ценности;
- local/mock progress до утверждения account/domain модели;
- явный возврат в основной FanFuel.

### Acceptance criteria для выхода из discovery

- есть one-page product brief, core loop и прототип первой сессии;
- определены auth/session, privacy, age, storage, deployment и cross-domain security риски;
- нет валюты, NFT, loot boxes, платных случайных наград, multiplayer и привязки прогресса к сумме покупок/донатов;
- владелец продукта отдельно одобрил production vertical slice и необходимые ADR/domain/API updates.

### Что не делать сейчас

Не создавать route, приложение, API или сущности БД. Не переносить игровую механику на основную marketplace-страницу.

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

## UX-TASK-036: marketplace-first контракт главной

Статус: PLANNED. Версия: v0.3.5. Маршруты: `/`, `/marketplace`.

- Покупатель всегда выбран по умолчанию; автор и продавец остаются вторичными вкладками.
- Первый экран решает задачу поиска и выбора реальных цифровых товаров, а не презентации всей платформы.
- Общий каталог не ограничивается товарами для стримеров/авторов.
- Большие role/platform landing блоки не возвращаются в покупательский режим.
- Результат требует явного product review и regression QA на `ru/en`, light/dark, reduced motion и 320/390/768/1440.

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

Задача улучшила отдельные формы и затем была замещена UX-TASK-035. `/auth/login` и `/auth/register` теперь являются совместимыми redirect-маршрутами.

Компактная шапка, доступные поля, управление показом пароля, theme/locale и шаг имени переиспользованы в PAGE-AUTH.

## UX-TASK-035 — единая авторизация и подтверждение email, 2026-09-17

PAGE-AUTH реализует email-first развилку: существующий аккаунт продолжает парольным входом, новый email подтверждается одноразовым кодом до задания пароля и создания аккаунта. Телефон и username отложены до отдельной модели идентификаторов и восстановления доступа.

## UX-TASK-041 / v1.1

`/studio` (CREATOR-COMMERCE-01): настройка витрины, независимо включаемый promo, live preview, перестановка блоков, banner/avatar presets, выбор товаров через поиск, реальные суммы поддержки и подсказки о цене. Требует входа и creator profile. Сохранение серверное, ошибки/revision conflict видимы; не терять черновик при сетевой ошибке.

`/creators/[slug]` (CREATOR-STORE-01): публичный preview/design, включённые блоки, товары с ref storefront, донат только при donations_enabled; disabled storefront не открывается.

`/seller` и `/seller/products/[id]` (SELLER-COMMERCE-01): существующие заказы сохраняются; настройки identity/rates и объяснимый ориентир цены. Конфиг перед submit обязателен. Форматы аккаунтов явно различимы, но публикация не открывается.

`/marketplace/products/[slug]` и checkout: вариант, точные аналоги, сумма/имя получателя, явный выбор при конфликте. Никакого увеличения цены покупателя.

Общие acceptance: ru/en, semantic light/dark, клавиатура, mobile 320px+, reduced motion, fixed media aspect-ratio, честные empty/error states; нет фиктивных товаров, статистики или вероятностей.

### Дополнение реализации UX-TASK-041 / v1.1

Статус перечисленных commerce-страниц: IMPLEMENTED_LOCAL, mock; review владельца ожидается. В /studio доступны реальные signed uploads PNG/JPEG для своего баннера и аватара, пресеты, live preview, grid/list, порядок блоков, отдельное размещение доната. Сбой сохранения/конфликт не очищает форму. /seller/products/[id] — отдельный маршрут редактора принадлежащего продавцу товара, включая ориентиры для неопубликованного черновика через owner API.

Acceptance подтверждено автоматическими проверками: независимость promo/storefront, сохранение оформления/порядка, выбор единственного получателя в checkout, невозможность равных ставок, перенос ref через локальную корзину, widths 320/390/768/1440. Главная и каталог используют общий группирующий поиск. Карточка продукта явно показывает формат/платформу/регион; обложка с фиксированным размером использует только public media и fallback при ошибке. Аналитика без событий просмотров не показывает выдуманную конверсию.

## UX-TASK-042 / marketplace v1.2 — NEEDS_REWORK

Маршруты: `/`, `/marketplace`, `/marketplace/catalog`; guest buyer/creator/seller tabs. Область изменения: только нижний блок discovery, список основных направлений, контур активной вкладки и размещение/состояние Ойли. Product feed, header, checkout, платежи и авторские настройки остаются вне rework. Четыре карточки с общими лозунгами заменить редакционным указателем направлений. Ключевые направления: игры, программы, для игр, графика/шаблоны, услуги, затем для авторов/эфира/обучения. До продаж считать порядок гипотезой.

Ойли — один actor на главной с anchor ID и командой `visit`, поддержкой resize/scroll и перехода в reduced-motion. Переключение guest role может вызвать перемещение к блоку роли. У empty/error нет собственного персонажа. Вызов на страницах презентаций без общего actor допускает отдельный экземпляр только вне главной.

Acceptance: см. `docs/tasks/ui-ux/UX-TASK-042.md` — рабочие ссылки/пустое состояние, SVG-обводка с ARIA tablist и reduced-motion, один actor, отсутствие перекрытий, ru/en и 320/390/768/1440.
