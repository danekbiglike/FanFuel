# DESIGN_SYSTEM.md

> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

Документ фиксирует дизайн-систему FanFuel после внедрения `v0.2 Design System Foundation` и целевое направление `v0.3.5 Aurora Refresh`.

## Живой графический слой публичных страниц

В действующем контракте UX-TASK-040 характер создают графит, лайм, свободная типографика и короткий несовершенный карандашный жест. Подчёркивание должно быть связано с конкретной фразой или выбранной категорией; контурный рисунок товара — с его видом. Чередовать плотные и свободные участки, оставляя паузу вокруг цены и действий. Не строить ритм на одинаковых значках у каждого блока, звездочках, стрелках, градиентных шарах и механически повторённых плашках. Цвет рисунка задаётся semantic tokens, в обеих темах сохраняется достаточный контраст. Пустые состояния могут содержать один тихий рисунок, но обязаны оставлять ясное действие.

## Концепция

FanFuel — зрелая creator-commerce платформа: донаты, витрины, цифровые товары, safe deal, OBS-сценарии и кабинеты должны выглядеть как надёжный продукт, а не как дешёвый геймерский сайт или generic marketplace.

С `v0.3.5` базовое визуальное направление называется **FanFuel Aurora**. Это не переименование продукта и не отдельный бренд, а внутренний дизайн-вектор: глубокий navy/graphite фон, violet/cyan брендовый акцент, emerald-акцент поддержки автора, аккуратные glass-слои и живые карточки marketplace без вайба adult/ставок/старого skin-shop.

Визуальная система строится как гибрид трёх направлений:

- **Creator OS**: публичные страницы, onboarding, брендовая часть, страницы авторов.
- **Marketplace Pro**: каталог, карточки товаров, checkout, orders, safe deal, финансовые статусы.
- **Stream Deck / Control Room**: studio, seller/buyer/admin dashboards, widgets, realtime panels.

`v0.3.5` начинается не с новых страниц, а с обновления уже существующих экранов под Aurora-основу: `/`, `/marketplace`, product page, checkout, buyer/seller dashboards, `/me/profile`, creator page, admin и OBS widget. Новые profile/studio/store задачи должны строиться уже поверх этой базы.

## Разбор внешней дизайн-критики

Принято:

- текущая связка тёмного фона, яркого оранжевого и жирных бейджей может давать нежелательные ассоциации с adult/betting/старым игровым магазином;
- оранжевый нельзя использовать как logo + primary CTA + hero accent + все бейджи одновременно;
- основной брендовый акцент переносится в violet/cyan, поддержка автора получает emerald, warm/orange остаётся редким статусным акцентом;
- glass уместен как премиальный слой навигации, поиска, segmented controls, модалок, hero preview, sticky checkout и виджетов;
- карточки marketplace должны выглядеть как реальные товары/услуги с медиа, продавцом, доверием, safe deal и аккуратным вкладом автора;
- светлая и тёмная темы обязательны, читаемость важнее эффекта.

Не принимается как правило:

- не копировать Apple Liquid Glass и не делать “всё стеклянным”;
- не переименовывать FanFuel в FunFuel или Aurora;
- не добавлять декоративные gradient orbs/blobs как основной фон;
- не увеличивать радиусы всех карточек до 20–24px: базовый radius карточек остаётся дисциплинированным;
- не превращать рабочие кабинеты и admin в эффектный промо-интерфейс;
- не обещать safe deal как финальную гарантию без legal/payment review.

## Анти-принципы

- Нет кислотного неона, агрессивных glow-эффектов и киберспортивного визуального шума.
- Нет случайных цветов в компонентах.
- Нет страниц, которые работают только в одной теме.
- Нет user-facing текста вне i18n.
- Нет dashboard-перегруза: панели должны помогать работать, а не имитировать сложность.

## Theme Tokens

Источник цветов — CSS variables из `packages/ui/src/styles.css`.

Базовые группы:

- `--color-background`, `--color-foreground`.
- `--color-surface`, `--color-surface-muted`, `--color-surface-elevated`.
- `--color-border`, `--color-border-strong`.
- `--color-muted`, `--color-muted-foreground`.
- `--color-primary`, `--color-secondary`, `--color-accent`.
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info`.
- `--color-held`, `--color-payout`, `--color-refunded`, `--color-disputed`, `--color-completed`.

Цветовые роли:

- `primary`: violet для главных CTA, активных состояний и ключевого брендового действия.
- `secondary`: electric cyan для интерактивных акцентов, realtime, glass highlights и вторичных CTA.
- `accent`: emerald для поддержки автора, позитивного вклада и community value.
- `warm`: amber/orange только для редких бейджей вроде “Хит”, warning/popular и небольших glow-деталей, но не как основной бренд.
- `success`: деньги/успех.
- `warning`: ожидание, ручная проверка.
- `danger`: ошибки, failed, destructive.
- `info`: system/realtime.
- `held`, `payout`, `refunded`, `disputed`, `completed`: финансовые и safe deal статусы.

Целевая палитра Aurora:

```css
:root[data-theme="dark"] {
  --color-background: #070a12;
  --color-surface: #0b1020;
  --color-surface-muted: #111827;
  --color-surface-elevated: #182033;
  --color-foreground: #f8fafc;
  --color-muted-foreground: #94a3b8;
  --color-primary: #7c5cff;
  --color-secondary: #22d3ee;
  --color-accent: #34d399;
  --color-warm: #ffb86b;
}

:root[data-theme="light"] {
  --color-background: #f7f8fc;
  --color-surface: #ffffff;
  --color-surface-muted: #eef2ff;
  --color-surface-elevated: #ffffff;
  --color-foreground: #111827;
  --color-muted-foreground: #667085;
  --color-primary: #6d5dfb;
  --color-secondary: #06b6d4;
  --color-accent: #10b981;
  --color-warm: #f59e0b;
}
```

Конкретные значения живут в `packages/ui/src/styles.css`; этот блок задаёт целевой контракт, а не разрешает хардкодить hex в компонентах.

## Aurora Materials

Glass — материал верхнего слоя, а не универсальный фон.

Разрешённые зоны:

- sticky topbar, command/search shell и compact filters;
- tabs/segmented controls;
- модалки, drawers, floating меню;
- hero preview и support bubble;
- streamer widgets и OBS preview;
- sticky checkout summary;
- мини-карточки промокодов/поддержки автора.

Запрещённые зоны:

- каждая карточка товара;
- длинные текстовые блоки и таблицы;
- dashboard data grids;
- весь фон страницы;
- financial/safe deal статусы, где эффект ухудшает читаемость.

Минимальный набор material tokens:

```css
--surface-glass: rgba(255, 255, 255, 0.06);
--surface-glass-strong: rgba(255, 255, 255, 0.1);
--border-glass: rgba(255, 255, 255, 0.14);
--shadow-glass: 0 20px 60px rgba(0, 0, 0, 0.35);
--blur-glass: blur(24px) saturate(140%);
--gradient-brand: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
--gradient-support: linear-gradient(135deg, var(--color-accent), var(--color-secondary));
```

Если фон под glass слишком шумный, компонент обязан использовать более плотную surface или отказаться от blur.

## Следующее направление: живой FanFuel

Aurora остаётся текущей технической token/material базой, но не считается финальным характером бренда. После стабилизации marketplace-first главной `UX-TASK-037` должен выбрать более живой визуальный язык на прототипах реальных экранов.

Целевые свойства для исследования:

- выразительная, но читаемая типографика;
- иллюстративные формы и контролируемая асимметрия вместо одинаковых корпоративных карточек;
- контекстные микроанимации и реакции интерфейса;
- разная интенсивность для marketplace, рабочих кабинетов и чувствительных финансовых сценариев;
- узнаваемые места для будущего маскота без его навязывания на каждом экране.

До design review запрещено массово переносить экспериментальное направление в production. Новая стилистика обязана сохранять semantic tokens, light/dark, `ru/en`, mobile, keyboard accessibility, `prefers-reduced-motion` и performance budget.

Маскот планируется в `UX-TASK-038` как отдельный компонентный слой после выбора живого направления. У него обязательны character bible, reaction matrix, static/reduced-motion fallback и запрет на шутливые реакции в ошибках оплаты, спорах, выплатах и блокировках.

## Skin Presets

`v0.3.5` добавляет планируемый слой скинов. Скин — это безопасный preset поверх дизайн-системы, а не отдельная тема страницы и не редактор layout.

Aurora base — первый обязательный skin-ready baseline. Все последующие скины сравниваются с ним по структуре, контрасту и устойчивости к `ru/en`.

Скин может менять:

- semantic color tokens в пределах allowlist;
- плотность интерфейса;
- radius scale;
- shadow/elevation tokens;
- preview assets и иллюстративные акценты.

Скин не может менять:

- route structure;
- layout slots;
- порядок ключевых блоков;
- i18n keys и пользовательские тексты;
- доступность, focus states и status semantics;
- произвольный CSS/HTML/JS.

Каждый skin preset должен проходить проверку на `ru` и `en`, mobile 320/390, desktop, light/dark и длинные пользовательские строки. Если скин ломает карточки, topbar, формы или Studio panels, он считается неготовым.

## Light Theme

Light theme не стерильно-белая: фон слегка холодный, поверхности чистые, разделители мягкие. Тема подходит для marketplace, форм, донатов и кабинетов.

Правила:

- Основной фон: `--color-background`.
- Карточки и формы: `--color-surface`.
- Вторичные зоны: `--color-surface-muted`.
- Primary CTA: `--color-primary`.
- Текст поверх поверхности всегда через `--color-foreground` или `--color-muted-foreground`.

## Dark Theme

Dark theme не является инверсией light. Она глубокая и спокойная, с умеренным контрастом и без “хакерской панели”. После Aurora Refresh нельзя использовать почти чёрный + доминирующий оранжевый как основной визуальный образ публичных страниц.

Правила:

- Не использовать чистый чёрный для рабочих поверхностей.
- Разделители должны оставаться видимыми, но не светиться.
- Статусы должны иметь surface + foreground, а не только яркий текст.
- Для checkout и financial pages не использовать декоративные анимации.

## Финансовые статусы

Статусы нельзя передавать только цветом. Нужен текст, бейдж, иконка или форма компонента.

Рекомендуемые роли:

- `payment_pending`, `payout_pending`, `payout_processing`, `seller_working`, `seller_submitted`: warning/info.
- `paid`, `buyer_confirmed`, `auto_confirmed`, `completed`, `payout_paid`: success/completed.
- `held`, `resolved_to_seller`: held/success.
- `disputed`: disputed.
- `resolved_to_buyer`, `refunded`: refunded/info.
- `cancelled`: refunded/neutral.
- `failed`, `payout_failed`: danger.

## Typography

Шрифт: системный stack `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Отдельная font dependency не добавлена.

