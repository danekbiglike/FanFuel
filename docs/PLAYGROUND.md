# Тестовая главная Ойли

Адрес: `https://playground.fanfuel.ru/`. Статус: публичная демонстрация `playground-v0.1`, задача `UX-TASK-044`. Это самостоятельная **статическая страница на том же nginx FanFuel VM**, без отдельного HTTP-процесса и без доступа к API. Существующий `fanfuel.ru` и его Docker-контейнеры не меняются при выпуске новой сборки playground.

Для просмотра с iPhone в домашнем Wi-Fi сейчас используется `http://192.168.0.104:8085/` без VPN. Windows-хост пересылает запросы через `infra/scripts/playground-lan-proxy.mjs` на локальный вход edge `http://192.168.0.250:8085/`, а edge проксирует статическую площадку на FanFuel VM с проверкой её HTTPS-сертификата. Прямой адрес edge отдаёт страницу с Windows, но с iPhone не открывался: edge VM не смог связаться с телефоном в Wi-Fi. Адрес Windows-хоста зависит от его LAN IP; после смены IP или перезагрузки хоста мост нужно запустить заново с актуальными адресами. Этот маршрут не зависит от публичного Static NAT. Порт 8085 не проброшен на роутере. HTTP-вход предназначен только для экспериментальной страницы без входа, API и покупок; не использовать его для основного сайта или передачи личных данных.

## Исходники

- `packages/pencil-engine/playground/index.html` — структура тестовой главной и фиктивные карточки.
- `packages/pencil-engine/playground/style.css` — semantic tokens обеих тем и адаптивная раскладка.
- `packages/pencil-engine/playground/golos.woff2` и `public/Golos-OFL.txt` — локальный шрифт с лицензией в сборке; внешние font-запросы не нужны.
- `packages/pencil-engine/playground/main.ts` — DOM-поверхности, ввод, физика, панель настроек и цикл рендера.
- `packages/i18n/src/playground.ts` — все подписи на русском и английском; цены форматируются общим `formatMoney`.
- `packages/pencil-engine/demo/soft-body-demo.ts` — временный источник осей упрощённого Ойли и пресетов карандаша. Художественные замены менять здесь, пока модель не выделена в отдельный asset.
- `packages/pencil-engine/demo/soft-body-worker.ts` — фоновый рендер. Один запрос выполняется, а новый заменяет ожидающий, чтобы не накапливать кадры.
- `packages/pencil-engine/src/soft-body.ts` и `src/contour.ts` — физика и растеризация.

Команды из корня репозитория:

```sh
npm run typecheck -w @fanfuel/pencil-engine
npm run test -w @fanfuel/pencil-engine
npm run build:playground -w @fanfuel/pencil-engine
```

Результат сборки: `packages/pencil-engine/dist-playground`. Для локального просмотра из `packages/pencil-engine` выполнить `npx vite preview --config vite.playground.config.ts --host 127.0.0.1 --port 5180`. Этот процесс нужен только для локальной разработки; опубликованная страница обслуживается nginx.

## Как развивать Ойли

1. Форму менять в исходных `PathCommand` или импортировать авторские штрихи как отдельный asset. Силуэт должен оставаться замкнутым: от него рассчитывается контакт с карточками и полом. Лицо и детали допускают открытые линии. Не строить коллайдер отдельно от видимого силуэта.
2. `PencilContourBrush.widthCss` — толщина в CSS px, независимая от размера персонажа. `pressureProfile` принадлежит штриху; настройки панели меняют масштаб нажима, его размах и фактуру. Заливка намеренно отсутствует в этом этапе.
3. Параметр `grainSpace: "stroke"` прикрепляет фактуру к материалу линии при деформации. `boilFrame` меняет мелкое зерно раз в 500 мс; форма при движении может обновляться до 24 раз/с. При неподвижной модели не запускается непрерывный рендер.
4. Для нового объекта сайта добавить `data-oily-surface="уникальный-id"` на его DOM-элемент. Поверхности перемеряются на scroll/resize и через `ResizeObserver`. Игровая физика использует координаты viewport, потому что слой Ойли фиксирован поверх страницы.
5. Новую настройку добавить в `defaults` в `playground/main.ts`, в `brushFor` или обработчик физики, и в оба словаря `packages/i18n/src/playground.ts`. Проверить клавиатуру, 390/1440 px, обе темы и reduced motion.

## Ограничения и производительность

Сейчас Ойли — упрощённый контур без заливки и отдельных жёстких деталей. На живой главной FanFuel этот актор ещё не подключён. `Canvas` хранит только обрезанную область персонажа; Worker рисует её вне основного потока. Верхняя граница удерживает быстрый бросок в viewport. Панель показывает время одного карандашного кадра, но это не полный бюджет страницы. Перед production-интеграцией измерить 1% худших кадров, память, scroll и батарею на слабом телефоне; исследовать кэш неподвижных форм и уменьшение DPR при перегрузке. Художественный вид должен подтвердить владелец.

## Публикация и откат

Конфигурации: `infra/nginx/fanfuel-playground-http.conf` для первичного HTTP-01, `infra/nginx/fanfuel-playground-tls.conf` для HTTPS, `infra/scripts/enable-playground-edge.sh` для двух маршрутов Host/SNI на edge. Certbot на FanFuel VM использует webroot `/var/www/letsencrypt`, отдельный сертификат `playground.fanfuel.ru` и существующий `certbot.timer` с deploy hook. Процедура и проверки описаны в `docs/DEPLOYMENT.md`.

Локальный Wi-Fi маршрут задаётся шаблоном `infra/nginx/fanfuel-playground-lan.conf.template` и устанавливается на edge скриптом `infra/scripts/enable-playground-lan.sh`. Для доступа через Windows-хост запустить из корня репозитория `node infra/scripts/playground-lan-proxy.mjs <WINDOWS_LAN_IP> 8085 <EDGE_LAN_IP> 8085`; процесс должен оставаться работающим. Он принимает только GET/HEAD от той же подсети `/24`. Маршрут не заменяет публичный HTTPS. Для отката edge удалить точный `include` этого файла из блока `http` в `/etc/nginx/nginx.conf`, удалить `/etc/nginx/http.d/fanfuel-playground-lan.conf`, проверить `nginx -t` и перезагрузить nginx; резервная копия исходного `nginx.conf` создаётся скриптом.

Сборку передавать на FanFuel VM в новый каталог `/var/www/fanfuel-playground/releases/<id>`, затем атомарно менять symlink `/var/www/fanfuel-playground/current`. Предыдущий release остаётся для отката: symlink возвращается на него, `nginx -t` и `systemctl reload nginx`. Не копировать незакоммиченные изменения основного Next.js сайта в production только ради playground.
