# CHANGELOG.md

Все заметные изменения проекта фиксируются здесь.

Формат основан на Keep a Changelog, но записи ведутся на русском языке.

## [Unreleased]

### Единая авторизация и подтверждение email — 2026-09-17

- UX-TASK-035: добавлена единая страница `/auth`: существующий email продолжает парольный вход, новый проходит одноразовый код, создание пароля и только затем создание аккаунта; `/auth/login` и `/auth/register` сохранены как совместимые redirects.
- Добавлены auth identify/verification endpoints, email verification challenges, короткоживущий одноразовый registration token, обязательный `email_verified_at`, HMAC-хранение кодов, expiry/cooldown/attempt limits и rate limits.
- Добавлен SMTP `EmailSender`, ru/en transactional copy, optional Mailpit compose для разработки и обязательная SMTP-конфигурация production.
- Существующие аккаунты grandfathered как verified миграцией `000007_email_verification`; телефон и username отложены до отдельной модели идентификаторов/recovery.
- Зафиксирован осознанный риск account enumeration в `identify`: одинаковый HTTP status и минимальный ответ уменьшают утечку, но выбранный следующий шаг раскрывает существование аккаунта.

### Публичный edge — 2026-09-14

- FF-0010: FanFuel подключён к общему nginx edge по Host/SNI, сохранён HTTPS LibreChat. Существующие пробросы TCP 80/443 направлены на edge, IP приложения закреплён в DHCP.
- Выпущен Let's Encrypt сертификат для основного и www-домена, настроены HTTPS redirect, certbot timer и reload hook. Тест продления успешен.
- Все контейнерные порты возвращены на loopback, вход 80/443 на VM приложения разрешён только от edge. Public admin API и mock callbacks закрыты.

### Инструменты агентов — 2026-09-15

- Локальный роутер провайдеров Codex (`~/.codex/router`) перестал выбрасывать элементы `reasoning` целиком: теперь `encrypted_content` разбирается по виду — шифртекст чужого аккаунта (GPT) отбрасывается вместе с элементом, а ссылка `<response_id>-<n>` (DeepSeek) и `null` (GLM) просто вырезаются. Из-за прежнего поведения DeepSeek отвечал `400 reasoning_text must be passed back` и `404 page not found`, обрывая ответы посреди хода.
- Проверено на реальных префиксах диалогов: `deepseek-v4-flash` и `glm-5.3` отдают 200, смешанный запрос с GPT-блобом обрабатывается корректно.
- Зафиксировано наблюдение: смена модели внутри открытого чата Codex не доходит до запроса (чат продолжает отвечать моделью, с которой создан). Требуется новый чат или перезапуск приложения.
### Инфраструктура — 2026-09-14

- FF-0009: создана и запущена отдельная Ubuntu VM FanFuel на диске D:, развернуты девять сервисов и применены пять миграций.
- Добавлены VM Compose override, сборки frontend без dev servers, фильтрация Docker ingress и инструкции запуска. MinIO для VM закреплён по digest из Quay после ошибки загрузки исходного Docker Hub образа.
- nginx/TLS и публичный маршрут отложены по уточнению пользователя: edge будет на отдельной VM. Ранее подготовленный HTTP bootstrap сохранён как промежуточный артефакт.

### Added

