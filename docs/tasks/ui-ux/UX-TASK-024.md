# UX-TASK-024 — Вернуть честную UX-навигацию `/marketplace`

Статус: completed  
Приоритет: P0  
Версия: v0.3.5  
Связанные страницы: PAGE-MARKETPLACE, PAGE-MARKETPLACE-CATALOG, PAGE-MARKETPLACE-CATEGORIES, PAGE-MARKETPLACE-CATEGORY, PAGE-CREATORS-DIRECTORY, PAGE-MARKETPLACE-PROMOCODES, PAGE-SAFE-DEAL

## Контекст

Главная marketplace начала вести себя непредсказуемо: быстрые направления выглядели как навигация, но меняли скрытые фильтры; часть CTA вела к якорям вместо ожидаемых страниц; карточки товаров имели лишние одинаковые кнопки.

## Что сделать

- Убрать скрытые фильтры и `query/category/sort` состояние с главной `/marketplace`.
- Сделать быстрые направления обычной навигацией на `/marketplace/category/*`, `/creators`, `/marketplace/promocodes`, `/safe-deal`.
- Заменить hero copy на понятное "Покупай цифровые товары и поддерживай авторов".
- Убрать hover CTA и дублирующую категорию из обычных product cards.
- Переделать featured-блок в "Популярно в витринах авторов" с CTA "Открыть товар" и "Посмотреть авторов".
- Вынести объяснение механики в компактный блок "Как покупка поддерживает автора".
- Добавить лёгкие destination routes для новых навигационных целей, без превращения `/marketplace` в набор лендингов.

## Acceptance criteria

- Каждый CTA на `/marketplace` делает то, что написано на элементе.
- Быстрые направления не скроллят и не фильтруют главную.
- Поиск в topbar отправляет товары в `/marketplace/catalog`, а режим авторов в `/creators`.
- Карточка товара целиком кликабельна и не содержит повторяющуюся кнопку "Подробнее" / "Открыть товар".
- Featured-блок не показывает "Открыть автора", если товар находится в нескольких витринах.
- Публичный UI новой части не содержит dev/internal/legal/mock формулировок.

## Проверки

- `npm run typecheck --workspaces --if-present`
- `npm run lint`
- `npm run build --workspaces --if-present`
- browser smoke `/marketplace`
