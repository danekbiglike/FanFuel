# UX-TASK-006: Спроектировать marketplace page foundations перед реализацией

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: PAGE-MARKETPLACE, PAGE-MARKETPLACE-CATEGORY, PAGE-PRODUCT, PAGE-CHECKOUT

### Цель

Подготовить marketplace UI к реализации после Product/Category/Order API.

### Что нужно сделать

- Уточнить product card.
- Уточнить filters/search/sort.
- Уточнить product page.
- Уточнить checkout states.
- Обновить i18n keys.

### Что не нужно делать

- Не создавать статические fake pages.
- Не включать risky categories.

### Acceptance criteria

- Marketplace pages имеют готовые specs и states.
- Реализация начинается только после API/domain задач.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/DOMAIN_MODEL.md`
- `docs/API_PLAN.md`
- `docs/PAYMENTS.md`

### Комментарии для агента

Marketplace — v0.3 priority, но порядок должен быть domain/API first.