- UX-TASK-034: добавлен скрытый route `/gaming` с автономной игрой Fuel Match — полем match-3 8×8, 12 уровнями, целями, каскадами, ракетами, призмами, локальными игровыми монетами, усилителями, суперсилой и сохранением прогресса только в браузере. Route не включён в публичную навигацию и не использует API, БД или реальные деньги.
- UX-TASK-032: регистрация стала базовой — только email и пароль, без выбора роли и имени платформы. Новый обязательный шаг `/auth/name` задаёт имя после регистрации, вход не пропускает его без сохранения, а существующие профили помечаются завершёнными миграцией `000006_profile_name_setup`.
- `/marketplace` в `v0.3.5` перестроен в product-discovery порядок: после hero идёт compact flow поддержки, затем быстрый товарный вход с 6 категориями и "Сейчас покупают", подборки авторов подняты выше proof-module и популярных товаров, а категории очищены от абстрактных декоративных фигур.
- Добавлены первые задачи `v0.3.5` для Aurora Refresh: `FF-0348`–`FF-0350`, чтобы сначала обновить текущий дизайн сайта, shared UI tokens и существующие экраны, а затем строить профиль, Studio и витрину.
- Добавлен план `v0.3.5 Universal Profile + Studio Skins`: roadmap, task-файлы `FF-0351`–`FF-0356`, domain/API/UI specs для скинов, профиля пользователя, пользовательских подборок, live-only витрины автора, widget rules и групп виджетов.
- Расширен план Studio для `v0.3.5`: задачи `FF-0357`–`FF-0361`, вкладки статистики, последних событий, настройки донатов, витрины, виджетов, продуктов и подборок, а также domain/API/security/ADR для Studio activity events, bot integrations и donation settings.
- Добавлены dev seed scripts `infra/scripts/seed-dev.sh` и `infra/scripts/seed-dev.ps1`, которые идемпотентно создают локальных продавцов и опубликованные mock товары для marketplace-витрины.
- Создана документационная основа FanFuel.
- Добавлены `README.md`, `ROADMAP.md`, `AGENTS.md`.
- Добавлены продуктовые, архитектурные, доменные, API, платежные, i18n, deployment, security, testing и UX документы.
- Добавлены `SECRETS.template.md`, `.env.example`, `.gitignore`.
- Добавлен ADR-журнал и handoff-документ.
- Реализован `v0.0 Foundation`: npm workspaces, Next.js web skeleton, Vite admin/widget skeleton, shared packages `ui`, `i18n`, `sdk`, `types`.
- Добавлены Go-сервисы `api`, `ws`, `worker` с `/healthz`, `/readyz` и foundation endpoints.
- Добавлены Dockerfiles, `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.example.yml`.
- Добавлены PostgreSQL, Redis, MinIO, первая миграция `000001_foundation` и миграционные скрипты.
- Добавлен базовый GitHub Actions CI workflow.
- Реализован `v0.1 Auth + Profiles`: миграция `000002_auth_profiles`, пользователи, роли, профили, JWT/bcrypt auth, public creator page API и admin users API.
- Добавлены web страницы регистрации, входа, профиля и публичной страницы автора.
- Добавлена базовая admin users panel.
- Реализован `v0.2 Donate MVP`: миграция `000003_donate_mvp`, donation/payment/goals/widget schema, mock `PaymentProvider`, idempotent donation API, mock callbacks, Redis realtime events и OBS WebSocket widget.
- Добавлены donation form, donation goals, публичная история донатов, топ донатеров и studio controls для goals/widget token.
- Добавлена дизайн-система FanFuel: `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/DESIGN_AUDIT.md`.
- Добавлены semantic theme tokens, базовые UI primitives и `ThemeSwitcher` в `packages/ui`.
- Добавлена миграция `000004_user_preferences` и API `/api/v1/me/preferences` для сохранения темы пользователя.
- Добавлена UI/UX planning система: `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`, `docs/UI_STATES.md`, `docs/UX_WRITING.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`.
- Зафиксированы текущие UI routes, статусы страниц, UX-долги, future/DO_NOT_BUILD_YET ограничения и workflow для UI/UX задач.
- Реализован `v0.3 Marketplace MVP`: миграция `000005_marketplace_mvp`, категории, товары, seller product CRUD, public marketplace/product API, order + mock safe deal lifecycle, buyer/seller order actions, reviews и admin product moderation.
- Добавлены web страницы `/marketplace`, `/marketplace/products/[slug]`, `/checkout/[productId]`, `/buyer`, `/buyer/orders/[id]`, `/seller`, `/seller/products`, `/seller/products/new`, `/seller/orders`.
- Добавлен практический рабочий маршрут в `README.md`, активный фокус в `docs/TASKS.md` и задача `FF-0307` для стабилизации Marketplace MVP проверками.
- Улучшен дизайн текущих страниц: role-entry блок на главной, доступная mobile topbar-навигация, более стабильные web/admin/widget surfaces и i18n для новых homepage строк.
- Добавлены ролевые публичные страницы `/for-buyers`, `/for-streamers`, `/for-sellers` с i18n и semantic tokens.
- Добавлены подпапки `docs/roadmap/` и `docs/tasks/` с детальными файлами roadmap-этапов и отдельных TASK-ID.

