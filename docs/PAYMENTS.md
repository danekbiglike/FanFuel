# PAYMENTS.md

Документ описывает платёжную архитектуру FanFuel. Он не является юридическим заключением. Все спорные вопросы отмечаются как `LEGAL_REVIEW_REQUIRED`.

## Цели

- Не привязывать доменную модель к одному платёжному провайдеру.
- Поддержать mock provider для MVP.
- Подготовить интеграции с tome.ru, ЮKassa/ЮMoney или другим оператором.
- Корректно обработать safe deal, refunds, payouts, webhooks и idempotency.
- Разделить order status, payment status, deal status, payout status и balance ledger.

## Главный принцип

Ни один модуль продукта не должен напрямую вызывать конкретный SDK провайдера. Все операции проходят через adapter layer:

```txt
domain/usecase -> provider interface -> provider adapter -> external provider
```

Запрещено:

- хранить provider-specific statuses как единственный статус домена;
- писать `if provider == "yookassa"` в бизнес-логике;
- вызывать provider API из frontend;
- хранить деньги float-типами;
- смешивать выплаты продавцу и возвраты покупателю в одной таблице без ledger.

## Provider abstraction

```go
type PaymentProvider interface {
    CreatePayment(ctx context.Context, req CreatePaymentRequest) (*PaymentResult, error)
    GetPayment(ctx context.Context, providerPaymentID string) (*PaymentStatus, error)
    RefundPayment(ctx context.Context, req RefundRequest) (*RefundResult, error)
}

type PayoutProvider interface {
    CreatePayout(ctx context.Context, req CreatePayoutRequest) (*PayoutResult, error)
    GetPayout(ctx context.Context, providerPayoutID string) (*PayoutStatus, error)
}

type SafeDealProvider interface {
    CreateDeal(ctx context.Context, req CreateDealRequest) (*DealResult, error)
    CaptureDeal(ctx context.Context, req CaptureDealRequest) (*DealResult, error)
    CancelDeal(ctx context.Context, req CancelDealRequest) (*DealResult, error)
}

type FiscalizationProvider interface {
    CreateReceipt(ctx context.Context, req CreateReceiptRequest) (*ReceiptResult, error)
    RefundReceipt(ctx context.Context, req RefundReceiptRequest) (*ReceiptResult, error)
}

type ProviderWebhookHandler interface {
    VerifySignature(ctx context.Context, headers map[string]string, body []byte) error
    ParseEvent(ctx context.Context, body []byte) (*ProviderWebhookEvent, error)
}
```

## Provider-agnostic statuses

### Payment

- `created`;
- `pending`;
- `requires_action`;
- `succeeded`;
- `failed`;
- `cancelled`;
- `refunded`;
- `partially_refunded`.

### Payout

- `created`;
- `pending_review`;
- `processing`;
- `succeeded`;
- `failed`;
- `cancelled`;
- `returned`.

## UI status colors

Дизайн-система добавляет semantic UI tokens для финансовых и safe deal статусов. Эти цвета не являются частью доменной логики и не должны использоваться для provider mapping.

Правила:

- provider statuses по-прежнему маппятся только через adapter layer;
- UI показывает статус текстом и бейджем, а не только цветом;
- `held`, `payout`, `refunded`, `disputed`, `completed` — visual roles, не новые provider statuses;
- смена цвета в `packages/ui` не должна менять бизнес-смысл payment/deal/payout статусов.

### Refund

- `created`;
- `processing`;
- `succeeded`;
- `failed`;
- `cancelled`.

### Deal

- `created`;
- `awaiting_payment`;
- `paid`;
- `held`;
- `seller_working`;
- `seller_submitted`;
- `buyer_confirmed`;
- `auto_confirmed`;
- `disputed`;
- `resolved_to_buyer`;
- `resolved_to_seller`;
- `refunded`;
- `completed`;
- `cancelled`;
- `failed`.

## Status mapping

Для каждого адаптера нужна таблица маппинга:

```txt
provider_status -> internal_status
provider_event_type -> internal_event_type
provider_failure_code -> internal_failure_code
```

Сырые provider payloads сохраняются в `provider_webhooks` для аудита и повторной обработки.

## Mock provider

Mock provider нужен для `v0.2-v0.4`:

- deterministic payment success/failure;
- mock callback/webhook simulation через dev-only endpoint;
- refund simulation;
- payout simulation;
- safe deal simulation;
- idempotency behavior;
- тестовые сценарии ошибок.

Mock provider не должен притворяться финальной юридической моделью.

Статус `v0.2`: реализован минимальный mock donation flow. `POST /donations` создаёт `Payment` в status `pending`; success/failure наступает только после mock callback. Callback сохраняется в `provider_webhooks`, обрабатывается идемпотентно и публикует realtime-события через Redis.

