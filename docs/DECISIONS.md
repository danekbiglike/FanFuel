# DECISIONS.md

ADR-журнал FanFuel. Новые решения, влияющие на масштабируемость, безопасность или деньги, добавлять сюда.

## ADR-0001: Monorepo

Дата: 2026-05-08
Статус: accepted

### Контекст

FanFuel включает web, admin, OBS widgets, Go services, shared UI, SDK, i18n и types.

### Решение

Использовать monorepo со структурой `apps`, `services`, `packages`, `infra`, `docs`.

### Последствия

Проще синхронизировать типы, UI и документацию. Нужна дисциплина ownership и CI.

### Альтернативы

Отдельные репозитории для web/backend/widgets.

### Связанные документы

- `README.md`
- `docs/ARCHITECTURE.md`

## ADR-0002: Next.js для web

Дата: 2026-05-08
Статус: accepted

### Контекст

Нужны публичные страницы, SEO, dashboards и хороший mobile responsive UX.

### Решение

Использовать Next.js + React + TypeScript для `apps/web`.

### Последствия

Хорошая основа для публичных страниц и кабинетов. Нужно следить за i18n и API boundary.

### Альтернативы

Vite SPA, Remix, отдельный SSR backend.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/UX_PLAN.md`

## ADR-0003: Vite для OBS widgets

Дата: 2026-05-08
Статус: accepted

### Контекст

OBS/browser source виджеты должны быть лёгкими, независимыми и быстрыми.

### Решение

Использовать Vite + React + TypeScript для `apps/widget`.

### Последствия

Виджеты не зависят от тяжёлого web app. Нужна отдельная сборка и event SDK.

### Альтернативы

Next.js route inside web app, vanilla JS widgets.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0004: Go backend

Дата: 2026-05-08
Статус: accepted

### Контекст

Нужны надёжные API, платежные интеграции, workers и WebSocket gateway.

### Решение

Использовать Go для backend services.

### Последствия

Производительность и простота деплоя. Нужна дисциплина package boundaries.

### Альтернативы

Node.js/NestJS, Python/FastAPI, JVM.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0005: Go WebSocket gateway

Дата: 2026-05-08
Статус: accepted

### Контекст

OBS alerts и realtime notifications требуют устойчивого WebSocket слоя.

### Решение

Выделить `services/ws` на Go.

### Последствия

Можно масштабировать realtime отдельно от REST API. Нужно Redis pub/sub или streams.

### Альтернативы

WebSocket inside API, managed realtime provider.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/API_PLAN.md`

## ADR-0006: PostgreSQL

Дата: 2026-05-08
Статус: accepted

### Контекст

Нужна надёжная транзакционная БД для users, orders, payments, deals, ledger и audit.

### Решение

Использовать PostgreSQL.

### Последствия

ACID, constraints, индексы и транзакции подходят для финансовой модели. Нужно проектировать миграции аккуратно.

### Альтернативы

MySQL, CockroachDB, managed document DB.

### Связанные документы

- `docs/DOMAIN_MODEL.md`

## ADR-0007: Redis

Дата: 2026-05-08
Статус: accepted

### Контекст

Нужны cache, queues, realtime state и pub/sub.

### Решение

Использовать Redis на ранних этапах.

### Последствия

Быстрый старт для WS и workers. Позже можно выделить очередь, если Redis станет узким местом.

### Альтернативы

RabbitMQ, NATS, Kafka, Postgres-only queue.

### Связанные документы

- `docs/ARCHITECTURE.md`

## ADR-0008: S3/R2-compatible storage

Дата: 2026-05-08
Статус: accepted

### Контекст

Нужны аватары, баннеры, product media, digital files, dispute evidence и alert assets.

### Решение

Использовать S3/R2-compatible storage через abstraction.

### Последствия

Можно менять провайдера хранения. Нужны signed URLs, public/private buckets и access control.

### Альтернативы

Локальное файловое хранилище, vendor-specific storage SDK без abstraction.

### Связанные документы

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`

## ADR-0009: Payment provider abstraction

Дата: 2026-05-08
Статус: accepted

### Контекст

Провайдер платежей не выбран окончательно. Возможны tome.ru, ЮKassa/ЮMoney или другой оператор.

### Решение

Ввести `PaymentProvider`, `PayoutProvider`, `SafeDealProvider`, `FiscalizationProvider`, `ProviderWebhookHandler`.

### Последствия

Домен не привязан к одному провайдеру. Требуется status mapping, idempotency и adapter tests.

### Альтернативы

Прямая интеграция с одним провайдером.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/DOMAIN_MODEL.md`

