# HANDOFF.md

Документ для передачи работы между агентами.

## Handoff 2026-09-17: UX-TASK-035 — подтверждение email и единая авторизация

### Что сделано

- Добавлен canonical route `/auth`: первый шаг принимает email, существующий аккаунт ведёт к паролю, новый — к отправке и проверке одноразового кода, затем к созданию пароля. Старые `/auth/login` и `/auth/register` перенаправляют на `/auth` и сохраняют `flow=creator`.
- Регистрация больше не принимает неподтверждённый email: API выдаёт короткоживущий registration token после verification и атомарно помечает challenge использованным при создании пользователя. Новый пользователь создаётся active с `email_verified_at`.
- Добавлены миграция `000007_email_verification`, challenge repository, HMAC digest кода, 10 минут TTL, 5 попыток, 60 секунд cooldown, rate limits по IP/email, SMTP `EmailSender` и optional Mailpit compose.
- Существующие пользователи grandfathered как verified, чтобы rollout не заблокировал вход. Телефон и username намеренно не входят в итерацию.
- Обновлены API/domain/security/ADR/UX/i18n документы и ru/en тексты. ADR-0024 фиксирует выбранный enumeration-компромисс и заменяет прежнее решение ADR-0023.

### Основные файлы

- Backend: `services/api/internal/app/{app,handlers,store,types,token,validation,email_verification,email_sender}.go`, `services/internal/platform/config/config.go`.
- Frontend: `apps/web/src/app/auth/**`, `apps/web/src/components/auth-{context,shell}.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/app/globals.css` и ссылки на auth в публичных/кабинетных страницах.
- Data/infra: `infra/migrations/000007_email_verification.*`, `docker-compose.yml`, `docker-compose.mailpit.yml`, `.env.example`.
- Contracts/copy: `packages/types/src/index.ts`, `packages/i18n/locales/{ru,en}/{common,errors,emails}.json`.

### Проверки

- `go test ./...` из `services/` — успешно.
- `go vet ./...` из `services/` — успешно.
- `npm run typecheck` — успешно во всех workspaces.
- `npm run lint -- --max-warnings=0` — успешно.
- `npm run build --workspace @fanfuel/web` — успешно.
- `npm run test --workspaces --if-present` — успешно (в workspaces нет отдельных test scripts с выводом).
- Browser QA `/auth`: desktop/mobile 390×844, light/dark, labels и focusable controls — успешно.

### Не проверено и риски

- Migration smoke и реальная SMTP-доставка не проверены: в локальной среде нет запущенных Docker/PostgreSQL/SMTP. Перед rollout применить migration на staging и пройти новый email → code → password → `/auth/name`, resend/expiry/attempt exhaustion и повторное использование token.
- `identify` раскрывает наличие аккаунта через `next_action`. Это осознанный продуктовый компромисс; ограничение — одинаковый 200 status, минимальный ответ и rate limits. Для устранения утечки понадобится OTP-first/passkey flow.
- Rate limiter пока process-local, а SMTP send синхронный. Перед горизонтальным масштабированием перенести лимиты в Redis, а доставку/retries — в worker/queue.
- SMTP adapter рассчитан на обычный SMTP с STARTTLS (или dev SMTP без TLS); implicit TLS на 465 отдельно не реализован.

### Следующие задачи

- Настроить production SMTP secrets и выполнить staging smoke новой регистрации.
- Отдельно реализовать безопасный password reset.
- Username/phone добавлять только после identifier model, уникальности, verification и recovery security review.

## Handoff 2026-09-16: UX-TASK-034 — скрытый режим Fuel Match

### Что сделано

- Добавлен скрытый route `/gaming`, который не отображается в публичной навигации FanFuel.
- Реализована автономная match-3 игра Fuel Match: поле 8×8, 12 уровней, цели по очкам и типам фишек, ограничение ходов, каскады, линейные ракеты, призмы, заряд суперсилы и состояния победы/поражения/паузы.
- Добавлены локальные игровые монеты без денежной ценности, усилители «Импульс», «Миксер» и «Вспышка», покупка усилителей за локальные монеты и награды за уровни.
- Прогресс, открытые уровни, лучшие результаты и инвентарь сохраняются только в `localStorage`; API, БД и серверная игровая логика не добавлялись.
- Добавлены ru/en строки, semantic light/dark стили, responsive layout, клавиатурная навигация и `prefers-reduced-motion`.
- Обновлены Page Spec, Page Map, UI/UX Tracker, User Flow, статус реализации, task и changelog.

### Изменённые файлы

- `apps/web/src/app/gaming/page.tsx`
- `apps/web/src/app/gaming/fuel-match.tsx`
- `apps/web/src/app/gaming/gaming.module.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/tasks/ui-ux/UX-TASK-034.md`
- `docs/TASKS.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Какие проверки запускались

- ESLint для новых TSX-файлов: ошибок и предупреждений нет.
- Prettier для новых игровых файлов, i18n-словарей и task-файла.
- Next.js production compilation: игровой route успешно компилируется; общая TypeScript-фаза останавливается на существующих до этой задачи отсутствующих auth-ключах ru/en в `apps/web/src/components/auth-shell.tsx`.
- Browser smoke на `/gaming`: desktop-render; mobile viewport 390×844 без горизонтального overflow; валидный ход уменьшает счётчик ходов, создаёт каскад ×2 и специальные фишки; «Импульс» очищает фишку без списания хода; console errors отсутствуют.

### Что не удалось проверить

- Полный workspace typecheck/build не проходит из-за уже существующего несоответствия ключей `auth.*` между i18n-словарями, не относящегося к UX-TASK-034.
- Не выполнялся длительный ручной проход всех 12 уровней; основные игровые механики проверены smoke-сценарием.

### Риски и следующие задачи

- Очистка browser storage удаляет прогресс; синхронизация между устройствами намеренно отсутствует.
- При расширении режима следующую игру нужно добавлять отдельной задачей и сохранять отсутствие публичной навигации/API, пока scope явно не изменён.
- Отдельной задачей исправить auth i18n parity, чтобы восстановить зелёный общий typecheck/build.

## Handoff 2026-09-15: обрывы ответов и фиктивная смена модели (локальный роутер Codex)

### Что сделано

- Диагностирован обрыв ответов посреди хода: локальный роутер провайдеров (`~/.codex/router`) выбрасывал элементы `reasoning`, из-за чего DeepSeek в thinking mode отвечал `400 The reasoning_text in the thinking mode must be passed back to the API` и `404 page not found`.
- Установлено, что `encrypted_content` бывает двух видов: настоящий шифртекст аккаунта у GPT (`gAAAAAB...`) и безобидная ссылка `<response_id>-<n>` у DeepSeek, `null` у GLM. Выбрасывать оба нельзя, оставлять оба тоже.
- В `router.py` добавлена функция `reasoning_action` и режим `reasoning_mode` (`auto` / `drop` / `keep`); `auto` классифицирует элемент по виду `encrypted_content`. Режим `drop_reasoning_items` сохранён для обратной совместимости.
- В `providers.json` оба провайдера переведены на `reasoning_mode: "auto"`.
- Зафиксировано, что смена модели внутри открытого чата не доходит до запроса: приложение пишет `thread_settings`, но отправляет модель, с которой чат создан.

### Изменённые файлы

- `C:\Users\remot\.codex\router\router.py`
- `C:\Users\remot\.codex\router\providers.json`
- `C:\Users\remot\.codex\router\README.md`
- `docs/CHANGELOG.md`
- Бэкапы: `router.py.bak-20260915-205123`, `providers.json.bak-20260915-205123`

### Какие проверки запускались

- `py_compile` для `router.py` — SYNTAX_OK.
- Юнит-тест `reasoning_action` на четырёх формах, плюс проверка `sanitize()` — все проходят.
- 5 прямых запросов в AgentRouter (варианты «как есть», «вырезать id», «вырезать id + encrypted», «выбросить reasoning»): DeepSeek с сохранением reasoning — 200 во всех глубинах (до 116 элементов / 552 КБ), с выбрасыванием — 400.
- End-to-end через роутер после перезапуска: DeepSeek (8 элементов, 2 reasoning) — 200, DeepSeek (полная история) — 200, GLM (полная история) — 200; в журнале `reasoning_items: 0`, `reasoning_encrypted: 35`.
- Смешанный запрос с GPT-блобом: блоб отброшен, ссылка вычищена, ответ 402 по квоте.

### Что не удалось проверить

- GPT-модели (`gpt-6-astra`, `gpt-5.6-sol`) — AgentRouter отвечает `402 Budget pool quota has been exhausted`; поведение шифртекста подтверждено только по форме данных и по отсутствию ошибок ресурса.
- Квота AgentRouter на GPT-модели исчерпана на стороне провайдера; для них нужен официальный аккаунт (`model_provider = "openai"`).

### Риски

- Классификация `encrypted_content` эвристическая: если релей сменит формат ссылки, элементы снова начнут отбрасываться. Признак в логе — рост `reasoning_items` при 400 от DeepSeek.
- Роутер слушает только loopback; без запущенного процесса Codex получает отказ соединения.

### Следующие задачи

- Проверить GPT-модели после восстановления квоты или на официальном аккаунте.
- Решить, нужно ли добиваться смены модели внутри чата на стороне приложения (сейчас лечится новым чатом).
## Handoff 2026-09-15: исправление проверок и UX-ошибок auth-форм

### Что сделано

- Добавлен `.prettierignore` (`.tmp`, `test-results`, `node_modules`, `package-lock.json`, `.next`, `dist`, `build`, `coverage`, логи, env-файлы) и весь репозиторий приведён к Prettier-стилю: `prettier --check .` теперь проходит.
- Проведён UX-аудит auth-форм по web.dev Sign-in Best Practices и NN/g: у login/register отсутствовали `autocomplete`, показ пароля и явная подсказка требований.
- `/auth/login`: добавлены `name`/`autoComplete="email"`, `autoComplete="current-password"`, кнопка показа/скрытия пароля с `aria-pressed`, подсказка о восстановлении пароля, семантический `role="tablist"` для переключателя вход/регистрация.
- `/auth/register`: добавлены `autoComplete="email"`, `autoComplete="new-password"`, кнопка показа/скрытия пароля, видимая подсказка требований к паролю (не после ошибки, а до ввода — по рекомендации NN/g).
- Добавлены i18n-ключи в ru/en: `showPassword`, `hidePassword`, `passwordRequirements`, `authModeLabel`, `authLoginHint`.
- Добавлены CSS-классы `ff-password-field`, `ff-password-toggle`, `ff-field-hint` через semantic tokens, без хардкода цветов.

### Изменённые файлы

- `.prettierignore` (новый)
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/register/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- Все остальные файлы, затронутые только `prettier --write` (форматирование, без изменения логики)

### Проверки

- `prettier --check .` — успешно (после добавления ignore и форматирования).
- TypeScript: все 7 workspace (web, admin, widget, i18n, sdk, types, ui) — успешно.
- ESLint по всему репозиторию — успешно.
- Production build `apps/web` (Next.js 16.3.3) — успешно, 26 маршрутов.
- Go-тесты не запускались: `go.exe` не установлен на этой машине.

### Что не проверено

- Browser QA форм вживую (нет запущенного API/БД в этой сессии).
- Go-сервисы: нет компилятора Go на машине.
- Полные билды admin/widget: в их локальных `node_modules` нет vite (не установлены зависимости workspace).

### Оставшиеся UX-проблемы (зафиксированы, не исправлялись без отдельной задачи)

- `/auth/login`: нет ссылки «Забыли пароль?» — заблокировано отсутствием backend reset flow (UX-BLOCKED-001), добавлена честная подсказка вместо мёртвой ссылки.
- `/me/profile` — NEEDS_REWORK: mini Studio и seller settings внутри профиля (UX-UPDATE-001, известная задача).
- Checkout требует логина перед покупкой — guest checkout не реализован (спорное решение для creator-commerce, требует продуктового решения).
- ThemeSwitcher — текстовые `OS/LT/DK`, ждёт дизайн-ревью (UX-DESIGN-REVIEW-001).
- Проверка «Забыли пароль» и passkeys требуют продуктового решения после LEGAL_REVIEW по способам входа в РФ (см. предыдущий handoff).

### Следующие шаги

- При доступной среде: browser QA login/register на mobile 320/390 и light/dark.
- Продуктовое решение по guest checkout.
- Реализация password reset backend flow после выбора способа авторизации.

TASK-ID: UX-аудит в рамках текущей сессии; отдельный TASK-ID не назначался.
Документ для передачи работы между агентами.

## Handoff 2026-09-15: обрывы ответов и фиктивная смена модели (локальный роутер Codex)

### Что сделано

- Диагностирован обрыв ответов посреди хода: локальный роутер провайдеров (`~/.codex/router`) выбрасывал элементы `reasoning`, из-за чего DeepSeek в thinking mode отвечал `400 The reasoning_text in the thinking mode must be passed back to the API` и `404 page not found`.
- Установлено, что `encrypted_content` бывает двух видов: настоящий шифртекст аккаунта у GPT (`gAAAAAB...`) и безобидная ссылка `<response_id>-<n>` у DeepSeek, `null` у GLM. Выбрасывать оба нельзя, оставлять оба тоже.
- В `router.py` добавлена функция `reasoning_action` и режим `reasoning_mode` (`auto` / `drop` / `keep`); `auto` классифицирует элемент по виду `encrypted_content`. Режим `drop_reasoning_items` сохранён для обратной совместимости.
- В `providers.json` оба провайдера переведены на `reasoning_mode: "auto"`.
- Зафиксировано, что смена модели внутри открытого чата не доходит до запроса: приложение пишет `thread_settings`, но отправляет модель, с которой чат создан.

### Изменённые файлы

- `C:\Users\remot\.codex\router\router.py`
- `C:\Users\remot\.codex\router\providers.json`
- `C:\Users\remot\.codex\router\README.md`
- `docs/CHANGELOG.md`
- Бэкапы: `router.py.bak-20260915-205123`, `providers.json.bak-20260915-205123`

### Какие проверки запускались

- `py_compile` для `router.py` — SYNTAX_OK.
- Юнит-тест `reasoning_action` на четырёх формах, плюс проверка `sanitize()` — все проходят.
- 5 прямых запросов в AgentRouter (варианты «как есть», «вырезать id», «вырезать id + encrypted», «выбросить reasoning»): DeepSeek с сохранением reasoning — 200 во всех глубинах (до 116 элементов / 552 КБ), с выбрасыванием — 400.
- End-to-end через роутер после перезапуска: DeepSeek (8 элементов, 2 reasoning) — 200, DeepSeek (полная история) — 200, GLM (полная история) — 200; в журнале `reasoning_items: 0`, `reasoning_encrypted: 35`.
- Смешанный запрос с GPT-блобом: блоб отброшен, ссылка вычищена, ответ 402 по квоте.

### Что не удалось проверить

- GPT-модели (`gpt-6-astra`, `gpt-5.6-sol`) — AgentRouter отвечает `402 Budget pool quota has been exhausted`; поведение шифртекста подтверждено только по форме данных и по отсутствию ошибок ресурса.
- Квота AgentRouter на GPT-модели исчерпана на стороне провайдера; для них нужен официальный аккаунт (`model_provider = "openai"`).

### Риски

- Классификация `encrypted_content` эвристическая: если релей сменит формат ссылки, элементы снова начнут отбрасываться. Признак в логе — рост `reasoning_items` при 400 от DeepSeek.
- Роутер слушает только loopback; без запущенного процесса Codex получает отказ соединения.

### Следующие задачи

- Проверить GPT-модели после восстановления квоты или на официальном аккаунте.
- Решить, нужно ли добиваться смены модели внутри чата на стороне приложения (сейчас лечится новым чатом).
## Handoff 2026-09-14: базовая регистрация и шаг имени — UX-TASK-032

### Что сделано

- `/auth/register` содержит только email и пароль. Выбор роли и имя платформы убраны.
- Добавлен `/auth/name`: обязательный шаг задания имени после регистрации. Пока email verification не подключена, он идёт сразу после создания аккаунта.
- `/auth/login` направляет пользователя на шаг имени, если `profile_name_confirmed_at` пуст.
- Имя платформы явно отделено от публичного ника, адреса витрины и будущего username.
- Backend больше не принимает `display_name`/`role_intent` при регистрации и не создаёт creator/seller profile по регистрационному запросу.
- Добавлена миграция `000006_profile_name_setup` с полем `profiles.name_confirmed_at`; существующие активные профили помечаются завершёнными.
- Обновлены API/domain/UI specs, tracker, flows, tasks, ADR-0022 и changelog.

### Изменённые файлы

- Frontend: `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/name/page.tsx`, `apps/web/src/components/home-audience.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/lib/creator-draft.ts`, `packages/types/src/index.ts`, `packages/i18n/locales/{ru,en}/common.json`.
- Backend/DB: `services/api/internal/app/types.go`, `services/api/internal/app/store.go`, `infra/migrations/000006_profile_name_setup.up.sql`, `infra/migrations/000006_profile_name_setup.down.sql`.
- Docs: `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/UI_UX_TRACKER.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/tasks/active-focus.md`, `docs/tasks/ui-ux/UX-TASK-032.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

### Проверки

- TypeScript: web, packages/types, packages/i18n — успешно.
- ESLint изменённых frontend/type файлов — успешно.
- gofmt и `go test ./...` в `services` — успешно.
- Production build `apps/web` (Next.js 16.3.3) — успешно.
- `git diff --check` — успешно.

### Что не проверено

- Migration test против живой PostgreSQL и полный smoke регистрации не выполнены: Docker/локальная БД в этой сессии недоступны.
- Browser QA новой страницы не выполнялось из-за отсутствия работающего API/БД.

### Риски

- Удаление `display_name`/`role_intent` из registration API — намеренное pre-beta breaking change, зафиксированное ADR-0022.
- `PATCH /api/v1/me/profile` используется как шаг имени и сохраняет текущие slug/bio без изменений; отдельный специализированный endpoint можно добавить позже, если contract нужно сузить.

### Следующие шаги

- При доступной БД применить миграцию и пройти smoke: регистрация → имя → marketplace; вход до/после имени.
- После подключения email verification вставить реальный verification step перед `/auth/name`.

TASK-ID: [UX-TASK-032](tasks/ui-ux/UX-TASK-032.md).

## Handoff 2026-09-14: исследование допустимых способов авторизации в РФ