Статус `v0.3`: mock provider расширен на orders. `POST /orders` создаёт `Payment` с `purpose=order`, `Order` в `awaiting_payment` и `Deal` в `awaiting_payment`; successful mock callback переводит payment в `succeeded`, order в `paid`, deal в `held`. Далее seller/buyer actions двигают mock safe deal: `held` → `seller_working` → `seller_submitted` → `completed`. Ledger, payouts, refunds, fiscalization, dispute resolution и реальные provider SDK не подключены.

Важно: `v0.3` safe deal — только domain/UI simulation поверх mock provider. Это не production escrow/hold и не юридическое обещание защиты.

Статус `v0.3.5`: публичный route `/safe-deal` может показывать только короткое пользовательское объяснение сценария: условия видны заранее, заказ проходит статусы, при проблеме можно обратиться в поддержку. Нельзя показывать provider-specific детали, юридические гарантии, обещания escrow/hold/capture или финальные правила споров до `LEGAL_REVIEW_REQUIRED` и provider review.

## Tome adapter plan

Перед реализацией:

- проверить поддерживаемые методы оплаты;
- проверить поддержку холда/safe deal;
- проверить webhooks и подписи;
- проверить refunds и partial refunds;
- проверить payouts физлицам, самозанятым, ИП/ООО;
- проверить фискализацию;
- проверить требования к категориям товаров;
- проверить лимиты и KYC;
- проверить договорную модель.

LEGAL_REVIEW_REQUIRED и PROVIDER_REVIEW_REQUIRED до production.

## ЮKassa/ЮMoney adapter plan

Перед реализацией:

- проверить актуальный API;
- проверить возможность marketplace/split/payout flow;
- проверить поддержку чеков;
- проверить ограничения по цифровым товарам и услугам;
- проверить webhooks, idempotency keys и refund API;
- проверить требования к идентификации получателей выплат;
- проверить применимость к safe deal.

LEGAL_REVIEW_REQUIRED и PROVIDER_REVIEW_REQUIRED до production.

## Idempotency

Idempotency применяется для:

- `POST /payments`;
- `POST /orders`;
- `POST /donations`;
- `POST /refunds`;
- `POST /payouts`;
- provider webhooks;
- safe deal state transitions.

Хранить:

- `idempotency_key`;
- `scope`;
- `request_hash`;
- `response_hash`;
- `status`;
- `created_at`;
- `expires_at`;

Правила:

- один ключ в одном scope возвращает один результат;
- если body отличается, вернуть conflict;
- provider webhook dedupe по `provider_event_id`;
- retries не должны создавать вторую оплату, выплату или refund.

## Webhooks

Требования:

- signature verification;
- timestamp tolerance, если провайдер поддерживает;
- сохранение raw body;
- сохранение headers;
- idempotent processing;
- отдельный статус обработки: `received`, `processed`, `failed`, `ignored`;
- retry worker;
- dead-letter strategy;
- audit log для финансовых переходов.

## Safe deal lifecycle

Базовый flow:

1. `created` — deal создан вместе с order.
2. `awaiting_payment` — ожидается оплата.
3. `paid` — провайдер подтвердил оплату.
4. `held` — средства удерживаются до выполнения условий.
5. `seller_working` — продавец начал выполнение.
6. `seller_submitted` — продавец заявил выполнение.
7. `buyer_confirmed` — покупатель подтвердил.
8. `auto_confirmed` — истёк срок ответа покупателя.
9. `completed` — начислены seller share, creator share и platform fee.
10. `disputed` — открыт спор.
11. `resolved_to_buyer` — решение в пользу покупателя.
12. `resolved_to_seller` — решение в пользу продавца.
13. `refunded` — полный или частичный возврат.

Сроки:

- `buyer_response_deadline_at`;
- `seller_response_deadline_at`;
- `auto_confirm_at`;
- `dispute_deadline_at`.

Все сроки должны быть конфигурируемыми, а не захардкоженными.

## Расчёт денег

В заказе хранить:

- `gross_amount_minor`;
- `discount_amount_minor`;
- `provider_fee_minor`;
- `platform_fee_minor`;
- `seller_amount_minor`;
- `creator_amount_minor`;
- `refund_amount_minor`;
- `currency`.

Правила:

- сумма частей должна сходиться;
- округление фиксируется в одном сервисе;
- нельзя использовать float;
- все расчёты аудируются через `balance_transactions`;
- provider fees могут быть неизвестны до webhook/settlement.

## Studio statistics не равна балансу

`v0.3.5` добавляет график динамики дохода в Studio. Это аналитический слой поверх событий донатов и заказов, а не финансовый ledger и не сумма к выводу.

Правила:

- статистика строится из `Donation`, `Order`, `Payment` и partner attribution events, но не создаёт денежных движений;
- суммы в статистике хранить и передавать только в minor units;
- UI не должен называть график банковским счётом, балансом или гарантированной выплатой;
- payout/available/frozen/pending amounts показывать только после `Wallet`/`BalanceTransaction`/`PayoutProvider` этапов;
- provider-specific payment statuses не должны попадать в график напрямую без domain mapping.

