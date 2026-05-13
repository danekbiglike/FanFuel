# TASKS.md

Короткий индекс задач FanFuel. Детальные описания вынесены в `docs/tasks/`, чтобы агент открывал только активный фокус и конкретные TASK-ID.

## Как читать

- Для выбора работы используйте блок `Активный фокус` ниже или файл [docs/tasks/active-focus.md](tasks/active-focus.md).
- После выбора открывайте только файл нужной задачи из `docs/tasks/.../<TASK-ID>.md`.
- Если задача меняет план, добавьте или обновите отдельный task-файл и ссылку в этом индексе.

## Активный фокус

Короткая очередь после локальной реализации `v0.3 Marketplace MVP`:

1. [FF-0307](tasks/v0.3/FF-0307.md) — стабилизировать Marketplace MVP проверками и smoke checklist.
2. [UX-TASK-007](tasks/ui-ux/UX-TASK-007.md) — разделить `/me/profile` на account/settings и role-aware Studio/Seller/Buyer dashboards.
3. [UX-TASK-010](tasks/ui-ux/UX-TASK-010.md) — проверить текущие web/admin/widget страницы на mobile и light/dark.
4. [FF-0105](tasks/v0.1/FF-0105.md) — решить и выполнить upload avatar/banner flow или явно перенести его в storage milestone.
5. [FF-0401](tasks/v0.4/FF-0401.md) — начинать Creator Store domain только после фиксации результатов пунктов выше в `docs/HANDOFF.md`.

## Индекс задач

### v0.0 — Foundation

- [FF-0001](tasks/v0.0/FF-0001.md) — Создать dev Docker Compose (статус: completed, приоритет: P0, версия: v0.0).
- [FF-0002](tasks/v0.0/FF-0002.md) — Создать skeleton monorepo приложений (статус: completed, приоритет: P0, версия: v0.0).
- [FF-0003](tasks/v0.0/FF-0003.md) — Создать skeleton Go services (статус: completed, приоритет: P0, версия: v0.0).
- [FF-0004](tasks/v0.0/FF-0004.md) — Добавить миграционный инструмент (статус: completed, приоритет: P0, версия: v0.0).
- [FF-0005](tasks/v0.0/FF-0005.md) — Создать i18n skeleton (статус: completed, приоритет: P0, версия: v0.0).
- [FF-0006](tasks/v0.0/FF-0006.md) — Создать базовый UI kit skeleton (статус: completed, приоритет: P1, версия: v0.0).
- [FF-0007](tasks/v0.0/FF-0007.md) — Настроить базовый CI outline (статус: completed, приоритет: P1, версия: v0.0).
- [FF-0008](tasks/v0.0/FF-0008.md) — Добавить seed data plan и dev fixtures (статус: completed, приоритет: P2, версия: v0.0).

### v0.1 — Auth + Profiles

- [FF-0101](tasks/v0.1/FF-0101.md) — Реализовать базовую auth модель (статус: completed, приоритет: P0, версия: v0.1).
- [FF-0102](tasks/v0.1/FF-0102.md) — Реализовать role/permission middleware (статус: completed, приоритет: P0, версия: v0.1).
- [FF-0103](tasks/v0.1/FF-0103.md) — Реализовать profile и public creator page API (статус: completed, приоритет: P0, версия: v0.1).
- [FF-0104](tasks/v0.1/FF-0104.md) — Создать базовую админку пользователей (статус: completed, приоритет: P1, версия: v0.1).
- [FF-0105](tasks/v0.1/FF-0105.md) — Добавить upload avatar/banner flow (статус: planned, приоритет: P1, версия: v0.1).
- [FF-0106](tasks/v0.1/FF-0106.md) — Добавить auth/profile frontend flows (статус: completed, приоритет: P1, версия: v0.1).

### v0.2 — Donate MVP

- [FF-0201](tasks/v0.2/FF-0201.md) — Реализовать donation domain и API (статус: completed, приоритет: P0, версия: v0.2).
- [FF-0202](tasks/v0.2/FF-0202.md) — Реализовать mock payment provider (статус: completed, приоритет: P0, версия: v0.2).
- [FF-0203](tasks/v0.2/FF-0203.md) — Реализовать donation page UI (статус: completed, приоритет: P0, версия: v0.2).
- [FF-0204](tasks/v0.2/FF-0204.md) — Реализовать OBS alert widget MVP (статус: completed, приоритет: P0, версия: v0.2).
- [FF-0205](tasks/v0.2/FF-0205.md) — Реализовать donation goals (статус: completed, приоритет: P1, версия: v0.2).
- [FF-0206](tasks/v0.2/FF-0206.md) — Добавить историю донатов и топ донатеров (статус: completed, приоритет: P2, версия: v0.2).
- [FF-0210](tasks/v0.2/FF-0210.md) — Внедрить дизайн-систему и глобальную темизацию (статус: completed, приоритет: P0, версия: v0.2).

### v0.3 — Marketplace MVP

