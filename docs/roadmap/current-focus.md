# Текущий практический фокус

`v0.3 Marketplace MVP` реализован локально, но перед расширением в `v0.4` нужно стабилизировать текущий слой:

1. Провести ручной browser smoke для buyer/seller/admin marketplace flow: товар, checkout, mock payment, safe deal actions, review, admin moderation.
2. Добавить automated tests для order/mock safe deal transitions, idempotency, permission checks и базового UI smoke.
3. Разделить перегруженный `/me/profile`: оставить account/settings, а Studio goals/widgets вынести в отдельный role-aware dashboard.
4. Решить судьбу `FF-0105` upload avatar/banner: сделать до Creator Store или явно перенести в storage milestone.
5. Двигаться к `v0.4 Creator Store + Partners` только после фиксации результатов проверок в `docs/HANDOFF.md`.

Стоп-линия: реальные платежи, выплаты, refunds, ledger, disputes, fiscalization и production safe deal не подключать без `docs/PAYMENTS.md`, provider/legal review, API/domain docs и ADR.
