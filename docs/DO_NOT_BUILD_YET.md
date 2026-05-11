# Do Not Build Yet

Документ фиксирует страницы и функции, которые не нужно создавать на текущем этапе. Если задача явно требует одну из этих функций, сначала изменить статус в `docs/UI_UX_TRACKER.md`, обновить specs/tasks и проверить зависимости.

| Фича/страница | Почему не делать сейчас | Можно вернуться после | Зависимости |
|---|---|---|---|
| Нативное iOS приложение | Roadmap сначала web, затем PWA; native apps не MVP. | future после v1.0 | Stable web/PWA, mobile strategy. |
| Нативное Android приложение | То же, что iOS. | future после v1.0 | Stable web/PWA, mobile strategy. |
| Сложная рекламная биржа | FanFuel не должен превращаться в ad exchange до marketplace fit. | future | Marketplace traction, legal review. |
| ML-рекомендации | Нет данных, не MVP, высокий риск непрозрачности. | future | Данные, privacy review, experimentation policy. |
| Полноценные игровые аккаунты | Рискованные категории, ToS/legal/payment ограничения. | Только после review | LEGAL_REVIEW_REQUIRED, PAYMENT_REVIEW. |
| Пополнения и ключи без проверки | Высокие legal/payment риски. | После separate category review | Provider constraints, category policy. |
| Автоматическая налоговая интеграция | Требует юридической модели и provider/fiscalization review. | После v1.0 readiness | Legal/fiscalization provider. |
| Сложный антифрод и ML scoring | v0.8 предполагает ручные risk flags, не ML. | future | RiskFlag domain, data, review. |
| Публичное API для продавцов | Не входит в MVP, повышает поддержку и security surface. | future | Seller Pro, API auth policy, rate limits. |
| Сложные кастомные темы стримеров | v0.2-v0.4 достаточно базовой структуры и semantic tokens. | future | Theme config schema, moderation. |
| Drag-and-drop редактор страниц | Высокая сложность, отвлекает от marketplace/safe deal. | future | Stable creator store, editor spec. |
| Полноценная CRM | Не входит в creator-commerce MVP. | future | Support/seller workflows, privacy policy. |
| Сложный биллинг для крупных компаний | Не целевая ранняя аудитория. | future | B2B scope, invoicing/legal. |
| Real payment provider UI | Нельзя без provider/legal/payment review. | v0.5 | `PaymentProvider`, webhooks, legal review. |
| Real payouts UI | Влияет на деньги и юридические обязательства. | v0.6 | `PayoutProvider`, wallet, ledger, review. |
| Seller Pro verification form | Нельзя собирать данные без состава и legal review. | v0.8 | Verification model, file security, legal. |
| Dispute/arbitration production UI | Требует rules/refunds/evidence/legal review. | v0.7 | Disputes, evidence storage, audit/refunds. |
| Risky marketplace categories | Не входят в MVP. | После отдельного review | Category policy, provider approval. |
| Full automated arbitration | Операционно и юридически рискованно. | future | Legal/SOP/support readiness. |
| Multi-level affiliate network | Сложность и риски attribution/abuse. | future | Simple attribution proven. |
| Public widget settings through token URL | Widget URL должен быть read-only. | NOT_PLANNED | Studio settings only. |
| Secret/provider settings UI | Риск утечки секретов. | После security design | Secret storage policy, audit. |
| Fake marketplace pages без backend | Создаёт ложное ощущение готовности. | v0.3 после API | Product/category/order domain. |
| Fake analytics dashboards | Метрики должны иметь источник. | v0.4 после events | Analytics events/snapshots. |

## Правила для агентов

- Если страница нужна в будущем, добавьте её в `PAGE_MAP`, `PAGE_SPECS` и `UI_UX_TRACKER`, но не создавайте production route.
- Если пользователь просит будущую фичу, уточните scope через документацию и отметьте зависимость.
- Если фича связана с деньгами, сначала сверить `docs/PAYMENTS.md`.
- Если фича связана с legal text, использовать `LEGAL_REVIEW_REQUIRED`.
- Если фича не входит в текущий этап, добавьте задачу в `docs/TASKS.md`, но не пишите код.
