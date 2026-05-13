# UX-TASK-012: Сделать залогиненную верхнюю панель ближе к marketplace shell

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Сделать authenticated topbar похожим на рабочую панель маркетплейса: логотип, поиск, notification placeholder и меню аккаунта вместо набора больших nav-ссылок.

### Что сделано

- Для авторизованного пользователя добавлен topbar search, который ведёт в `/marketplace?query=...`.
- Добавлен compact actions block с notification placeholder.
- Добавлено меню аккаунта с профилем, покупками, продажами для seller role, настройками, темой, языком и выходом.
- Пункты без готового домена оставлены disabled без перехода на future routes.
- Финансы показаны только как disabled review item, без fake balance и без обещаний выплат.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не создавались страницы сообщений, финансов, выплат или помощи.
- Не добавлялись fake notifications, fake balance и real payout UI.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- Вошедший пользователь видит поиск и меню аккаунта.
- Гость продолжает видеть публичную навигацию.
- Поиск из topbar открывает marketplace с query.
- Меню аккаунта не уезжает за экран на mobile.
- Все новые тексты идут через i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Настоящий notification center, messages и finance/payout sections требуют отдельных domain/API задач и review.