- [FF-0301](tasks/v0.3/FF-0301.md) — Реализовать product categories (статус: completed, приоритет: P0, версия: v0.3).
- [FF-0302](tasks/v0.3/FF-0302.md) — Реализовать seller product CRUD (статус: completed, приоритет: P0, версия: v0.3).
- [FF-0303](tasks/v0.3/FF-0303.md) — Реализовать marketplace listing и product page (статус: completed, приоритет: P0, версия: v0.3).
- [FF-0304](tasks/v0.3/FF-0304.md) — Реализовать order и mock safe deal (статус: completed, приоритет: P0, версия: v0.3).
- [FF-0305](tasks/v0.3/FF-0305.md) — Реализовать базовую модерацию товаров (статус: completed, приоритет: P1, версия: v0.3).
- [FF-0306](tasks/v0.3/FF-0306.md) — Реализовать отзывы (статус: completed, приоритет: P2, версия: v0.3).
- [FF-0307](tasks/v0.3/FF-0307.md) — Стабилизировать Marketplace MVP проверками (статус: planned, приоритет: P0, версия: v0.3).

### v0.4 — Creator Store + Partners

- [FF-0401](tasks/v0.4/FF-0401.md) — Реализовать Creator Store domain (статус: planned, приоритет: P0, версия: v0.4).
- [FF-0402](tasks/v0.4/FF-0402.md) — Реализовать Creator Store UI (статус: planned, приоритет: P0, версия: v0.4).
- [FF-0403](tasks/v0.4/FF-0403.md) — Реализовать PromoCode domain (статус: planned, приоритет: P0, версия: v0.4).
- [FF-0404](tasks/v0.4/FF-0404.md) — Реализовать Affiliate attribution (статус: planned, приоритет: P0, версия: v0.4).
- [FF-0405](tasks/v0.4/FF-0405.md) — Добавить базовую аналитику для creator/seller (статус: planned, приоритет: P1, версия: v0.4).

### v0.5 — Real Payment Provider Integration

- [FF-0501](tasks/v0.5/FF-0501.md) — Реализовать provider interfaces и registry (статус: planned, приоритет: P0, версия: v0.5).
- [FF-0502](tasks/v0.5/FF-0502.md) — Реализовать provider webhook pipeline (статус: planned, приоритет: P0, версия: v0.5).
- [FF-0503](tasks/v0.5/FF-0503.md) — Подготовить tome adapter spike (статус: planned, приоритет: P1, версия: v0.5).
- [FF-0504](tasks/v0.5/FF-0504.md) — Подготовить ЮKassa/ЮMoney adapter spike (статус: planned, приоритет: P1, версия: v0.5).
- [FF-0505](tasks/v0.5/FF-0505.md) — Реализовать refunds MVP (статус: planned, приоритет: P0, версия: v0.5).
- [FF-0506](tasks/v0.5/FF-0506.md) — Реализовать safe deal lifecycle worker (статус: planned, приоритет: P0, версия: v0.5).

### v0.6 — Seller Balance + Payouts

- [FF-0601](tasks/v0.6/FF-0601.md) — Реализовать Wallet и BalanceTransaction (статус: planned, приоритет: P0, версия: v0.6).
- [FF-0602](tasks/v0.6/FF-0602.md) — Реализовать payout requests (статус: planned, приоритет: P0, версия: v0.6).
- [FF-0603](tasks/v0.6/FF-0603.md) — Реализовать admin payout review (статус: planned, приоритет: P0, версия: v0.6).
- [FF-0604](tasks/v0.6/FF-0604.md) — Реализовать Seller Lite/Pro limits (статус: planned, приоритет: P1, версия: v0.6).
- [FF-0605](tasks/v0.6/FF-0605.md) — Добавить базовую отчётность баланса (статус: planned, приоритет: P2, версия: v0.6).

### v0.7 — Disputes + Arbitration

- [FF-0701](tasks/v0.7/FF-0701.md) — Реализовать dispute domain (статус: planned, приоритет: P0, версия: v0.7).
- [FF-0702](tasks/v0.7/FF-0702.md) — Реализовать dispute evidence upload (статус: planned, приоритет: P0, версия: v0.7).
- [FF-0703](tasks/v0.7/FF-0703.md) — Реализовать dispute UI для buyer/seller (статус: planned, приоритет: P1, версия: v0.7).
- [FF-0704](tasks/v0.7/FF-0704.md) — Реализовать admin arbitration (статус: planned, приоритет: P0, версия: v0.7).
- [FF-0705](tasks/v0.7/FF-0705.md) — Добавить dispute notifications (статус: planned, приоритет: P1, версия: v0.7).

### v0.8 — Anti-fraud + Verification

- [FF-0801](tasks/v0.8/FF-0801.md) — Реализовать RiskFlag domain (статус: planned, приоритет: P0, версия: v0.8).
- [FF-0802](tasks/v0.8/FF-0802.md) — Добавить Seller Pro verification workflow (статус: planned, приоритет: P0, версия: v0.8).
- [FF-0803](tasks/v0.8/FF-0803.md) — Реализовать лимиты Seller Lite (статус: planned, приоритет: P0, версия: v0.8).
- [FF-0804](tasks/v0.8/FF-0804.md) — Добавить suspicious activity review queue (статус: planned, приоритет: P1, версия: v0.8).
- [FF-0805](tasks/v0.8/FF-0805.md) — Добавить audit log viewer (статус: planned, приоритет: P1, версия: v0.8).