Шкала:

- Display: 56–72px desktop, 38–44px mobile.
- Page title: 40–52px.
- Section title: 26–32px.
- Card title: 18–20px.
- Body: 16px, line-height 1.5–1.6.
- Body small: 14px.
- Caption: 13px.
- Label: 14px, font-weight 800.
- Table text: 14–15px.
- Button text: 14–16px, font-weight 700.
- Form hint: 14px muted.
- Error text: 14–16px danger.

Letter spacing остаётся `0`.

## Layout

Контейнеры:

- Public/marketing: `min(1180px, 100%)`.
- Auth/settings narrow: `min(780px, 100%)`.
- Dashboards: responsive grid с 2–3 колонками на desktop и одной колонкой на mobile.
- Top bar: sticky/fixed, compact, с theme switcher.
- Cards: radius до `8px`, кроме hero/control previews и glass overlays, где допустим `12px`.

Отступы:

- Page padding: `--space-page`.
- Card/panel padding: 20–24px.
- Section bottom: 48–64px.
- Dense dashboard gap: 12–16px.

## Motion

- Обычные transitions: 150–250ms.
- Уважать `prefers-reduced-motion`.
- Финансовые статусы не анимировать игриво.
- Dashboard realtime transitions — subtle.
- OBS widgets могут иметь отдельные настройки анимации.

## Компоненты

Shared primitives находятся в `packages/ui`:

