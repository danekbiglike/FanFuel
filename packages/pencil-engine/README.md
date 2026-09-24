# @fanfuel/pencil-engine

Изолированный прототип карандашного векторного рендерера для FanFuel (`UX-TASK-043`). Формат сцены, API, инструкция по авторингу, ограничения и план разработки: [docs/PENCIL_ENGINE.md](../../docs/PENCIL_ENGINE.md).

Из корня проекта:

```bash
npm run demo -w @fanfuel/pencil-engine
npm run test -w @fanfuel/pencil-engine
npm run typecheck -w @fanfuel/pencil-engine
npm run build:demo -w @fanfuel/pencil-engine
```

Анимационное демо находится по `/`, сравнение с референсом и загрузкой `.gbr` v2 — по `/study.html`. На странице сравнения можно включить живую микрофактуру 24 кадра/с; тяжёлый слой кэшируется по масштабу и кистям. Оба демо доступны после `npm run demo -w @fanfuel/pencil-engine`. Снимки на 180/512/1000 px — в `reference/`. Образец пока не достиг художественного сходства, пакет не подключён к production-приложениям.
