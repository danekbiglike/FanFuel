# UX-TASK-014: Сделать гостевое topbar menu похожим на auth shell

Статус: completed
Версия: v0.3
Приоритет: P0
Затрагивает: CMP-TOPBAR, PAGE-MARKETPLACE, FLOW-BUYER-SEARCH

### Цель

Заменить публичную навигацию гостя на компактный topbar с поиском и dropdown menu, чтобы структура гостя и авторизованного пользователя была предсказуемой.

### Что сделано

- Поиск в верхней панели доступен гостю и авторизованному пользователю.
- Placeholder поиска стал "Найти товар, услугу или автора" на широком экране и "Поиск" на mobile.
- Гостевое dropdown menu содержит вход, регистрацию, marketplace и ролевые публичные страницы.
- Пункт покупок не добавлен для гостя, потому что гостевой заказ должен открываться по ссылке из письма.
- Theme и language controls в гостевом меню используют overlay-dropdown, как в account menu.
- Новые строки добавлены в `ru` и `en`.

### Что не делалось

- Не создавались guest purchases/history pages.
- Не добавлялись notification, messages, finance, payouts или real payment UI.
- Не менялись backend endpoints, доменная модель и платежная логика.

### Acceptance criteria

- Гость видит поиск, burger/dropdown menu, вход и регистрацию.
- В гостевом меню нет пункта покупок.
- Topbar остаётся одной строкой на mobile.
- Theme и language dropdown не растягивают меню внутри.
- Все новые тексты идут через i18n.

### Связанные документы

- `docs/UI_UX_TRACKER.md`
- `docs/PAGE_SPECS.md`
- `docs/USER_FLOWS.md`
- `docs/UX_IMPLEMENTATION_STATUS.md`

### Комментарии для агента

Расширение поиска по авторам/категориям должно проверяться отдельно на уровне marketplace API/индекса, если текущий backend ищет только товары.
