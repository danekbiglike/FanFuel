# Активный фокус
> Актуализация 22.09.2026, UX-TASK-041: выполнена локальная реализация исправленного дизайна и commerce foundation. Ниже сохранена историческая очередь, её ограничения по storefront/promo заменены прямым запросом владельца. Реализованы /studio, visual storefront, seller identity/rates, точные аналоги, поиск и mock-атрибуция. Обзор: docs/MARKETPLACE_ALGORITHMS.md; визуальные материалы: docs/DESIGN_ASSETS.md. Следующие этапы: review дизайна, durable S3/R2, проверяемые canonical IDs, телеметрия, production payment review. Ойли теперь graphite WebP; полная игра World остаётся FUTURE.


> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

Короткая очередь после локальной реализации `v0.3 Marketplace MVP`:

1. [UX-TASK-036](ui-ux/UX-TASK-036.md) — закрепить marketplace-first контракт `/` и `/marketplace`; это блокер остальных широких UI-изменений.
2. [FF-0307](v0.3/FF-0307.md) — стабилизировать Marketplace MVP проверками и smoke checklist.
3. [UX-TASK-037](ui-ux/UX-TASK-037.md) — после product review главной выбрать живой визуальный язык вместо generic corporate UI.
4. [UX-TASK-007](ui-ux/UX-TASK-007.md) — разделить `/me/profile` на account/settings и role-aware Studio/Seller/Buyer dashboards.
5. [UX-TASK-010](ui-ux/UX-TASK-010.md) — проверить текущие web/admin/widget страницы на mobile и light/dark.
6. [FF-0105](v0.1/FF-0105.md) — решить и выполнить upload avatar/banner flow или явно перенести его в storage milestone.
7. [FF-0351](v0.3.5/FF-0351.md) — спроектировать skin-ready дизайн и i18n-stable layouts с учётом утверждённого живого направления.
8. [FF-0352](v0.3.5/FF-0352.md) — разделить профиль пользователя и режимы автора/продавца.
9. [FF-0353](v0.3.5/FF-0353.md) — добавить избранное, мои отзывы и пользовательские подборки.
10. [FF-0354](v0.3.5/FF-0354.md) — реализовать настройки витрины автора и live-only блоки.
11. [FF-0355](v0.3.5/FF-0355.md) — добавить widget trigger rules и asset-настройки.
12. [FF-0356](v0.3.5/FF-0356.md) — добавить группы виджетов и OBS placement zones.
13. [FF-0357](v0.3.5/FF-0357.md) — собрать Studio shell и вкладку статистики.
14. [FF-0358](v0.3.5/FF-0358.md) — добавить последние события и bot-backed channel subscriptions.
15. [FF-0359](v0.3.5/FF-0359.md) — добавить настройки донатов, модерацию и spam-фильтр.
16. [FF-0360](v0.3.5/FF-0360.md) — добавить Studio products и авторские подборки.
17. [FF-0361](v0.3.5/FF-0361.md) — расширить Studio widgets до каталога категорий и presets.
18. [UX-TASK-038](ui-ux/UX-TASK-038.md) — после утверждения живого интерфейса исследовать и прототипировать маскота без экономики.
19. [UX-TASK-039](ui-ux/UX-TASK-039.md) — будущий discovery `world.fanfuel.ru`; production пока не строить.
20. [FF-0401](v0.4/FF-0401.md) — начинать Creator Store + Partners после обязательной стабилизации; production-маскот и World не являются блокером.
