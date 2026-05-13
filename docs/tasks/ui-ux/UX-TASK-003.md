# UX-TASK-003: Поддерживать UI/UX tracker после каждой UI-задачи

Статус: planned
Версия: v0.3
Приоритет: P0
Затрагивает: docs

### Цель

Сделать tracker живым документом, а не одноразовым аудитом.

### Что нужно сделать

- Обновлять статус страницы после изменений.
- Добавлять новые `PAGE-ID`, `FLOW-ID`, `CMP-ID`.
- Фиксировать расхождения в `docs/DESIGN_AUDIT.md` или `docs/UX_IMPLEMENTATION_STATUS.md`.

### Что не нужно делать

- Не менять статусы future pages без причины и задачи.

### Acceptance criteria

- Любая новая UI page отражена в tracker/spec/tasks.
- Future pages не появляются в коде случайно.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Это постоянный процесс для всех будущих UI задач.
