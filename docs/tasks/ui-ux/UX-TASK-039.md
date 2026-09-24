# UX-TASK-039: провести discovery FanFuel World

Статус: future
Версия: future / world discovery
Приоритет: P2
Зависимость: UX-TASK-038

## Цель

Определить ценность и безопасный первый vertical slice для `world.fanfuel.ru` — отдельного дома/студии маскота с взаимодействиями и мини-играми.

## Что нужно сделать

- Описать аудиторию, core loop, первую сессию и связь с основным marketplace.
- Прототипировать одну комнату, базовое взаимодействие, одну мини-игру и несколько cosmetic-only предметов.
- Определить auth/session, privacy, age, storage, deployment и cross-domain security модель.
- Решить, нужен ли отдельный app/module, только через architecture review и ADR.
- До domain approval использовать local/mock progress.
- Провести product review перед снятием `DO_NOT_BUILD_YET`.

## Acceptance criteria

- Есть one-page brief, clickable/interactive prototype и тест первой сессии.
- Нет внутренней валюты, NFT, loot boxes, платных случайных наград, multiplayer или marketplace rewards.
- Риски privacy/security/age зафиксированы.
- Production scope, доменные сущности и API не создаются без отдельного одобрения.

## Что не делать

- Не создавать production route/app на этом этапе.
- Не связывать доступ или прогресс с суммой покупок/донатов.
- Не переносить игровую механику на основной marketplace.
