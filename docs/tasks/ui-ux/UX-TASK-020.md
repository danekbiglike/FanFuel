# UX-TASK-020: Отполировать компактную `/marketplace` витрину: hero, обложки и подборки

Статус: completed  
Приоритет: P0  
Версия: v0.3.5  
Связанные страницы: PAGE-HOME, PAGE-MARKETPLACE  
Связанные задачи: UX-TASK-019, FF-0350

## Контекст

После уплотнения `/marketplace` страница стала ближе к creator-commerce витрине, но оставались четыре UX-долга: hero был слишком высоким, поиск и категории повторяли один заголовок, товарные превью выглядели как placeholder, а подборки авторов занимали слишком много вертикального пространства.

## Scope

- Сократить hero и заменить заголовок на более уникальную формулу про цифровые товары, которые поддерживают авторов.
- Развести заголовки быстрого поиска и категорий, чтобы убрать дубль "Что можно найти на FanFuel".
- Сделать категорийные псевдообложки для товаров: OBS-пак, алерт, дизайн-ассет, коучинг, игровая услуга и цифровой товар.
- Усилить OBS-мокап в hero-card и featured product.
- Сократить подборки авторов на главной до двух блоков по четыре товара.
- Сделать карточку автора компактной на desktop и mobile.
- Сократить текст поддержки автора в карточках до короткого сигнала с подсказкой.
- Унифицировать публичные тексты на FanFuel без пробела.

## Acceptance criteria

- Hero на desktop не выглядит как четырёхстрочный тяжёлый заголовок, а на mobile укладывается в 2-3 строки.
- На странице нет двух подряд заголовков "Что можно найти на FanFuel".
- Товарные карточки используют разные category cover templates и не выглядят как skeleton или пустые заглушки.
- Блок "Подборки авторов" показывает максимум две подборки и не растягивает карточку автора на весь ряд.
- Компактный SafeDeal не содержит внутренних формулировок вроде `provider`, `production`, `legal review` или `dispute flow`.
- Все новые пользовательские тексты добавлены в `packages/i18n/locales/ru/common.json` и `packages/i18n/locales/en/common.json`.

## Проверки

- `npx prettier --write apps\web\src\app\marketplace\page.tsx apps\web\src\app\globals.css packages\i18n\locales\ru\common.json packages\i18n\locales\en\common.json`
- `node -e "JSON.parse(require('fs').readFileSync('packages/i18n/locales/ru/common.json','utf8')); JSON.parse(require('fs').readFileSync('packages/i18n/locales/en/common.json','utf8')); console.log('ok')"`
- `npm run typecheck -w @fanfuel/web`
