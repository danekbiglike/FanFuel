# UX-TASK-005: Привести публичную страницу стримера к spec

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: PAGE-CREATOR-PUBLIC, PAGE-CREATOR-DONATE, `apps/web/src/app/creators/[slug]/page.tsx`

### Цель

Улучшить текущую creator page без добавления creator store до v0.4.

### Что нужно сделать

- Добавить structured loading/empty/error states.
- Улучшить donation form feedback.
- Зафиксировать решение: отдельный `/donate` route или embedded flow.
- Подготовить место для avatar/banner после storage задачи.

### Что не нужно делать

- Не добавлять витрину товаров.
- Не подключать реальные платежи.

### Acceptance criteria

- Donate MVP не ломается.
- Empty goals/donations выглядят осмысленно.
- Payment status понятен.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/UI_STATES.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Сохранять mock provider как dev-only паттерн.
