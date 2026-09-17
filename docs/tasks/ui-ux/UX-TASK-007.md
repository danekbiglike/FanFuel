# UX-TASK-007: Привести dashboard layout к spec

Статус: partial
Версия: v0.3 / v0.3.5
Приоритет: P0
Затрагивает: PAGE-ME-PROFILE, PAGE-BUYER-DASHBOARD, PAGE-STUDIO-DASHBOARD, PAGE-SELLER-DASHBOARD, PAGE-ADMIN-DASHBOARD

### Цель

Разделить текущий `/me/profile` на понятные role contexts и dashboard patterns.

### Что нужно сделать

- Спроектировать `RoleSwitcher`.
- Подготовить shared dashboard layout.
- Зафиксировать отдельные routes `/me/settings` и `/studio` как ближайшие страницы "скоро".
- Вынести Studio goals/widgets из `/me/profile`.
- Вынести seller settings в seller section.
- Сохранить `/me/profile` как account/settings fallback.
- В `v0.3.5` довести `/me/profile` до user account hub: аватар, настройки, избранное, мои отзывы, подборки, стать автором/продавцом, pause/archive role modes.
- В `v0.3.5` собрать Studio shell с вкладками: статистика, последние события, настройка донатов, витрина автора, виджеты, продукты и подборки.

### Что не нужно делать

- Не переписывать все dashboards сразу.
- Не добавлять payouts/disputes и расширенную аналитику до их версий.
- Не возвращать настройки витрины, виджетов и seller forms в `/me/profile`.

### Acceptance criteria

- Пользователь с несколькими ролями понимает, где находится.
- `/me/profile` перестаёт быть dumping ground.
- Mobile navigation работает.

### Связанные документы

- `docs/INFORMATION_ARCHITECTURE.md`
- `docs/PAGE_SPECS.md`
- `docs/UI_UX_TRACKER.md`

### Комментарии для агента

Реализовывать по частям, начиная со Studio widgets/goals.
