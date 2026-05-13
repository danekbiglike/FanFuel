# UX-TASK-011: Сделать marketplace главной точкой входа и поправить auth navigation

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, PAGE-FOR-BUYERS, PAGE-FOR-STREAMERS, PAGE-FOR-SELLERS, PAGE-AUTH-LOGIN, PAGE-AUTH-REGISTER, CMP-TOPBAR

### Цель

Убрать generic landing с `/`, сделать marketplace главным входом, добавить три ролевых лендинга и исправить навигацию после авторизации.

### Что сделано

- `/` рендерит ту же marketplace-витрину, что и `/marketplace`, без redirect.
- Marketplace получил buyer-facing benefits block перед каталогом.
- Добавлены `/for-buyers`, `/for-streamers`, `/for-sellers`.
- Topbar показывает вход/регистрацию только гостю и профиль только авторизованному пользователю.
- `/auth/login` и `/auth/register` перенаправляют уже авторизованного пользователя на marketplace.
- Auth layout сделан компактнее.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не добавлялись payouts, disputes, real payment UI, creator store и risky categories.
- Не менялись backend endpoints и доменная модель.

### Acceptance criteria

- При открытии `/` пользователь сразу видит marketplace-витрину без смены URL.
- После входа верхняя панель не показывает кнопки входа и регистрации.
- Гость не видит кнопку профиля.
- Страница входа визуально компактная, не съезжает вниз и не растягивает форму.
- Ролевые лендинги используют semantic tokens и i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Нужен отдельный screenshot QA pass по `UX-TASK-010`, потому что Playwright/mobile проверка в рамках задачи не выполнялась.
