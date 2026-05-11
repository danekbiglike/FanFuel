# Information Architecture

Документ описывает навигацию FanFuel, структуру меню и переключение между ролями. Один пользователь может одновременно быть покупателем, стримером, продавцом и админом; интерфейс должен поддерживать это без создания нескольких аккаунтов.

## Принципы IA

- Роль — это рабочий контекст, а не отдельный аккаунт.
- Глобальная навигация не должна показывать пользователю все будущие разделы сразу.
- Главный entry для authenticated user — role-aware switcher.
- Кабинеты используют одинаковую структуру: topbar, sidebar, content, contextual actions.
- Публичные страницы не должны зависеть от авторизации, кроме персонализированных действий.

## Верхний уровень

| Зона | Назначение | Пример routes | Статус |
|---|---|---|---|
| Public | Объяснение продукта, marketplace, creator pages | `/`, `/marketplace`, `/creators/[slug]` | PARTIAL/PLANNED |
| Auth | Вход, регистрация, onboarding | `/auth/login`, `/auth/register`, `/onboarding` | PARTIAL/PLANNED |
| Buyer | Покупки и заказы | `/buyer`, `/buyer/orders/[id]` | PLANNED |
| Studio | Кабинет стримера | `/studio`, `/studio/widgets` | PLANNED/PARTIAL |
| Seller | Кабинет продавца | `/seller`, `/seller/products` | PLANNED |
| Admin | Операционная панель | `/admin`, `/admin/users` | PARTIAL/PLANNED |
| Widget | OBS/browser source | `apps/widget /?token=` | PARTIAL |

## Public Navigation

Desktop topbar:

- Brand: `/`.
- Marketplace: `/marketplace` после v0.3.
- Для стримеров: `/for-streamers` после v0.3.
- Для продавцов: `/for-sellers` после v0.3.
- FAQ: `/faq` после v1.0.
- Login/Register или User menu.
- ThemeSwitcher.

Mobile topbar:

- Brand.
- Compact menu button.
- ThemeSwitcher compact.
- Primary action: register или открыть активный кабинет.

Правила:

- Не показывать future pages в навигации, пока их status `FUTURE` или `DO_NOT_BUILD_YET`.
- Если marketplace не реализован, главная может объяснять его как planned, но ссылка не должна вести на пустую страницу.

## Auth Navigation

Routes:

- `/auth/login`.
- `/auth/register`.
- `/auth/reset-password` после backend.
- `/auth/verify` после verification backend.
- `/auth/role` после role management.
- `/onboarding`.

После успешного login/register:

1. Если у пользователя одна роль, отправить в соответствующий кабинет.
2. Если несколько ролей, открыть последний активный role context.
3. Если role context не выбран, показать role switcher/onboarding.
4. Если admin role есть, admin не становится default для обычных public flows.

## Role Switcher

Компонент: `RoleSwitcher` planned.

Где показывать:

- Authenticated topbar.
- Sidebar header в кабинетах.
- `/me/profile` или `/me/settings` как fallback.

Состояния:

- One role: показывать текущую роль без dropdown или простой switcher.
- Multiple roles: dropdown с Buyer, Studio, Seller, Admin.
- Role unavailable: disabled item с объяснением.
- Admin: отделить визуально и требовать явного перехода.

Правила:

- Переключение роли меняет navigation context, но не меняет пользователя.
- Last role context можно хранить в localStorage/cookie, но backend permissions остаются источником истины.
- Нельзя показывать ссылки на роль, которой нет, как доступные actions.

## Buyer Navigation

Sidebar:

- Обзор: `/buyer`.
- Покупки: `/buyer/purchases`.
- Заказы: `/buyer/orders`.
- Избранное: `/buyer/favorites` после v0.4.
- Промокоды: `/buyer/promocodes` после v0.4.
- Настройки: `/buyer/settings`.

Topbar context actions:

- Открыть marketplace.
- Notifications.
- RoleSwitcher.

Mobile:

- Bottom/compact nav: Обзор, Покупки, Marketplace, Настройки.
- Заказы показывать списком summary cards.

## Streamer Studio Navigation

