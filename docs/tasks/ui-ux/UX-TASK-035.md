# UX-TASK-035 — подтверждение почты и единая авторизация

Версия: v0.3.5. Статус: COMPLETED. Приоритет: P0.
Страницы: PAGE-AUTH, PAGE-AUTH-NAME.
Маршруты: `/auth`, `/auth/name`; `/auth/login` и `/auth/register` остаются совместимыми redirect-маршрутами.

## Объём

Заменить отдельные формы входа и регистрации единым identifier-first сценарием для email. На первом шаге пользователь вводит email, backend определяет следующий шаг: пароль для существующего аккаунта или подтверждение почты для нового. Новый аккаунт создаётся только после успешного одноразового кода и задания пароля. Имя платформы остаётся отдельным шагом `/auth/name`.

Телефон и username в этой итерации не поддерживаются: поле и API принимают только email. Их добавление требует отдельных уникальных идентификаторов, нормализации, verification/recovery flow и security review.

## Backend

- Добавить `POST /api/v1/auth/identify` с rate limit по IP и нормализованному email.
- Добавить `POST /api/v1/auth/email-verification/start` и `POST /api/v1/auth/email-verification/verify`.
- Изменить регистрацию: `POST /api/v1/auth/register` принимает одноразовый registration token и пароль, а не неподтверждённый email.
- Коды: криптографически случайные, срок 10 минут, не более 5 проверок, повторная отправка не чаще раза в 60 секунд, хранение только HMAC digest, предыдущий активный challenge инвалидируется.
- Registration token: подписанный, короткоживущий, привязан к email и challenge, одноразовый на уровне БД.
- Реальную отправку выполнять через provider abstraction; SMTP-конфигурация только из environment. В dev использовать Mailpit.
- Существующие до миграции аккаунты считать grandfathered verified, чтобы rollout не блокировал вход уже созданных пользователей.

## UX

1. Email → «Продолжить».
2. Существующий аккаунт → пароль → вход.
3. Новый email → отправка кода → код → новый пароль → создание аккаунта.
4. После регистрации → `/auth/name`; после входа → прежний destination.

Email сохраняется только в памяти auth layout. Пароль и код не записываются в URL/storage. Пользователь может вернуться к email с любого шага. Все состояния имеют явные loading/error/retry, видимые labels, корректные `autocomplete`, ru/en, light/dark и mobile.

## Осознанный компромисс

`identify` возвращает разные следующие шаги и поэтому позволяет определить наличие аккаунта. Это изменение решения ADR-0023, принятое по прямому запросу пользователя. Риск ограничивается rate limit, одинаковым HTTP status и минимальным ответом без user data; полное устранение enumeration потребовало бы подтверждать email до выбора режима или перевести вход на OTP/passkey.

## Критерии приёмки

- Нельзя создать аккаунт без подтверждённого одноразового кода.
- Код нельзя использовать повторно, после expiry или после исчерпания попыток.
- Registration token нельзя использовать для другого email или повторного создания аккаунта.
- SMTP secret/code/password не логируются и не попадают в аналитику.
- Старые auth URL не ломают внешние ссылки и сохраняют `flow=creator`.
- API, domain model, security, ADR, i18n, changelog и handoff обновлены.
- Проходят Go tests, frontend typecheck/lint/build и migration smoke test, если PostgreSQL/Docker доступны.

## Результат

Реализованы единая страница `/auth`, email verification challenges, SMTP adapter, одноразовый registration token, обязательная проверка email до создания аккаунта и совместимые redirects со старых routes. Добавлены ru/en тексты, optional Mailpit compose и документация API/domain/security/ADR.

Проверки: Go tests и vet, frontend typecheck/lint/build, browser QA на desktop/mobile и light/dark — успешно. Migration smoke test не выполнен: в локальной среде нет Docker/PostgreSQL; миграция требует проверки при следующем запуске dev stack.
