# Текущий практический фокус
> Актуализация 22.09.2026, UX-TASK-041: выполнена локальная реализация исправленного дизайна и commerce foundation. Ниже сохранена историческая очередь, её ограничения по storefront/promo заменены прямым запросом владельца. Реализованы /studio, visual storefront, seller identity/rates, точные аналоги, поиск и mock-атрибуция. Обзор: docs/MARKETPLACE_ALGORITHMS.md; визуальные материалы: docs/DESIGN_ASSETS.md. Следующие этапы: review дизайна, durable S3/R2, проверяемые canonical IDs, телеметрия, production payment review. Ойли теперь graphite WebP; полная игра World остаётся FUTURE.


> Решение 2026-09-22: актуальный контракт — UX-TASK-040 (`docs/tasks/ui-ux/UX-TASK-040.md`), статус implemented_local; product review и интеграционная проверка ожидаются. / и /marketplace: три вкладки только гостям, после входа — marketplace. /for-streamers и /for-sellers: полноценные презентации в гостевых вкладках и самостоятельные страницы через footer/поиск. Утверждён графит/лайм #cafa39, SVG-Ойли, лёгкий motion и стабильные skeleton. Этот контракт заменяет противоречащие указания Aurora и вкладок для всех ниже. Полная игра World остаётся FUTURE.

`v0.3 Marketplace MVP` реализован локально, но главная страница ещё не считается стабилизированной: текущая реализация частично соответствует новой структуре и при последующих изменениях дрейфует обратно в лендинг или в каталог только для стримеров. До расширения остальных публичных экранов нужно закрыть `UX-TASK-036` и получить явный product review.

1. `UX-TASK-036`: закрепить `/` и `/marketplace` как одну marketplace-first страницу для обычного покупателя; покупатель выбран по умолчанию, автор и продавец доступны вкладками, а creator/OBS-товары не определяют весь ассортимент.
2. Добавить regression checklist/UI smoke против возврата generic landing, role-first hero, fake content и streamer-only taxonomy; проверить `ru/en`, light/dark, 320/390/768/1440, данные и empty/error states.
3. Провести ручной browser smoke для buyer/seller/admin marketplace flow: товар, checkout, mock payment, safe deal actions, review, admin moderation.
4. Добавить automated tests для order/mock safe deal transitions, idempotency, permission checks и базового UI smoke.
5. После product review главной выполнить `UX-TASK-037`: выбрать более живой визуальный язык вместо generic corporate UI на прототипах реальных экранов. Aurora считать текущей token-базой, а не финальным характером бренда.
6. Продолжить scoped-задачи профиля и Studio: разделить `/me/profile`, решить `FF-0105`, затем выполнять `FF-0351+` без переписывания стабилизированной структуры главной.
7. После утверждения живого интерфейса выполнить `UX-TASK-038`: концепции, character bible и безопасный UI-пилот контекстного маскота без экономики.
8. `UX-TASK-039` оставить в discovery: исследовать `world.fanfuel.ru` и только после отдельного review решать, строить ли production vertical slice.
9. Двигаться к `v0.4 Creator Store + Partners` после фиксации результатов обязательных `v0.3`/`v0.3.5` проверок в `docs/HANDOFF.md`; production-маскот и World не являются блокером `v0.4`.

Стоп-линия: реальные платежи, выплаты, refunds, ledger, disputes, fiscalization и production safe deal не подключать без `docs/PAYMENTS.md`, provider/legal review, API/domain docs и ADR.

Отдельная стоп-линия: не создавать production `world.fanfuel.ru`, mascot economy, валюту, случайные платные награды или привязку прогресса к сумме покупок/донатов до снятия `DO_NOT_BUILD_YET`, product/security/privacy review и необходимых ADR.