### v0.9 — Mobile Web / PWA

- [FF-0901](tasks/v0.9/FF-0901.md) — Подготовить PWA baseline (статус: planned, приоритет: P0, версия: v0.9).
- [FF-0902](tasks/v0.9/FF-0902.md) — Адаптировать buyer mobile flows (статус: planned, приоритет: P0, версия: v0.9).
- [FF-0903](tasks/v0.9/FF-0903.md) — Адаптировать studio/seller mobile flows (статус: planned, приоритет: P1, версия: v0.9).
- [FF-0904](tasks/v0.9/FF-0904.md) — Подготовить push notification strategy (статус: planned, приоритет: P2, версия: v0.9).

### v1.0 — Public Beta

- [FF-1001](tasks/v1.0/FF-1001.md) — Подготовить production deployment (статус: planned, приоритет: P0, версия: v1.0).
- [FF-1002](tasks/v1.0/FF-1002.md) — Настроить backups и restore rehearsal (статус: planned, приоритет: P0, версия: v1.0).
- [FF-1003](tasks/v1.0/FF-1003.md) — Подготовить support и moderation workflows (статус: planned, приоритет: P0, версия: v1.0).
- [FF-1004](tasks/v1.0/FF-1004.md) — Провести legal/payment readiness review (статус: planned, приоритет: P0, версия: v1.0).
- [FF-1005](tasks/v1.0/FF-1005.md) — Подготовить controlled launch checklist (статус: planned, приоритет: P0, версия: v1.0).

### UI/UX задачи

- [UX-TASK-001](tasks/ui-ux/UX-TASK-001.md) — Создать UI/UX документацию и tracker статусов (статус: completed, приоритет: P0, версия: v0.2).
- [UX-TASK-002](tasks/ui-ux/UX-TASK-002.md) — Сверить текущие страницы с UI/UX tracker (статус: completed, приоритет: P0, версия: v0.2).
- [UX-TASK-003](tasks/ui-ux/UX-TASK-003.md) — Поддерживать UI/UX tracker после каждой UI-задачи (статус: planned, приоритет: P0, версия: v0.3).
- [UX-TASK-004](tasks/ui-ux/UX-TASK-004.md) — Привести главную страницу к spec v0.3 (статус: completed, приоритет: P1, версия: v0.3).
- [UX-TASK-005](tasks/ui-ux/UX-TASK-005.md) — Привести публичную страницу стримера к spec (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-006](tasks/ui-ux/UX-TASK-006.md) — Спроектировать marketplace page foundations перед реализацией (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-007](tasks/ui-ux/UX-TASK-007.md) — Привести dashboard layout к spec (статус: partial, приоритет: P0, версия: v0.3).
- [UX-TASK-008](tasks/ui-ux/UX-TASK-008.md) — Добавить стандартные empty/loading/error states (статус: completed, приоритет: P1, версия: v0.3).
- [UX-TASK-009](tasks/ui-ux/UX-TASK-009.md) — Обновить UX writing и i18n для новых состояний (статус: completed, приоритет: P1, версия: v0.3).
- [UX-TASK-010](tasks/ui-ux/UX-TASK-010.md) — Проверить mobile UX текущих страниц (статус: planned, приоритет: P1, версия: v0.3).
- [UX-TASK-011](tasks/ui-ux/UX-TASK-011.md) — Сделать marketplace главной точкой входа и поправить auth navigation (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-012](tasks/ui-ux/UX-TASK-012.md) — Сделать залогиненную верхнюю панель ближе к marketplace shell (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-013](tasks/ui-ux/UX-TASK-013.md) — Доуплотнить authenticated topbar и меню аккаунта (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-014](tasks/ui-ux/UX-TASK-014.md) — Сделать гостевое topbar menu похожим на auth shell (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-015](tasks/ui-ux/UX-TASK-015.md) — Отполировать topbar search на mobile (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-016](tasks/ui-ux/UX-TASK-016.md) — Сделать topbar search единым control и починить mobile auth API (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-017](tasks/ui-ux/UX-TASK-017.md) — Переделать `/marketplace` в мобильную главную маркетплейса (статус: completed, приоритет: P0, версия: v0.3).
- [UX-TASK-018](tasks/ui-ux/UX-TASK-018.md) — Упростить главную marketplace и добавить dev seed товары (статус: completed, приоритет: P0, версия: v0.3).

## Добавление новой задачи

1. Создать отдельный файл задачи в подходящей подпапке `docs/tasks/`.
2. Добавить ссылку на задачу в этот индекс и, если нужно, в `docs/tasks/active-focus.md`.
3. Если задача относится к новому roadmap-этапу, добавить или обновить файл в `docs/roadmap/`.
4. После работы обновить `docs/HANDOFF.md`; заметное изменение также добавить в `docs/CHANGELOG.md`.
