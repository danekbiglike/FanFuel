# Текущий практический фокус

`v0.3 Marketplace MVP` реализован локально. Перед расширением в `v0.4` нужно стабилизировать текущий слой и пройти промежуточный этап `v0.3.5 Aurora Refresh + Universal Profile + Studio Skins`, чтобы новый профиль, Studio, витрина автора и виджеты не росли поверх временного `/me/profile` и старого orange/black визуального слоя.

1. Провести ручной browser smoke для buyer/seller/admin marketplace flow: товар, checkout, mock payment, safe deal actions, review, admin moderation.
2. Добавить automated tests для order/mock safe deal transitions, idempotency, permission checks и базового UI smoke.
3. Разделить перегруженный `/me/profile`: оставить account/settings, а Studio goals/widgets вынести в отдельный role-aware dashboard.
4. Решить судьбу `FF-0105` upload avatar/banner: сделать до Creator Store или явно перенести в storage milestone.
5. Реализовать `v0.3.5`, начиная с Aurora Refresh текущих экранов: закрепить новый token/material baseline, обновить существующие public/marketplace/account/dashboard/widget поверхности, затем делать skin-ready дизайн, новый профиль пользователя, пользовательские подборки, полноценный Studio shell, статистику, последние события, настройки донатов, live-only витрину автора, products/collections, widget trigger rules, каталог виджетов и группы виджетов.
6. Двигаться к `v0.4 Creator Store + Partners` только после фиксации результатов проверок `v0.3` и `v0.3.5` в `docs/HANDOFF.md`.

Стоп-линия: реальные платежи, выплаты, refunds, ledger, disputes, fiscalization и production safe deal не подключать без `docs/PAYMENTS.md`, provider/legal review, API/domain docs и ADR.