- `Button`, `IconButton`.
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`.
- `Tabs`, `Badge`, `Tag`.
- `Card`, `Panel`, `DashboardPanel`.
- `Modal`, `Drawer`, `Dropdown`, `Tooltip`, `Alert`, `Toast`.
- `Table`, `EmptyState`, `Skeleton`, `Pagination`, `Breadcrumbs`.
- `StatCard`, `ProductCard`, `DonationCard`, `GoalCard`, `OrderStatusCard`, `DealTimeline`, `WidgetPreviewContainer`.
- `ThemeSwitcher`, `UserMenu`, `TopBar`, `Sidebar`, `MobileNav`.

Каждый компонент обязан работать в `light` и `dark` через semantic tokens.

Компоненты, которые участвуют в skin-ready слое `v0.3.5`, дополнительно обязаны не зависеть от конкретной длины текста, fixed hero copy или одного цветового акцента.

## Page Patterns

### Creator OS

- Hero объясняет продукт или автора быстро.
- Важный объект страницы виден в первом viewport.
- CTA один главный, вторичные действия спокойные.

### Marketplace Pro

- Цена, продавец, условия, safe deal и вклад автору видны рядом.
- Фильтры не должны ломать mobile.
- Карточки товара не перегружать бейджами.
- Product preview не должен выглядеть как пустая тёмная заглушка, если для категории есть доступное медиа или mockup.
- Support-бейдж показывает вклад автора спокойно: это доверительный сигнал, а не манипулятивная наклейка.

### Stream Deck / Control Room

- Панели модульные, scannable.
- Статусы живые, но не шумные.
- Таблицы на mobile переходят в summary rows.
- Studio v0.3.5 использует рабочие вкладки, charts, event feeds и widget catalog без decorative dashboard overload.
- Графики и event feed должны быть плотными, но не похожими на финансовый терминал или payout screen.

## Do / Don't

Do:

- Использовать `var(--color-*)`.
- Добавлять i18n ключи для любых user-facing строк.
- Проверять обе темы и mobile.
- Использовать бейджи со статусным текстом.

Don't:

- Хардкодить `#fff`, `#000`, `bg-white`, `text-black` в компонентах.
- Использовать цвет как единственный носитель статуса.
- Добавлять тяжёлые UI-библиотеки без ADR.
- Делать неоновые glow-эффекты.
- Возвращать оранжевый как primary brand без нового ADR.
- Использовать glass как универсальный стиль всех карточек и таблиц.

## Главная — UX-TASK-030

DiscoveryArt — SVG-иллюстрации категорий на существующих semantic tokens, без растровых заглушек и фиктивных товаров. Витрина и схема каналов в презентациях подписаны как концепция/разработка. Товарные карточки в покупательском режиме используют реальные данные API. Переключатель UX-TASK-029 сохранён.

## Уточнение иллюстраций — UX-TASK-030

По обратной связи пользователя обновлены четыре варианта DiscoveryArt: современный симметричный беспроводной геймпад; алерт как событие с сердцем поверх трансляции вместо колокольчика; мягкая раскрытая книга с символом видеозвонка; исправленный порядок слоёв сообщений комьюнити. Стили и semantic tokens сохранены, новые пользовательские тексты не добавлялись.

### UX-TASK-031: единый Select и строка мобильных шагов

По запросу пользователя все нативные select в web переводятся на общий компонент дизайн-системы: semantic surface/border/focus, собственный список, клавиатура и disabled. В анкете возвращается строка из пяти кликабельных шагов на всех ширинах; на узком экране равные колонки, перенос длинных названий и touch targets от 44px, без горизонтальной прокрутки.

Общий Select экспортируется из @fanfuel/ui: управляемый одиночный выбор с option children, portal listbox, semantic tokens, выбранный пункт с отметкой, hover/focus/disabled. Стрелки, Home/End, Enter/Space, Escape/Tab и поиск по первым буквам; нативный скрытый select сохраняет передачу change и form values. Multiple/size > 1 остаются нативным списком. В web больше нет прямых select; системный выбор файлов не относится к Select.

## UX-TASK-041 — актуальная реализация 22.09.2026

Графитный Ойли теперь локальный alpha WebP 48 KB, а не гладкий SVG-силуэт. Контуры почерка даёт локальный Caveat; основной набор — Golos. Semantic tokens light/dark, #cafa39, канистра, reduced-motion/SaveData сохранены. Данные об источниках, размерах, лицензиях и решениях: DESIGN_ASSETS.md. Эти указания заменяют раннее требование рисовать Ойли исключительно SVG. Кнопки, логотип, декоративные подчёркивания остаются кодовыми/векторными.