- Уточнение о регистрации иностранной компании гражданином РФ: проверены [Companies Registry Hong Kong](https://www.cr.gov.hk/en/faq/local-company/incorporation.htm), [FSA Seychelles](https://fsaseychelles.sc/media-corner/faqs), [ФНС об участии](https://www.nalog.gov.ru/rn77/taxation/cfcomp/notif_part/) и [КИК](https://www.nalog.gov.ru/rn77/taxation/cfcomp/conforcom/), [ЦБ об оплате капитала нерезидента](https://cbr.ru/Reception/TopicalMessage/Page/11480). Иностранный соучредитель не является общим условием; банковское обслуживание, санкционная проверка, налоговое резидентство и финансирование капитала требуют отдельной оценки. LEGAL_REVIEW_REQUIRED для индивидуальной структуры FanFuel и Google-входа. Регистрация, платежи и изменения кода не выполнялись; тесты приложения не требовались.
- Уточнение по FunPay: в HTML публичной страницы https://funpay.com/account/login подтверждена ссылка providerId=google; вход не выполнялся. В преамбуле https://funpay.com/en/account/agreement указана Funpay LTD, Республика Сейшельские Острова, регистрационный номер 241718. Иностранная компания является возможным объяснением отличия по ч. 10 ст. 8 149-ФЗ, но публичное соглашение не заменяет проверку фактического владельца и позиции регулятора (LEGAL_REVIEW_REQUIRED). Код не менялся; проверены публичные документы и HTML, тесты приложения не требовались.
- Уточнение о российских платежах DonationAlerts: п. 3.13 пользовательского соглашения предусматривает сторонних платёжных провайдеров, CIS Payment Terms — рублёвые операции. Наличие СБП/выплат само по себе не определяет владельца сайта для ч. 10 ст. 8 149-ФЗ. Конкретный провайдер и договорная схема СБП не установлены, перевод не выполнялся. Проверен docs/PAYMENTS.md; архитектура FanFuel не менялась. Для иностранного оператора могут действовать другие российские обязанности, включая 236-ФЗ при попадании в его сферу; окончательная квалификация DonationAlerts — LEGAL_REVIEW_REQUIRED.
- Уточнение по DonationAlerts: в [политике конфиденциальности](https://www.donationalerts.com/privacy-policy) от 12.03.2026 оператором указан Zaya Solutions Limited, Hong Kong; предусмотрены данные входа через Google/YouTube. В [условиях](https://www.donationalerts.com/terms-of-service/broadcasters) от 27.05.2026 раздел 4 предусматривает сторонний вход и YouTube API. Иностранный оператор — существенное отличие от российского владельца FanFuel для субъектного состава ч. 10 ст. 8. Это вывод по публичным документам, а не подтверждение позиции регулятора или полной законности сервиса; LEGAL_REVIEW_REQUIRED для окончательной квалификации. Реальный вход в аккаунт не выполнялся.
- По запросу пользователя изучены ч. 10 ст. 8 149-ФЗ и ст. 13.55 КоАП РФ, а также различие между иностранным OAuth и email как логином собственной системы. Это исследование, а не утверждение новой архитектуры.
- Для российского владельца сервиса и пользователей на территории РФ самостоятельный вход через Google не соответствует предусмотренным способам; добавление российской кнопки рядом не даёт явного исключения. Предлагаемые кандидаты для дальнейшего выбора: собственная система, Яндекс ID, VK ID, телефон; ЕСИА и ЕБС предусмотрены законом, но требуют соответствующего подключения.
- LEGAL_REVIEW_REQUIRED: подтвердить владельца и контроль системы FanFuel по п. 4 ч. 10 ст. 8; отдельно оценить email-коды/magic links/восстановление доступа, passkeys с иностранной синхронизацией и подключение YouTube/Twitch как интеграций после входа. Не считать иностранный email в поле логина автоматически иностранным OAuth.
- Источники: [действующая ст. 8 149-ФЗ](https://www.consultant.ru/document/cons_doc_LAW_61798/78b773a28f3ad19eb234697b20ab1d48c09f748a/), [ст. 13.55 КоАП РФ](https://legalacts.ru/kodeks/KOAP-RF/razdel-ii/glava-13/statja-13.55/), [разбор различия Gmail и входа через Google](https://t-j.ru/news/google-sites-ban/), [условия Яндекс ID](https://yandex.ru/legal/id_termsofuse/).
- Изменён только docs/HANDOFF.md в рамках этого исследования. Код, настройки авторизации и ранее существовавшие изменения не менялись. Проверены интернет-источники и docs/SECURITY.md; тесты не запускались, поскольку код не изменялся. Правовое заключение и проверка фактического production auth не выполнялись.
- Следующий шаг: согласовать продуктовый набор способов входа, затем отдельной задачей оформить ADR/specs и реализацию. TASK-ID: отдельный идентификатор для исследовательского запроса не назначен.

## Handoff 2026-09-14: полная переработка главной — UX-TASK-030

### Результат

- По просьбе пользователя полностью переработаны содержание, структура и визуальная подача покупательского, авторского и продавецкого режимов. Одобренный переключатель сохранён.
- Поиск геометрически центрирован в хэдере, «Маркет»/«Авторы» перенесены в общую группу с аккаунтом справа. На промежуточных ширинах вторичный CTA скрывается, чтобы не сдавливать поиск.
- Покупатель: компактная торговая шапка, шесть категорий с SVG-иллюстрациями, реальные новые товары, направления под задачу, спокойный блок рекомендаций. Фиктивные подборки/промокоды и показатели удалены. Добавлены loading/error/empty и retry.
- Автор: витрина и покупка как поддержка, иллюстрация концепции, три шага механики, собственные и партнёрские продукты, затем донаты/цели/OBS. Продавец: два канала продаж, схема продукта и каналов, процесс выполнения заказа и кабинет. Будущие функции обозначены как разработка, тестовые платежи не представлены реальными.

### Файлы

- apps/web/src/app/marketplace/page.tsx; apps/web/src/components/home-audience.tsx; apps/web/src/components/app-chrome.tsx; apps/web/src/lib/home-copy.ts; apps/web/src/app/globals.css.
- packages/i18n/locales/{ru,en}/common.json; PAGE_SPECS, UI_UX_TRACKER, UX_IMPLEMENTATION_STATUS, USER_FLOWS, DESIGN_SYSTEM, DESIGN_AUDIT, TASKS, tasks/ui-ux/UX-TASK-030.md, HANDOFF и CHANGELOG.

### Проверки

- Web TypeScript, общий ESLint без предупреждений и production build Next.js — успешно. Workspace test command завершился успешно; test scripts отсутствуют, поэтому unit tests не выполнялись.
- Браузер: ru/en, light/dark, 320/390/768/1280/1440px в выбранных комбинациях; переключение ролей и клавиатура; один видимый H1; мобильные длинные названия товаров/продавцов. Проверенные элементы не выходят за ширину viewport. Центр поиска совпадает с центром хедера на 768/1280/1440px.
- Временно запущен read-only fixture API на loopback для четырёх явно подписанных тестовых товаров; проверены получение данных, отображение цен и длинных названий, retry после ошибки и пустой список. Fixture остановлен, production/БД не изменены.
- Поиск передаёт OBS в /marketplace/catalog?query=OBS. Сам каталог пока не реализует поисковую выдачу — записано в DESIGN_AUDIT как отдельная задача.

### Ограничения

- Реальный локальный API недоступен. После отключения fixture главная честно показывает ошибку загрузки; checkout и реальный backend не проверялись.
- Профиль авторизованного пользователя в браузере не проверялся; структура общей правой группы проверена через код/TypeScript, гостевой хэдер — в браузере.
- Изменения локальные. На fanfuel.ru не развёрнуты. Следующий шаг: обратная связь пользователя по новой композиции и отдельная реализация каталожного поиска.

TASK-ID: [UX-TASK-030](tasks/ui-ux/UX-TASK-030.md).

## Handoff 2026-09-14: режимы аудитории главной — UX-TASK-029

- Общая главная / и /marketplace получила центрированный ползунок «Я покупатель / Я автор / Я продавец». Покупатель выбран по умолчанию; переключение не меняет URL и роль аккаунта.
- Покупатель видит компактный заголовок, категории, товары и вторичные авторские подборки. Автор и продавец видят презентации возможностей и CTA с role intent. Будущие функции явно обозначены.
- Поиск возвращён в хэдер без ожидания прокрутки; указанные пользователем ссылки удалены из desktop-навигации и мобильного меню.
- Файлы: apps/web/src/components/home-audience.tsx, apps/web/src/app/marketplace/page.tsx, apps/web/src/components/app-chrome.tsx, apps/web/src/app/globals.css, packages/i18n/locales/{ru,en}/common.json; PAGE_SPECS, PAGE_MAP, USER_FLOWS, UI_UX_TRACKER, UX_IMPLEMENTATION_STATUS, DESIGN_AUDIT, TASKS и UX-TASK-029.
- Проверки: TypeScript web, общий ESLint, production build Next.js — успешно. Workspace tests завершились успешно, но test scripts отсутствуют: unit tests фактически не выполнялись. Зависимости установлены по существующему lockfile без его изменения.
- Браузер: три режима без смены URL, один видимый H1, стрелки/Home/End, мобильный поиск, ru/en, light/dark, 320/390px и desktop — проверены.
- Ограничения: локальный backend недоступен; проверено отображение ошибки, заполненный каталог и покупка не проверялись. Существующие демонстрационные подборки требуют отдельного подключения реального domain; расхождение записано в DESIGN_AUDIT.
- Изменения локальные, на публичную VM не развёрнуты. Следующий шаг: интеграционная проверка с доступным API. TASK-ID: [UX-TASK-029](tasks/ui-ux/UX-TASK-029.md).

## Handoff 2026-09-14: публичный HTTPS через общий edge — FF-0010

### Результат

- FanFuel доступен по `https://fanfuel.ru` и `https://www.fanfuel.ru`. HTTP перенаправляется на HTTPS.
- На рабочем `nginx-edge-prod2` добавлены Host/SNI entries для FanFuel. TLS проходит до nginx VM приложения; существующий LibreChat passthrough сохранён.
- Через панель роутера изменены существующие правила HTTP/HTTPS: TCP 80/443 направлены на edge. Остальные пробросы не менялись, новые SSH-пробросы не создавались.
- Текущий IP приложения закреплён в DHCP по MAC; edge имеет статический адрес вне DHCP pool. Фактические адреса и MAC находятся только в ignored `docs/SERVER_ACCESS.md`.
- Docker web/API/WS/widget возвращены на loopback. UFW принимает 80/443 только от edge, SSH остаётся через NAT. Docker ingress разрешён только от edge.
- На FanFuel VM выпущен Let's Encrypt сертификат, срок до 2026-12-13; `certbot.timer` и nginx reload hook активны.
- На edge сохранён backup nginx.conf; обновлены локальные seed `user-data` и `seed.iso` по указанному пользователем пути в соседнем LibreChat workspace. Ключи/пароли не создавались и не выводились; commits не выполнялись.

### Изменённые файлы

- `infra/nginx/fanfuel-tls.conf`, `infra/scripts/enable-vm-tls.sh`, комментарии `docker-compose.vm.yml`.
- `docs/DEPLOYMENT.md`, `docs/DECISIONS.md` (ADR-0021), `docs/TASKS.md`, `docs/tasks/v0.0/README.md`, `docs/tasks/v0.0/FF-0010.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
- Ignored `docs/SERVER_ACCESS.md`, runtime `.env`, nginx/UFW/systemd config на VM; nginx config и seed на edge.

### Проверки

- `nginx -t` на обеих VM — успешно.
- Публичный HTTP-01 marker достиг FanFuel через новый edge; получение сертификата и `certbot renew --dry-run` — успешно.
- HTTPS main/www, marketplace, API products, widget HTML и JS — HTTP 200 с проверкой доверия сертификату.
- HTTP main — 308 на HTTPS; WS alerts/auth без токенов — 401; admin/mock public paths — 404.
- LibreChat HTTPS после переключения роутера — HTTP 200.
- В браузере открыт HTTPS FanFuel, страница отображается, ошибок сертификата нет. Router UI подтвердил сохранённые 80/443 и DHCP reservation.
- Все девять контейнеров работают, предусмотренные healthchecks healthy. Shell syntax и `git diff --check` — успешно.
- Frontend/backend исходники не менялись, unit tests/build повторно не запускались. Полный realtime flow с валидным widget token не воспроизводился.

### Обнаруженные ограничения

- FanFuel VM до настройки отвечала по HTTP, но SSH зависал; в консоли были kernel soft lockups/RCU stalls. ACPI shutdown не завершился, выполнен reset только FanFuel VM. SSH и сервисы восстановились, время синхронизировано; первопричина зависаний отдельно не исследовалась.
- У Alpine edge системный диск около 182 МБ. Попытка установки certbot закончилась нехваткой места и была отменена через apk del; nginx остался работоспособен. Сертификаты и certbot размещены на FanFuel VM. На edge осталось около 9,6 МБ свободного места — увеличение диска отдельной задачей.
- При текущем TLS passthrough исходный client IP до nginx приложения не передаётся; per-IP лимиты агрегируются по edge. Для масштабирования нужен PROXY protocol или другое место TLS termination.
- Каталог новой базы пуст; тестовые товары и пользователи не добавлялись. Real payments/legal readiness не включены.

Следующий шаг при необходимости: расширение диска edge и отдельная диагностика VM stalls. TASK-ID: [FF-0010](tasks/v0.0/FF-0010.md) — completed.

## Handoff 2026-09-14: отдельная VM приложения — FF-0009

### Что сделано

- По уточнению пользователя создана новая VM `FanFuel` на диске D:, отдельно от существующей LibreChat VM: Ubuntu 24.04, 4 vCPU, 4 ГБ RAM, динамический диск 40 ГБ. Использован cloud image с проверенным SHA-256 относительно локального checksum-файла.
- Установлены Docker/Compose, отдельный SSH-ключ, UFW и фильтрация Docker ingress через `DOCKER-USER`; firewall восстанавливается systemd, контейнеры имеют `restart: unless-stopped`.
- Текущая рабочая копия перенесена на VM без Git, локальных секретов, сборочных каталогов и `.tmp`. На VM создан новый `.env` с уникальными секретами и правами 0600.
- Web работает через `next start`, widget/admin собраны как статические приложения. Девять контейнеров запущены. База новая: применены пять миграций, тестовые товары и пользователи не добавлялись.
- Web/API/WS/widget доступны на LAN-интерфейсе для будущего edge. Admin, PostgreSQL, Redis, MinIO и worker доступны только на loopback. Адреса, SSH-команда и пути к ключам записаны в игнорируемом `docs/SERVER_ACCESS.md`.
- Исходный `minio/minio:latest` не скачивался (`pull access denied`). Только VM override переключён на доступный официальный Quay image, закреплённый по digest.

### Уточнение по nginx

До сообщения пользователя о выделенной nginx VM успели установить nginx/certbot и применить HTTP bootstrap внутри FanFuel VM. После сообщения nginx больше не менялся; TLS, DNS и роутер не настраивались. После переноса прикладных портов на LAN старые loopback upstreams bootstrap не являются рабочим edge. Нельзя считать FanFuel.ru опубликованным.

### Файлы

- `.dockerignore`, `docker-compose.vm.yml`, `infra/docker/frontend.vm.Dockerfile`, `infra/scripts/vm-firewall.sh`.
- Подготовленные до уточнения `infra/nginx/fanfuel.conf`, `infra/nginx/fanfuel-proxy.conf`, `infra/nginx/static.conf`.
- `docs/DEPLOYMENT.md`, `docs/DECISIONS.md` (ADR-0020), `docs/TASKS.md`, `docs/tasks/v0.0/README.md`, `docs/tasks/v0.0/FF-0009.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
- Локально обновлён игнорируемый `docs/SERVER_ACCESS.md`; секреты в Git не добавлены. Чужие существующие изменения сохранены.

### Проверки

- VM running, SSH, cloud-init `done`, Docker/firewall systemd — успешно.
- Docker Compose config/build/up — успешно после замены источника MinIO. TypeScript и production build web/admin/widget, сборки Go-сервисов — успешно.
- Миграции `000001`–`000005` применены; повторный запуск пропустил уже применённые версии.
- Web `/` и `/marketplace`, admin, widget и его JS asset — HTTP 200. API/WS/worker health, категории, товары и MinIO health — HTTP 200.
- API auth без токена и WS alerts без widget token — HTTP 401.
- Проверка с Windows: HTTP 200 у web и API; прикладные LAN-порты открыты, admin/DB/Redis/MinIO закрыты.
- `git diff --check` для затронутых файлов — успешно, только предупреждения о CRLF.
- Полные frontend lint/backend unit tests отдельно не запускались: исходники приложений не менялись; выполнены сборки, TypeScript и эксплуатационные smoke checks.

### Ограничения и следующий шаг

- Дальнейшая nginx/TLS-конфигурация отложена пользователем. Браузерные API/WSS URL собраны для HTTPS-домена; полный браузерный сценарий ждёт edge. LAN HTTP upstream проверен отдельно.
- Закрепить DHCP-адрес приложения на роутере. После появления адреса nginx VM сузить разрешённый источник Docker ingress с локальной подсети до нужных адресов.
- Будущий edge должен проксировать web/API/WS и `/widget/`, корректно обрабатывать Upgrade, включить TLS и не публиковать admin/mock callbacks. В текущем backend mock callbacks фактически зарегистрированы и без отдельной проверки `APP_ENV`; production-режим сам по себе не выключает mock payments. Исправление приложения не входило в FF-0009.
- Real payments, payouts и production legal readiness не реализованы; `LEGAL_REVIEW_REQUIRED` сохраняется. Object storage перед публичным использованием требует отдельной проверки поддержки/обновлений.
- Автозапуск VM при перезагрузке Windows и reboot rehearsal не настраивались/не проверялись.

TASK-ID: [FF-0009](tasks/v0.0/FF-0009.md) — completed в уточнённых границах запуска VM и приложения.

## Handoff 2026-05-20: product-discovery порядок `/marketplace`

### Что сделано

- `/marketplace` оставлен в версии `v0.3.5`, но порядок блоков переставлен под product discovery: hero, compact flow, быстрый товарный вход, подборки авторов, proof-module, популярные товары, role sections, безопасность и финальный CTA.
- Большой блок "Покупка может быть поддержкой" заменён compact flow-bar `Товар найден → Покупка через автора → Автор получает поддержку`, чтобы не задерживать пользователя перед товарами.
- Добавлен блок "Начни с того, что нужно": 6 категорий слева и "Сейчас покупают" справа с 3 компактными товарами при наличии данных.
- "Подборки авторов" подняты выше proof-module и обычного товарного грида; карточки показывают автора, цель, промокод, 2 товара и CTA `Открыть подборку`.
- Категории очищены от абстрактных декоративных фигур через финальные CSS-правила и используют понятные иконки/примеры.
- Добавлены ru/en i18n-ключи для нового товарного входа, compact flow и CTA подборок авторов.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-028.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `node` JSON parse для ru/en i18n — успешно.
- `npx prettier --write ...` — успешно.
- `npm run lint` — успешно.
- `npm run typecheck --workspaces --if-present` — успешно.
- `npm run build --workspaces --if-present` — успешно.
- `git diff --check` — успешно, только стандартные Windows CRLF warnings.
- Browser QA на `http://127.0.0.1:3000/marketplace`: desktop `1280x720` и mobile `390x844`, horizontal overflow = 0, flow cards = 3, entry categories = 6, now buying = 3 при наличии локальных товаров, collection cards = 3, collection mini products = 6.

### Риски и следующие шаги

- Если локальная база пустая, блок "Сейчас покупают" показывает compact empty state, потому что публичный UI не должен подменять каталог фейковыми товарами.
- Light theme visual QA отдельно не запускался в браузере; CSS использует semantic tokens, но отдельный screenshot-pass стоит сделать следующей задачей.
- Следующий шаг — вынести product preview contract в общий компонент для marketplace/catalog/creator store и добавить полноценные данные авторских витрин.

## Handoff 2026-05-19: search-first creator-commerce `/marketplace`

### Что сделано

- `/marketplace` и корневой `/` оставлены в версии `v0.3.5`, но страница структурно перепрошита под search-first creator-commerce: поиск, авторская витрина, промокод, безопасная покупка и поддержка автора видны в первом сценарии.
- Header закреплён как 64px sticky glass bar с единым брендом FanFuel, навигацией `Маркет`, `Авторы`, `Для авторов`, `Для продавцов`, `Безопасность`; гостевой burger скрыт на desktop и оставлен для mobile.
- Hero усиливает связку `Покупай нужное. Поддерживай любимых.`, большой поиск и demo покупки через витрину автора с целью, товаром, промокодом, безопасной сделкой и мини-flow `Зритель покупает → продавец выполняет → автор получает поддержку`.
- Блок "Покупка может быть поддержкой" оформлен как цепочка, а не как равнозначные мелкие карточки.
- Категории очищены от абстрактных фигур: остались понятные иконки, описания, примеры и стабильная сетка.
- Featured-блок "Популярно в витринах авторов" стал единым proof-module: слева товар, справа авторы/промокоды и тезис о поддержке выбранного автора через витрину или промокод.
- Product grid стабилизирован как 4/3/2/1, media slots держат `16:10`, обычные карточки остаются кликабельными целиком и не перегружаются бейджами.
- Витрины авторов, секции для авторов/продавцов и безопасность разведены по разным визуальным паттернам.
- Статусы `UX-TASK-027`, `PAGE-MARKETPLACE`, `UI_UX_TRACKER` и `UX_IMPLEMENTATION_STATUS` закрыты как implemented/completed.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/components/app-chrome.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-027.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write ...` для изменённых web/i18n/docs файлов — успешно.
- `npm run lint` — успешно.
- `npm run typecheck --workspaces --if-present` — успешно.
- `npm run build --workspaces --if-present` — успешно.
- `git diff --check` — успешно; остались только стандартные Windows CRLF warnings.
- Browser QA `http://127.0.0.1:3000/marketplace`: desktop viewport 1280x720 без горизонтального overflow, topbar 64px, desktop guest burger скрыт, 4 product cards в ряд; mobile viewport 390x844 без layout overflow, горизонтальным остаётся только ожидаемый scroll быстрых направлений.
- Скриншоты QA сохранены: `.tmp/marketplace-ux027-desktop-viewport.png`, `.tmp/marketplace-ux027-mobile.png`.

### Риски и следующие шаги

- Product/category preview для пустых cover slots остаются CSS fallback; реальные seller cover images нужно проверять отдельно, когда они появятся в данных.
- Авторские витрины и промокоды пока используют showcase-данные; следующий продуктовый шаг — подключить реальные creator storefront / promo campaign данные.
- Детальная SafeDeal-логика остаётся за `/safe-deal` и платежным доменом; юридические/провайдерские детали не добавлялись в публичный UI.

Связанные TASK-ID: `UX-TASK-027`.

## Handoff 2026-05-19: иерархия creator-commerce витрины `/marketplace`

### Что сделано

- `/marketplace` и корневой `/` остаются в версии `v0.3.5`; структура из `UX-TASK-025` сохранена, без нового разворота дизайна.
- Hero усилен визуально: H1 крупнее, строка "Поддерживай любимых" получила более сильный акцент, lead переписан на "цифровые товары, донаты, OBS-алерты и витрины авторов в одной платформе".
- Быстрые направления под hero search стали тихой навигационной строкой, чтобы не конкурировать с главным поиском и CTA.
- Hero-card дополнительно подчёркивает мини-flow "зритель покупает → продавец выполняет → автор получает поддержку".
- Блок "Покупка может быть поддержкой" получил цепочку "Товар → Автор → Поддержка", более крупные карточки и уточнённые тексты.
- Категории в "Что можно найти на FanFuel" получили примеры товаров/сценариев и более различимые mini-preview.
- Product media снова показывает осмысленные category preview для пустых cover slots, но реальные seller cover image остаются верхним слоем.
- Featured-блок явно говорит "Этот товар добавили 14 авторов" и добавляет подпись о поддержке выбранного автора через витрину или промокод.
- "Витрины авторов" стали легче: первая витрина featured, следующие компактнее.
- Блоки для авторов/продавцов усилены визуально; seller copy сфокусирован на том, что товар может появляться в каталоге, витринах, промокодах и подборках.
- Safety cards переписаны простыми пользовательскими формулировками: оплата внутри заказа, рейтинг, условия заказа, спор.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-026.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/TASKS.md docs/tasks/ui-ux/UX-TASK-026.md docs/UX_IMPLEMENTATION_STATUS.md docs/UI_UX_TRACKER.md docs/PAGE_SPECS.md docs/USER_FLOWS.md docs/CHANGELOG.md docs/HANDOFF.md` — успешно.
- `npm run typecheck --workspaces --if-present` — успешно.
- `npm run lint` — успешно.
- `npm run build --workspaces --if-present` — успешно.
- `git diff --check` — успешно, остаются только стандартные Windows CRLF warnings.
- Browser smoke `/marketplace` на `http://127.0.0.1:3000`: desktop hero/search/card flow отрисованы; lower-section smoke после прокрутки подтвердил "Этот товар добавили 14 авторов", 14 product tiles, seller path "Товар → Каталог → Витрины авторов → Заказы"; sticky header остаётся сверху (`top: 0`, `z-index: 80`).
- Headless Chrome screenshot для mobile `390x844` сохранён в `.tmp/marketplace-qa-headless-mobile.png`; CDP-проверка показала `scrollWidth <= innerWidth`, а элементы за правым краем относятся к горизонтальным product/direction shelves.

### Риски и следующие шаги

- Category preview остаются CSS-mock слоями для пустых cover slots. Когда появятся реальные seller images, нужно проверять, что они визуально перекрывают preview и не выглядят как шумная заглушка.
- Следующий UX-шаг: подключить реальные данные по авторским витринам и промокодам, когда появится domain слой `CreatorStore`/`StoreItem`.

## Handoff 2026-05-19: creator-commerce hero для `/marketplace`

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но главная снова показывает creator-commerce механику в первом скролле, а не только тёмную товарную витрину.
- Hero перестроен: большой поиск стал главным действием и ведёт в `/marketplace/catalog`, подсказки разделены по товарам, авторам, категориям и промокодам.
- Desktop topbar search на `/marketplace` скрывается до прокрутки ниже hero, чтобы не дублировать главный hero search; после прокрутки появляется как compact global search.
- Hero demo теперь показывает покупку через витрину автора: автора W4VESHIFT, цель, товар, промокод, безопасную сделку и три шага "зритель → продавец → автор".
- Блок "Покупка может быть поддержкой" поднят сразу после hero и объясняет механику: найти товар, купить через автора, дать пользу покупателю/продавцу/автору.
- "Что можно найти на FanFuel" расширен до 8 категорий с preview chips, чтобы ассортимент считывался через распознавание, а не через угадывание запроса.
- "Популярно в витринах авторов" теперь показывает featured-товар вместе со списком авторов и промокодов, у которых товар есть в витрине.
- "Подборки авторов" заменены на "Витрины авторов": карточка автора стала showcase-обложкой с целью, промокодом, донатами и мини-товарами.
- Добавлены компактные секции для авторов, продавцов, безопасности и финального выбора действия; тексты остаются пользовательскими без внутренних provider/legal/mock формулировок.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/components/app-chrome.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-025.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npm run typecheck --workspaces --if-present`
- `npm run lint`
- `npm run build --workspaces --if-present`
- `rg` по marketplace/i18n на старые публичные строки: "Цифровые товары, которые поддерживают авторов", "Открыть витрину", "есть витрина", "Подробнее", `provider/legal review`, `production`, `dispute flow`.
- CDP smoke `http://127.0.0.1:3000/marketplace`: проверены hero search, подсказки, быстрые направления, 8 категорий, отсутствие старых строк, порядок блоков, deferred topbar search до/после прокрутки.
- Сняты локальные screenshots `.tmp/marketplace-desktop.png` и `.tmp/marketplace-mobile.png` для визуального sanity check.

### Риски и следующие шаги

- Hero search сейчас ведёт в лёгкую страницу `/marketplace/catalog`; полноценные фильтры, autocomplete API, пагинация и cross-entity search остаются отдельной задачей.
- Витрины авторов и промокоды на главной используют локальные showcase-данные до появления публичного creator storefront / promo campaign API.
- `/safe-deal` и блок безопасности остаются кратким пользовательским объяснением; детальные статусы споров, удержания, провайдеры и юридические формулировки требуют payment/legal review.
- Mobile hero search читает короткий placeholder; при реализации настоящего autocomplete нужно отдельно проверить 320/390px и экранную клавиатуру.

Связанные TASK-ID: `UX-TASK-025`, `UX-TASK-024`, `UX-TASK-023`.

## Handoff 2026-05-19: честная UX-логика `/marketplace`

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но UX-логика упрощена до правила "кнопка делает то, что написано": направления открывают страницы, поиск ищет, карточки открывают сущности, бейджи только сообщают статус.
- С главной убраны скрытые фильтры и якоря: OBS-паки, алерты, игровые услуги, оформление, авторы, промокоды и SafeDeal теперь ведут на явные маршруты, а не меняют блоки на текущей странице.
- Hero обновлён на заголовок "Покупай цифровые товары и поддерживай авторов" и пользовательский подзаголовок про маркетплейс и витрины стримеров.
- CTA hero ведут на `/marketplace/catalog` и `/marketplace/categories`; "Найти автора" фокусирует topbar search в режиме авторов с placeholder "Найти автора по нику".
- Topbar search теперь отправляет пользователя на явные страницы: товары в `/marketplace/catalog`, авторы в `/creators`, продавцы в каталог с параметром `type=seller`.
- Обычные карточки товаров стали плотнее: вся карточка кликабельна, кнопки "Подробнее" и hover-кнопка убраны, категория показывается один раз как label на превью.
- Блок переименован в "Популярно в витринах авторов": если товар есть у многих авторов, показываются "В 14 витринах авторов", аватарки/список авторов и CTA "Открыть товар" / "Посмотреть авторов".
- Правый большой объясняющий блок рядом с featured-товаром удалён; вместо него ниже добавлен компактный блок "Как покупка поддерживает автора" с тремя карточками.
- Добавлены лёгкие destination-страницы для `/marketplace/catalog`, `/marketplace/categories`, `/marketplace/category/[slug]`, `/marketplace/promocodes`, `/creators` и `/safe-deal`, чтобы навигационные клики не вели в пустоту.
- Публичный `/safe-deal` оставлен коротким пользовательским объяснением без `provider/legal review`, `production`, `dispute flow` и других внутренних формулировок.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/components/app-chrome.tsx`
- `apps/web/src/components/marketplace-route-shell.tsx`
- `apps/web/src/app/marketplace/catalog/page.tsx`
- `apps/web/src/app/marketplace/categories/page.tsx`
- `apps/web/src/app/marketplace/category/[slug]/page.tsx`
- `apps/web/src/app/marketplace/promocodes/page.tsx`
- `apps/web/src/app/creators/page.tsx`
- `apps/web/src/app/safe-deal/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-024.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/PAYMENTS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npm run typecheck --workspaces --if-present`
- `npm run lint`
- `npm run build --workspaces --if-present`
- `git diff --check`
- Browser smoke `http://localhost:3000/marketplace`: проверены hero CTA, быстрые направления, отсутствие второго поиска, отсутствие публичных "Подробнее" / "Открыть витрину" / "есть витрина" / "Открыть автора", product-card клики, featured modal "Авторы, у которых товар в витрине" и маршруты `/marketplace/catalog`, `/marketplace/categories`, `/marketplace/category/obs-packs`, `/marketplace/promocodes`, `/creators`, `/safe-deal`.

### Риски и следующие шаги

- Новые destination-страницы намеренно лёгкие: они фиксируют честную навигацию, но не заменяют полноценный каталог, поиск авторов, фильтры, пагинацию и SafeDeal-лендинг.
- `/safe-deal` остаётся кратким публичным описанием сценария; детальная логика оплат, споров, провайдеров и legal wording требует отдельной payment/legal задачи.
- В общих i18n-словарях остаются mock-строки для checkout/buyer/seller MVP, но публичный `/marketplace` и новые destination-страницы их не выводят.

Связанные TASK-ID: `UX-TASK-024`, `UX-TASK-023`, `UX-TASK-022`.

## Handoff 2026-05-19: `/marketplace` без дублирующего поиска и шумных CTA

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но страница стала ещё более market-first: второй большой search-блок удалён, поиск остаётся единым control в topbar.
- Вместо search-form на главной добавлены быстрые направления: OBS-паки, алерты, игровые услуги, оформление, авторы, промокоды и SafeDeal.
- Hero-ссылка "Ищешь стримера? Найти автора" больше не скроллит к секции; она фокусирует topbar search, включает режим авторов и placeholder "Найти автора по нику".
- Обычные карточки товаров больше не показывают кнопку "Подробнее"; вся карточка ведёт на товар, а на desktop есть тихий hover-сигнал "Открыть товар".
- В карточках авторских подборок убран бейдж "есть витрина"; остались признаки "12 товаров", "есть промокод", "принимает донаты", а CTA стал нормальной кнопкой "Открыть страницу автора".
- Блок "Хит в витринах авторов" больше не показывает неопределённое "Открыть автора": теперь есть "В 14 витринах авторов", авторские аватарки/список и CTA "Смотреть товар" / "Показать авторов".
- Главная структура сокращена до hero, быстрых направлений, популярного, хита в витринах, авторских подборок, новых товаров, trust strip и footer.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/components/app-chrome.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-023.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/components/app-chrome.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/TASKS.md docs/tasks/ui-ux/UX-TASK-023.md docs/UX_IMPLEMENTATION_STATUS.md docs/UI_UX_TRACKER.md docs/PAGE_SPECS.md docs/USER_FLOWS.md`
- JSON parse для `packages/i18n/locales/ru/common.json` и `packages/i18n/locales/en/common.json`.
- `npm run typecheck --workspaces --if-present`
- `npm run lint`
- `npm run build --workspaces --if-present`
- Browser smoke `http://localhost:3000/marketplace`: проверены отсутствие второго поиска, quick directions, фокус topbar search в режиме авторов, отсутствие публичных "Подробнее" / "Открыть витрину" / "есть витрина" / "Открыть автора", featured CTA и trust strip.

### Риски и следующие шаги

- Topbar search пока отправляет `type=creator` как URL-параметр, но полноценная выдача авторов зависит от будущего search/catalog API.
- Отдельные маршруты `/creators`, `/marketplace/catalog`, `/safe-deal`, `/streamers`, `/sellers` не создавались в рамках этой правки.
- В общих i18n-словарях остаются mock-строки для checkout/buyer/seller MVP, но публичный `/marketplace` их не выводит.

Связанные TASK-ID: `UX-TASK-023`, `UX-TASK-022`, `UX-TASK-021`.

## Handoff 2026-05-19: авторы выше и честные обложки `/marketplace`

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но авторы подняты в верхний ритм страницы: после hero и поиска теперь идёт компактная полка "Популярные авторы".
- Блоки переставлены в новую структуру: compact hero, search, popular authors, popular now, hit in author storefronts, quick categories, new products, author collections, catalog shelves, trust strip, footer.
- "Подборки авторов" оставлены ниже как второй уровень авторских витрин, а не первое появление авторов на странице.
- Product media очищен от фейковых полосок, псевдо-скриншотов и декоративных mockup-слоёв: карточка показывает seller cover URL, если такое поле появится в API, иначе нейтральный сине-фиолетовый градиент и label категории.
- Сигнал "В витрине автора" перенесён в короткий бейдж карточки товара вместе с SafeDeal/Проверен.
- Категории получили единые outline SVG-иконки вместо текстовых/неровных кастомных пиктограмм.
- Placeholder поиска на странице возвращён к формулировке "Найти товар, автора, OBS-пак или игровую услугу".

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-022.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/TASKS.md docs/tasks/ui-ux/UX-TASK-022.md docs/UX_IMPLEMENTATION_STATUS.md docs/UI_UX_TRACKER.md docs/PAGE_SPECS.md docs/CHANGELOG.md docs/HANDOFF.md`
- JSON parse для `packages/i18n/locales/ru/common.json` и `packages/i18n/locales/en/common.json`.
- `npm run typecheck -w @fanfuel/web`
- `npm run lint`
- `npm run build -w @fanfuel/web`
- `git diff --check`
- Browser smoke `http://localhost:3000/marketplace` на desktop и mobile.

### Риски и следующие шаги

- API пока не отдаёт реальное поле обложки товара; UI уже поддерживает `cover_url`/`image_url`/camelCase варианты как forward-compatible слой.
- Полка популярных авторов пока использует локальные mock-данные до появления публичного authors API/creator storefront API.
- Нужен отдельный pass для реальных страниц `/creators`, `/streamers`, `/sellers` и полноценного поиска по авторам.

Связанные TASK-ID: `UX-TASK-022`, `UX-TASK-021`, `UX-TASK-020`, `FF-0350`.

## Handoff 2026-05-19: `/marketplace` как плотная маркет-витрина

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но страница переведена из компактного объясняющего лендинга в плотную маркет-витрину.
- Порядок блоков изменён на market-first: compact hero, рабочий поиск, 6 коротких категорий, "Популярно сейчас", "Хит в витринах авторов", новые товары, авторские витрины, OBS/алерты, игровые услуги, дизайн и trust-полоса.
- Большие секции "Одна покупка — польза для всех", SafeDeal, final CTA и FAQ убраны с главной витрины; вместо них оставлена компактная trust-панель с SafeDeal, проверенными продавцами, отзывами, промокодами и витринами авторов.
- Карточки товаров упрощены до магазинной структуры: cover, категория, название, цена/рейтинг, продавец, короткие бейджи и CTA; длинная строка "Поддерживает автора при покупке" заменена коротким сигналом "В витрине автора".
- Hero сжат до фактической высоты около 460px на desktop, правая карточка покупки через автора оставлена как компактная подсказка.
- Добавлены i18n-ключи для новых товарных полок, быстрых чипов, trust-полосы и footer-ссылок.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-021.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/TASKS.md docs/tasks/ui-ux/UX-TASK-021.md docs/UX_IMPLEMENTATION_STATUS.md docs/UI_UX_TRACKER.md docs/PAGE_SPECS.md docs/CHANGELOG.md docs/HANDOFF.md`
- JSON parse для `packages/i18n/locales/ru/common.json` и `packages/i18n/locales/en/common.json` — успешно.
- `npm run typecheck -w @fanfuel/web` — успешно.
- `npm run lint` — успешно.
- `npm run build -w @fanfuel/web` — успешно.
- `git diff --check` — ошибок нет, остались только стандартные Windows LF → CRLF warnings.
- Browser smoke `http://localhost:3000/marketplace`: desktop `1280x720` и mobile `390x844`; проверены 6 категорий, 5 trust-сигналов, 6 товаров в каждой полке `popular/new/obs/game/design`, порядок `popular` перед `featured`, отсутствие больших SafeDeal/FAQ/final CTA/role-value текстов, отсутствие horizontal overflow, desktop hero около `460px`.

### Риски и следующие шаги

- Товарные полки используют текущий общий список товаров и UI-level разложение по категориям до полноценной API-модели витрин/подборок.
- Отдельные страницы `/safe-deal`, `/creators`, `/streamers`, `/sellers` не создавались: это отдельные spec/tracker/task pass.
- Нужен ручной visual QA на реальном мобильном браузере и в light/dark темах перед финальной приёмкой.

Связанные TASK-ID: `UX-TASK-021`, `UX-TASK-020`, `UX-TASK-019`, `FF-0350`.

## Handoff 2026-05-18: компактная `/marketplace` витрина

### Что сделано

- `/marketplace` и корневой `/` сохранены в версии `v0.3.5`, но страница уплотнена до витрины marketplace вместо полной презентации платформы.
- Hero переписан на короткий сценарий покупки цифровых товаров и поддержки авторов: две основные CTA, тихая ссылка на авторов, компактная карточка покупки через W4VESHIFT.
- После hero оставлены быстрый поиск, категории, "Хит в витринах авторов", "Популярно сейчас", авторские подборки, "Одна покупка — польза для всех", компактный SafeDeal, общий CTA и FAQ на 4 вопроса.
- Убраны большой поиск автора, секция новых товаров, полноценные лендинговые блоки для стримеров и продавцов, длинный SafeDeal и длинный FAQ.
- Product preview и category cards получили осмысленные псевдо-превью вместо пустых градиентных заглушек.
- Публичные SafeDeal-тексты очищены от внутренних `provider/legal review` и `production` формулировок.

### Изменённые файлы

- `apps/web/src/app/marketplace/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/i18n/locales/ru/common.json`
- `packages/i18n/locales/en/common.json`
- `docs/PAGE_SPECS.md`
- `docs/UI_UX_TRACKER.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/TASKS.md`
- `docs/tasks/ui-ux/UX-TASK-019.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

### Проверки

- `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/PAGE_SPECS.md docs/UI_UX_TRACKER.md docs/UX_IMPLEMENTATION_STATUS.md docs/TASKS.md docs/tasks/ui-ux/UX-TASK-019.md docs/CHANGELOG.md docs/HANDOFF.md`
- `npm run typecheck -w @fanfuel/web`
- `npm run lint`
- `git diff --check` — ошибок нет, остались только предупреждения Git про будущую LF → CRLF нормализацию.
- Browser smoke `http://localhost:3000/marketplace`: desktop 1280×720 и mobile 390×844. Проверены наличие ключевых блоков, 6 категорий, 3 SafeDeal карточек, 4 FAQ, отсутствие публичных `provider/legal`, `production`, `dispute flow` формулировок и отсутствие горизонтального overflow в основных текстовых элементах.

### Риски и следующие шаги

- CTA `Как работает SafeDeal` ведёт на `/safe-deal`, но отдельная страница остаётся payment/legal review задачей и не создавалась в этом изменении.
- Отдельные `/marketplace/catalog`, `/marketplace/search`, `/creators`, `/streamers`, `/sellers` не создавались: для них нужен отдельный spec/tracker/task pass.
- Авторские подборки и сигналы "в витринах авторов" пока остаются UI-level над текущим API до полноценной creator store/partner модели.

## Текущий статус

Статус: `v0.3 Marketplace MVP / implemented locally`.

Foundation, auth/profile слой, Donate MVP, Design System Foundation и Marketplace MVP подготовлены. `v0.3` проверен локально, миграции применены к dev-БД, docker compose stack пересобран и отвечает по web/admin/widget/API.

## Что уже сделано

- Создана структура monorepo.
- Созданы основные документы проекта.
- Зафиксирован roadmap `v0.0-v1.0`.
- Описаны продуктовые модули и MVP scope.
- Описана архитектура web/api/ws/worker/storage.
- Описана доменная модель.
- Описана payment provider abstraction.
- Описана i18n strategy.
- Описаны security, deployment и testing plans.
- Созданы правила для ИИ-агентов.
- Создан ADR-журнал.
- Добавлены npm workspaces и `package-lock.json`.
- Добавлены skeleton приложения `apps/web`, `apps/admin`, `apps/widget`.
- Добавлены shared packages `packages/ui`, `packages/i18n`, `packages/sdk`, `packages/types`.
- Добавлены Go-сервисы `services/api`, `services/ws`, `services/worker`.
- Добавлены healthchecks `/healthz` и `/readyz`.
- Добавлены Dockerfiles и Docker Compose.
- Добавлен базовый GitHub Actions CI outline.
- Добавлены PostgreSQL, Redis, MinIO.
- Добавлена миграция `000001_foundation`.
- Foundation stack поднят локально и на VM.
- Добавлена миграция `000002_auth_profiles`.
- Реализованы `users`, `user_roles`, `profiles`, `buyer_profiles`, `creator_profiles`, `seller_profiles`, `audit_logs`.
- Реализованы JWT/bcrypt auth endpoints, role guards и базовый rate limit для auth.
- Реализованы public profile/creator endpoints.
- Реализованы базовые admin users endpoints.
- Добавлены web страницы регистрации, входа, профиля и публичной страницы автора.
- Добавлена рабочая admin users panel.
- Добавлена миграция `000003_donate_mvp`.
- Реализованы `payments`, `donations`, `donation_goals`, `provider_webhooks`, `widgets`, `idempotency_keys`.
- Реализован `POST /api/v1/donations` с обязательным `Idempotency-Key`.
- Реализован mock `PaymentProvider` и dev-only mock callbacks success/fail.
- Реализована идемпотентная фиксация mock callbacks в `provider_webhooks`.
- Реализована публикация `donation.alert.created` и `donation.goal.updated` через Redis.
- Реализован WebSocket endpoint `/ws/alerts` с проверкой read-only widget token по БД.
- Реализована donation form на публичной странице автора.
- Добавлены donation goals, публичная история донатов и топ донатеров.
- Добавлены studio controls для создания goals и OBS widget token.
- Реализован OBS widget MVP с reconnect, heartbeat через WS gateway и event dedupe.
- Добавлена миграция `000005_marketplace_mvp`.
- Реализованы `product_categories`, `products`, `product_media`, `orders`, `deals`, `deal_events`, `reviews`.
- Реализованы marketplace endpoints: categories, public products/product, seller products, orders, buyer/seller order actions, reviews, admin product moderation.
- Mock `PaymentProvider` расширен на `payment.purpose=order`.
- Реализован mock safe deal lifecycle: `awaiting_payment` → `held` → `seller_working` → `seller_submitted` → `completed`.
- Добавлены web страницы marketplace/product/checkout/buyer/seller.
- Admin app получил product moderation queue и confirmation для admin actions.
- Предыдущие web/admin экраны обновлены под дизайн-систему через skeleton/empty/error states и semantic tokens.

## Что не сделано

- Upload avatar/banner flow `FF-0105`.
- Полная доменная схема PostgreSQL после Marketplace MVP.
- Полные i18n словари.
- Реальные payment providers.
- Refunds/payouts/fiscalization/disputes/ledger.
- CI pipeline.
- Полные тесты продуктовых сценариев.

## Известные проблемы

- Git-репозиторий в текущей папке не был инициализирован на момент создания документации.
- Платёжный провайдер не выбран.
- Юридическая модель не проверена.
- Restricted/risky категории marketplace требуют legal/payment review и остаются недоступными для seller product creation.
- На VM остались старые orphan containers `fanfuel-frontend` и `fanfuel-backend`; они не мешают текущему compose stack, но их можно убрать отдельной DevOps-задачей после подтверждения, что они больше не нужны.
- Mock callbacks dev-only и не заменяют provider webhook signature verification.
- Widget token rotation в `v0.2` сразу делает старый token недействительным; grace period не реализован.

## Следующие шаги

1. Инициализировать Git, если это нужно проекту.
2. Выполнить `FF-0307`: automated tests и browser smoke для Marketplace MVP.
3. Вынести Studio goals/widgets из `/me/profile` в отдельные `/studio/*` страницы.
4. Проверить mobile/light/dark текущих страниц по `UX-TASK-010`.
5. Решить, выполнять ли `FF-0105` до Creator Store или перенести в storage/file milestone.

## Важные решения

- Monorepo.
- Next.js для web.
- Vite для OBS widgets.
- Go для API/WS/worker.
- PostgreSQL для основной БД.
- Redis для cache/queues/realtime.
- S3/R2 для файлов.
- Payment provider abstraction mandatory.
- i18n mandatory.
- Docker-based deployment.
- JWT access token для `v0.1`, refresh/session слой требует отдельного ADR перед production.

## Ссылки на задачи

- `FF-0001`–`FF-0008`: Foundation.
- `FF-0101`–`FF-0104`, `FF-0106`: Auth + Profiles implemented.
- `FF-0105`: upload avatar/banner planned.
- `FF-0201`–`FF-0206`: Donate MVP implemented.
- `FF-0301`–`FF-0306`: Marketplace MVP implemented locally.
- `FF-0401`–`FF-0405`: Creator Store + Partners.
- `FF-0501`–`FF-0506`: Real Payment Provider Integration.
- `FF-0601`–`FF-0605`: Seller Balance + Payouts.
- `FF-0701`–`FF-0705`: Disputes + Arbitration.
- `FF-0801`–`FF-0805`: Anti-fraud + Verification.
- `FF-0901`–`FF-0904`: Mobile Web / PWA.
- `FF-1001`–`FF-1005`: Public Beta.

## Что нельзя ломать

- Документированные payment abstractions.
- Разделение `Order`, `Deal`, `Payment`, `Payout`, `BalanceTransaction`.
- i18n requirement.
- No secrets in Git.
- Safe deal statuses.
- Provider-agnostic statuses.
- Audit log requirements.
- Юридические пометки `LEGAL_REVIEW_REQUIRED`.

## Проверки v0.0

Локально:

- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `npm audit --audit-level=moderate` — успешно, 0 vulnerabilities.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1` — успешно, повторный запуск идемпотентен.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.

Oracle VM `FanFuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`.

## Проверки v0.1

Локально:

- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1` — успешно, `000002_auth_profiles` применена, повторный запуск идемпотентен.
- Auth smoke: register/login/me — успешно.
- Creator smoke: `GET /api/v1/creators/{creator_slug}` — успешно.
- Admin smoke: list users, block/activate user — успешно, `audit_logs` заполнен.
- `web/admin/widget` — HTTP 200.

Oracle VM `fanfuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно, повторный запуск идемпотентен.
- Auth smoke: register/login/me — успешно.
- Creator smoke: `GET /api/v1/creators/vm-streamer` — успешно.
- Admin smoke: `GET /api/v1/admin/users` — успешно.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`, `000002_auth_profiles`.

## Проверки v0.2

Локально:

- `npm install` — успешно.
- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run build` — успешно.
- `npm audit --audit-level=moderate` — успешно, 0 vulnerabilities.
- `cd services && go test ./...` — успешно.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `infra/scripts/migrate.ps1 -ComposeFile docker-compose.yml` — успешно, `000003_donate_mvp` применена.
- Smoke Donate MVP: register streamer, create goal, create widget token, connect WS, create donation, repeat same `Idempotency-Key`, complete mock payment, receive `donation.alert.created`, verify public donations and goal progress — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.

Oracle VM `fanfuel`:

- IP/доступы хранятся только в игнорируемом `docs/SERVER_ACCESS.md`.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` — успешно.
- `sh infra/scripts/migrate.sh docker-compose.yml` — успешно, `000003_donate_mvp` применена.
- Smoke Donate MVP внутри web container: register streamer, create goal, create widget token, connect WS, create donation, repeat same `Idempotency-Key`, complete mock payment, receive `donation.alert.created`, verify public donations and goal progress — успешно.
- `api/ws/worker /healthz` — `ok`.
- `web/admin/widget` — HTTP 200.
- `schema_migrations` содержит `000001_foundation`, `000002_auth_profiles`, `000003_donate_mvp`.

## Handoff-запись 2026-05-09

Дата: 2026-05-09  
Агент: Codex  
Задача: обновить проект до `v0.2 Donate MVP`, проверить предыдущие этапы и запустить локально/на VM.  
Изменённые файлы: `services/api`, `services/ws`, `services/internal/platform/events`, `infra/migrations`, `apps/web`, `apps/widget`, `packages/types`, `packages/i18n`, `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: реализован Donate MVP с mock payment, idempotency, goals, public history/top donors, OBS WebSocket alerts и widget token flow.  
Проверки: локальные Go/TS/lint/build/audit/compose/migration/smoke; VM compose/migration/smoke/health/http.  
Что не проверено: полноценный browser visual QA и реальные OBS/browser source настройки.  
Риски: mock provider dev-only; real provider, webhook signatures, refunds, payouts и fiscalization остаются planned; VM содержит старые orphan containers `fanfuel-frontend` и `fanfuel-backend`.  
Следующие шаги: добавить automated tests для Donate MVP и готовить `v0.3 Marketplace MVP`.  
Связанные TASK-ID: `FF-0201`, `FF-0202`, `FF-0203`, `FF-0204`, `FF-0205`, `FF-0206`.

## Handoff-запись 2026-05-09: Design System Foundation

Дата: 2026-05-09  
Агент: Codex  
Задача: внедрить дизайн-систему FanFuel, light/dark/system темы, ThemeSwitcher и user preferences для существующих `v0.2` экранов.  
Изменённые файлы: `packages/ui`, `packages/types`, `packages/i18n/locales`, `apps/web`, `apps/admin`, `apps/widget`, `services/api/internal/app`, `infra/migrations/000004_user_preferences.*.sql`, `README.md`, `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/DESIGN_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: добавлены semantic tokens для light/dark, shared UI primitives, `ThemeSwitcher`, `ThemeProvider`, ранний theme script, guest localStorage/cookie, backend sync через `GET/PATCH /api/v1/me/preferences`, таблица `user_preferences`, i18n ключи, обновлён UI главной/auth/profile/creator/admin/widget, добавлен widget URL override `?theme=system|light|dark|transparent`.  
Проверки: `gofmt`; `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `cd services && go test ./...`; `rg`-проверка hardcoded colors в apps показала отсутствие случайных hex/bg-white/text-black/text-white вне token layer; dev servers на `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173` отвечают HTTP 200.  
Что не проверено: миграция `000004_user_preferences` не применялась к живой dev БД в compose; не выполнялся browser screenshot QA light/dark/mobile; не выполнялся ручной authenticated preferences smoke через API/UI.  
Риски: ThemeSwitcher использует текстовые short icons `OS/LT/DK` до подключения icon library; marketplace/safe deal/checkout/payout pages ещё planned и покрыты документацией/patterns, но не реальными экранами; визуальный regression suite отсутствует.  
Следующие шаги: применить миграцию в dev/staging, провести ручную QA-проверку обеих тем и mobile, добавить component gallery/fixtures перед `v0.3 Marketplace MVP`.  
Связанные TASK-ID: `FF-0210`.

## Handoff-запись 2026-05-09: UI/UX planning system

Дата: 2026-05-09  
Агент: Codex  
Задача: подробно продумать UI/UX FanFuel, создать карту страниц, page specs, user flows, tracker статусов и запреты на преждевременную разработку без массовой реализации новых страниц.  
Изменённые файлы: `README.md`, `AGENTS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`, `docs/UI_STATES.md`, `docs/UX_WRITING.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`, `docs/DESIGN_AUDIT.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: создан UI/UX source of truth; зафиксированы текущие routes `/`, `/auth/login`, `/auth/register`, `/me/profile`, `/creators/[slug]`, admin users panel и OBS alert widget; всем текущим и будущим страницам проставлены статусы; описаны сценарии buyer/streamer/seller/admin; добавлен workflow для агентов; future/DO_NOT_BUILD_YET страницы вынесены отдельно.  
Проверки: `Test-Path` для всех новых UI/UX документов; `npm run typecheck --workspaces --if-present`; `npm run lint`.  
Что не проверено: browser screenshot QA, mobile visual QA, markdown formatting через Prettier, Go tests не запускались, потому что backend-код не менялся.  
Риски: `PAGE_SPECS.md` содержит подробные specs для текущих/ближайших страниц и краткие specs для future pages; перед реализацией future page нужно раскрывать spec до полного формата. Marketplace/safe deal/payout/dispute UI остаются заблокированными roadmap/domain/legal/payment зависимостями.  
Следующие шаги: выполнить `UX-TASK-004`–`UX-TASK-010`, начиная с разделения `/me/profile`, role-aware navigation, states и mobile QA.  
Связанные TASK-ID: `UX-TASK-001`, `UX-TASK-002`, `UX-TASK-003`, `UX-TASK-004`, `UX-TASK-005`, `UX-TASK-006`, `UX-TASK-007`, `UX-TASK-008`, `UX-TASK-009`, `UX-TASK-010`.

## Handoff-запись 2026-05-09: Marketplace MVP v0.3

Дата: 2026-05-09  
Агент: Codex  
Задача: сделать апдейт `v0.3 Marketplace MVP` и обновить дизайн прошлых экранов по системе.  
Изменённые файлы: `services/api/internal/app`, `infra/migrations/000005_marketplace_mvp.*.sql`, `apps/web`, `apps/admin`, `packages/types`, `packages/i18n/locales`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DESIGN_AUDIT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`, `ROADMAP.md`.  
Что сделано: реализованы категории, товары, seller product CRUD, public marketplace/product pages, checkout, orders, mock safe deal lifecycle, buyer/seller dashboards, reviews, admin product moderation; старые home/profile/creator/admin экраны получили обновлённые states/navigation по дизайн-системе.  
Проверки: `gofmt -w services/api/internal/app`; `cd services && go test ./...`; `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `rg`-проверка русских строк в UI-коде и случайных цветов вне token layer; `infra/scripts/migrate.ps1 -ComposeFile docker-compose.yml`; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build api web admin widget ws worker`; smoke `GET /healthz`, `GET /api/v1/categories`, web `/marketplace`, admin `/`, widget `/`.  
Что не проверено: ручной browser smoke полного buyer/seller/admin order flow и screenshot QA light/dark/mobile ещё не запускались.  
Риски: mock safe deal не является production escrow/hold; ledger/refunds/payouts/disputes/fiscalization не реализованы; product media пока placeholder без signed file access; `/me/profile` всё ещё содержит mini studio до отдельного выноса.  
Следующие шаги: применить миграцию в dev DB, сделать browser smoke buyer/seller/admin flows, добавить automated tests для order/safe deal transitions, продолжить `UX-TASK-007` через отдельные `/studio/*` страницы.  
Связанные TASK-ID: `FF-0301`, `FF-0302`, `FF-0303`, `FF-0304`, `FF-0305`, `FF-0306`, `UX-TASK-004`, `UX-TASK-005`, `UX-TASK-006`, `UX-TASK-007`, `UX-TASK-008`, `UX-TASK-009`.

## Handoff-запись 2026-05-10: Практический маршрут и активный фокус

Дата: 2026-05-10  
Агент: Codex  
Задача: сделать проектную документацию удобнее и практичнее для следующего шага после `v0.3`.  
Изменённые файлы: `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/TESTING.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: README обновлён до статуса `v0.3 Marketplace MVP / implemented locally`; добавлен быстрый рабочий маршрут; в roadmap добавлен текущий практический фокус перед `v0.4`; в `TASKS.md` добавлен блок `Активный фокус` и новая задача `FF-0307` на стабилизацию Marketplace MVP проверками; в `TESTING.md` добавлен быстрый набор проверок и smoke checklist для `v0.3`.  
Проверки: проверено наличие изменённых документов через `Test-Path`; выполнен поиск ключевых новых блоков через `Select-String` и `rg`; `npx prettier --check README.md ROADMAP.md docs/TASKS.md docs/TESTING.md docs/CHANGELOG.md docs/HANDOFF.md` — успешно.  
Что не проверено: markdown rendering/formatting через отдельный formatter; product/browser smoke не запускался, потому что production-код не менялся.  
Риски: `FF-0307` пока только документационная задача; automated tests и browser smoke ещё нужно выполнить отдельной реализацией.  
Следующие шаги: выполнить `FF-0307`, затем продолжить `UX-TASK-007`, `UX-TASK-010` и решение по `FF-0105`.  
Связанные TASK-ID: `FF-0307`, `UX-TASK-007`, `UX-TASK-010`, `FF-0105`.

## Handoff-запись 2026-05-10: Practical Page Design Pass

Дата: 2026-05-10  
Агент: Codex  
Задача: улучшить дизайн текущих страниц, не создавая future routes и не меняя доменную логику.  
Изменённые файлы: `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/admin/src/styles.css`, `apps/widget/src/styles.css`, `packages/ui/src/styles.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DESIGN_AUDIT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: добавлены быстрые входы по ролям на главной; mobile topbar web теперь сохраняет навигацию через горизонтальный scroll; улучшены surfaces, hover/focus states, карточки товаров, order rows, формы, сообщения, admin rows и OBS widget alert; новые строки добавлены в `ru/en` i18n.  
Проверки: `npm run typecheck --workspaces --if-present`; `npm run lint`; `npm run build --workspaces --if-present`; `npm run test --workspaces --if-present`; `npx prettier --check` для изменённых UI/i18n/docs файлов; HTTP smoke текущего docker stack: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173` — 200.  
Что не проверено: Playwright/screenshot QA на 320/390/768/1440; ручная проверка всех страниц в light/dark; полный browser smoke buyer/seller/admin marketplace flow.  
Риски: изменения в основном CSS могут дать мелкие visual regressions на редких ширинах; нужен отдельный `UX-TASK-010` screenshot pass.  
Следующие шаги: провести mobile/light/dark screenshot QA, затем продолжить `UX-TASK-007` и `FF-0307`.  
Связанные TASK-ID: `UX-TASK-010`, `UX-TASK-007`, `FF-0307`.

## Handoff-запись 2026-05-11: Marketplace-first auth и публичные страницы ролей

Дата: 2026-05-11  
Агент: Codex  
Задача: сделать страницу входа компактнее и понятнее, исправить auth-состояние верхней панели, отправлять уже вошедшего пользователя из `/auth/login` в marketplace и сделать marketplace главной точкой входа.  
Изменённые файлы: `apps/web/src/lib/api.ts`, `apps/web/src/components/app-chrome.tsx`, `apps/web/src/components/public-landing.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/for-buyers/page.tsx`, `apps/web/src/app/for-streamers/page.tsx`, `apps/web/src/app/for-sellers/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: `/` теперь редиректит на `/marketplace`; login/register получили компактную форму, верхнее центрирование и редирект в marketplace при уже валидной сессии; `AppTopBar` синхронизирует token state через `getMe`, `storage` и `fanfuel-auth-changed`, скрывает login/register для вошедших и профиль для гостей; добавлены публичные страницы `/for-buyers`, `/for-streamers`, `/for-sellers`; marketplace получил блок преимуществ для покупателей; все новые UI-строки добавлены в `ru/en` i18n.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; HTTP smoke на свежем dev-сервере `http://localhost:3002`: `/` даёт `307` на `/marketplace`, `/marketplace`, `/for-buyers`, `/for-streamers`, `/for-sellers`, `/auth/login` отвечают `200`; Chrome headless screenshots проверены для desktop login/marketplace и mobile `/for-streamers`.  
Что не проверено: полный ручной authenticated browser flow с реальным backend-пользователем; полный matrix light/dark/mobile по всем новым страницам; старый dev-сервер на `localhost:3000` во время проверки отдавал устаревшее состояние, поэтому smoke выполнялся на новом `localhost:3002`.  
Риски: auth-состояние шапки зависит от доступности `GET /api/v1/auth/me`; при битом или устаревшем токене клиент очищает token и показывает guest-навигацию; мобильная шапка теперь переносит публичные ссылки в две строки на узких экранах.  
Следующие шаги: выполнить ручной smoke входа/выхода с dev API, проверить light theme для новых публичных страниц и продолжить `FF-0307` стабилизационными browser smoke сценариями.  
Связанные TASK-ID: `UX-TASK-011`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-11: Authenticated marketplace topbar

Дата: 2026-05-11  
Агент: Codex  
Задача: приблизить залогиненную верхнюю панель к наброску пользователя: логотип, поиск, notification action и раскрывающееся меню аккаунта в стиле FanFuel.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: для авторизованного состояния `AppTopBar` получил marketplace search с переходом в `/marketplace?query=...`, compact actions, disabled notification placeholder и account dropdown; меню показывает профиль, покупки, продажи для seller role, настройки, theme switcher, язык и выход; пункты помощи/сообщений/финансов оставлены disabled, финансы не показывают fake balance и не ведут на future payout routes.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `GET http://localhost:8080/healthz` и `GET http://localhost:3002/marketplace` — 200; создан временный dev-пользователь `codex-topbar-...@example.test` через local API и проверены Chrome headless screenshots authenticated desktop/mobile с открытым меню; topbar search smoke из `/buyer` привёл на `/marketplace?query=obs`.  
Что не проверено: полный ручной click-through всех menu items в обычном браузере; light theme screenshot для нового dropdown; реальные notification/messages/finance flows, потому что домен/API ещё не готовы.  
Риски: notification button сейчас intentionally disabled до notification flow; пункт финансов disabled до wallet/payout/provider/legal review; `/me/profile` всё ещё временно принимает часть Studio/settings ссылок до `UX-TASK-007`.  
Следующие шаги: провести light/mobile screenshot QA в рамках `UX-TASK-010`, затем продолжить разделение `/me/profile` по `UX-TASK-007` и не включать финансы/выплаты без `docs/PAYMENTS.md` review.  
Связанные TASK-ID: `UX-TASK-012`, `UX-TASK-010`, `UX-TASK-007`, `FF-0307`.

## Handoff-запись 2026-05-11: Compact mobile account menu

Дата: 2026-05-11  
Агент: Codex  
Задача: исправить залогиненный topbar/menu на мобильных: всё в одну строку, меню плотнее, категории разделены, тема не раскрывается некорректно, profile/settings/studio разделены в планах.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: authenticated topbar на mobile удерживает логотип, поиск, уведомления и меню в одну строку; account dropdown стал уже и плотнее; пункты меню разнесены по категориям с разделителями и отступом подпунктов; theme/language controls вынесены в компактные dropdown-паттерны; `/me/settings` добавлен в план как отдельная страница, `/studio` оставлен planned и оба пункта меню помечены как "скоро".  
Проверки: `npx prettier --check` для изменённых UI/i18n/docs файлов — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://localhost:3002/marketplace` с streamer-token: viewport 390px и 320px, topbar one-line = true, nested theme menu = false, overflow rows = 0.  
Что не проверено: ручной click-through в обычном браузере; полный light/dark matrix для всех страниц; real notification/messages/finance flows, потому что домен/API ещё не готовы.  
Риски: пункты `/me/settings` и `/studio` сейчас intentionally disabled как "скоро", поэтому полноценное разделение страниц остаётся задачей `UX-TASK-007`; финансы остаются disabled до payment/provider/legal review.  
Следующие шаги: реализовать отдельные `/me/settings` и `/studio` по `UX-TASK-007`, затем провести полный `UX-TASK-010` screenshot QA.  
Связанные TASK-ID: `UX-TASK-013`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Preference dropdowns в account menu

Дата: 2026-05-11  
Агент: Codex  
Задача: поправить отступы account menu, вернуть аккуратный dropdown для темы и добавить dropdown смены языка `Русский`/`English`.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/i18n.ts`, `apps/web/src/app/layout.tsx`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: выровнен вертикальный ритм account menu; theme и language controls заменены на overlay-dropdown поверх меню; язык показывает `Русский` вместо `По-русски`, содержит `English`, сохраняется в localStorage/cookie и через `PATCH /api/v1/me/preferences`; topbar использует выбранную locale для своих подписей.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://localhost:3002/marketplace` с streamer token на 390px и 320px — topbar one-line, dropdown fits, overflow rows = 0, theme/language overlay fits; screenshot artifacts сохранены во временной папке.  
Что не проверено: полный ручной click-through в обычном браузере; полная локализация всех страниц от dropdown, потому что текущая i18n-архитектура страниц всё ещё использует `NEXT_PUBLIC_DEFAULT_LOCALE`/app helper без route-level LocaleProvider.  
Риски: language dropdown сохраняет preference и переводит topbar/menu, но остальной page copy останется на текущей app locale до отдельной задачи по глобальной runtime-locale архитектуре; notification/messages/finance остаются disabled по прежним ограничениям.  
Следующие шаги: при реализации `/me/settings` вынести туда полноценное управление locale/theme и отдельно решить глобальную локализацию страниц; продолжить `UX-TASK-007` и `UX-TASK-010`.  
Связанные TASK-ID: `UX-TASK-013`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Guest topbar dropdown menu

Дата: 2026-05-11  
Агент: Codex  
Задача: сделать похожее burger/dropdown menu для неавторизованного пользователя, оставить поиск в topbar и обновить placeholder поиска под товары, услуги, категории и авторов.  
Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: поиск вынесен в общий topbar для гостя и авторизованного пользователя; для гостя добавлено compact dropdown menu с входом, регистрацией, marketplace, ролевыми публичными страницами, темой и языком; пункт покупок для гостя не показывается; placeholder поиска показывает "Найти товар, услугу или автора" на широком экране и "Поиск" на mobile.  
Проверки: `npx prettier --write` для изменённых UI/i18n/docs файлов; `npm run typecheck` — успешно; `npm run lint` — успешно; `npm run build` — успешно; `npm run test` — успешно; CDP smoke на `http://localhost:3002/marketplace` для 1440/390/320 — topbar one-line, mobile placeholder compact, guest menu внутри viewport, есть вход/регистрация/тема/язык, нет "Покупок", theme/language overlay внутри viewport.  
Что не проверено: полный ручной click-through в обычном браузере; реальное расширение backend-поиска по авторам и категориям, потому что это отдельная marketplace/API задача.  
Риски: topbar search уже использует broad placeholder, но фактическая глубина поиска зависит от текущей реализации marketplace API/фильтра; language preference переводит topbar/menu, но глобальная runtime-locale архитектура страниц остаётся отдельной задачей.  
Следующие шаги: при необходимости расширить marketplace search backend/index на авторов и категории; продолжить `UX-TASK-007`, `UX-TASK-010` и стабилизационные browser smoke из `FF-0307`.  
Связанные TASK-ID: `UX-TASK-014`, `UX-TASK-007`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: Внешний dev-домен для web

Дата: 2026-05-11  
Агент: Codex  
Задача: исправить ситуацию, когда `danechka.com:3002/marketplace` отдаёт страницу через Next.js dev-сервер, но интерактивность работает некорректно из-за заблокированных dev-ресурсов.  
Изменённые файлы: `apps/web/next.config.mjs`, `.env.example`, `docs/TESTING.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.  
Что сделано: в `next.config.mjs` добавлен `allowedDevOrigins` для `127.0.0.1` и тестового host `danechka.com`; дополнительные host можно указать через `NEXT_ALLOWED_DEV_ORIGINS`. В `.env.example` добавлен пример переменной, а в `docs/TESTING.md` описана проверка web через внешний dev-домен и необходимость перезапуска dev-сервера после изменения allowlist. Dev-сервер на 3002 перезапущен с новым конфигом.  
Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `npx prettier --check apps/web/next.config.mjs docs/TESTING.md docs/CHANGELOG.md docs/HANDOFF.md` — успешно; CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1` — React-гидратация есть, dropdown открывается, placeholder поиска виден; в dev-логе нет `Blocked cross-origin request`.  
Что не проверено: реальный внешний DNS/порт с другого устройства вне этой машины; HTTPS/proxy-сценарий для домена.  
Риски: `allowedDevOrigins` нужен только для Next.js dev-режима; production-показ домена должен идти через `next start`/reverse proxy и отдельную настройку origin/CORS. При добавлении нового тестового домена dev-сервер нужно перезапустить.  
Следующие шаги: если появится второй preview host, добавить его в `NEXT_ALLOWED_DEV_ORIGINS` через запятую и повторить browser smoke dropdown/search.

## Handoff-запись 2026-05-11: Topbar search polish и hydration guard

Задача: исправить dev hydration overlay на `danechka.com:3002`, выровнять кнопку поиска в topbar и не сокращать placeholder до "Поиск", когда длинный текст фактически помещается.

Изменённые файлы: `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/marketplace/page.tsx`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

Что сделано: topbar search теперь измеряет фактическую ширину input и выбирает компактный placeholder только при нехватке места; search button стал inset-кнопкой с равными top/right/bottom отступами; на topbar и marketplace form controls добавлен точечный `suppressHydrationWarning`, чтобы browser/extension-injected attributes вроде `__gcruniqueid` не поднимали blocking dev overlay.

Проверки: `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npx prettier --check` для изменённых UI/docs файлов — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; CDP smoke на `http://danechka.com:3002/marketplace` с локальным host mapping на `127.0.0.1` и viewport 390px — placeholder `Найти товар, услугу или автора`, ширина поля 278px, кнопка 34px, gaps top/right/bottom = 5px, dev overlay не найден.

Что не проверено: реальный iOS Safari с тем же набором расширений пользователя.

Риски: `suppressHydrationWarning` должен оставаться локальным guard для внешних атрибутов, а не способом скрывать настоящие SSR/client расхождения.

Следующие шаги: при повторении overlay на других формах проверить, какой атрибут добавляется браузером, и расширять guard только на конкретные затронутые controls.
Связанные TASK-ID: `FF-0307`, `UX-TASK-014`.

## Handoff-запись 2026-05-11: Topbar search control и mobile API proxy

Задача: выровнять поле поиска по высоте с topbar-кнопками, сделать кнопку поиска встроенной частью поля и починить mobile dev-сценарий, где auth/API работает с ПК, но ломается с телефона через `danechka.com:3002`.

Изменённые файлы: `.env.example`, `apps/web/src/app/api/v1/[...path]/route.ts`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/api.ts`, `docs/API_PLAN.md`, `docs/TESTING.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.

Что сделано: topbar search получил ту же высоту, что соседние кнопки, а submit стал правым встроенным сегментом с divider; login/register forms защищены от внешних injected attributes через точечный `suppressHydrationWarning`; browser API client перешёл на same-origin `/api/v1/*` при localhost public base; добавлен Next.js route proxy `/api/v1/*`, который серверно прокидывает запросы к Go API через `FANFUEL_INTERNAL_API_BASE_URL`/`API_BASE_URL`/fallback `localhost:8080`.

Проверки: `npx prettier --check` для изменённых code/docs файлов — успешно; `.env.example` не форматировался Prettier, потому что у него нет parser; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; HTTP smoke `GET http://localhost:3002/api/v1/categories` — 200 через web proxy; `GET http://localhost:3002/marketplace` — 200.

Что не проверено: реальный iOS Safari с телефона и настоящий внешний DNS/port-forward после правки; нужно повторить ручной smoke на устройстве через `danechka.com:3002`.

Риски: proxy не заменяет production reverse proxy/CORS-политику; если в будущем `NEXT_PUBLIC_API_BASE_URL` укажет внешний не-localhost API origin, телефон должен иметь доступ к этому origin напрямую.

Следующие шаги: вручную открыть `http://danechka.com:3002/auth/login` на телефоне, проверить отсутствие hydration overlay и успешный login при запущенном Go API на машине с Next.js.
Связанные TASK-ID: `UX-TASK-016`, `FF-0307`.

## Handoff-запись 2026-05-11: Главная маркетплейса как мобильная витрина

Дата: 2026-05-11
Агент: Codex
Задача: переделать `/marketplace` из текстового лендинга в полноценную мобильную главную маркетплейса цифровых товаров и услуг.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/PAGE_SPECS.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `/marketplace` получил короткий торговый hero с поиском, быстрыми категориями и CTA; кликабельные плашки Safe deal/промокодов/проверенных продавцов; ленту "Популярно сейчас"; блок "Подборки авторов"; категории "Для стримеров" и "Игровые услуги"; блок доверия; нижнюю ленту новых товаров. Карточки товаров стали плотнее и показывают цену, продавца, рейтинг/нового продавца, safe deal и бейдж поддержки автора при наличии `affiliate_percent_bps`. Ленты используют реальные товары из marketplace API и не подставляют фиктивные товары при пустой БД.
Проверки: `npx prettier --write` и `npx prettier --check` для изменённых UI/i18n/docs файлов; `git diff --check` — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run build --workspaces --if-present` — успешно; `npm run test --workspaces --if-present` — успешно; `GET http://localhost:8080/healthz` — `ok`; `GET http://localhost:3002/marketplace` — 200; CDP smoke на `http://localhost:3002/marketplace` при viewport 390x844 — горизонтального overflow нет, hero высотой 609px, `#popular-now` начинается на 784px и виден в первом экране, 3 explainer-плашки есть, клик по первой открывает объяснение.
Что не проверено: полный screenshot QA на 320/390/768/1440 в light/dark; визуальный вид лент с опубликованными товарами, потому что текущий `GET /api/v1/products` в dev вернул пустой список; реальный iOS/Android браузер.
Риски: при пустом marketplace API страница честно показывает пустые состояния вместо демо-товаров; авторские подборки используют существующий public creator route `/creators/[slug]`, но конкретные витрины будут полезны только после появления соответствующих профилей/товаров; игровые услуги остаются с `LEGAL_REVIEW_REQUIRED` и не должны расширяться в рискованные категории без legal/payment review; Safe deal в `v0.3` остаётся mock-сценарием.
Следующие шаги: добавить dev/seed-набор опубликованных товаров только как отдельное решение, затем провести screenshot QA mobile/light/dark и расширять поиск по авторам/категориям отдельной backend/API задачей.
Связанные TASK-ID: `UX-TASK-017`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-11: черновик Figma design map

Дата: 2026-05-11
Агент: Codex
Задача: создать Figma-карту текущего дизайна FanFuel и примеры базовых UI-паттернов.
Изменённые файлы: `docs/HANDOFF.md`; Figma-файл `FanFuel Design Map v0.3` (`https://www.figma.com/design/RiTvolqL6ooNxkgxb77gjy`).
Что сделано: создан новый Figma-файл; заведены страницы `00 Cover`, `01 Foundations`, `02 Components & Screens`; добавлены коллекции переменных `FanFuel / Color` с режимами Light/Dark и `FanFuel / Sizing`; добавлены 48 переменных на основе `packages/ui/src/styles.css` и sizing-токенов, 9 текстовых стилей и 3 effect styles.
Проверки: прочитаны обязательные проектные и UI/UX-документы; проверены доступные Inter fonts через Figma MCP; выполнен поиск существующих design system assets в Figma, результатов нет; Figma `_use_figma` подтвердил создание переменных и стилей.
Что не получилось проверить: визуальные секции карты, примеры Button/Input/Dropdown/Switch/Badge/ProductCard/Topbar/Modal и мини-экраны не удалось записать в Figma.
Риски: Figma MCP остановил дальнейшие записи лимитом Starter-плана; повторная попытка дорисовать карту через `_use_figma` также вернула `mcp_rate_limit_paywall`; текущий Figma-файл является foundation draft, а не полной дизайн-картой.
Следующие шаги: после сброса или увеличения лимита Figma MCP дорисовать визуальные страницы foundations, компонентные примеры, состояния, topbar/dropdown/switch/modal patterns, marketplace/buyer/seller/admin/widget mini-screens и developer rules.
Связанные TASK-ID: `FF-0210`, `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-11: разнесение roadmap и tasks по файлам

Дата: 2026-05-11
Агент: Codex
Задача: переделать roadmap и backlog так, чтобы агентам не нужно было читать весь монолитный список при каждой задаче.
Изменённые файлы: `README.md`, `ROADMAP.md`, `docs/TASKS.md`, `docs/roadmap/**`, `docs/tasks/**`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `ROADMAP.md` превращён в короткий индекс, а подробные разделы перенесены в `docs/roadmap/`; `docs/TASKS.md` превращён в короткий индекс с активным фокусом и ссылками на отдельные TASK-ID; все подробные задачи перенесены в `docs/tasks/` по папкам `v0.0`-`v1.0` и `ui-ux`; добавлены `README.md`-индексы для новых подпапок; основной README обновлён под новый маршрут чтения.
Проверки: `npx prettier --check README.md ROADMAP.md docs/TASKS.md "docs/roadmap/**/*.md" "docs/tasks/**/*.md" docs/CHANGELOG.md` — успешно; custom link check для новых индексов — успешно; `git diff --check -- README.md ROADMAP.md docs/TASKS.md docs/roadmap docs/tasks docs/CHANGELOG.md` — успешно.
Что не проверено: полный `git diff --check` по всему рабочему дереву остаётся заблокирован существующими trailing spaces в ранее добавленной Figma-записи `docs/HANDOFF.md`, не относящейся к этому сплиту.
Риски: при добавлении новой задачи теперь нужно обновлять и отдельный task-файл, и короткий индекс `docs/TASKS.md`; если старые инструкции будут ссылаться только на монолитный `docs/TASKS.md`, они всё равно попадут в индекс, но подробности нужно открывать по ссылке TASK-ID.
Следующие шаги: при следующей задаче использовать `docs/tasks/active-focus.md` и конкретный файл задачи; при планировании нового этапа добавлять отдельный файл в `docs/roadmap/`.
Связанные TASK-ID: документационная инфраструктура, отдельный TASK-ID не создавался.

## Handoff-запись 2026-05-11: полировка topbar logo/search

Дата: 2026-05-11
Агент: Codex
Задача: уменьшить левый визуальный отступ у лупы в topbar search и сделать `FF`-логотип такого же размера, как соседние блоки.
Изменённые файлы: `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `FF`-логотип увеличен до `40x40` на desktop и `38x38` на mobile, чтобы совпадать с высотой соседних topbar controls; search submit-сегмент сделан квадратным (`38x38` на desktop и `36x36` на mobile), а правый padding input уменьшен, чтобы лупа визуально стояла ровно внутри кнопки.
Проверки: `npx prettier --check apps/web/src/app/globals.css docs/CHANGELOG.md docs/HANDOFF.md` — успешно; `npm run typecheck --workspaces --if-present` — успешно; `npm run lint` — успешно; `npm run test --workspaces --if-present` — успешно; Chrome DevTools Protocol smoke на `http://localhost:3002/marketplace` — на viewport `390x844` логотип и menu `38x38`, search height `38`, кнопка лупы `36x36`, horizontal overflow `0`; на viewport `1440x900` логотип/menu/search height `40`, кнопка лупы `38x38`, horizontal overflow `0`.
Что не проверено: полный screenshot QA light/dark и реальный мобильный браузер; `git diff --check` остаётся заблокирован старой Figma-записью в `docs/HANDOFF.md` с trailing spaces.
Риски: в рабочем дереве уже были несвязанные изменения `apps/web/src/app/globals.css`, marketplace/i18n/docs; эта правка ограничена topbar selectors и не должна трактоваться как полная проверка существующего большого diff.
Следующие шаги: при следующем визуальном QA проверить topbar на 320px и в обеих темах вместе с `UX-TASK-010`.
Связанные TASK-ID: `UX-TASK-010`, `FF-0307`.

## Handoff-запись 2026-05-12: главная marketplace без redirect и CRM-фильтров

Дата: 2026-05-12
Агент: Codex
Задача: обновить главную marketplace по UX-замечаниям: `/` должен открывать ту же витрину без redirect, первый экран не должен выглядеть как CRM-фильтр, публичный UI не должен показывать внутренний `LEGAL_REVIEW_REQUIRED`, empty states должны быть спокойными, а для разработки нужны seed/mock товары.
Изменённые файлы: `apps/web/src/app/page.tsx`, `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `services/api/internal/app/marketplace_store.go`, `services/api/internal/app/slug.go`, `services/api/internal/app/slug_test.go`, `infra/scripts/seed-dev.sh`, `infra/scripts/seed-dev.ps1`, `docker-compose.dev.yml`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/UI_UX_TRACKER.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/TASKS.md`, `docs/tasks/ui-ux/README.md`, `docs/tasks/ui-ux/UX-TASK-011.md`, `docs/tasks/ui-ux/UX-TASK-018.md`, `docs/DEPLOYMENT.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: корневой route `/` теперь рендерит тот же marketplace screen, что и `/marketplace`, без HTTP/client redirect; бренд в topbar ведёт на `/`; внутренний hero search и строка category/sort убраны полностью, поиск остался в topbar; первый экран стал ближе к референсу: CTA, быстрые категории, витринная карточка товара, объяснение покупки и компактные role tabs под trust-плашками; горизонтальные marketplace-ленты сбрасываются в начало после загрузки данных, без принудительного вертикального scroll страницы; hero CTA "Смотреть популярное" и "Подборки авторов" убраны; внутренний `LEGAL_REVIEW_REQUIRED` больше не выводится в публичном marketplace UI; старые дублирующие category bands удалены, а авторские подборки оставлены ближе к существующему компактному варианту; пустые списки показывают спокойный empty state с действиями "Стать продавцом" и "Все категории". Dev seed scripts теперь идемпотентно создают 3 seller profiles и 6 published mock products через реальные таблицы. В API исправлен баг, где пустой `category` превращался в slug `user` и `/api/v1/products` без фильтра возвращал пустой список. В `docker-compose.dev.yml` web proxy явно ходит к API по `http://api:8080`.
Проверки: `npx prettier --check` для затронутых TSX/CSS/JSON/Markdown/YAML файлов — успешно; `npm run typecheck --workspaces --if-present` и `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run test --workspaces --if-present` — успешно; `npm run build --workspaces --if-present` и `npm run build -w @fanfuel/web` — успешно; `cd services && go test ./...` — успешно; `git diff --check` — успешно; `.\infra\scripts\seed-dev.ps1 -ComposeFile docker-compose.yml` — первый рабочий запуск создал 3 sellers и 6 products, повторный запуск `INSERT 0 0`; SQL smoke подтвердил 6 published seed products; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` пересобрал API/web; `GET http://localhost:8080/api/v1/products` и `GET http://localhost:3000/api/v1/products` возвращают 6 товаров; `GET http://localhost:3000/` и `/marketplace` возвращают 200 без `NEXT_REDIRECT`, без `ff-market-search-panel`, без "Искать</button>", без "Применить" и без `LEGAL_REVIEW_REQUIRED`.
Что не проверено: полноценный screenshot QA в реальном браузере на 320/390/768/1440 и обеих темах; состояние абсолютно пустой БД после удаления seed-товаров проверено только логикой empty state, без отдельного сброса БД.
Риски: dev seed добавляет демонстрационные товары в локальную БД, поэтому для проверки пустого состояния нужно запускать отдельную чистую БД или удалить seed-товары; product media пока остаётся CSS-заглушкой, без реальных изображений товаров; line-ending warnings `LF will be replaced by CRLF` остаются особенностью текущей Windows git-настройки.
Следующие шаги: провести browser screenshot QA после seed на desktop/mobile light/dark; отдельно проверить пустую БД без seed; добавить реальные product media/preview assets отдельной задачей.
Связанные TASK-ID: `UX-TASK-018`, `UX-TASK-011`, `UX-TASK-017`, `FF-0307`.

## Handoff-запись 2026-05-12: компактные карточки marketplace

Дата: 2026-05-12
Агент: Codex
Задача: убрать hero-кнопки "Смотреть товары" и "Все категории", перестроить порядок данных в карточках, оставить горизонтальное листание только на мобильных ширинах и усилить авторский блок подборок.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: hero CTA удалены; карточки товаров и hero-товар показывают цену, рейтинг со звездой, название, продавца и плашки в новом порядке; desktop-ряды товаров стали CSS grid без горизонтального overflow, mobile-ряды остались свайпаемыми; карточки уплотнены по высоте; аватар и ник автора в подборках увеличены и выровнены по центру высоты блока.
Проверки: frontend форматирование, typecheck, lint, build и browser smoke выполнялись после правки.
Что не проверено: полный ручной screenshot QA light/dark на всех ширинах и реальный мобильный браузер.
Риски: карточки стали плотнее, поэтому после появления настоящих длинных названий товаров нужен отдельный визуальный regression pass.
Следующие шаги: проверить marketplace на 320/390/768/1440 в light/dark и при большем числе реальных товаров.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: визуальная доводка hero marketplace

Дата: 2026-05-12
Агент: Codex
Задача: довести hero и мобильные ленты marketplace по замечаниям: акцентный перенос "поддерживай авторов", меньший отступ после подзаголовка, выравнивание hero-карточек по заголовку, скрытие секционных orange-eyebrow плашек, mobile-only свайп-подсказки и отсутствие hover-подъёма на touch-устройствах.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: заголовок hero разбит на две строки через i18n-ключи `marketplaceTitlePrimary`/`marketplaceTitleAccent`, акцентная строка окрашена в primary token; отступ после подзаголовка уменьшен; right-side hero карточки выровнены по верхней границе заголовка на desktop; секционные плашки `Хиты`/`Авторы`/`Почему удобно`/`Новое` оставлены в JSX-комментариях; мобильные author collections показывают аватар и ник автора первым элементом горизонтальной ленты, а товарную карточку справа подрезают как affordance; для свайпа добавлена малозаметная стрелка, hover-подъём карточек отключён для touch/coarse pointer.
Проверки: `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/`: desktop title line break `true`, accent color primary, hero aside delta from h1 `0`, секционных `.ff-status` нет; mobile overflow X `0`, `.ff-market-author-inline` display `grid`, `.ff-market-author-side` display `none`, author tile первый в shelf, стрелка `→` есть, первая товарная карточка в author shelves подрезана справа.
Что не проверено: полный ручной screenshot QA light/dark на 320/390/768/1440 и реальный мобильный браузер; long-title regression на большом каталоге.
Риски: подсказка-стрелка добавлена CSS-псевдоэлементом для всех mobile product shelves, поэтому при будущей ленте с очень малым числом товаров может потребоваться условное скрытие; hover reset рассчитан на `hover: none`/`pointer: coarse`, desktop touch-экраны тоже получат поведение mobile.
Следующие шаги: пройти полный visual QA marketplace в light/dark и проверить реальные изображения товаров, когда появятся product media.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: бейджи и адаптивные карточки marketplace

Дата: 2026-05-12
Агент: Codex
Задача: исправить обрезание цены, перенос карточек, размер loading skeleton, смысловые бейджи Safe deal/поддержки автора/товара от автора и мобильный вид авторских подборок.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/src/format.ts`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: `formatMoney` получил опцию `trimZeroFraction`, marketplace-карточки используют её для цен без `,00`; product meta переведён на flex, чтобы цена не ужималась; desktop product shelves и нижняя feed-сетка ограничены одной видимой строкой и скрывают лишние карточки вместо переноса; `ff-market-shelf-skeleton` получил высоту реальной карточки; Safe deal стал зелёным бейджем со shield-иконкой; поддержка автора показывается только в author collections через жёлто-оранжевый бейдж `автору`; в общих карточках support-бейдж убран, добавлен бейдж `От автора` для `seller_type=pro` и `verification_status=approved`; mobile author tile потерял рамку/фон, product cards в author collections вернулись к стандартной ширине; свайп-подсказка заменена на edge fade + тонкий chevron без кнопочного контейнера.
Проверки: `npx prettier --write packages/i18n/src/format.ts apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/i18n` — успешно; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/marketplace` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/marketplace`: desktop row height `220`, visible tile rows `1`, popular support badges `[]`, feed support count `0`, author support sample `автору`, prices без `[,.]00`, Safe deal имеет `.ff-market-badge-icon-safe`; mobile overflow X `0`, author border `0px`, author background transparent, product flex-basis `170px`, first product not cut, second product cut, swipe chevron `›` and fade width `34px`.
Что не проверено: ручной screenshot QA light/dark на 320/390/768/1440 и реальный мобильный браузер; отдельный сценарий creator storefront пока не реализован в текущем marketplace screen.
Риски: признак `От автора` построен по доступной MVP-модели `seller_type=pro` + `verification_status=approved`, потому что отдельного поля verified creator у public product summary пока нет; если доменная модель различит seller verification и creator verification, условие нужно заменить на явный backend-флаг.
Следующие шаги: добавить явный `is_creator_verified`/`seller_has_creator_profile` в public product summary, если бейдж `От автора` станет продуктовым контрактом, и пройти visual QA после реальных product media.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-12: исправление clipping marketplace-карточек

Дата: 2026-05-12
Агент: Codex
Задача: исправить визуальную регрессию, где карточки marketplace стали обрезать нижний контент и hover-подъём клиповался сверху.
Изменённые файлы: `apps/web/src/app/globals.css`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: высота карточки увеличена до `228px`, preview area переведена с `4/3` на `16/9`, desktop shelves больше не используют vertical clipping, лишние product/skeleton карточки скрываются через `nth-of-type` на desktop/tablet breakpoint'ах, feed grid скрывает лишние карточки без второго ряда, hover transform у marketplace product tile отключён, чтобы карточка не выезжала под обрезку.
Проверки: `npx prettier --write apps/web/src/app/globals.css docs/CHANGELOG.md docs/HANDOFF.md`; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` — успешно; `GET http://localhost:3000/marketplace` — 200; `git diff --check` — успешно, только Windows CRLF warnings; CDP smoke на production `http://127.0.0.1:3010/marketplace`: на `930x900` popular/author rows имеют height `228`, visible rows `1`, visible count `4`, `overflowY=visible`, `contentCut=false` для карточек, seller и badges видны; hover transform `none`, `clippedTop=false`; на `1466x980` author row visible count `6`, rows `1`, seller виден.
Что не проверено: ручной screenshot QA в обеих темах и реальный мобильный браузер.
Риски: количество видимых карточек теперь задано CSS breakpoint'ами, а не измерением фактической ширины контейнера; для будущего идеального поведения можно заменить на container queries или вычисляемый shelf limit.
Следующие шаги: после появления реальных product media пройти visual QA на 930/1024/1280/1440 и mobile widths.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-13: единый шаблон карточек marketplace

Дата: 2026-05-13
Агент: Codex
Задача: исправить desktop-перенос карточек marketplace, унифицировать карточки товаров во всех секциях, заменить текстовые бейджи на раскрывающиеся иконки, добавить меню действий и кнопку избранного для авторизованных пользователей.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: карточки marketplace переведены на общий шаблон с одинаковым `16/9` media ratio, авто-высотой и без вертикального clipping; на desktop-полках лишние карточки скрываются вместо переноса, а мобильные полки остаются горизонтально свайпаемыми; бейджи Safe deal/От автора/автору стали компактными круглыми иконками, раскрываются по hover на desktop и по нажатию на touch/mobile; бейджи вынесены из ссылки карточки, чтобы tap не уводил пользователя со страницы; у каждой карточки появился левый action-menu с пунктом "Пожаловаться"; при валидной авторизации справа сверху показывается кнопка избранного; нижняя секция "Новые товары" использует тот же компонент карточки.
Проверки: `npx prettier --write apps/web/src/app/marketplace/page.tsx apps/web/src/app/globals.css packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json`; `npm run typecheck -w @fanfuel/web` — успешно; `npm run typecheck -w @fanfuel/i18n` — успешно; `npm run lint` — успешно; `npm run build -w @fanfuel/web` — успешно; CDP smoke на `http://127.0.0.1:3010/marketplace` для `930x900`, `1110x900`, `1466x980` и `390x900`: desktop-полки в один визуальный ряд, mobile-полки горизонтально скроллятся, media ratio `1.778`, clipping не найден; проверены раскрытие бейджа hover/tap, открытие меню "Пожаловаться" и отображение heart-кнопок после регистрации smoke-пользователя.
Что не проверено: полноценный ручной visual QA в light/dark темах и реальный мобильный браузер; backend-действия для избранного и жалобы не реализованы в этой задаче, кнопки пока UI-заготовка; `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build web` не завершился за 244 секунды и был остановлен, при этом существующий `http://localhost:3000/marketplace` отвечал 200.
Риски: количество видимых карточек на desktop сейчас регулируется CSS breakpoint'ами; при новых нестандартных контейнерах может потребоваться container-query или вычисляемый лимит. Кнопки избранного и жалобы имеют готовый UI, но до появления endpoints не сохраняют действие.
Следующие шаги: добавить backend/API для избранного и жалоб, когда появится продуктовый контракт; после реальных product media пройти отдельный visual QA на 320/390/768/930/1110/1440.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-15: возврат бейджа поддержки автора

Дата: 2026-05-15
Агент: Codex
Задача: вернуть плашку поддержки автора для товаров, где задана партнёрская доля/скидка автора, а не только для товаров в авторских подборках.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `docs/HANDOFF.md`.
Что сделано: бейдж `marketplaceAuthorSupportBadge` теперь показывается у любой marketplace-карточки с `affiliate_percent_bps > 0`; устаревший проп `showAuthorSupportBadge` удалён из `ProductShelf` и `MarketplaceProductTile`.
Проверки: запущены `npx prettier --write apps/web/src/app/marketplace/page.tsx docs/HANDOFF.md`, `npm run typecheck -w @fanfuel/web`.
Что не проверено: ручной visual QA light/dark/mobile и browser smoke не запускались для этой точечной правки.
Риски: плашек на общих лентах станет больше, поэтому при большом каталоге стоит дополнительно проверить, что компактные icon-бейджи не перегружают карточку.
Следующие шаги: при появлении отдельного доменного флага для промокодов/партнёрских отчислений заменить UI-условие на явный backend-контракт, если `affiliate_percent_bps` перестанет быть достаточным.
Связанные TASK-ID: `UX-TASK-018`, `FF-0307`, `UX-TASK-010`.

## Handoff-запись 2026-05-15: план v0.3.5 Universal Profile + Studio Skins

Дата: 2026-05-15
Агент: Codex
Задача: дополнить план разработки так, чтобы к версии `v0.3.5` были запланированы универсальные скины, профиль пользователя, пользовательские подборки, live-only витрина автора и расширенные Studio widgets.
Изменённые файлы: `ROADMAP.md`, `docs/roadmap/*`, `docs/tasks/*`, `docs/TASKS.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/I18N.md`, `docs/SECURITY.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`, `docs/UI_RULES.md`, `docs/UX_RULES.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: добавлен milestone `v0.3.5 Universal Profile + Studio Skins`; созданы задачи `FF-0351`-`FF-0356`; профиль пользователя отделён в плане от настроек автора/продавца; добавлены user-owned избранное, отзывы и подборки; Studio store переведён в `v0.3.5` с live-only visibility rules; Studio widgets расширены trigger rules и widget groups; скины ограничены semantic tokens и schema-validated presets; API/domain/security/ADR/UI specs синхронизированы.
Проверки: выполнены документационные grep/diff проверки по `v0.3.5`, `PAGE-CREATOR-STORE`, `PAGE-STUDIO-STORE`, `PAGE-STUDIO-WIDGET-GROUPS`, `PAGE-ME-FAVORITES`, `FF-035*`; кодовые тесты не запускались, потому что задача меняла только плановую документацию.
Что не проверено: markdown rendering таблиц в отдельном preview, автоматический link checker и production UI.
Риски: в рабочем дереве уже были несвязанные изменения в `apps/web/*` и `packages/i18n/*`; они не относятся к этой плановой задаче и не откатывались. Реализация `v0.3.5` потребует отдельной проверки активных заказов перед pause/archive seller mode и аккуратной visual QA матрицы для скинов.
Следующие шаги: начать с `FF-0351` и `FF-0352`, затем `FF-0353`; `FF-0354`-`FF-0356` выполнять после стабилизации профиля и file upload flow для avatar/banner/widget assets.
Связанные TASK-ID: `FF-0351`, `FF-0352`, `FF-0353`, `FF-0354`, `FF-0355`, `FF-0356`, `UX-TASK-007`.

## Handoff-запись 2026-05-15: расширение Studio v0.3.5

Дата: 2026-05-15
Агент: Codex
Задача: расширить план `v0.3.5`, чтобы Studio получила вкладки статистики, последних событий, настройки донатов, витрины, виджетов, продуктов и подборок.
Изменённые файлы: `docs/roadmap/v0.3.5-universal-profile-studio.md`, `docs/tasks/v0.3.5/*`, `docs/TASKS.md`, `docs/tasks/active-focus.md`, `docs/API_PLAN.md`, `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/I18N.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_RULES.md`, `docs/UX_RULES.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_MAP.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/DO_NOT_BUILD_YET.md`, `docs/roadmap/current-focus.md`, `docs/roadmap/v0.4-creator-store-partners.md`, `docs/tasks/ui-ux/UX-TASK-007.md`, `docs/tasks/v0.4/FF-0401.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: добавлены задачи `FF-0357`-`FF-0361`; Studio описана как отдельный shell с вкладками; добавлены specs/routes для `/studio/statistics`, `/studio/events`, `/studio/donation-settings`, `/studio/products`, `/studio/collections`; домен и API расширены сущностями `CreatorMetricSnapshot`, `CreatorActivityEvent`, `CreatorChannelIntegration`, `CreatorDonationSettings`, `WidgetPreset`; зафиксирован ADR-0018 для provider-agnostic Studio activity layer; платежные документы уточняют, что график дохода не является балансом или payout UI.
Проверки: `rg`-сверка новых TASK-ID, PAGE-ID и domain entities; `git diff --check` после удаления trailing whitespace проходит успешно, остаются только стандартные Windows CRLF warnings.
Что не проверено: кодовые тесты, browser smoke и markdown preview не запускались, потому что задача меняла только плановую документацию.
Риски: bot-интеграции YouTube/Twitch/Telegram потребуют platform/security review, безопасного хранения секретов, rate limits и retry/dead-letter strategy перед production; формулировки "доход" в Studio нужно не смешивать с балансом и выплатами; в рабочем дереве остаются несвязанные изменения в `apps/web/*` и `packages/i18n/*`.
Следующие шаги: выполнять `FF-0357` перед глубокими Studio pages, затем `FF-0358` и `FF-0359`; `FF-0360` и `FF-0361` связывать с реализацией `FF-0354`-`FF-0356`.
Связанные TASK-ID: `FF-0357`, `FF-0358`, `FF-0359`, `FF-0360`, `FF-0361`, `UX-TASK-007`.

## Handoff-запись 2026-05-16: Aurora Refresh как начало v0.3.5

Дата: 2026-05-16
Агент: Codex
Задача: проанализировать внешнюю дизайн-критику, обновить дизайн-систему и сделать первые задачи `v0.3.5` про обновление текущего дизайна сайта.
Изменённые файлы: `ROADMAP.md`, `docs/roadmap/*`, `docs/tasks/*`, `docs/TASKS.md`, `docs/DESIGN_SYSTEM.md`, `docs/THEMING.md`, `docs/UI_RULES.md`, `docs/UX_RULES.md`, `docs/DO_NOT_BUILD_YET.md`, `docs/DESIGN_AUDIT.md`, `docs/DECISIONS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/USER_FLOWS.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: зафиксировано направление FanFuel Aurora как internal design direction; принято уходить от orange/black primary-визуала к violet/cyan, emerald support и редкому warm-акценту; glass ограничен allowlisted слоями; добавлены задачи `FF-0348`-`FF-0350`, которые ставятся перед `FF-0351+`; обновлены rules/specs/tracker/ADR/changelog.
Проверки: `rg`-сверка `FF-0348`/`FF-0349`/`FF-0350`, `FanFuel Aurora` и `Aurora Refresh`; `git diff --check` проходит успешно, остаются только стандартные Windows CRLF warnings. Кодовые тесты не запускались, потому что production-код не менялся.
Что не проверено: markdown preview, link checker и browser visual QA; они нужны при реализации `FF-0349`/`FF-0350`.
Риски: в рабочем дереве остаются несвязанные изменения в `apps/web/*` и `packages/i18n/*`; они не относятся к этой плановой документационной задаче и не откатывались. При реализации Aurora важно не уйти в glass-везде и не сломать контраст.
Следующие шаги: выполнить `FF-0348`, затем `FF-0349` и `FF-0350`; только после этого переходить к `FF-0351` и profile/studio задачам.
Связанные TASK-ID: `FF-0348`, `FF-0349`, `FF-0350`, `FF-0351`, `UX-TASK-010`.

## Handoff-запись 2026-05-16: кодовый pass Aurora v0.3.5

Дата: 2026-05-16
Агент: Codex
Задача: сделать первый кодовый апдейт `v0.3.5` после планирования Aurora Refresh, не создавая новые future routes.
Изменённые файлы: `packages/ui/src/styles.css`, `apps/web/src/app/globals.css`, `apps/web/src/app/marketplace/page.tsx`, `apps/admin/src/styles.css`, `apps/widget/src/styles.css`, `docs/CHANGELOG.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/tasks/v0.3.5/FF-0349.md`, `docs/tasks/v0.3.5/FF-0350.md`, `docs/HANDOFF.md`.
Что сделано: shared light/dark tokens переведены на Aurora palette с violet/cyan primary, emerald support и отдельным warm-акцентом; добавлены glass/material tokens и gradient roles; web topbar, marketplace hero, product media, badges, admin shell и OBS widget alert обновлены через semantic tokens; исправлены fallback query-строки marketplace с повреждённой кодировкой; `FF-0349` и `FF-0350` помечены как `partial`.
Проверки: `npx prettier --write packages/ui/src/styles.css apps/web/src/app/globals.css apps/web/src/app/marketplace/page.tsx apps/admin/src/styles.css apps/widget/src/styles.css`; `npm run typecheck`; `npm run lint`; `git diff --check`; `npm run build` собрал admin/widget, но первый web build упал по памяти из-за параллельного dev-сервера; после остановки dev-сервера `NODE_OPTIONS=--max-old-space-size=4096 npm run build -w @fanfuel/web` прошёл успешно; web dev-сервер снова поднят и `GET http://127.0.0.1:3000/marketplace` вернул 200.
Что не проверено: полноценный browser/screenshot QA `ru/en`, light/dark и 320/390/768/1440 не выполнялся; визуальную оценку Aurora на реальном браузере нужно сделать отдельным проходом.
Риски: glass layer теперь применяется к allowlisted topbar/dropdown/hero/widget поверхностям, но контраст и читаемость на редких viewport ещё требуют визуального QA; dev-сервер на `3000` может занимать память при production build, поэтому перед повторным `next build` его лучше остановить.
Следующие шаги: пройти screenshot QA по `FF-0350`, проверить product/media placeholders на реальных данных и только после этого переходить к `FF-0351+` профилю/Studio.
Связанные TASK-ID: `FF-0349`, `FF-0350`, `UX-TASK-010`.

## Handoff-запись 2026-05-18: creator-commerce главная v0.3.5

Дата: 2026-05-18
Агент: Codex
Задача: переработать главную `/` и `/marketplace` в рамках `v0.3.5`, чтобы страница считывалась не как обычный маркетплейс, а как creator-commerce модель с товарами, авторами, витринами, промокодами, донатами и SafeDeal.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/components/app-chrome.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: hero переписан под FanFuel и creator-commerce смысл; добавлен live mockup покупки через автора; блок "Хит продаж" заменён на "Хит в витринах авторов"; блок ценности перестроен на покупателя, автора и продавца; добавлены категории, поиск с подсказками, популярные товары, подборки авторов, поиск автора, CTA для стримеров и продавцов, SafeDeal-секция, FAQ и footer; карточки товаров получили псевдо-превью, авторский контекст и доверительные бейджи; header получил desktop-навигацию и mobile fullscreen search.
Проверки: `npx prettier --write apps/web/src/app/globals.css apps/web/src/app/marketplace/page.tsx apps/web/src/components/app-chrome.tsx packages/i18n/locales/ru/common.json packages/i18n/locales/en/common.json docs/HANDOFF.md docs/CHANGELOG.md`; `npm run typecheck -w @fanfuel/web`; `npm run lint`; `git diff --check` прошёл с ожидаемыми Windows CRLF warnings. Для visual QA использован уже запущенный локальный Next dev-сервер на `http://localhost:3000`, потому что порт `3000` был занят до проверки, а второй сервер Next для того же проекта не стартует параллельно; браузерный sanity-проход выполнен для desktop `1280x720` и mobile `390x844` с раскрытием mobile search.
Что не проверено: полноценная матрица `ru/en`, light/dark, 320/390/768/1024/1440 и полный backend smoke не выполнялись; браузерная проверка была sanity-проходом по текущему локальному dev-серверу.
Риски: часть сигналов "в витринах авторов", подборки авторов и creator-commerce объяснения в карточках сейчас UI-уровня, потому что отдельного backend-контракта для авторских витрин/поиска авторов ещё нет; true cross-entity search по товарам, авторам, продавцам, играм и тегам требует API/domain работы в `FF-0351+`/`FF-0401+`. SafeDeal-тексты оставлены без обещаний production-провайдера и требуют provider/legal review перед реальными платежами.
Следующие шаги: выполнить screenshot QA по `FF-0350`, затем расширить backend-контракты авторских витрин, промокодов и поиска, чтобы заменить UI-демо-сигналы реальными данными.
Связанные TASK-ID: `FF-0349`, `FF-0350`, `FF-0351`, `FF-0401`, `UX-TASK-010`.

## Handoff-запись 2026-05-19: полировка компактной `/marketplace` витрины

Дата: 2026-05-19
Агент: Codex
Задача: отполировать уже компактную `/marketplace` витрину `v0.3.5`: уменьшить hero, убрать повтор "Что можно найти на FanFuel", усилить товарные cover previews, сократить авторские подборки и сохранить страницу как marketplace, а не полный лендинг платформы.
Изменённые файлы: `apps/web/src/app/marketplace/page.tsx`, `apps/web/src/app/globals.css`, `packages/i18n/locales/ru/common.json`, `packages/i18n/locales/en/common.json`, `docs/TASKS.md`, `docs/tasks/ui-ux/UX-TASK-020.md`, `docs/UX_IMPLEMENTATION_STATUS.md`, `docs/UI_UX_TRACKER.md`, `docs/PAGE_SPECS.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md`.
Что сделано: hero получил более короткий заголовок "Цифровые товары, которые поддерживают авторов", меньшую высоту и обновлённый текст hero-card про зрителя; быстрый поиск переименован в "Найди товар, автора или услугу", категории — в "Быстрые направления"; категории получили разные CSS-иконки; product media получил cover templates для OBS, алертов, дизайна, коучинга, игровых услуг, digital/service товаров; featured и hero preview стали более предметными; текст "Поддерживает автора при покупке" сокращён до "Поддерживает автора" с подсказкой; авторские подборки на главной ограничены двумя рядами по четыре товара и компактной author card; final CTA cards сделаны кликабельными целиком; блок "Одна покупка — польза для всех" получил короткую схему `товар → покупка → поддержка → заказ`; SafeDeal wording оставлен пользовательским без внутренних provider/legal формулировок.
Проверки: `npx prettier --write apps\web\src\app\marketplace\page.tsx apps\web\src\app\globals.css packages\i18n\locales\ru\common.json packages\i18n\locales\en\common.json docs\TASKS.md docs\tasks\ui-ux\UX-TASK-020.md docs\UX_IMPLEMENTATION_STATUS.md docs\UI_UX_TRACKER.md docs\PAGE_SPECS.md docs\CHANGELOG.md docs\HANDOFF.md`; JSON parse для ru/en i18n — успешно; `npm run typecheck -w @fanfuel/web` — успешно; `npm run lint` — успешно; `git diff --check` — успешно, только стандартные Windows CRLF warnings; Browser smoke на `http://localhost:3000/marketplace` для desktop `1280x720` и mobile `390x844`: нет дубля "Что можно найти на FanFuel", author collections = 2, product media = 16, horizontal overflow = 0, внутренних SafeDeal/provider/legal формулировок в публичном тексте нет.
Что не проверено: полноценная матрица `ru/en`, light/dark, 320/390/768/1024/1440 пока не проходилась; cover templates остаются CSS-псевдопревью до появления реальных product media.
Риски: часть creator-commerce сигналов всё ещё UI-демо, потому что отдельного backend-контракта для витрин авторов, промокодов и cross-entity search пока нет; route `/safe-deal` отдельно не создавался в рамках этой задачи.
Следующие шаги: пройти расширенный screenshot QA, затем проектировать реальные контракты авторских витрин/промокодов и вынести product media contract в общий компонент для marketplace/store/seller.
Связанные TASK-ID: `UX-TASK-020`, `UX-TASK-019`, `FF-0350`, `UX-TASK-010`.

## Шаблон handoff-записи

```txt
Дата:
Агент:
Задача:
Изменённые файлы:
Что сделано:
Проверки:
Что не проверено:
Риски:
Следующие шаги:
Связанные TASK-ID:
```

## Handoff 2026-09-14: проверка запуска VM и домена

- Запрос: запустить VM на диске D:, проект FanFuel и настроить nginx для `fanfuel.ru`.
- Проверено: список VirtualBox VM, состояние VM, поиск файлов `.vbox` на D:, конфигурация сетевых адаптеров и пробросов портов, локальные инструкции запуска и DNS домена.
- На D: обнаружена только `librechat-ubuntu-server`; на момент проверки она уже запущена. Отдельная VM FanFuel не обнаружена. Прежняя запись Development VM в локальном `docs/SERVER_ACCESS.md` не соответствует зарегистрированным VM.
- SSH-подключение не выполнено: Windows запрещает доступ к существующему SSH known_hosts; чтение ACL приватного ключа также возвращает отказ в доступе. Ограничения не изменялись.
- Проект и nginx не запускались и не изменялись. Доступность приложения, конфигурация nginx и HTTP smoke не проверены из-за отсутствия доступа к целевой VM.
- Изменён только `docs/HANDOFF.md`; существующие изменения проекта сохранены.
- Следующий шаг: уточнить целевую VM и получить доступный SSH-доступ; затем проверить существующие сервисы, развернуть проект и настроить домен. DNS-запись существует, но соответствие целевой VM ещё не установлено.
- TASK-ID: отдельная задача не заведена; выполнение исходного DevOps-запроса остаётся незавершённым.

### Итерация иконок — UX-TASK-030, 2026-09-14

- Изменён `apps/web/src/components/home-audience.tsx`: перерисованы геймпад, алерт и книга с видеозвонком; у комьюнити переднее сообщение перекрывает точки заднего. Общий компонент обновляет иллюстрации во всех режимах.
- Проверены TypeScript web и ESLint компонента — успешно. Иллюстрации просмотрены в браузере в составе категорий и крупных блоков. Unit tests для изменения SVG не добавлялись.
- Обновлена `docs/DESIGN_SYSTEM.md`. API и данные не менялись, новых ограничений нет. Изменения локальные.

### Дополнение к иконкам — UX-TASK-030, 2026-09-14

В `apps/web/src/components/home-audience.tsx` к стрим-алерту добавлена декоративная монета через существующие warm tokens. Корпус геймпада сужен, кнопки и стики сближены без деформации кругов; силуэт центрирован по высоте. TypeScript web и ESLint компонента прошли, результат проверен в браузере. Изменения локальные, платёжная логика и тексты не менялись.

### Выравнивание сердечка — UX-TASK-030, 2026-09-14

В `apps/web/src/components/home-audience.tsx` сердечко алерта опущено на 4 SVG-единицы для центрирования внутри сообщения. Остальные элементы сохранены. ESLint компонента прошёл; отдельные тесты для корректировки SVG не добавлялись.

### Стабильное положение поиска — UX-TASK-030, 2026-09-14

В `apps/web/src/app/globals.css` для `html` добавлен `scrollbar-gutter: stable`. На главной вертикальная полоса прокрутки занимала 15 px, а в коротком каталоге исчезала, смещая центр поиска на 7,5 px. Теперь место под полосу сохраняется. В браузере при ширине 1280 px проверены `/` и `/marketplace/catalog`: координаты и размеры поиска совпадают (x=404,796875; width=455,390625). Проверка whitespace diff прошла. Отдельные тесты для CSS не добавлялись; другие браузерные движки не проверялись. Изменение локальное, дальнейших действий по этой корректировке нет.

## UX-TASK-031 — анкета автора до регистрации, 2026-09-14

Сделано: из хедера удалены CTA создания страницы и отдельная регистрация в меню; вход виден на мобильном. CTA обоих блоков «Я автор» ведут на /create. Пошаговая анкета (название, описание, сохранение) имеет живой предпросмотр, sessionStorage текущей вкладки, восстановление данных и явные ошибки. Вкладки входа/регистрации сохраняют flow=creator, имя регистрации подставляется из анкеты; возврат только на фиксированный /create?step=finish. После входа отдельная кнопка сохраняет серверный draft; существующая страница не перезаписывается.

Backend: POST /api/v1/studio/onboarding создаёт профиль и роль streamer транзакционно, проверяет активный аккаунт, сериализует повторы блокировкой пользователя и пишет audit. Непубличные creator profiles исключены из публичной выдачи и адресатов доната.

Файлы: apps/web/src/app/create/page.tsx; auth/login и auth/register; components/app-chrome.tsx и home-audience.tsx; lib/creator-draft.ts и api.ts; globals.css; ru/en common.json; services/api/internal/app/creator_onboarding.go, creator_onboarding_test.go, app.go, store.go, donation_store.go; связанные specs/tracker/tasks/flows/API/ADR/domain/payments/audit/changelog.

Проверки: web TypeScript, ESLint изменённых TS/TSX, production Next build, gofmt и go test ./... прошли. Добавлены проверки границ Unicode/пустого названия/описания и отказа endpoint без авторизации. В браузере: 1280/390/320 px, light/dark, ввод/предпросмотр, переход в регистрацию с подстановкой имени, вкладка входа с сохранением контекста, восстановление обоих полей. Тестовые поля очищены через UI, светлая тема и исходный viewport восстановлены.

Ограничения: локальный API/PostgreSQL недоступен, полный цикл регистрации и INSERT с реальной БД не проверен, DB concurrency/retry не проверены интеграционно. Отдельных frontend unit-test scripts нет. Go runtime скачан с проверкой SHA256 в игнорируемый node_modules/.cache/fanfuel-build-tools.

Следующий шаг: при доступном backend выполнить интеграционный smoke новой регистрации, существующего покупателя, повторного сохранения, приватности draft и публикации. Изменения локальные, не развёрнуты.

### UX-TASK-031 — необязательные шаги, 2026-09-14

Добавлены «Пропустить» у описания, шаг оформления с необязательными аватаром/баннером и шаг спонсорских товаров. В предпросмотре отображаются локальные картинки и выбранные товары. JPG/PNG/WebP до 5 МБ, ограничения размеров изображения; SVG исключён. Изображения — Blob в IndexedDB с идентификатором черновика из sessionStorage, без HTTP-загрузки. Object URLs освобождаются. Название/описание/выбор товаров восстанавливаются после auth-переходов. Подборка максимум 12 позиций, только published товары с affiliate_percent_bps > 0 из текущей выдачи каталога.

Файлы: create/page.tsx, components/creator-onboarding-extras.tsx, lib/creator-draft.ts, lib/creator-draft-media.ts, lib/use-creator-draft-media.ts, globals.css, ru/en common.json и связанные UX-документы. Backend не менялся в этой итерации.

Проверки: TypeScript, ESLint изменённых файлов и production Next build прошли. Локальные Node-тесты с fake-indexeddb: запись/чтение/удаление Blob, разделение аватара/баннера и разных идентификаторов вкладок, отказ SVG/файлам свыше лимита — прошли. Тестовые файлы/зависимость в игнорируемом node_modules/.cache/fanfuel-build-tools/storage-tests. Browser QA 1280 и 390 px: все пропуски, варианты полей, фильтрация партнёрских товаров на временном GET-only API fixture, выбор, предпросмотр, возврат после auth, удаление, ошибка реального API без блокировки продолжения. Fixture остановлен; тестовый товар удалён из черновика через UI.

Не проверено: системный выбор файла и визуальный результат с пользовательским изображением; инструмент браузера не предоставляет загрузку локального файла. Форматы проверяются также декодированием createImageBitmap в приложении.

Ограничения: публичная витрина и signed upload ещё не подключены. Новые картинки и подборка пока остаются только локально даже после регистрации; они не удаляются при серверном сохранении основных полей, об этом сообщает экран успеха. Полного переноса оформления в аккаунт нет. Следующий шаг — authenticated signed upload и серверное сохранение/публикация StoreItem по отдельной задаче; не выдавать текущий локальный выбор за опубликованную витрину.

### UX-TASK-031 — кнопка с эффектом печати, 2026-09-14

В create/page.tsx объединены продолжение/пропуск. Добавлен components/typing-action-label.tsx: последовательное стирание и печать, отмена таймеров при смене надписи и unmount, обработка reduced motion. globals.css резервирует постоянную ширину и показывает курсор только во время эффекта. Новых текстов нет: используются существующие i18n next/skip. TypeScript и ESLint изменённых компонентов прошли; browser QA подтвердил пустой шаг оформления, заполненное/пустое описание и одинаковую ширину кнопки 165,96875 px. Исходное описание восстановлено. Полная сборка повторно не запускалась для этой локальной правки; загрузка файлов и сервер не менялись.

### UX-TASK-031 — выравнивание и кликабельные шаги, 2026-09-14

Изменены create/page.tsx и globals.css: равные колонки, центрированные подписи/номера, кнопки шагов с aria-current и focus-visible. Состояние анкеты остаётся в родительском компоненте, медиа-хук не размонтируется. TypeScript и ESLint прошли. В браузере проверены переходы О вас → Сохранение → Название → О вас: описание сохранено; центры подписей совпадают с центрами кнопок (погрешность менее 0,01 px). Существующие ограничения серверного переноса локального оформления не менялись.

### UX-TASK-031 — мобильная переработка анкеты, 2026-09-14

Изменены create/page.tsx и globals.css. До 899px: компактная шапка, список выбора любого шага вместо переполняющейся ленты, раскрываемый предпросмотр перед формой, одна колонка до 600px, поля от 16px и основные действия от 48px. Состояние анкеты сохранено в родительском компоненте. На desktop осталась двухколоночная компоновка и прежняя навигация.
Проверки: TypeScript, ESLint, production Next build — успешно. Browser QA: 320/390/768/1280 px без горизонтального переполнения; просмотр поля оформления на 320px, описание в dark на 390px, раскрытие/сворачивание предпросмотра и выбор всех пяти шагов через select, сохранение описания. Desktop 1280px: две колонки и открытый предпросмотр. Светлая тема и исходный viewport восстановлены. Мобильная экранная клавиатура реального iOS/Android не проверялась; использована эмуляция размеров браузера. Серверная логика/локальное хранение картинок не менялись.

### UX-TASK-031 — общий дизайн списков и мобильная строка, 2026-09-14

Добавлен packages/ui/src/select.tsx, re-export через components.tsx, стили в packages/ui/src/styles.css. Все 11 одиночных select в web заменены общим компонентом: регистрация, профиль, цели/донаты, новый товар, оценка заказа. Добавлена зависимость react-dom для portal и её типы; lockfile обновлён. Пункты списка оформлены через semantic tokens; выбор передаётся существующему обработчику через нативный change.
В create/page.tsx удалён мобильный select, возвращены пять кнопок в строку. Короткие ru/en подписи на мобильном, полные accessible names; на 320 px каждая зона 47×70 px, переполнения нет.
Проверки: TypeScript всех workspaces, ESLint изменённых компонентов, production Next build прошли. Browser QA: выбор роли мышью, ArrowDown/Enter, Escape, сохранение значения в native select и React, popup над полем с зазором 6px у нижнего края; светлая/тёмная темы на 390px; строка шагов на 320px. Формы, требующие backend/auth, не проверены сквозным сценарием; их существующие обработчики и payload не менялись. Системный file picker не менялся. Светлая тема, исходный viewport и анкета восстановлены.

### UX-TASK-031: общая кнопка входа, 2026-09-14

В app-chrome.tsx гостевая кнопка и пункт меню переименованы в «Вход / Регистрация» через новый ru/en ключ navAuth. Переход ведёт на существующую страницу входа с регистрацией. В globals.css уменьшены отступы и шрифт кнопки до 359px для сохранения места под поиск и меню. Проверки: TypeScript и ESLint компонента; браузерная геометрия на 320px.

### UX-TASK-031: упрощение мобильного меню, 2026-09-14

Из app-chrome.tsx удалены дублирующая кнопка входа/регистрации с пустеющей секцией аккаунта и пункт «Покупателям» в гостевом меню. Основная кнопка хедера сохранена. Проверки: TypeScript web и ESLint компонента.

## Публикация текущей версии — 2026-09-14

Публикация не выполнена: VM FanFuel запущена, но SSH через настроенный NAT не отвечает (повторные banner timeout), публичный HTTPS не завершает handshake. Журнал VirtualBox содержит длительные задержки heartbeat. Отправлен один штатный ACPI power button для восстановления; VM осталась running. Принудительное отключение/reset не выполнялось, так как внутри находится PostgreSQL. Серверные файлы, контейнеры и БД не менялись.
Текущая локальная версия: ESLint, production Next build и go test ./... прошли. Подготовлен архив 170 исходных файлов в игнорируемом node_modules/.cache/fanfuel-release/source.tar.gz; секреты, .tmp, сборки и node_modules исключены. До отправки архива при новых изменениях пересобрать его. Следующий шаг: восстановить управляемость VM (при необходимости согласовать принудительный перезапуск), проверить статус после ранее отправленного ACPI, затем backup исходников/образов, перенос, build и up через три VM compose файла, smoke публичных страниц/API. Связано с FF-0009/FF-0010 и UX-TASK-031.

## Публикация выполнена — 2026-09-14, FF-0009/FF-0010, UX-TASK-031

После явного разрешения пользователя выполнен reset только VM FanFuel. SSH восстановлен, PostgreSQL/Redis/API/WS/worker healthy. Архив текущих исходников перенесён на существующий сервер, секреты/данные/настройки nginx не перезаписывались, миграции не требовались. Перед заменой сохранены исходники /home/fanfuel/releases/before-20260914.tar.gz и теги образов fanfuel-{web,api,admin,widget}:before-20260914.
При проверке npm выявлены критические advisories Next.js 16.2.6; выполнено обновление web до 16.3.3 и lockfile (sharp 0.35.4). ESLint, локальный production build/TypeScript прошли; Go tests прошли перед публикацией. На VM успешно собраны web/api/widget/admin; заменены только эти контейнеры через три Compose файла с --no-deps --wait. PostgreSQL и остальные контейнеры не пересоздавались.
Публичная проверка после запуска: HTTPS /, /create, /auth/login, /auth/register, /api/v1/products, /widget/ — 200; новая подпись «Вход / Регистрация» и анкета присутствуют. POST /api/v1/studio/onboarding без токена — 401. Во время переключения web кратковременно возвращал 502, после запуска повторные проверки дали 200.
Ограничения: новые аккаунты и записи в публичной БД ради smoke не создавались; полный пользовательский сценарий сохранения не проверен. Linux npm ci сообщает о дополнительных некритических advisories; требуется отдельный разбор остальных зависимостей. Причина задержек VM до перезапуска окончательно не установлена. Следующие задачи: аудит зависимостей и диагностика стабильности VM. Публичный адрес: https://fanfuel.ru.

## Handoff 2026-09-14: локальный роутер провайдеров Codex

Проблема: в чатах FanFuel с моделью `gpt-6-astra` через провайдера AgentRouter Codex падал в первом же ходу с `OpenAI Responses bad request: The requested item was created under a different *** OpenAI resource`, позже — с `402 Budget pool quota has been exhausted`. Код продукта не изменялся, это окружение разработки.

Причина: Codex прикладывает к запросу ссылки на серверное состояние провайдера — `id` элементов `input`, `reasoning` с `encrypted_content`, `item_reference`. AgentRouter отдаёт `gpt-*` через пул upstream-аккаунтов, поэтому следующий запрос того же хода попадает в другой аккаунт, который не знает чужие идентификаторы. Модели `glm-5.3` и `deepseek-v4-flash` идут через отдельные каналы и этой ошибки не давали.

Что сделано (вне репозитория, в `C:\Users\remot\.codex`):

- создан локальный роутер `.codex\router` (`router.py`, `providers.json`, `start-router.ps1`, `README.md`): одна точка входа для Codex, несколько upstream-провайдеров, каждый запрос переписывается в stateless (снимаются `previous_response_id`, `id` элементов, `reasoning`, `item_reference`, ставится `store: false`), подставляются заголовки клиента Codex, есть резервные провайдеры и журнал `logs\router.jsonl`;
- в `config.toml` у `[model_providers.agentrouter]` изменён `base_url` на `http://127.0.0.1:8799/v1`, добавлена секция `[model_providers.router]`; резервная копия — `config.toml.before-router-20260914`;
- задача планировщика Windows `CodexProviderRouter` поднимает роутер при входе в систему.

Проверки: `codex exec` через роутер на `glm-5.3` выполнил ход с вызовом инструмента (журнал показал два запроса со снятыми `id`); `healthz?probe=1` — `glm-5.3` и `deepseek-v4-flash` отвечают 200; `gpt-6-astra` и `gpt-5.6-sol` — 402 (лимит пула на стороне AgentRouter), `claude-opus-*` — 503 «нет доступного канала».

Ограничения: файлы репозитория не изменялись, тесты продукта не запускались, так как менялось только окружение Codex; для `gpt-*` нужен пополненный пул AgentRouter либо официальный провайдер (`model_provider = "openai"`); приложение читает адрес провайдера при старте, поэтому нужен один перезапуск Codex; если роутер не запущен, Codex не подключится к провайдеру.

## Публикация UX-TASK-032 — 2026-09-15

Сделано: текущее рабочее дерево опубликовано на `https://fanfuel.ru`. Регистрация и вход используют новую схему: только email и пароль, без выбора роли и имени платформы; имя задаётся отдельным шагом `/auth/name`. Применена миграция `000006_profile_name_setup`, существующие профили помечены завершёнными. Сервисы собраны и перезапущены через три VM Compose-файла, проект переключён на новую директорию `/home/fanfuel/FanFuel`, прежняя версия сохранена в `/home/fanfuel/FanFuel.backup-20260915055409`.

Файлы: `apps/web/src/app/auth/register/page.tsx`, `apps/web/src/app/auth/login/page.tsx`, `apps/web/src/app/auth/name/page.tsx`, `services/api/internal/app/*`, `infra/migrations/000006_profile_name_setup.*`, `docker-compose.vm.yml`, `infra/docker/frontend.vm.Dockerfile`, связанные документация и i18n-словари.

Проверки: production build всех образов на VM, `docker compose config --quiet`, `docker compose ps`, локальные `/healthz` API/WS/worker, публичные `/auth/register`, `/auth/login`, `/auth/name` и главная — 200. Форма регистрации проверена на отсутствие `role_intent` и имени платформы, страница имени доступна. Миграция `000006_profile_name_setup` применена успешно.

Ограничения: полный сценарий регистрации с реальным пользователем и email-подтверждением не проверялся, так как email ещё не подключён. Причина зависания SSH до жёсткого перезапуска VM не установлена; после перезапуска соединение и сервисы стабильны.

Следующие шаги: подключить email-подтверждение, добавить интеграционный smoke новой регистрации и продолжить аудит зависимостей.