### Changed

- `/marketplace` в `v0.3.5` структурно перепрошит как search-first creator-commerce homepage: header закреплён в 64px glass-формате с единым брендом FanFuel, hero показывает поиск и demo покупки через витрину автора, блок поддержки стал цепочкой `Товар → Автор → Поддержка`, категории очищены от абстрактных фигур, featured-модуль стал proof-module про 14 авторских витрин, product grids стабилизированы как 4/3/2/1, а безопасность и role sections разведены по разным визуальным паттернам.
- `/marketplace` в `v0.3.5` дополнительно усилен по иерархии creator-commerce: H1 и hero-search стали заметнее, быстрые направления стали тихой навигационной строкой, блок "Покупка может быть поддержкой" получил цепочку "Товар → Автор → Поддержка", категории показывают примеры, product media использует category preview при отсутствии seller cover image, featured-блок явно говорит "Этот товар добавили 14 авторов", а safety cards переписаны простым пользовательским языком.
- `/marketplace` в `v0.3.5` получил marketplace-first hero с большим поиском, подсказками по товарам/авторам/категориям/промокодам и demo покупки через витрину автора; topbar search на desktop скрывается до прокрутки ниже hero, блок "Покупка может быть поддержкой" поднят сразу под первый экран, категории расширены до 8 направлений, "Популярно в витринах авторов" теперь показывает товар вместе со списком авторов/промокодов, а "Подборки авторов" заменены на showcase-блоки "Витрины авторов".
- `/marketplace` в `v0.3.5` возвращён к честной UX-логике: быстрые направления теперь ведут на реальные routes, а не включают скрытые фильтры; topbar search отправляет товары в `/marketplace/catalog`, авторов в `/creators`; hero получил заголовок "Покупай цифровые товары и поддерживай авторов"; product cards стали плотнее, без hover CTA и дублирующей категории; блок "Популярно в витринах авторов" открывает товар или модалку авторов; добавлены лёгкие destination pages `/marketplace/catalog`, `/marketplace/categories`, `/marketplace/category/[slug]`, `/marketplace/promocodes`, `/creators`, `/safe-deal`.
- `/marketplace` в `v0.3.5` очищен от дублирующего поиска и лендингового шума: второй большой search-блок заменён быстрыми направлениями, "Найти автора" фокусирует topbar search в режиме авторов, обычные карточки товаров открываются целиком без кнопки "Подробнее", авторские CTA стали кнопками "Открыть страницу автора", а "Хит в витринах авторов" показывает множественные витрины и действия "Смотреть товар" / "Показать авторов".
- `/marketplace` в `v0.3.5` получил ранний авторский слой: сразу после поиска добавлена полка "Популярные авторы", "Быстрые направления" опущены ниже популярного и хита в витринах, карточки товаров больше не рендерят фейковые псевдо-скриншоты и используют seller cover URL при наличии либо нейтральный градиент с category label, а категории получили единые outline SVG-иконки.
- `/marketplace` в `v0.3.5` переведён из компактного объясняющего лендинга в плотную маркет-витрину: после hero идут рабочий поиск, компактные категории и "Популярно сейчас", затем хит в витринах авторов, новые товары, OBS/алерты, игровые услуги, дизайн, авторские витрины и короткая trust-полоса вместо больших SafeDeal/FAQ/final CTA/role-value секций.
- `/marketplace` в `v0.3.5` дополнительно отполирован без добавления новых блоков: hero стал ниже и получил заголовок "Цифровые товары, которые поддерживают авторов", поиск и категории больше не дублируют "Что можно найти на FanFuel", карточки товаров получили категорийные cover templates вместо placeholder-превью, авторские подборки сокращены до двух компактных рядов, а SafeDeal/final CTA/FAQ оставлены короткими витринными блоками.
- `/marketplace` в `v0.3.5` уплотнён из полной презентации платформы в компактную creator-commerce витрину: оставлены hero, быстрый поиск и категории, "Хит в витринах авторов", популярные товары, подборки авторов, блок "Одна покупка — польза для всех", компактный SafeDeal, общий CTA и короткий FAQ. Большие лендинговые блоки для стримеров/продавцов, большой поиск автора, новые товары и длинные SafeDeal/FAQ объяснения убраны с главной витрины.
- Главная marketplace в `v0.3.5` получила creator-commerce смысловой слой FanFuel: hero объясняет связь покупателя, автора и продавца, добавлен живой пример покупки через автора, блок "Хит в витринах авторов", поиск по товарам/авторам/категориям, подборки авторов, SafeDeal/FAQ и более информативные карточки товаров с авторским контекстом.
- Кодовый слой `v0.3.5` начал переход на FanFuel Aurora: shared tokens в `packages/ui` переведены на violet/cyan/emerald palette с отдельным warm-акцентом, web/admin/widget получили дозированные glass/material поверхности, marketplace hero/product media/badges обновлены под Aurora, а испорченные fallback query-строки marketplace исправлены.
- Дизайн-система обновлена направлением FanFuel Aurora: orange/black больше не primary-визуал, основной акцент переносится в violet/cyan, support — в emerald, warm/orange остаётся редким статусным акцентом, а glass разрешён только как дозированный material layer.
- Карточки marketplace приведены к единому шаблону во всех секциях: фиксированное clipping-поведение заменено на авто-высоту с одинаковым `16/9` media ratio, desktop-полки скрывают лишние карточки вместо переноса, бейджи стали круглыми и раскрываются по hover/tap, у карточек появился action-menu с пунктом "Пожаловаться", а для авторизованных пользователей показывается кнопка избранного.
- Исправлена регрессия marketplace-карточек после ограничения рядов: product media стал ниже, содержимое карточек больше не режется по высоте, hover не поднимает карточку вверх, а на узких desktop/tablet ширинах лишние карточки скрываются селекторами вместо переноса или clipping.
- Карточки marketplace доработаны для адаптивных ширин: цены без нулевых копеек не обрезаются, desktop-ленты скрывают лишние карточки вместо переноса, загрузочные skeleton-карточки получили реальный размер, Safe deal стал зелёным бейджем со щитом, поддержка автора показывается только в авторском контексте как бейдж `автору`, а для verified pro-продавцов добавлен бейдж `От автора`.
- Главная marketplace получила точечную правку hero и мобильных лент: акцентный перенос в заголовке, выравнивание hero-карточек по заголовку, скрытые секционные orange-eyebrow плашки, мобильный author tile внутри горизонтальной подборки, тонкие стрелки для свайпа и отключение hover-подъёма на touch-устройствах.
- Главная marketplace дополнительно уплотнена: hero-кнопки "Смотреть товары" и "Все категории" удалены, карточки товаров показывают цену, рейтинг со звездой, название, продавца и плашки в заданном порядке, desktop-ряды стали сеткой без горизонтального листания, а мобильные ряды сохранили свайп.
- Статус roadmap `v0.0` обновлён до implemented.
- Статус roadmap `v0.1` обновлён до implemented.
- Статус roadmap `v0.2` обновлён до implemented.
- Go backend перешёл на `go 1.25.0`, Dockerfiles используют `golang:1.25-alpine`.
- Web/admin/widget больше не вызывают `getDictionary("ru")` напрямую, locale берётся из public env и общего i18n helper.
- Существующие web/admin/widget экраны переведены на light/dark темы через `data-theme` и semantic tokens.
- Главная, auth, профиль/studio, публичная страница автора, admin users panel и OBS widget визуально приведены к Creator OS / Marketplace Pro / Control Room направлению.
- `AGENTS.md` дополнен UI/UX workflow: какие документы читать перед интерфейсными задачами, как работать со статусами и что делать при расхождении кода с документацией.
- `docs/TASKS.md` дополнен разделом `UI/UX tasks`.
- Главная, профиль, публичная страница автора и admin app обновлены под текущую дизайн-систему: skeleton/empty/error states, role links, moderation tabs и подтверждения опасных действий.
- Mock payment callback теперь поддерживает `payment.purpose=order` и переводит order/deal в provider-agnostic статусы без real provider SDK.
- `README.md`, `ROADMAP.md` и `docs/TESTING.md` актуализированы под текущий статус `v0.3 Marketplace MVP / implemented locally` и ближайшие практические проверки перед `v0.4`.
- `docs/UX_IMPLEMENTATION_STATUS.md` и `docs/DESIGN_AUDIT.md` обновлены результатами practical page design pass.
- Корневой web route `/` теперь рендерит ту же marketplace-витрину, что и `/marketplace`, без redirect; topbar стал auth-aware, а auth pages перенаправляют уже вошедшего пользователя в marketplace.
- Страница входа web стала компактнее и визуально ближе к narrow auth layout.
- Залогиненная web topbar получила marketplace search, compact actions и меню аккаунта с role-aware ссылками без fake balance/future route переходов.
- Залогиненная web topbar на mobile удерживает элементы в одну строку; меню аккаунта разделено на категории, theme/language открываются как overlay-dropdown, а `/me/settings` и `/studio` отмечены в плане как страницы "скоро".
- Гостевая web topbar получила поиск, burger/dropdown menu с входом, регистрацией, публичными разделами, темой и языком; пункт покупок для гостя не показывается.
- Web dev-сервер разрешает тестовый внешний host `danechka.com` для Next.js dev-ресурсов через `allowedDevOrigins`; дополнительные host задаются через `NEXT_ALLOWED_DEV_ORIGINS`.
- Topbar search теперь сокращает placeholder только при реальной нехватке ширины, кнопка поиска выровнена по inset-отступам, а form controls защищены от dev hydration overlay из-за внешних injected attributes.
- Topbar search стал единым control с высотой соседних кнопок и встроенной правой кнопкой submit по смыслу YouTube search.
- Web-клиент в браузере по умолчанию использует same-origin `/api/v1/*`; Next.js route proxy прокидывает запросы к Go API, чтобы мобильный внешний dev-домен не обращался к `localhost` телефона.
- `/marketplace` переделан из текстового лендинга в мобильную главную маркетплейса: первый экран, поиск, быстрые категории, объясняющие плашки, горизонтальные товарные ленты, подборки авторов, блок доверия и нижняя лента новых товаров.
- Главная marketplace доупрощена: внутренний hero search/CRM-like панель поиска/категории/сортировки убраны, первый экран стал ближе к торговой витрине с CTA, быстрыми категориями, примером товара и role tabs; hero CTA "Смотреть популярное"/"Подборки авторов" убраны, raw `LEGAL_REVIEW_REQUIRED` не выводится в публичном UI, empty state получил действия "Стать продавцом" и "Все категории".
- Верх marketplace дополнительно отполирован: горизонтальные товарные ленты сбрасываются в начало после загрузки, role tabs стали компактными и размещены под trust-плашками, а блок "Как проходит покупка" оформлен как аккуратная flow-карточка.
- Public products API больше не превращает пустой `category` в slug `user`, поэтому `/api/v1/products` без фильтра возвращает все опубликованные товары; `docker-compose.dev.yml` явно прокидывает web proxy к `http://api:8080`.
- `ROADMAP.md` и `docs/TASKS.md` стали короткими индексами; подробные разделы перенесены в отдельные файлы, чтобы агент открывал только актуальный фокус и нужную задачу.
- В web topbar логотип `FF` выровнен по размеру с соседними controls, а кнопка поиска сделана квадратной с центрированной лупой.