## Balance lifecycle

Вариант А: выплата сразу после завершения сделки.

Плюсы:

- меньше внутренней финансовой логики;
- проще MVP.

Минусы:

- сложнее управлять холдами и спорами;
- меньше контроля над лимитами;
- выше операционный риск.

Вариант Б: внутренний баланс продавца.

Состояния:

- `frozen`;
- `available`;
- `pending_payout`;
- `paid_out`;
- `withheld`;
- `refunded`;
- `disputed`.

Важно:

- не называть внутренний баланс банковским счётом;
- добавить юридические пометки;
- предусмотреть лимиты;
- предусмотреть ручной контроль;
- предусмотреть KYC при росте оборота;
- фиксировать все движения ledger-записями.

Рекомендация для roadmap: начать с модели ledger и mock payout, включить реальную выплату только после provider/legal review.

## Payout lifecycle

1. Seller создаёт payout request.
2. API проверяет available balance, лимиты и risk flags.
3. Payout получает статус `pending_review` или `processing`.
4. Admin approval требуется для high-risk или Seller Lite выше лимита.
5. PayoutProvider создаёт выплату.
6. Provider webhook подтверждает результат.
7. Ledger фиксирует `pending_payout`, затем `paid_out` или rollback.

## Refunds

Refund может быть:

- full refund;
- partial refund;
- refund после dispute;
- refund по admin action;
- provider-initiated/chargeback-like event, если провайдер поддерживает.

Требования:

- refund не может превысить paid amount;
- refund должен корректировать balance transactions;
- creator share и platform fee корректируются по правилам;
- digital file access может быть отозван, если применимо;
- все решения пишутся в audit log.

## Disputes

Спор может удерживать:

- seller payout;
- creator share;
- platform fee, если правила требуют;
- доступ к файлу, если это возможно.

Решения:

- `resolved_to_buyer`;
- `resolved_to_seller`;
- partial refund;
- manual adjustment.

LEGAL_REVIEW_REQUIRED для правил возвратов по цифровым товарам.

## Fiscalization placeholders

Фискализация не реализуется в MVP как реальная production-интеграция.

Нужно подготовить:

- `FiscalizationProvider`;
- `receipts` или provider receipt fields;
- receipt status;
- refund receipt flow;
- legal entity responsibility model.

LEGAL_REVIEW_REQUIRED:

- кто формирует чек;
- когда формируется чек;
- какие позиции включать;
- как оформлять донаты;
- как оформлять комиссию.

## Seller Lite

Особенности:

- быстрый старт;
- лимиты;
- выплаты на карту/СБП, если провайдер поддерживает;
- продавец сам отвечает за налоги;
- повышенный hold;
- усиленные anti-fraud checks;
- меньше продвижения.

LEGAL_REVIEW_REQUIRED:

- текст предупреждения о налогах;
- лимиты;
- идентификация;
- выплаты физлицам.

## Seller Pro

Особенности:

- verification;
- ИНН;
- больше лимиты;
- быстрее вывод;
- ниже комиссия;
- документы/отчёты;
- бейдж;
- расширенная аналитика;
- API/автовыдача в будущем.

LEGAL_REVIEW_REQUIRED:

- договорная модель;
- документы;
- налоговые и чековые обязанности.

## Legal risks

- 54-ФЗ и чеки.
- 115-ФЗ и AML/anti-fraud.
- Выплаты физлицам.
- Внутренний баланс.
- Safe deal и удержание средств.
- Цифровые товары после скачивания.
- Игровые услуги и ToS игр.
- Аккаунты, ключи, пополнения — не MVP.

## Что спросить у провайдера

- Поддерживаются ли marketplace payments?
- Есть ли split payments?
- Есть ли safe deal/hold/capture?
- Можно ли делать payouts физлицам, самозанятым, ИП, ООО?
- Какие лимиты?
- Какие KYC требования?
- Какие категории запрещены?
- Как работают webhooks?
- Есть ли webhook signatures?
- Есть ли idempotency keys?
- Поддерживаются ли partial refunds?
- Кто отвечает за фискализацию?
- Как оформляются чеки?
- Какой flow chargeback/dispute?
- Какие SLA по выплатам?
- Можно ли тестировать в sandbox?

## Что нельзя хардкодить

- provider name;
- provider statuses;
- provider fee formula;
- currency;
- commission rates;
- hold duration;
- auto-confirm duration;
- payout limits;
- fiscalization behavior;
- legal text;
- category restrictions.

UX-TASK-031: обнаружена выдача draft авторов публичными GET и допустимость draft в разрешении адресата доната. В связи с созданием приватных черновиков разрешён только published; PublicProfile скрывает непубличный creator_profile. Provider/суммы/проведение платежей не меняются. Изменение доступа намеренное, чтобы черновик не был публичным до публикации.
