# UI_RULES.md

Правила применения интерфейсной системы FanFuel.

## Общие правила

- Каждый экран должен работать в `light` и `dark`.
- Цвета только через semantic tokens.
- Тексты только через i18n.
- Скины могут менять только разрешённые semantic tokens и визуальные параметры, но не структуру страниц.
- В `v0.3.5` сначала обновить существующие экраны под FanFuel Aurora, затем строить новые profile/studio/store страницы.
- Оранжевый/warm не использовать как primary brand, основной CTA, logo surface и hero accent одновременно.
- Mobile не считается вторичным.
- Карточки не вкладывать в карточки.
- Dashboard-панели должны быть рабочими, а не декоративными.

## Aurora и glass

- Aurora — это deep navy/graphite, violet/cyan, emerald support и редкий warm-акцент.
- Glass использовать только там, где он усиливает иерархию: topbar, поиск, tabs, модалки, hero preview, sticky checkout, widget preview.
- Не делать glass-стилем все карточки товара, таблицы, длинные тексты и dashboard grids.
- Если glass ухудшает контраст текста, использовать обычную surface или более плотный overlay.
- Не добавлять декоративные gradient orbs/blobs/bokeh как фон страницы.

## Отступы

- Page padding: `--space-page`.
- Section gap: 32–64px.
- Card/panel padding: 20–24px.
- Dense list gap: 8–12px.
- Form field gap: 8px внутри label, 16px между полями.

## Заголовки

- Один главный H1 на страницу.
- H1 должен описывать объект или ценность страницы.
- В карточках использовать card title, а не hero-scale type.
- Длинные русские строки проверять на mobile.

## Карточки

- Radius: 8px по умолчанию.
- Карточка — для повторяемых items или реально framed tools.
- Секции страницы не превращать в плавающие карточки.
- В карточке товара первыми должны считываться: название, цена, продавец, условия, safe deal.
- Product preview должен иметь устойчивое соотношение сторон и не выглядеть как пустая заглушка, если у товара есть media/mockup.

## CTA

- Один primary CTA в локальном контексте.
- Secondary actions должны быть спокойнее и не спорить с primary.
- Destructive actions требуют danger tone и подтверждения в admin/financial flows.

## Empty States

- Empty state должен отвечать на вопрос “что дальше”.
- Не использовать шутливые формулировки для денег, споров и выплат.
- Для planned модулей использовать честный placeholder/pattern, не имитировать готовый flow.

## Ошибки

- API errors отображаются по `i18n_key`.
- Ошибка формы должна быть рядом с формой и читаемой в обеих темах.
- Для destructive или financial ошибок использовать `danger` + текст.

## Status UI

- Цвет не единственный способ передать статус.
- Использовать `Badge` с текстом.
- Для financial/safe deal статусов использовать semantic tones из `DESIGN_SYSTEM.md`.

## Таблицы

- Desktop: таблица с понятными колонками и actions справа.
- Mobile: summary rows вместо горизонтального хаоса.
- Статусы в таблицах — бейджи, не цветной текст без подписи.
- Admin tables должны показывать next action, а не только data dump.

## Формы

- Label обязателен.
- Placeholder не заменяет label.
- Focus state через `--shadow-focus`.
- Disabled state должен быть визуально понятен.
- Для денег использовать minor units в API и shared formatting helper в UI.

## Dashboard Panels

- Панель должна иметь заголовок, ключевой показатель или действие.
- Realtime updates — subtle.
- Не смешивать unrelated controls в одной панели.
- На mobile панели идут одной колонкой.

## Studio UI

- Studio использует стабильные вкладки: статистика, события, донаты, витрина, виджеты, продукты, подборки.
- Вкладки не должны переноситься в хаотичный список на 320-390px; на mobile допустим горизонтальный scroll/tab menu с явным текущим состоянием.
- Графики статистики должны иметь empty/loading/error states и не показывать fake revenue.
- Event feed показывает тип, источник, время и статус события текстом, а не только цветом.
- Donation settings используют form controls с label, hint и validation рядом с полем.
- Widget catalog показывает категории и presets, но не открывает произвольный code editor.

## Marketplace Cards

- Карточка товара должна показывать цену, seller trust, delivery/terms и safe deal.
- Не перегружать бейджами.
- Рейтинг и отзывы должны быть рядом с продавцом или social proof.
- Вклад в поддержку автора показывать ясно, но не как манипулятивный баннер.
- SafeDeal, поддержка автора, хит, новинка, проверенный продавец и промокод имеют разные semantic tones; warm/orange допустим только для “Хит”/warning/popular.
- Hover/tap может раскрывать CTA или бейдж, но не должен менять размер карточки и ломать сетку.

## Responsive UI

- Breakpoint до 900px: основные grids переходят в одну колонку.
- Top bar на mobile скрывает вторичную навигацию, ThemeSwitcher остаётся compact.
- Кнопки и inputs не должны ужиматься ниже читаемой ширины.
- Таблицы и lists должны оставаться сканируемыми без горизонтального скролла, если это не специализированный admin grid.
