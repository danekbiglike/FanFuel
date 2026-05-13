# UX-TASK-008: Добавить стандартные empty/loading/error states

Статус: completed
Версия: v0.3
Приоритет: P1
Затрагивает: current pages, `packages/ui`

### Цель

Сделать текущие страницы устойчивыми и понятными при загрузке, пустых данных и ошибках.

### Что нужно сделать

- Заменить plain loading на skeleton там, где layout известен.
- Добавить EmptyState для goals/widgets/donations/users.
- Добавить секционные errors.
- Проверить unauthorized/forbidden states.

### Что не нужно делать

- Не добавлять новые функции вместе со states.

### Acceptance criteria

- Current pages не показывают пустые зоны без объяснения.
- Ошибки не раскрывают raw backend details.

### Связанные документы

- `docs/UI_STATES.md`
- `docs/UX_RULES.md`

### Комментарии для агента

Начать с `/me/profile`, `/creators/[slug]`, `apps/admin`.