## ADR-0010: Русскоязычный продукт с i18n

Дата: 2026-05-08
Статус: accepted

### Контекст

Основной язык продукта — русский, но английский должен поддерживаться без переписывания UI.

### Решение

Default locale `ru`, supported locales `ru/en`, все пользовательские тексты через i18n.

### Последствия

Больше дисциплины в компонентах, но проще масштабировать продукт и избегать hardcoded strings.

### Альтернативы

Хардкод русского языка на MVP.

### Связанные документы

- `docs/I18N.md`

## ADR-0011: Docker-based deployment

Дата: 2026-05-08
Статус: accepted

### Контекст

Целевой запуск — Linux VM/server. Нужны воспроизводимые dev, staging и production окружения.

### Решение

Использовать Docker + Docker Compose.

### Последствия

Проще запускать сервисы и зависимости. Нужна дисциплина секретов, healthchecks и backups.

### Альтернативы

Bare metal install, Kubernetes с первого дня, managed PaaS.

### Связанные документы

- `docs/DEPLOYMENT.md`

## ADR-0012: npm workspaces для frontend monorepo

Дата: 2026-05-08
Статус: accepted

### Контекст

На локальной машине доступны Node.js и npm, но `pnpm` не установлен. Для `v0.0 Foundation` нужен воспроизводимый способ запускать `apps/*` и `packages/*` без дополнительной установки менеджера пакетов.

### Решение

Использовать npm workspaces и `package-lock.json` для frontend/package части monorepo.

### Последствия

Разработчик может выполнить `npm install`, `npm run typecheck`, `npm run lint`, `npm run build` сразу после checkout. Если команда позже решит перейти на pnpm, это нужно оформить отдельным ADR и обновить lockfile/scripts.

### Альтернативы

pnpm workspaces, Yarn workspaces, Turborepo с отдельным package manager.

### Связанные документы

- `README.md`
- `docs/DEPLOYMENT.md`

## ADR-0013: JWT access token для v0.1 Auth

Дата: 2026-05-08
Статус: accepted; registration role policy superseded by ADR-0022

### Контекст

Для `v0.1 Auth + Profiles` нужен быстрый и проверяемый способ авторизовать web/admin запросы. Cookie/session и refresh rotation требуют отдельной проработки CSRF, invalidation и device/session management.

### Решение

Использовать JWT access token в `Authorization: Bearer <token>` с HS256, `JWT_SECRET`, `ACCESS_TOKEN_TTL_MINUTES` и bcrypt password hashing. Исходная политика role intent заменена ADR-0022: публичная регистрация создаёт только базовую роль `buyer`. Роль `admin` через публичную регистрацию не выдаётся. Dev bootstrap admin разрешён только вне production через `ADMIN_BOOTSTRAP_EMAIL`, если admin role ещё отсутствует.

### Последствия

`v0.1` можно тестировать через web/admin UI и REST API без cookie/session слоя. Logout на этом этапе клиентский/stateless, поэтому для production нужен следующий ADR по refresh token, session invalidation и secure cookie strategy.

### Альтернативы

Server-side sessions, JWT access + refresh сразу, OAuth-first подход.

### Связанные документы

- `docs/SECURITY.md`
- `docs/API_PLAN.md`
- `docs/TASKS.md`

## ADR-0014: Mock payment callback и Redis events для Donate MVP

Дата: 2026-05-09
Статус: accepted

### Контекст

`v0.2 Donate MVP` должен дать проверяемый поток доната без подключения реального платёжного провайдера. Донат влияет на деньги, публичную историю, цели сбора и OBS realtime alerts.

### Решение

Для `v0.2` использовать mock `PaymentProvider`: `POST /donations` создаёт `Payment` в status `pending`, а dev-only mock callback переводит payment/donation в success или failure. Callback сохраняется в `provider_webhooks` и обрабатывается идемпотентно. После успешной оплаты API публикует provider-agnostic event envelope в Redis channels `creator:{creator_id}:alerts` и `creator:{creator_id}:goals`; `services/ws` валидирует read-only widget token по БД и пересылает события OBS widget.

### Последствия

Donate flow можно проверять локально и на VM без real provider credentials. Домен не получает прямой зависимости от конкретного провайдера, но перед production нужны real provider adapter, подписи webhook, fiscalization review, refund flow и отдельное решение по token rotation grace period.

