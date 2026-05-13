# UX-TASK-015: Отполировать topbar search на mobile

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Исправить mobile search в верхней панели после гостевого меню: убрать ложное сокращение placeholder на 390px, выровнять кнопку поиска внутри поля и убрать dev hydration overlay, вызванный внешними browser-injected attributes.

### Что сделано

- Placeholder topbar search выбирается по фактической доступной ширине input, а не только по breakpoint.
- Search button выровнен как inset-кнопка с одинаковыми отступами сверху, справа и снизу.
- На topbar search и marketplace toolbar form controls добавлен точечный `suppressHydrationWarning` для внешнего `__gcruniqueid`/похожих injected attributes.

### Что не делалось

- Не расширялся backend search по авторам и категориям.
- Не менялась marketplace API-логика и структура данных.

### Acceptance criteria

- На 390px "Найти товар, услугу или автора" остаётся, если строка помещается.
- На узких ширинах placeholder всё ещё может стать "Поиск", если места реально мало.
- Search button не выглядит смещённой вправо.
- Dev overlay не блокирует тестовый просмотр из-за стороннего атрибута на form controls.