### Security

- Добавлены правила запрета реальных секретов в Git.
- Добавлены шаблоны для секретов и доступов.
- Добавлен npm override для `postcss` и проверка `npm audit --audit-level=moderate`.
- Зафиксирован ADR для JWT access token в `v0.1`; admin role не выдаётся через публичный role intent.
- Зафиксирован ADR для mock payment callback и Redis events в Donate MVP.
- Зафиксирован ADR для semantic tokens, `data-theme` и хранения user preferences.
- Зафиксирован ADR для mock safe deal в Marketplace MVP; risky categories остаются restricted до legal/payment review.

### Verification

- `v0.1` проверен локально и на Oracle VM `fanfuel`: build, migrations, healthchecks, auth smoke, public creator smoke, admin users smoke.
- `v0.2` проверен локально и на Oracle VM `fanfuel`: build, migrations, healthchecks, donation idempotency smoke, mock payment callback, goal progress update и WebSocket `donation.alert.created`.
- `v0.3` локально проверен командами `npm run typecheck --workspaces --if-present`, `npm run lint`, `npm run build --workspaces --if-present`, `npm run test --workspaces --if-present`, `cd services && go test ./...`; миграции применены к dev-БД, docker compose stack пересобран, smoke `GET /healthz`, `GET /api/v1/categories`, web/admin/widget HTTP 200.
- Guest topbar menu проверено локально: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, CDP smoke на `http://localhost:3002/marketplace` для 1440/390/320 с проверкой one-line topbar, compact placeholder, отсутствия пункта покупок и overlay-dropdown темы/языка.
- Внешний dev-домен проверен через CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1`: React-гидратация есть, dropdown открывается, поиск отображается, предупреждения `Blocked cross-origin request` в логе dev-сервера нет.
- Topbar search polish проверен через CDP smoke на `http://danechka.com:3002/marketplace` при viewport 390px: placeholder остаётся длинным, если помещается; top/right/bottom inset search button = 5px; dev overlay не найден.

