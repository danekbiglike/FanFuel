# UX-TASK-018: Упростить главную marketplace и добавить dev seed товары

Статус: completed  
Версия: v0.3  
Приоритет: P0  
Затрагивает: PAGE-HOME, PAGE-MARKETPLACE, FLOW-BUYER-HOME, FLOW-BUYER-SEARCH

### Цель

Сделать главную marketplace менее похожей на CRM-панель, убрать публичные внутренние warning-тексты и подготовить dev seed товары для локальной витрины.

### Что сделано

- `/` рендерит тот же marketplace screen, что и `/marketplace`, без redirect.
- Внутренний hero search убран; поиск остался в topbar.
- Быстрые CTA "Смотреть популярное" и "Подборки авторов" убраны с первого экрана.
- Публичный marketplace UI больше не показывает raw `LEGAL_REVIEW_REQUIRED`.
- Empty state переписан как спокойное состояние с действиями "Стать продавцом" и "Все категории".
- `infra/scripts/seed-dev.sh` и `infra/scripts/seed-dev.ps1` создают dev-only продавцов и опубликованные mock товары.
- Public products API без `category` возвращает все опубликованные товары, а не пустой список из-за fallback slug.

### Что не делалось

- Не добавлялись fake products во frontend.
- Не создавались новые публичные routes категорий, creator store, real safe deal, выплаты или dispute UI.
- Не подключались реальные payment/payout providers.

### Acceptance criteria

- `/` открывает marketplace-витрину без смены URL на `/marketplace`.
- На главной нет кнопки "Применить", внутренней кнопки "Искать" и raw `LEGAL_REVIEW_REQUIRED`.
- Empty state не выглядит как ошибка и предлагает понятные следующие шаги.
- Dev seed можно запустить повторно без дублей товаров.