Sidebar:

- Обзор: `/studio`.
- Публичная страница: `/studio/page`.
- Донаты: `/studio/donations`.
- Цели: `/studio/goals`.
- Алерты: `/studio/alerts`.
- OBS widgets: `/studio/widgets`.
- Витрина: `/studio/store` после v0.4.
- Партнёрские товары: `/studio/partners` после v0.4.
- Промокоды: `/studio/promocodes` после v0.4.
- Аналитика: `/studio/analytics` после v0.4.
- Выплаты: `/studio/payouts` после v0.6 и review.
- Настройки: `/studio/settings`.

Primary actions:

- Открыть публичную страницу.
- Создать цель.
- Создать widget.
- Future: добавить товар в витрину.

Mobile:

- Summary-first dashboard.
- Widget token copy должен не ломать ширину.
- Wide tables заменять cards.

## Seller Navigation

Sidebar:

- Обзор: `/seller`.
- Товары: `/seller/products`.
- Заказы: `/seller/orders`.
- Сделки: `/seller/deals` после safe deal.
- Споры: `/seller/disputes` после v0.7.
- Промокоды: `/seller/promocodes` после v0.4.
- Партнёрская программа: `/seller/partners` после v0.4.
- Аналитика: `/seller/analytics` после v0.4.
- Выплаты: `/seller/payouts` после v0.6.
- Настройки: `/seller/settings`.
- Seller Pro: `/seller/verification/pro` после v0.8 legal review.

Primary actions:

- Создать товар.
- Открыть заказы.
- Future: запросить выплату.

Правила:

- Balance/payout links hidden or disabled до v0.6.
- Seller Pro не должен собирать данные до legal review.

## Admin Navigation

Sidebar:

- Обзор: `/admin`.
- Пользователи: `/admin/users`.
- Продавцы: `/admin/sellers`.
- Стримеры: `/admin/streamers`.
- Товары: `/admin/products`.
- Категории: `/admin/categories`.
- Заказы: `/admin/orders`.
- Сделки: `/admin/deals` после v0.5.
- Споры: `/admin/disputes` после v0.7.
- Платежи: `/admin/payments` после v0.5.
- Выплаты: `/admin/payouts` после v0.6.
- Модерация: `/admin/moderation`.
- Антифрод: `/admin/anti-fraud` после v0.8.
- Аудит-лог: `/admin/audit-log` после v0.8.
- Настройки платформы: `/admin/settings` после v1.0.

Admin topbar:

- Environment label.
- Current admin user.
- RoleSwitcher.
- ThemeSwitcher.

Правила:

- Опасные действия требуют confirmation.
- Audit link показывать для действий, которые уже записаны.
- Не показывать raw secrets/provider payloads без masking.

## Widget Navigation

OBS widgets не имеют обычной навигации.

Widget URL:

- `/?token=...&theme=system|light|dark|transparent` для alert.
- Future routes для goal/purchase/feed.

Правила:

- Widget read-only.
- Settings только через Studio.
- Token не логировать и не показывать повторно после создания/rotation.

## Переходы между ролями

Пример multi-role user:

1. Пользователь входит как `buyer+streamer+seller`.
2. Topbar показывает RoleSwitcher.
3. В Buyer context он видит marketplace и purchases.
4. При переключении в Studio меняются sidebar и primary actions.
5. При переключении в Seller показываются products/orders.
6. Admin context показывается только если есть admin role и требует явного выбора.

## Guard states

Unauthorized:

- Показать login CTA.
- Сохранить intended URL, если безопасно.

Forbidden:

- Объяснить, какой роли не хватает.
- Предложить onboarding/add role, если это разрешено.
- Для admin не предлагать публичное получение роли.

Not found:

- Для public pages показать мягкий not found и link home.
- Для private pages не раскрывать существование чужих entities.

## Что нужно обновить в текущей реализации

- `/me/profile` разделить на role dashboards.
- `AppTopBar` сделать role-aware.
- `apps/admin` получить route-like IA: dashboard/users/moderation.
- Widget setup вынести из profile в `/studio/widgets`.
- Loading/error/empty states унифицировать.