## 2026-09-14 — UX-TASK-029

Главная получила три режима аудитории: покупательский маркетплейс по умолчанию и презентации авторов/продавцов. Поиск возвращён в хэдер, ролевые ссылки и безопасность убраны из его навигации. Добавлены ru/en, адаптивность и клавиатурное управление.

## 2026-09-14 — UX-TASK-030

Полностью обновлены три режима главной: торговая навигация и реальные товары покупателю, витрина/рекомендации/поддержка автору, два канала продаж продавцу. Поиск центрирован, навигация сгруппирована с аккаунтом справа. Удалены фиктивные подборки и промокоды; добавлены локализованные иллюстрации, адаптивная композиция и retry каталога.

### 2026-09-14 — уточнение иконок UX-TASK-030

Обновлены геймпад, стрим-алерт и иллюстрация обучения с видеозвонком; исправлено перекрытие сообщений в иконке комьюнити.

- UX-TASK-030: добавлена монета к иллюстрации алерта; уточнены компактные пропорции и выравнивание геймпада.

### UX-TASK-031 — 2026-09-14

В хедере остался вход; регистрация доступна на auth-странице. Авторы сначала заполняют анкету с предпросмотром /create, затем авторизуются и сохраняют черновик. Добавлен API onboarding для новых и существующих аккаунтов покупателей. Публичная выдача черновиков закрыта.

UX-TASK-031: необязательные шаги описания, оформления (локальные аватар/баннер) и спонсорских товаров; пропуск без блокировки регистрации и сохранение локальных дополнений.

UX-TASK-031: переработана мобильная анкета — компактный выбор шага, раскрываемый предпросмотр, адаптированные поля и кнопки без горизонтального переполнения.

UX-TASK-031: единый Select дизайн-системы во всех web-формах; мобильная анкета снова использует строку из пяти шагов с короткими подписями и удобными зонами нажатия.

### Публикация — 2026-09-14

Текущий интерфейс и API опубликованы на https://fanfuel.ru после восстановления VM. Включены три режима главной, анкета автора и упрощённый вход/мобильное меню. Next.js обновлён до 16.3.3 перед публикацией.

### Публикация — 2026-09-15

- UX-TASK-032 опубликован на `https://fanfuel.ru`: регистрация без выбора роли и имени, отдельный шаг `/auth/name`, применена миграция `000006_profile_name_setup`.
- Production-сборка и проверка API/WS/worker/web выполнены на VM; прежняя версия сохранена в `/home/fanfuel/FanFuel.backup-20260915055409`.
