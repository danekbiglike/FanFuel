# UX-TASK-016: Сделать topbar search единым control и починить mobile auth API

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: CMP-TOPBAR, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER, FLOW-BUYER-SEARCH

### Цель

Выровнять topbar search по высоте с соседними кнопками и сделать search submit встроенным правым сегментом поля. Убрать mobile dev hydration overlay на auth pages и исключить ситуацию, когда телефон пытается отправить API-запросы на свой `localhost:8080`.

### Что сделано

- Topbar search получил фиксированную высоту, совпадающую с topbar buttons: 40px на desktop и 38px на mobile.
- Кнопка поиска встроена в поле правым сегментом с border divider и без отдельной inset-плашки.
- На login/register forms и controls добавлен `suppressHydrationWarning` для внешних injected attributes.
- Добавлен web route proxy `/api/v1/*`, который серверно прокидывает запросы к Go API через `FANFUEL_INTERNAL_API_BASE_URL`/`API_BASE_URL`/fallback `localhost:8080`.
- Browser API client использует same-origin `/api/v1/*`, если public API base указывает на localhost.

### Acceptance criteria

- Поле поиска и соседние кнопки topbar одинаковой высоты на mobile и desktop.
- Search submit выглядит как часть поля, а не отдельная кнопка внутри.
- Auth pages не показывают blocking hydration overlay из-за injected attributes.
- На телефоне через внешний dev-домен web может логиниться без прямого доступа телефона к `localhost:8080`, если API доступен Next.js dev-серверу.
