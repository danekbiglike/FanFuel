# THEMING.md

FanFuel поддерживает три режима темы:

```ts
type ThemePreference = "system" | "light" | "dark";
```

Default: `system`.

## Корневой атрибут

Выбран подход через `data-theme`:

```html
<html data-theme="light">
<html data-theme="dark">
```

Дополнительно выставляется `data-theme-preference="system|light|dark"` для диагностики и будущих сценариев.

## CSS Variables

Все цвета находятся в `packages/ui/src/styles.css`. Приложения импортируют этот файл и используют только semantic tokens.

Запрещено:

- hardcoded цвета в компонентах;
- page-specific случайные hex-цвета;
- `bg-white`, `text-black`, `text-white`, если проект позже подключит Tailwind;
- отдельная тема только для одной страницы.

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

## Как тестировать

- Открыть web, admin, widget в `light`.
- Открыть web, admin, widget в `dark`.
- Проверить `system`, переключив системную тему устройства.
- Проверить reload без заметного flash.
- Проверить mobile top bar.
- Проверить keyboard navigation ThemeSwitcher.
- Проверить authenticated sync через `/api/v1/me/preferences`.