### Альтернативы

Сразу подключить real provider sandbox; завершать оплату синхронно в `POST /donations`; держать WebSocket внутри API.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/SECURITY.md`

## ADR-0015: Semantic tokens и `data-theme` для UI

Дата: 2026-05-09
Статус: accepted

### Контекст

FanFuel должен поддерживать зрелый creator-commerce UI, light/dark темы, OBS widgets и будущие marketplace/dashboard сценарии. В `v0.2` цвета были зашиты в web/admin/widget CSS и не давали безопасно развивать дизайн.

### Решение

Использовать shared design system в `packages/ui`:

- semantic CSS variables для цветов, статусов, surface, borders, shadows;
- `data-theme="light|dark"` на `<html>`;
- `ThemePreference = "system" | "light" | "dark"`;
- guest choice хранить в localStorage/cookie;
- authenticated choice хранить в `user_preferences`;
- синхронизация через `/api/v1/me/preferences`;
- OBS widgets поддерживают URL override `?theme=system|light|dark|transparent`.

### Последствия

Все новые страницы должны использовать semantic tokens. Темизация применяется до React render через inline script, что снижает flash неправильной темы. Backend получает новую таблицу preferences, но платёжная логика и provider abstractions не меняются.

### Альтернативы

- `next-themes` только для web без admin/widget.
- Hardcoded light theme до marketplace.
- Tailwind-only palette без backend preferences.

### Связанные документы

- `docs/DESIGN_SYSTEM.md`
- `docs/THEMING.md`
- `docs/UI_RULES.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`

## ADR-0016: Mock safe deal для Marketplace MVP

Дата: 2026-05-09
Статус: accepted

### Контекст

`v0.3 Marketplace MVP` должен дать проверяемый поток покупки товара без подключения реального провайдера, выплат, ledger и юридически финального safe deal. При этом нельзя смешивать `Order`, `Payment` и `Deal` статусы, потому что дальше это повлияет на деньги, споры и выплаты.

### Решение

Использовать provider-agnostic mock flow:

- `POST /orders` создаёт `Payment` с `purpose=order`, `Order` и `Deal`;
- mock callback переводит `Payment` в `succeeded`, `Order` в `paid`, `Deal` в `held`;
- seller actions переводят deal в `seller_working` и `seller_submitted`;
- buyer confirmation завершает mock lifecycle как `Order.completed` и `Deal.completed`;
- restricted/risky categories остаются seeded, но недоступны для seller product creation до legal/payment review;
- реальные payouts, refunds, disputes, fiscalization и ledger movements не создаются в `v0.3`.

### Последствия

Marketplace можно тестировать end-to-end локально: категории, товары, checkout, buyer/seller кабинеты, отзывы и admin moderation. Production money flow остаётся заблокированным до provider/legal review и ledger/payout задач.

### Альтернативы

Сразу подключить real provider sandbox; хранить только order status без отдельного deal; отложить весь marketplace до payout/ledger.

### Связанные документы

- `docs/PAYMENTS.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/TASKS.md`

## ADR-0017: Skin-ready UI без изменения структуры страниц

Дата: 2026-05-15
Статус: proposed

### Контекст

К `v0.3.5` FanFuel должен поддержать разные визуальные скины сайта и публичных страниц, но без риска сломать навигацию, i18n, mobile layout, доступность и рабочие кабинеты. Одновременно профиль пользователя нужно отделить от настроек автора/продавца, чтобы role-specific Studio/Seller flows не росли внутри `/me/profile`.

### Решение

Ввести безопасный слой `DesignSkinPreset` поверх существующих semantic tokens:

- скин меняет только allowlisted token overrides, density, radius scale, shadow/elevation и preview assets;
- скин не меняет layout slots, route structure, порядок ключевых блоков, i18n keys и бизнес-статусы;
- произвольный CSS/HTML/JS запрещён;
- public profile, creator store и widget preview используют один layout contract и проверяются на `ru`/`en`, light/dark и mobile;
- `/me/profile` становится user account hub, а настройки автора, витрины и виджетов живут в `/studio/*`, продавца — в `/seller/*`.

### Последствия

Можно развивать визуальную вариативность без ветвления страниц и без кастомных шаблонов, которые сложно поддерживать. Нужны schema validation, visual QA matrix и дисциплина i18n для длинных строк. User role lifecycle требует owner-only endpoints, confirmation и audit log.

### Альтернативы

- Разрешить произвольные темы/CSS для авторов.
- Оставить один глобальный дизайн без skin layer.
- Дать авторам редактировать layout drag-and-drop уже в MVP.

### Связанные документы

- `docs/roadmap/v0.3.5-universal-profile-studio.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/THEMING.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/UI_UX_TRACKER.md`

## ADR-0018: Studio statistics и bot events как provider-agnostic activity layer

Дата: 2026-05-15
Статус: proposed

### Контекст

К `v0.3.5` Studio должна получить статистику дохода, последние события, подписки на каналы YouTube/Twitch/Telegram через ботов, покупки партнёрских товаров и настройки донатов. Эти функции затрагивают деньги, realtime, внешние платформы и безопасность токенов, но не должны раньше времени превращаться в payouts, ledger или provider-specific интеграцию.

### Решение

Ввести отдельный activity/analytics слой Studio:

- `CreatorActivityEvent` хранит unified feed событий без raw secrets;
- `CreatorMetricSnapshot` хранит агрегаты для графиков в minor units и не является балансом;
- `CreatorChannelIntegration` хранит masked status внешних каналов, а секреты остаются backend-side encrypted references;
- bot ingestion идёт через signed service-to-service endpoint или trusted queue boundary;
- `/studio/statistics` показывает аналитику по событиям, а не доступные к выводу деньги;
- `/studio/events` показывает донаты, channel subscriptions и partner purchases с дедупликацией.

### Последствия

Studio может расти как рабочий центр автора без смешивания с платежным ledger и без привязки к одному внешнему сервису. Перед production-подключением ботов нужны platform/security review, rate limits, retry/dead-letter strategy и policy по OAuth scopes. UI должен осторожно формулировать "доход" и не обещать выплату.

### Альтернативы

- Читать статистику напрямую из payment/order таблиц на каждом запросе.
- Хранить YouTube/Twitch/Telegram payload как публичные события без отдельного masking слоя.
- Отложить все события Studio до полноценной BI/analytics системы.

### Связанные документы

- `docs/roadmap/v0.3.5-universal-profile-studio.md`
- `docs/API_PLAN.md`
- `docs/DOMAIN_MODEL.md`
- `docs/PAYMENTS.md`
- `docs/SECURITY.md`
- `docs/UI_UX_TRACKER.md`

## ADR-0019: FanFuel Aurora как базовый visual refresh перед v0.3.5

Дата: 2026-05-16
Статус: proposed

### Контекст

Текущий public/marketplace UI использует тёмную основу, яркий оранжевый акцент и плотные бейджи. Для creator-commerce продукта это несёт риск нежелательного считывания как adult/betting/casino/старый skin-shop и может мешать доверию к покупкам, safe deal и поддержке автора. Перед расширением профиля, Studio, витрины и виджетов нужно обновить уже существующий визуальный слой.

### Решение

Принять `FanFuel Aurora` как internal design direction для `v0.3.5`:

- primary brand: violet/cyan через semantic tokens;
- support action: emerald;
- warm/orange: только редкий статусный акцент для hit/warning/popular;
- deep navy/graphite surfaces вместо почти чёрного визуального монолита;
- glass material только для allowlisted слоёв: topbar, search, tabs, modals/drawers, hero preview, sticky checkout, widget preview;
- public pages могут быть эмоциональнее, dashboards/admin остаются плотными и рабочими;
- первый блок задач `v0.3.5` обновляет текущие экраны, затем идут skin-ready/profile/studio задачи.

### Последствия

Новые страницы `v0.3.5` будут строиться поверх единой базы, а не усиливать старый orange/black стиль. Потребуются token migration, contrast QA, screenshot QA в `ru/en`, light/dark и mobile. Нельзя возвращать orange как primary без нового ADR/design review.

### Альтернативы

- Оставить текущий orange/black визуал и строить Studio поверх него.
- Сделать весь UI glassmorphism.
- Разрешить авторам произвольный CSS/HTML для “скинов”.
- Сменить внешний бренд/название продукта вместо аккуратного visual refresh.

### Связанные документы

- `docs/DESIGN_SYSTEM.md`
- `docs/THEMING.md`
- `docs/UI_RULES.md`
- `docs/UX_RULES.md`
- `docs/DESIGN_AUDIT.md`
- `docs/tasks/v0.3.5/FF-0348.md`
- `docs/tasks/v0.3.5/FF-0349.md`
- `docs/tasks/v0.3.5/FF-0350.md`

## ADR-0020: Отдельная VM приложения и отдельный edge nginx

Дата: 2026-09-14. Статус: принято для задачи FF-0009.

### Контекст

Пользователь запросил новую VM FanFuel на диске D: и затем уточнил, что nginx будет размещён на другой VM. Существующие VM других проектов не используются для приложения.

### Решение

- Отдельная Ubuntu 24.04 VM, Docker Compose и постоянные volumes приложения.
- `docker-compose.vm.yml` применяется после base/dev файлов; Next.js запускается через `next start`, Vite-приложения собираются в статические файлы.
- `APP_ENV=production` отключает dev bootstrap администратора и включает точный CORS allowlist. Это технический режим запуска, а не признание готовности платежей к production.
- Секреты генерируются отдельно на VM, `.env` имеет права 0600; SSH использует отдельный ключ вне Git.
- Базы, storage API/console, worker и admin привязаны к loopback. Web/API/WS/widget публикуются на LAN-адресе VM для будущего edge.
- `DOCKER-USER` ограничивает вход из LAN к прикладным контейнерам. До получения адреса nginx VM разрешена локальная подсеть; затем правило следует сузить до адреса edge и необходимых административных источников. UFW сам по себе не защищает published Docker ports.
- nginx/TLS/внешние пробросы остаются отдельным шагом по просьбе пользователя. Созданный до уточнения HTTP bootstrap внутри FanFuel VM далее не изменяется и не считается финальным edge.

### Последствия

- В публичной конфигурации edge потребуются TLS, проксирование HTTP/WebSocket, ограничения auth/API и запрет публикации mock callbacks/admin API.
- Реальные платежи, выплаты и legal readiness остаются за пределами задачи. `LEGAL_REVIEW_REQUIRED` и provider review сохраняются.
- Нужно закрепить LAN-адрес VM через DHCP reservation; фактические адреса и SSH-доступы записаны только в игнорируемом `docs/SERVER_ACCESS.md`.
- Перезапуск контейнеров обеспечен `unless-stopped`, firewall восстанавливается systemd. Автозапуск самой VM при старте Windows отдельно не настраивается.

Дополнение FF-0009: недоступный Docker Hub образ MinIO заменён только в VM override на официальный Quay image с закреплённым digest. Storage не публикуется в LAN; обновление/поддержка object storage требует отдельного решения перед публичным использованием файлов.

## ADR-0021: Публичный Host/SNI edge и TLS на VM приложения

Дата: 2026-09-14. Статус: принято. TASK-ID: FF-0010. Уточняет ADR-0020.

- Общий edge сохраняет TLS passthrough для LibreChat; добавлены только домены FanFuel в Host/SNI maps.
- TCP 80/443 роутера направлены на edge; новые SSH-пробросы не создаются. Остальные правила роутера не меняются.
- HTTPS завершается на FanFuel VM, где установлен certbot и достаточно места для него. На маленьком системном диске Alpine edge certbot не используется.
- Все Docker published ports FanFuel возвращены на loopback; UFW принимает 80/443 только от edge. IP приложения закреплён в DHCP.
- Let's Encrypt сертификат покрывает основной и www-домен. Обновление выполняет certbot.timer с nginx reload hook.
- Public admin API и mock callbacks запрещены на nginx; реальные платежи и legal readiness этим не включаются.
- Ограничение принятой схемы: исходный TLS client IP до приложения не передаётся, лимиты nginx агрегируются по IP edge. Улучшение требует PROXY protocol или изменения места TLS termination; в текущей задаче работающий LibreChat transport не меняется.

## ADR-0022: Базовая регистрация без role intent и имени платформы

Дата: 2026-09-14. Статус: принято. TASK-ID: UX-TASK-032.

### Контекст

Регистрация просила имя на платформе и роль для старта. Это смешивало три разных значения: имя для интерфейса, публичный ник/название витрины и будущий username, а также заставляло выбирать роль до первого опыта в продукте. Backend по role intent сразу создавал creator/seller profile.

### Решение

- `POST /api/v1/auth/register` принимает только `email`, `password` и optional locale/time zone.
- Публичная регистрация всегда создаёт базовый аккаунт с ролью `buyer`.
- `display_name` и `role_intent` удалены из request contract; старые клиенты должны обновиться.
- Профиль создаётся с временным display name и `name_confirmed_at = null`.
- Следующий обязательный шаг — `/auth/name`; он сохраняет имя через `PATCH /api/v1/me/profile`.
- Текущему пользователю API возвращает `profile_name_confirmed_at`; публичные profile responses не раскрывают этот маркер.
- Режимы автора/продавца включаются отдельными явными сценариями после базового аккаунта.
- Существующие профили в миграции помечаются подтверждёнными, чтобы не заставлять текущих пользователей повторять шаг.

### Последствия

- Это локальное pre-beta breaking change публичного auth contract; оно зафиксировано здесь и в `docs/API_PLAN.md`.
- После подключения email verification шаг имени должен идти после реального подтверждения email, но смысл поля не меняется.
- Имя платформы, публичный ник/название витрины и username остаются отдельными значениями и не резервируют друг друга.

## ADR — UX-TASK-031: создание авторского черновика после входа

Решение: публичная анкета хранит только название/описание в sessionStorage; серверное создание выполняется после авторизации и явного сохранения. Фиксированный auth-return исключает внешний redirect. POST onboarding выдаёт только роль streamer своему пользователю (как существующая регистрация), блокирует повторное создание блокировкой строки пользователя, не изменяет существующие страницы и пишет audit log. Публикация отдельная.

UX-TASK-031: обнаружена выдача draft авторов публичными GET и допустимость draft в разрешении адресата доната. В связи с созданием приватных черновиков разрешён только published; PublicProfile скрывает непубличный creator_profile. Provider/суммы/проведение платежей не меняются. Изменение доступа намеренное, чтобы черновик не был публичным до публикации.

## ADR-0023: UX авторизации без публичного определения наличия аккаунта

Дата: 2026-09-15. Статус: принято. TASK-ID: UX-TASK-033.

Сохраняем email/password и фиксированные переходы marketplace/name/creator. Не вводим endpoint проверки существования пользователя, вход по display_name/slug или телефону. Будущая автоматическая развилка требует подтверждения владения email и отдельного backend/security проекта; обоснование и источники — `docs/AUTH_UX_REVIEW.md`.

Пароль не сохраняется при смене режима, email живёт только в памяти auth layout. Текущая политика JWT/localStorage не меняется. Ошибка сети при проверке сессии не является доказательством невалидного токена; очищать его можно при unauthorized либо явном выборе другого аккаунта. Проверка регистрации на клиенте учитывает фактический предел bcrypt в 72 UTF-8 байта без обрезания пароля; серверная политика требует отдельного выравнивания, см. DESIGN_AUDIT.

## ADR-0024: Подтверждение email до регистрации и единый identifier-first flow

Дата: 2026-09-17. Статус: принято. TASK-ID: UX-TASK-035. Заменяет решение ADR-0023 о запрете публичной развилки.

### Контекст

Пользователь явно запросил обязательное подтверждение почты и объединение отдельных страниц входа/регистрации. Текущий backend создаёт активный аккаунт сразу по email/password и не отправляет письма. Телефон и account username пока отсутствуют в домене.

### Решение

- Канонический маршрут авторизации — `/auth`; старые `/auth/login` и `/auth/register` выполняют совместимый redirect.
- `POST /auth/identify` определяет только существование email и возвращает `login` либо `register`.
- Новый аккаунт не создаётся до подтверждения одноразового кода.
- Код живёт 10 минут, имеет максимум 5 попыток, resend cooldown 60 секунд, хранится только как HMAC digest и инвалидирует предыдущий challenge.
- После проверки кода выдаётся короткоживущий registration JWT, привязанный к email и challenge. Challenge помечается завершённым в транзакции создания пользователя, поэтому token нельзя применить повторно.
- Письма отправляются через `EmailSender`; первая реализация использует SMTP из environment, а dev stack — Mailpit. Синхронная отправка из API принята как временный MVP; перенос в worker/queue нужен до существенной нагрузки.
- Аккаунты, существующие до миграции, получают `email_verified_at` из `created_at`, чтобы rollout не блокировал текущий вход.

### Security-компромисс

Ответ `identify` раскрывает факт существования аккаунта. Это осознанно принято ради парольного входа без OTP на каждом посещении. Ограничения: rate limit по IP и identifier, одинаковый HTTP status, отсутствие профиля/статуса/ролей в ответе. Более строгий будущий вариант должен подтверждать владение email до выбора режима либо использовать единый OTP/passkey flow.

### Последствия

Контракт регистрации меняется до public beta: вместо email требуется registration token. Нужны миграция challenge-таблицы, SMTP readiness, мониторинг доставки и cleanup истёкших challenge. Телефон/username не добавляются этой задачей.
