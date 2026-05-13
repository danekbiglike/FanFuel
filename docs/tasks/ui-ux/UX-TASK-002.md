# UX-TASK-002: Сверить текущие страницы с UI/UX tracker

Статус: completed
Версия: v0.2
Приоритет: P0
Затрагивает: `apps/web`, `apps/admin`, `apps/widget`, `packages/ui`, docs

### Цель

Зафиксировать фактические routes, компоненты и расхождения текущей реализации с целевым UX.

### Что нужно сделать

- Найти текущие routes.
- Найти текущие компоненты и layouts.
- Проверить hardcoded UI text.
- Проверить hardcoded colors вне token layer.
- Записать выводы в `docs/DESIGN_AUDIT.md`, `docs/UI_UX_TRACKER.md`, `docs/UX_IMPLEMENTATION_STATUS.md`.

### Что не нужно делать

- Не исправлять найденные UX-долги без отдельной задачи.

### Acceptance criteria

- Текущие страницы имеют статус `PARTIAL` или `NEEDS_REWORK`.
- Главные UX-долги перечислены.

### Связанные документы

- `docs/DESIGN_AUDIT.md`
- `docs/UI_UX_TRACKER.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Аудит показал, что `/me/profile` является главным временным экраном и требует разделения.
