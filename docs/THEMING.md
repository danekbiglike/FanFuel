# THEMING.md

> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

FanFuel поддерживает три режима темы:

```ts
type ThemePreference = "system" | "light" | "dark";
```

Default: `system`.

## Корневой атрибут

Выбран подход через `data-theme`:

```html
<html data-theme="light">
  <html data-theme="dark"></html>
</html>
```

Дополнительно выставляется `data-theme-preference="system|light|dark"` для диагностики и будущих сценариев.

## CSS Variables

Все цвета находятся в `packages/ui/src/styles.css`. Приложения импортируют этот файл и используют только semantic tokens.

Запрещено:

- hardcoded цвета в компонентах;
- page-specific случайные hex-цвета;
- `bg-white`, `text-black`, `text-white`, если проект позже подключит Tailwind;
- отдельная тема только для одной страницы.

## Skin presets

`v0.3.5` планирует skin presets как слой поверх `light`/`dark`, а не замену темы. Первым baseline-пресетом становится `aurora`: он обновляет текущий оранжево-тёмный визуальный образ в сторону deep navy/graphite, violet/cyan, emerald support и редкого warm-акцента.

```ts
type SkinPreset = "base" | "aurora" | string;
```

Правила:

- theme отвечает за `light`/`dark`, skin отвечает только за безопасные token overrides;
- skin не может менять DOM structure, route, layout slots или i18n keys;
- skin config хранится как schema-validated preset/reference, а не arbitrary CSS;
- у skin должны быть light/dark значения или наследование base tokens;
- переключение skin не должно менять бизнес-статусы, payment/deal colors semantics или доступность.
- skin не может возвращать orange/black как dominant primary без отдельного design/brand ADR;
- glass/material tokens разрешены только для allowlisted компонентов: topbar, search, tabs, modal/drawer, hero preview, sticky checkout, widget preview.

## Aurora token contract

Aurora добавляет семантические роли, которые должны быть доступны в `light` и `dark`:

- `--color-primary`: violet brand action.
- `--color-secondary`: cyan interactive/realtime accent.
- `--color-accent`: emerald support/community action.
- `--color-warm`: amber/orange for hit/warning/popular, not primary CTA.
- `--surface-glass`, `--surface-glass-strong`, `--border-glass`, `--shadow-glass`, `--blur-glass`.
- `--gradient-brand`, `--gradient-support`.

Эти токены описывают роли. Компонентам запрещено напрямую сравнивать цветовые значения или строить логику на том, какой именно hex у текущего skin.

Aurora является текущим baseline, а не утверждённым финальным визуальным характером FanFuel. Будущий живой интерфейс из `UX-TASK-037` должен переиспользовать semantic roles либо изменить их через design/brand review и ADR, не через page-specific hardcode. Маскот и `world.fanfuel.ru` не получают отдельную несвязанную цветовую систему до такого решения.

## Гость

Для гостя выбор темы хранится:

- `localStorage`: `fanfuel_theme_preference`;
- cookie: `fanfuel_theme_preference`.

Если значения нет, используется `system`.

## Авторизованный пользователь

Источник истины — `user_preferences` в PostgreSQL.

Поля:

- `user_id`;
- `theme_preference`;
- `locale`;
- `created_at`;
- `updated_at`.

Frontend после загрузки с access token запрашивает:

```txt
GET /api/v1/me/preferences
```

При изменении темы:

1. UI мгновенно применяет тему.
2. Выбор сохраняется локально.
3. Frontend отправляет `PATCH /api/v1/me/preferences`.
4. Backend сохраняет `themePreference`.

Payload:

```json
{
  "themePreference": "system"
}
```

## First Paint

Чтобы снизить flash неправильной темы:

- `apps/web` вставляет inline `ThemeScript` в `layout.tsx`.
- `apps/admin` и `apps/widget` имеют inline script в `index.html`.
- Скрипт читает localStorage/cookie/URL до React render.
- Скрипт выставляет `data-theme` и `colorScheme`.
- В Next.js используется `suppressHydrationWarning` на `<html>`.

## ThemeProvider

`apps/web/src/components/theme-provider.tsx`:

- держит `preference` и `resolvedTheme`;
- слушает `prefers-color-scheme`, если preference = `system`;
- сохраняет guest choice в localStorage/cookie;
- синхронизирует authenticated choice с backend;
- optimistic UI: тема применяется до ответа backend;
- при ошибке сохраняет локальный выбор и показывает сообщение в settings.

## ThemeSwitcher

`ThemeSwitcher` находится в `packages/ui`.

Требования:

- поддерживает `system`, `light`, `dark`;
- keyboard accessible через button/dropdown controls;
- имеет `aria-label`, `aria-haspopup`, `aria-expanded`, `role=listbox`;
- использует i18n labels, не содержит user-facing строк;
- работает в desktop top bar и mobile compact top bar.

## User Settings

В `apps/web/src/components/app-chrome.tsx` есть `ThemeSettingsPanel`.

Он отображается в профиле:

```txt
Внешний вид
Тема интерфейса:
- Системная
- Светлая
- Тёмная
```

Пояснение берётся из i18n: `themeSystemDescription`.

## OBS / Widgets

`apps/widget` поддерживает отдельную тему через URL:

```txt
?theme=system
?theme=light
?theme=dark
?theme=transparent
```

`transparent` сохраняет прозрачный фон для OBS/browser source и использует dark-readable alert surface. В будущем настройки виджета должны хранить явную тему виджета отдельно от темы обычного интерфейса.

## Как добавлять токены

1. Добавить semantic variable в `packages/ui/src/styles.css` для light и dark.
2. Описать назначение в `docs/DESIGN_SYSTEM.md`.
3. Использовать токен через `var(--color-*)`.
4. Проверить контраст в обеих темах.
5. Если токен относится к glass/gradient, проверить читаемость на плотном и пустом фоне, а также `prefers-reduced-motion`.

## Как тестировать

- Открыть web, admin, widget в `light`.
- Открыть web, admin, widget в `dark`.
- Проверить `system`, переключив системную тему устройства.
- Проверить reload без заметного flash.
- Проверить mobile top bar.
- Проверить keyboard navigation ThemeSwitcher.
- Проверить authenticated sync через `/api/v1/me/preferences`.
- Для `aurora` отдельно проверить, что warm/orange не доминирует в логотипе, primary CTA, hero accent и бейджах одновременно.
