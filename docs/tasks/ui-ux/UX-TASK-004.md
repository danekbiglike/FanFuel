# UX-TASK-004: Привести главную страницу к spec v0.3

Статус: completed
Версия: v0.3
Приоритет: P1
Затрагивает: PAGE-HOME, `apps/web/src/app/page.tsx`, i18n

### Цель

Уточнить главную страницу как вход в creator-commerce, не превращая её в generic SaaS landing.

### Что нужно сделать

- Добавить role-aware входы для buyer/streamer/seller.
- Подготовить marketplace preview без fake products.
- Объяснить safe deal осторожно и без юридических обещаний.
- Проверить mobile.

### Что не нужно делать

- Не создавать marketplace внутри главной.
- Не добавлять future pages без routes/spec.

### Acceptance criteria

- Главная за 5 секунд объясняет FanFuel.
- Тексты через i18n.
- Light/dark/mobile проверены.

### Связанные документы

- `docs/PAGE_SPECS.md`
- `docs/UX_WRITING.md`
- `docs/UX_RULES.md`

### Комментарии для агента

Если добавляется ссылка на marketplace, сначала убедиться, что route готов или ссылка скрыта.
