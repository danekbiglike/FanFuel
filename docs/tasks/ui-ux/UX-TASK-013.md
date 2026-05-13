# UX-TASK-013: Доуплотнить authenticated topbar и меню аккаунта

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: CMP-TOPBAR, PAGE-ME-PROFILE, PAGE-ME-SETTINGS, PAGE-STUDIO-DASHBOARD

### Цель

Исправить mobile layout залогиненного topbar и сделать account menu структурным, без вложенных dropdown-сломов и без переходов на неготовые страницы.

### Что сделано

- Authenticated topbar на mobile оставлен в одну строку: логотип, поиск, уведомления, меню пользователя.
- Account menu разделено на категории: аккаунт, маркетплейс, поддержка, FanFuel Studio, настройки.
- Подпункты меню получили небольшой отступ слева.
- Theme control внутри меню работает как компактный dropdown поверх меню, без `OS/LT/DK`-сегмента и без растягивания списка.
- Language control внутри меню работает как dropdown с вариантами "Русский" и "English"; выбор сохраняется в locale preferences.
- `/me/settings` добавлен в план как отдельная страница "скоро".
- `/studio` явно оставлен planned/"скоро" до реализации полноценной Studio.

### Что не делалось

- Не создавались пустые routes `/me/settings` и `/studio`.
- Не включались notifications, messages, finance или payout flows.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- На мобильной ширине topbar не переносит элементы на вторую строку.
- Theme и language dropdown открываются поверх account menu и не ломают mobile layout.
- Profile, settings и Studio разделены в IA/docs.
- Все новые строки добавлены в i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_MAP.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Следующий настоящий шаг — реализация `UX-TASK-007` с отдельными страницами и route guards.
