# DESIGN_SYSTEM.md

Документ фиксирует дизайн-систему FanFuel после внедрения `v0.2 Design System Foundation`.

## Концепция

FanFuel — зрелая creator-commerce платформа: донаты, витрины, цифровые товары, safe deal, OBS-сценарии и кабинеты должны выглядеть как надёжный продукт, а не как дешёвый геймерский сайт или generic marketplace.

Визуальная система строится как гибрид трёх направлений:

- **Creator OS**: публичные страницы, onboarding, брендовая часть, страницы авторов.
- **Marketplace Pro**: каталог, карточки товаров, checkout, orders, safe deal, финансовые статусы.
- **Stream Deck / Control Room**: studio, seller/buyer/admin dashboards, widgets, realtime panels.

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

- `primary`: сдержанный fuel-orange для главных CTA и прогресса.
- `secondary`: спокойный creator-violet для вторичных акцентов.
- `accent`: зрелый teal для поддержки и product energy.
- `success`: деньги/успех.
- `warning`: ожидание, ручная проверка.
- `danger`: ошибки, failed, destructive.
- `info`: system/realtime.
- `held`, `payout`, `refunded`, `disputed`, `completed`: финансовые и safe deal статусы.

## Light Theme

Light theme не стерильно-белая: фон слегка холодный, поверхности чистые, разделители мягкие. Тема подходит для marketplace, форм, донатов и кабинетов.

Правила:

- Основной фон: `--color-background`.
- Карточки и формы: `--color-surface`.
- Вторичные зоны: `--color-surface-muted`.
- Primary CTA: `--color-primary`.
- Текст поверх поверхности всегда через `--color-foreground` или `--color-muted-foreground`.

## Dark Theme

Dark theme не является инверсией light. Она глубокая и спокойная, с умеренным контрастом и без “хакерской панели”.

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
- Cards: radius до `8px`, кроме hero/control previews где допустим `12px`.

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

## Page Patterns

### Creator OS

- Hero объясняет продукт или автора быстро.
- Важный объект страницы виден в первом viewport.
- CTA один главный, вторичные действия спокойные.

### Marketplace Pro

- Цена, продавец, условия, safe deal и вклад автору видны рядом.
- Фильтры не должны ломать mobile.
- Карточки товара не перегружать бейджами.

### Stream Deck / Control Room

- Панели модульные, scannable.
- Статусы живые, но не шумные.
- Таблицы на mobile переходят в summary rows.

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

