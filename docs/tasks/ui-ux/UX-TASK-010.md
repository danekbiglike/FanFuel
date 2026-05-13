# UX-TASK-010: Проверить mobile UX текущих страниц

Статус: planned
Версия: v0.3
Приоритет: P1
Затрагивает: `apps/web`, `apps/admin`, `apps/widget`

### Цель

Проверить, что текущие страницы не ломаются на mobile и в обеих темах.

### Что нужно сделать

- Проверить 320/390/768/1440 viewports.
- Проверить long Russian strings.
- Проверить forms, buttons, widget preview.
- Записать результаты в `docs/DESIGN_AUDIT.md`.

### Что не нужно делать

- Не переписывать visual style без конкретных багов.

### Acceptance criteria

- Нет перекрытия текста.
- Нет горизонтального хаоса в таблицах/формах.
- Light/dark работают.

### Связанные документы

- `docs/DESIGN_AUDIT.md`
- `docs/UI_RULES.md`
- `docs/UX_RULES.md`

### Комментарии для агента

При возможности использовать Playwright screenshots.
