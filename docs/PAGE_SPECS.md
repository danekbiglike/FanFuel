# Page Specs

Источник истины для целевого UI/UX страниц FanFuel. Если страница есть в `docs/PAGE_MAP.md`, она должна иметь spec здесь или в таблице кратких specs. Страница со статусом `FUTURE`, `PAYMENT_REVIEW`, `LEGAL_REVIEW` или пометкой `DO_NOT_BUILD_YET` не создаётся в коде без отдельной задачи на изменение статуса.

## Общие правила для всех Page Specs

- Все пользовательские тексты идут через `packages/i18n`.
- Все цвета и состояния идут через semantic tokens из `packages/ui`.
- Loading, Empty, Error, Unauthorized, Forbidden, Mobile и Desktop состояния должны быть спроектированы до реализации.
- Для финансовых действий нужен confirmation и provider-agnostic status.
- Юридические формулировки помечать `LEGAL_REVIEW_REQUIRED`.
- Платёжные формулировки и flows сверять с `docs/PAYMENTS.md`.

## PAGE-HOME: Главная

Статус: IMPLEMENTED  
Route: `/`  
Раздел: Public  
Роль пользователя: guest, buyer, streamer, seller  
Версия появления: v0.2  
Не создавать до: —  
Связанные документы: `README.md`, `ROADMAP.md`, `docs/UX_PLAN.md`, `docs/UI_UX_TRACKER.md`  
Связанные компоненты: `AppTopBar`, `Button`, `Badge`, `Panel`, `ThemeSwitcher`

### Назначение страницы

Открывать FanFuel сразу с marketplace как главной продуктовой точки входа.

### Пользовательская цель

Сразу попасть в каталог, где видны товары, продавцы, условия и преимущества покупки через FanFuel.

### Бизнес-цель

Сформировать первое доверие и направить пользователя в регистрацию, marketplace или публичный пример автора.

### Когда пользователь попадает сюда

При открытии корневого URL, из бренда в topbar, из внешних ссылок.

### Основные блоки страницы

- Redirect `/` → `/marketplace`.
- Marketplace page содержит buyer-facing benefits перед каталогом.
- Ролевые лендинги вынесены в `/for-buyers`, `/for-streamers`, `/for-sellers`.

### Основные действия пользователя

- Зарегистрироваться.
- Войти.
- Открыть профиль.
- В будущей версии открыть marketplace или страницу для роли.

### Данные, которые нужны странице

- i18n copy.
- Не требует API данных в v0.2.
- В будущем: featured categories/products только после marketplace API.

### Состояния страницы

#### Loading

Не требуется для статического v0.2. Для будущих featured products использовать skeleton cards.

#### Empty

Если нет featured products, показывать нейтральный блок "Маркетплейс готовится", не фальшивые товары.

#### Error

Ошибки загрузки внешних блоков не должны ломать главную.

#### Success

Не применяется.

#### Unauthorized

Не применяется.

#### Forbidden

Не применяется.

#### Mobile

Первый экран должен показывать название, ценность и один главный CTA без горизонтального скролла.

#### Desktop

Использовать два смысловых столбца: copy + product/control preview.

### UX-правила

Не использовать агрессивную монетизационную риторику. Не обещать безопасную сделку как абсолютную гарантию.

### UI-правила

Semantic tokens, неон и glow не использовать. Не превращать страницу в generic SaaS landing.

### Что уже реализовано

Корневой route перенаправляет на `/marketplace`; отдельные ролевые лендинги реализованы для покупателей, стримеров и продавцов.

### Что нужно изменить

Провести screenshot QA для `/marketplace` и ролевых лендингов на mobile/light/dark.

### Что не нужно делать сейчас

Не возвращать generic SaaS landing на `/` без отдельного изменения IA.

### Acceptance criteria

- Пользователь за 5 секунд понимает, что FanFuel связан с авторами, донатами и цифровыми товарами.
- CTA не спорят между собой.
- Тексты через i18n.
- Light/dark/mobile работают.

### Зависимости

Marketplace API для динамических блоков.

### Комментарии для будущих агентов

Если добавляете новый блок с пользовательским текстом, сначала обновите i18n и tracker.

## PAGE-AUTH-LOGIN: Вход

Статус: PARTIAL  
Route: `/auth/login`  
Раздел: Auth  
Роль пользователя: guest  
Версия появления: v0.1  
Не создавать до: —  
Связанные документы: `docs/SECURITY.md`, `docs/I18N.md`  
Связанные компоненты: `AppTopBar`, `Button`, `Input`, `Alert`

### Назначение страницы

Дать пользователю безопасно войти в аккаунт.

### Пользовательская цель

Ввести email/password и попасть в нужный кабинет.

### Бизнес-цель

Снизить friction входа и не раскрывать данные о существовании аккаунта.

### Когда пользователь попадает сюда

Из topbar, после unauthorized state, при попытке открыть закрытую страницу.

### Основные блоки страницы

- Заголовок.
- Email/password форма.
- CTA входа.
- Ссылка на регистрацию.
- Future: восстановление пароля.

### Основные действия пользователя

- Войти.
- Перейти к регистрации.
- Future: восстановить пароль.

### Данные, которые нужны странице

- Auth API `/api/v1/auth/login`.
- i18n ошибки API.

### Состояния страницы

#### Loading

Disabled submit + label loading.

#### Empty

Не применяется.

#### Error

Показывать локализованную ошибку рядом с формой.

#### Success

Переход в marketplace. Если пользователь уже авторизован и открывает `/auth/login`, страница перенаправляет на `/marketplace`.

#### Unauthorized

Это сама unauthorized entry page.

#### Forbidden

Не применяется.

#### Mobile

Форма одна колонка, label видимый, кнопки не переполняют ширину.

#### Desktop

Narrow auth layout.

### UX-правила

Не различать "email не найден" и "пароль неверный" в публичном тексте.

### UI-правила

Label обязателен, placeholder не заменяет label.

### Что уже реализовано

Форма email/password, loading submit, i18n ошибки, компактный auth layout, redirect на `/marketplace` и redirect уже авторизованного пользователя.

### Что нужно изменить

Добавить forgot password после backend flow, role-aware next step после onboarding, Alert component и skeleton/focus QA.

### Что не нужно делать сейчас

Не добавлять OAuth без отдельного решения.

### Acceptance criteria

- Ошибки не раскрывают лишние данные.
- После входа пользователь попадает в понятный next step.
- Тексты через i18n.

### Зависимости

Password reset и session policy.

### Комментарии для будущих агентов

Не менять auth storage policy без ADR.

## PAGE-AUTH-REGISTER: Регистрация

Статус: PARTIAL  
Route: `/auth/register`  
Раздел: Auth  
Роль пользователя: guest  
Версия появления: v0.1  
Не создавать до: —  
Связанные документы: `docs/SECURITY.md`, `docs/I18N.md`, `docs/INFORMATION_ARCHITECTURE.md`  
Связанные компоненты: `AppTopBar`, `Button`, `Select`, `Alert`

### Назначение страницы

Создать аккаунт и первичную роль пользователя.

### Пользовательская цель

Зарегистрироваться как покупатель, стример или продавец.

### Бизнес-цель

Получить корректный role intent и начать onboarding без ручной настройки.

### Когда пользователь попадает сюда

Из главной, role landing pages, checkout или protected routes.

### Основные блоки страницы

- Email/password/display name.
- Выбор role intent.
- CTA создания аккаунта.
- Ссылка на вход.

### Основные действия пользователя

- Создать аккаунт.
- Выбрать роль.
- Перейти во вход.

### Данные, которые нужны странице

- Auth API `/api/v1/auth/register`.
- i18n ошибки и role labels.

### Состояния страницы

#### Loading

Disabled submit + loading label.

#### Empty

Не применяется.

#### Error

Локализованные validation/API errors.

#### Success

Переход в onboarding или role dashboard. Сейчас `/me/profile`.

#### Unauthorized

Не применяется.

#### Forbidden

Admin role не может быть выбран публично.

#### Mobile

Все поля читаемы, select не обрезает длинные роли.

#### Desktop

Narrow auth layout.

### UX-правила

Role intent должен объяснять последствия без перегруза.

### UI-правила

Форма не должна превращаться в onboarding wizard до отдельной задачи.

### Что уже реализовано

Email/password/display name, role intent buyer/streamer/seller, redirect.

### Что нужно изменить

Вынести полноценный выбор роли и onboarding на отдельные pages в v0.3.

### Что не нужно делать сейчас

Не добавлять admin/support/moderator как публичные варианты.

### Acceptance criteria

- Public registration не выдаёт admin.
- Тексты и ошибки через i18n.
- Пользователь понимает, куда попадёт после регистрации.

### Зависимости

Role-aware navigation.

### Комментарии для будущих агентов

Если меняется список ролей, обновить backend validation, i18n, IA и docs.

## PAGE-ME-PROFILE: Профиль и временный mini studio

Статус: NEEDS_REWORK  
Route: `/me/profile`  
Раздел: Auth  
Роль пользователя: authenticated, multi-role  
Версия появления: v0.1  
Не создавать до: —  
Связанные документы: `docs/INFORMATION_ARCHITECTURE.md`, `docs/UI_UX_TRACKER.md`  
Связанные компоненты: `AppTopBar`, `ThemeSettingsPanel`, `Panel`, `Button`, `GoalCard`, `WidgetPreviewContainer`

### Назначение страницы

Сейчас страница служит временным центром аккаунта, studio controls и seller settings.

### Пользовательская цель

Отредактировать профиль, тему, публичную страницу автора, цели, widgets или seller profile.

### Бизнес-цель

На v0.1-v0.2 дать рабочий MVP без полноценной IA кабинетов.

### Когда пользователь попадает сюда

После login/register, из topbar, из unauthorized redirects.

### Основные блоки страницы

- Sidebar с ролями.
- Theme settings.
- Account profile form.
- Creator profile form.
- Donation goals form/list.
- Widget create/rotate token.
- Seller profile form.

### Основные действия пользователя

- Сохранить профиль.
- Выйти.
- Открыть публичную страницу.
- Создать цель.
- Создать/ротировать widget token.
- Обновить seller profile.

### Данные, которые нужны странице

- `/api/v1/auth/me`.
- `/api/v1/me/profile`.
- `/api/v1/me/preferences`.
- `/api/v1/studio/profile`.
- `/api/v1/studio/goals`.
- `/api/v1/studio/widgets`.
- `/api/v1/seller/profile`.

### Состояния страницы

#### Loading

Сейчас plain text. Нужно заменить на skeleton layout.

#### Empty

Для целей/widgets показывать EmptyState с next action.

#### Error

Ошибка сейчас общая; нужна привязка к секции.

#### Success

Success message не должен перекрывать следующую форму.

#### Unauthorized

Показывать login CTA.

#### Forbidden

Для отсутствующей роли не показывать секцию, но объяснять где добавить роль в будущем.

#### Mobile

Sidebar уходит вверх, формы одна колонка, token input не ломает layout.

#### Desktop

Двухколоночный settings layout допустим только временно.

### UX-правила

Не добавлять новые крупные функции сюда. Новые Studio/Seller/Buyer flows должны получать отдельные pages.

### UI-правила

Сохранить semantic tokens, заменить inline list patterns на shared components постепенно.

### Что уже реализовано

Рабочие profile/studio/seller forms, создание goals/widgets, theme settings.

### Что нужно изменить

Разделить на `/buyer`, `/studio`, `/seller`, `/me/settings` или equivalent по IA v0.3. В текущем topbar `/me/settings` и `/studio` показываются как "скоро", пока отдельные страницы не реализованы.

### Что не нужно делать сейчас

Не переписывать весь кабинет без UX-TASK-007.

### Acceptance criteria

- `/me/profile` остаётся стабильным временным fallback.
- Новые flows не добавляются в эту страницу.
- Нет регрессии v0.2 Donate MVP.

### Зависимости

Role switcher, dashboard layout, route guards.

### Комментарии для будущих агентов

Эта страница является главным UX-долгом текущей реализации.

## PAGE-CREATOR-PUBLIC: Публичная страница стримера

Статус: PARTIAL  
Route: `/creators/[slug]`  
Раздел: Public  
Роль пользователя: guest, buyer, streamer  
Версия появления: v0.2  
Не создавать до: —  
Связанные документы: `docs/PAYMENTS.md`, `docs/DOMAIN_MODEL.md`, `docs/UI_STATES.md`  
Связанные компоненты: `AppTopBar`, `Button`, `Panel`, `Badge`, `GoalCard`, `DonationCard`

### Назначение страницы

Публичная страница автора, где зритель может понять автора и поддержать его донатом.

### Пользовательская цель

Открыть автора, увидеть цели, отправить донат, посмотреть историю поддержки.

### Бизнес-цель

Доказать Donate MVP и подготовить основу для creator store.

### Когда пользователь попадает сюда

По ссылке автора, из marketplace/store, из donation alert/share.

### Основные блоки страницы

- Creator hero: avatar/banner/title/description/status.
- Donation form.
- Donation goals.
- Donation history.
- Top donors.
- Future: creator store, promo codes, partner disclosure.

### Основные действия пользователя

- Отправить донат.
- Выбрать цель.
- Включить анонимность.
- Завершить mock payment в dev.
- Future: открыть товар из витрины.

### Данные, которые нужны странице

- `/api/v1/creators/{slug}`.
- `/api/v1/creators/{slug}/goals`.
- `/api/v1/creators/{slug}/donations`.
- `/api/v1/donations`.
- `/api/v1/mock/payments/{id}/succeed` только dev.

### Состояния страницы

#### Loading

Skeleton creator hero + donation form placeholder.

#### Empty

Нет целей: не показывать пустой блок или показать мягкий текст. Нет донатов: EmptyState с "Пока нет донатов".

#### Error

Если creator не найден, показать not found state и ссылку на главную.

#### Success

После успешного доната показать payment status и обновить историю/цель.

#### Unauthorized

Донат разрешён guest, если backend policy позволяет.

#### Forbidden

Blocked/hidden creator не должен принимать донаты.

#### Mobile

Donation form после hero, sticky CTA допустим только после QA.

#### Desktop

Hero/content слева, donation form справа.

### UX-правила

Донат должен быть быстрым. Mock payment помечать как dev-only в будущем UI, если остаётся доступен.

### UI-правила

Не делать страницу похожей на casino/gaming neon. Автор должен быть главным объектом первого viewport.

### Что уже реализовано

Creator hero, donation form, goals, history, top donors, mock payment completion.

### Что нужно изменить

Добавить banner/avatar upload flow после storage, улучшить loading/empty/error states, вынести donate route decision.

### Что не нужно делать сейчас

Не добавлять store blocks до v0.4 и marketplace domain.

### Acceptance criteria

- Донат создаётся idempotently.
- Payment status понятен.
- Цели обновляются после successful payment.
- Пустые states не выглядят как ошибка.

### Зависимости

Storage upload, marketplace, real payment provider review.

### Комментарии для будущих агентов

Публичная страница автора не должна стать dumping ground для всех creator features.

## PAGE-CREATOR-DONATE: Донат-страница стримера

Статус: PARTIAL  
Route: `/creators/[slug]/donate`  
Раздел: Public  
Роль пользователя: guest, buyer  
Версия появления: v0.2  
Не создавать до: отдельный route только после UX decision  
Связанные документы: `docs/PAYMENTS.md`, `docs/UX_RULES.md`  
Связанные компоненты: `Button`, `Input`, `Select`, `Alert`, `WidgetPreviewContainer`

### Назначение страницы

Сфокусированный donate flow без витрины и длинного профиля автора.

### Пользовательская цель

Быстро отправить донат и понять статус оплаты.

### Бизнес-цель

Увеличить conversion donation flow для ссылок из OBS/соцсетей.

### Когда пользователь попадает сюда

По прямой donate-ссылке автора, из CTA публичной страницы.

### Основные блоки страницы

- Мини hero автора.
- Сумма/валюта.
- Имя/анонимность.
- Сообщение.
- Выбор цели.
- Preview alert, если доступен.
- Payment status.

### Основные действия пользователя

Отправить донат, завершить оплату, вернуться к автору.

### Данные, которые нужны странице

Creator summary, active goals, donation/payment APIs.

### Состояния страницы

#### Loading

Skeleton формы и creator summary.

#### Empty

Если нет целей, select показывает "Без цели".

#### Error

Validation у поля; payment error отдельным Alert.

#### Success

Спасибо + статус оплаты + ссылка на автора.

#### Unauthorized

Guest donation допустим по policy.

#### Forbidden

Donations disabled/creator blocked.

#### Mobile

Форма одна колонка, CTA виден без перекрытия.

#### Desktop

Narrow checkout-like layout.

### UX-правила

Один главный CTA. Ошибки оплаты писать человеческим языком.

### UI-правила

Не добавлять marketplace recommendations в donate flow.

### Что уже реализовано

Логика доната реализована внутри `/creators/[slug]`.

### Что нужно изменить

Решить, нужен ли отдельный route в v0.3 или оставить embedded flow.

### Что не нужно делать сейчас

Не создавать route без задачи и redirect strategy.

### Acceptance criteria

Если route создаётся, он использует тот же domain flow и не дублирует бизнес-логику.

### Зависимости

Donate MVP, payment provider abstraction.

### Комментарии для будущих агентов

Статус `PARTIAL` означает "flow есть", а не "route существует".

## PAGE-MARKETPLACE: Маркетплейс

Статус: IMPLEMENTED  
Route: `/marketplace`  
Раздел: Marketplace  
Роль пользователя: guest, buyer  
Версия появления: v0.3  
Не создавать до: реализовано в v0.3  
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/API_PLAN.md`, `docs/UX_RULES.md`  
Связанные компоненты: `AppTopBar`, `ProductCard`, `Tabs`, `Badge`, `EmptyState`, `Skeleton`, `Pagination`

### Назначение страницы

Дать покупателю каталог цифровых товаров и услуг с понятной безопасностью и авторской поддержкой.

### Пользовательская цель

Найти товар, сравнить условия, открыть карточку.

### Бизнес-цель

Запустить marketplace foundations без рискованных категорий и без рекламной биржи.

### Когда пользователь попадает сюда

Из главной, role landing, creator store, поиска и topbar search.

### Основные блоки страницы

- Search на странице и search в верхней панели для гостя и авторизованного пользователя.
- Category tabs/list.
- Filters: цена, формат, seller status, safe deal.
- Sort.
- Product cards.
- Empty/search no results.
- Legal/category warning для restricted категорий.

### Основные действия пользователя

Искать, фильтровать, открыть товар, применить category route. Гость и авторизованный пользователь могут отправить запрос из верхней панели, не открывая сначала каталог.

### Данные, которые нужны странице

Categories, product list, seller summary, price, rating, delivery type, safe deal flag.

### Состояния страницы

#### Loading

Skeleton grid.

#### Empty

Пояснить, что в категории пока нет товаров, и предложить изменить фильтр.

#### Error

Retry action, не скрывать navigation.

#### Success

Product grid loaded.

#### Unauthorized

Browsing allowed for guests.

#### Forbidden

Restricted category hidden or explained.

#### Mobile

Filters in drawer, cards single column.

#### Desktop

Filter sidebar + product grid.

### UX-правила

Карточка товара показывает цену, продавца, условия и safe deal. Не перегружать бейджами.

### UI-правила

No fake products. Если нет API, страница не создаётся.

### Что уже реализовано

Реализованы каталог `/marketplace`, загрузка категорий/товаров из API, query/category/sort filters, buyer-facing benefits block, loading/empty/error states и topbar search для гостя/авторизованного пользователя, который ведёт в `/marketplace?query=...`.

### Что нужно изменить

Провести screenshot QA mobile/light/dark; позже улучшить mobile filters как drawer и добавить отдельные category routes только после уточнения spec.

### Что не нужно делать сейчас

Не делать статический каталог без backend.

### Acceptance criteria

- Поиск и фильтры не ломают mobile.
- Empty/error/loading states есть.
- Risky categories не доступны без review.

### Зависимости

ProductCategory, Product, seller profile, moderation.

### Комментарии для будущих агентов

Marketplace — ближайший крупный UX milestone, но не должен появляться как набор заглушек.

## PAGE-PRODUCT: Карточка товара

Статус: IMPLEMENTED  
Route: `/marketplace/products/[slug]`  
Раздел: Marketplace  
Роль пользователя: guest, buyer  
Версия появления: v0.3  
Не создавать до: реализовано в v0.3  
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UX_WRITING.md`  
Связанные компоненты: `ProductCard`, `Badge`, `Panel`, `OrderStatusCard`, `Alert`

### Назначение страницы

Показать товар, условия, продавца и процесс покупки.

### Пользовательская цель

Понять, что покупает, кто продавец, сколько стоит, какие условия и как защищена покупка.

### Бизнес-цель

Конвертировать просмотр в безопасный order.

### Когда пользователь попадает сюда

Из marketplace, категории, creator store, promo link.

### Основные блоки страницы

- Медиа/preview.
- Название, цена, CTA.
- Seller card.
- Terms/delivery.
- Safe deal explanation.
- Creator support attribution, если есть.
- Reviews.
- Similar products позже.

### Основные действия пользователя

Купить, применить промокод позже, открыть seller profile, открыть reviews.

### Данные, которые нужны странице

Product snapshot, seller summary, category, media, price, rating, safe_deal_required, affiliate percent.

### Состояния страницы

#### Loading

Skeleton media + info.

#### Empty

Не применяется.

#### Error

Not found/hidden/restricted states.

#### Success

Data loaded, CTA enabled.

#### Unauthorized

Guest может смотреть, покупка может потребовать login по policy.

#### Forbidden

Restricted product/category.

#### Mobile

CTA не перекрывает legal/safe deal text.

#### Desktop

Sticky purchase summary допустим.

### UX-правила

Цена и условия видны до CTA. Safe deal объясняется процессом.

### UI-правила

Не скрывать продавца и delivery terms в accordion по умолчанию.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Добавить после Product API.

### Что не нужно делать сейчас

Не создавать fake product page.

### Acceptance criteria

- Покупатель видит цену, продавца, условия и safe deal.
- CTA один главный.
- Тексты через i18n.

### Зависимости

Products, reviews, checkout/order.

### Комментарии для будущих агентов

Юридические слова про гарантии помечать `LEGAL_REVIEW_REQUIRED`.

## PAGE-CHECKOUT: Checkout товара

Статус: IMPLEMENTED  
Route: `/checkout/[productId]`  
Раздел: Marketplace  
Роль пользователя: buyer  
Версия появления: v0.3  
Не создавать до: реализовано в v0.3  
Связанные документы: `docs/PAYMENTS.md`, `docs/SECURITY.md`  
Связанные компоненты: `OrderStatusCard`, `DealTimeline`, `Alert`, `Button`, `Badge`

### Назначение страницы

Безопасно оформить покупку товара.

### Пользовательская цель

Проверить состав заказа, цену, скидку, вклад автору и оплатить.

### Бизнес-цель

Создать order/payment/deal без дублей и путаницы статусов.

### Когда пользователь попадает сюда

После CTA покупки на product/creator store.

### Основные блоки страницы

- Order summary.
- Price breakdown.
- Promo code.
- Creator support attribution.
- Safe deal explanation.
- Payment method/confirmation.
- Terms acknowledgement.

### Основные действия пользователя

Применить промокод, подтвердить заказ, оплатить, вернуться к товару.

### Данные, которые нужны странице

Order draft, product snapshot, seller, creator attribution, promo validation, payment status.

### Состояния страницы

#### Loading

Skeleton order summary.

#### Empty

Order draft expired: предложить вернуться к товару.

#### Error

Payment/order errors с retry.

#### Success

Переход на order page.

#### Unauthorized

Login/register inline или redirect.

#### Forbidden

Blocked user/product unavailable.

#### Mobile

Price summary виден до кнопки оплаты.

#### Desktop

Two-column checkout layout.

### UX-правила

Финансовое действие требует явного подтверждения.

### UI-правила

Не показывать provider-specific details, если они не нужны пользователю.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Спроектировать после API order draft.

### Что не нужно делать сейчас

Не подключать реальные платежи до v0.5 review.

### Acceptance criteria

- Idempotency key используется для создания order/payment.
- Деньги форматируются helper.
- Status payment/deal/order не смешиваются.

### Зависимости

Order, PaymentProvider, SafeDeal mock.

### Комментарии для будущих агентов

Если меняется money breakdown, обновить `docs/PAYMENTS.md` и ADR.

## PAGE-BUYER-ORDER: Страница заказа

Статус: IMPLEMENTED  
Route: `/buyer/orders/[id]`  
Раздел: Buyer  
Роль пользователя: buyer  
Версия появления: v0.3  
Не создавать до: реализовано в v0.3 mock lifecycle  
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UI_STATES.md`  
Связанные компоненты: `OrderStatusCard`, `DealTimeline`, `Alert`, `Button`

### Назначение страницы

Показать покупателю статус заказа и следующий шаг.

### Пользовательская цель

Понять, что происходит с заказом, что нужно сделать и какие сроки.

### Бизнес-цель

Снизить поддержку и подготовить safe deal/dispute lifecycle.

### Когда пользователь попадает сюда

После checkout, из истории покупок, из уведомлений.

### Основные блоки страницы

- Order summary.
- Status card.
- Safe deal timeline.
- Seller/contact rules.
- Files/delivery result.
- Actions: confirm, open dispute, review.

### Основные действия пользователя

Подтвердить получение, открыть спор, оставить отзыв, скачать файл если разрешено.

### Данные, которые нужны странице

Order, deal, payment, product snapshot, seller, deadlines, allowed actions.

### Состояния страницы

#### Loading

Skeleton status/timeline.

#### Empty

Order not found.

#### Error

Retry и request id.

#### Success

Status loaded and next action clear.

#### Unauthorized

Login required.

#### Forbidden

Order belongs to another user.

#### Mobile

Timeline compact, actions sticky only if не перекрывает сроки.

#### Desktop

Summary + timeline + side actions.

### UX-правила

Пользователь всегда видит следующий шаг и deadline.

### UI-правила

Статус не передаётся только цветом.

### Что уже реализовано

Не реализовано.

### Что нужно изменить

Добавить в v0.3 после order API.

### Что не нужно делать сейчас

Не делать dispute UI до v0.7.

### Acceptance criteria

- Buyer видит только свой заказ.
- Order/deal/payment statuses разделены.
- Опасные действия подтверждаются.

### Зависимости

Order lifecycle, deal events, file access.

### Комментарии для будущих агентов

Если добавляется download, проверить private file permissions.

## PAGE-STUDIO-DASHBOARD: Streamer Studio dashboard

Статус: PLANNED  
Route: `/studio`  
Раздел: Creator  
Роль пользователя: streamer  
Версия появления: v0.3  
Не создавать до: v0.3 dashboard layout task  
Связанные документы: `docs/INFORMATION_ARCHITECTURE.md`, `docs/UX_RULES.md`  
Связанные компоненты: `Sidebar`, `TopBar`, `DashboardPanel`, `StatCard`, `EmptyState`

### Назначение страницы

Единый рабочий обзор автора: донаты, цели, widgets, публичная страница, задачи.

### Пользовательская цель

Быстро понять состояние поддержки и перейти к настройке.

### Бизнес-цель

Сделать creator retention и подготовить creator store.

### Когда пользователь попадает сюда

После регистрации как streamer, из role switcher, из topbar. До реализации route пункт topbar помечается как "скоро" и не ведёт на future page.

### Основные блоки страницы

- Primary next action.
- Donation summary.
- Active goal.
- Widget connection status.
- Public page status.
- Alerts/tasks.
- Future: store/partner summary.

### Основные действия пользователя

Открыть публичную страницу, создать цель, настроить widget, посмотреть донаты.

### Данные, которые нужны странице

Current user, creator profile, donation summary, goals, widgets.

### Состояния страницы

#### Loading

Dashboard skeleton panels.

#### Empty

Новый стример: checklist setup.

#### Error

Retry per panel.

#### Success

Overview loaded.

#### Unauthorized

Login required.

#### Forbidden

Нет роли streamer: предложить добавить роль/onboarding.

#### Mobile

Panels one column; sidebar becomes mobile nav.

#### Desktop

Sidebar + dashboard grid.

### UX-правила

Dashboard начинается с главных действий, а не с набора статистики.

### UI-правила

Не перегружать control-room стилем.

### Что уже реализовано

Часть функций есть в `/me/profile`.

### Что нужно изменить

Вынести Studio из профиля.

### Что не нужно делать сейчас

Не добавлять store/partners до v0.4.

### Acceptance criteria

- Автор видит next action.
- Goals/widgets доступны за один переход.
- `/me/profile` не дублирует новую логику.

### Зависимости

Role switcher, dashboard layout, existing studio APIs.

### Комментарии для будущих агентов

Это одна из первых UI задач v0.3.

## PAGE-SELLER-DASHBOARD: Seller dashboard

Статус: IMPLEMENTED  
Route: `/seller`  
Раздел: Seller  
Роль пользователя: seller  
Версия появления: v0.3  
Не создавать до: реализовано в v0.3  
Связанные документы: `docs/DOMAIN_MODEL.md`, `docs/PAYMENTS.md`, `docs/UX_RULES.md`  
Связанные компоненты: `Sidebar`, `DashboardPanel`, `StatCard`, `Table`, `Badge`

### Назначение страницы

Рабочий центр продавца: товары, заказы, модерация, первые продажи.

### Пользовательская цель

Понять, что нужно сделать, чтобы товар был опубликован и продавался.

### Бизнес-цель

Запустить supply side marketplace без операционного хаоса.

### Когда пользователь попадает сюда

После seller onboarding, из role switcher.

### Основные блоки страницы

- Setup checklist.
- Product moderation status.
- Recent orders.
- Seller profile status.
- Future: balance/payout summary.

### Основные действия пользователя

Создать товар, открыть заказы, обновить seller profile.

### Данные, которые нужны странице

Seller profile, product summary, order summary, moderation queue status.

### Состояния страницы

#### Loading

Dashboard skeleton.

#### Empty

Новый seller: создать первый товар.

#### Error

Retry per panel.

#### Success

Dashboard loaded.

#### Unauthorized

Login required.

#### Forbidden

Нет роли seller: предложить onboarding.

#### Mobile

Checklist above metrics.

#### Desktop

Sidebar + dense panels.

### UX-правила

Не показывать payout/balance как доступные, пока они не реализованы.

### UI-правила

Статусы модерации бейджами.

### Что уже реализовано

Seller profile fields есть в `/me/profile`.

### Что нужно изменить

Создать dashboard после product domain.

### Что не нужно делать сейчас

Не добавлять выплаты до v0.6.

### Acceptance criteria

- Seller понимает next action.
- Нет fake revenue metrics.
- Empty state ведёт к созданию товара.

### Зависимости

Products, moderation, seller profile.

### Комментарии для будущих агентов

Не смешивать Seller Lite/Pro legal copy без review.

## PAGE-ADMIN-USERS: Пользователи

Статус: PARTIAL  
Route: `/admin/users` целевой, сейчас `apps/admin /`  
Раздел: Admin  
Роль пользователя: admin  
Версия появления: v0.1  
Не создавать до: —  
Связанные документы: `docs/SECURITY.md`, `docs/DOMAIN_MODEL.md`  
Связанные компоненты: `TopBar`, `Table`, `Badge`, `Modal`, `Alert`

### Назначение страницы

Просмотр пользователей и управление базовым статусом.

### Пользовательская цель

Админ находит пользователя и блокирует/активирует при необходимости.

### Бизнес-цель

Минимальная операционная безопасность до marketplace.

### Когда пользователь попадает сюда

После входа в admin app.

### Основные блоки страницы

- Admin login guard.
- Users list.
- Role tags.
- Status.
- Actions block/activate.
- Future: filters, user details, audit link.

### Основные действия пользователя

Войти, загрузить пользователей, заблокировать/активировать, выйти.

### Данные, которые нужны странице

`/api/v1/admin/users`, `/api/v1/admin/users/{id}/status`.

### Состояния страницы

#### Loading

Table skeleton, disabled actions.

#### Empty

Нет пользователей: показать explanation.

#### Error

Forbidden/unauthorized/API errors separately.

#### Success

Status updated + reload.

#### Unauthorized

Login form.

#### Forbidden

Показать, что нужна admin role.

#### Mobile

Table превращается в summary rows.

#### Desktop

Admin table with filters.

### UX-правила

Блокировка пользователя — опасное действие, нужна confirmation.

### UI-правила

Не показывать лишние персональные данные в таблице.

### Что уже реализовано

Login, list, roles, status, block/activate.

### Что нужно изменить

Добавить confirmation, filters, details, audit link, route alignment.

### Что не нужно делать сейчас

Не добавлять CRM или bulk actions.

### Acceptance criteria

- Non-admin получает forbidden.
- Status change auditable.
- Опасное действие подтверждается.

### Зависимости

Audit log viewer для ссылок.

### Комментарии для будущих агентов

Текущий Vite admin screen работает, но IA admin ещё не оформлена.

## PAGE-WIDGET-ALERT: Alert widget

Статус: PARTIAL  
Route: `apps/widget /?token=...`  
Раздел: Widget  
Роль пользователя: OBS browser source  
Версия появления: v0.2  
Не создавать до: —  
Связанные документы: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`  
Связанные компоненты: `WidgetPreviewContainer`, widget CSS tokens

### Назначение страницы

Показать OBS alert при успешном донате.

### Пользовательская цель

Стример видит алерт в OBS без ручного обновления.

### Бизнес-цель

Доказать realtime donation loop.

### Когда пользователь попадает сюда

OBS Browser Source открывает URL с token.

### Основные блоки страницы

- Connection status.
- Waiting state.
- Live donation alert.
- Optional transparent/panel theme.

### Основные действия пользователя

Пользователь не действует в widget; настройка только в Studio.

### Данные, которые нужны странице

Widget token, WebSocket `/ws/alerts`, realtime events.

### Состояния страницы

#### Loading

Waiting/connecting label.

#### Empty

Нет alert: waiting state.

#### Error

Token missing/disconnected.

#### Success

Live alert rendered.

#### Unauthorized

Missing/invalid token.

#### Forbidden

Revoked/disabled widget token.

#### Mobile

Не основной сценарий, но preview должен быть responsive.

#### Desktop

OBS canvas safe area.

### UX-правила

Widget read-only. Token не логировать и не показывать повторно после создания.

### UI-правила

Анимации должны уважать reduced motion; transparent mode должен читаться поверх OBS.

### Что уже реализовано

WebSocket connect, reconnect, event dedupe, theme query.

### Что нужно изменить

Добавить studio preview/settings, configurable alert variants, better error states.

### Что не нужно делать сейчас

Не добавлять публичное редактирование настроек через widget URL.

### Acceptance criteria

- Alert появляется только после confirmed payment event.
- Reconnect работает.
- Duplicate event не дублирует alert.

### Зависимости

Widget settings API, preview fixtures.

### Комментарии для будущих агентов

Новые widget pages должны оставаться лёгкими и не тянуть Next.js.

## Краткие specs для остальных страниц

Эти specs краткие, потому что страницы ещё не должны реализовываться или зависят от будущих доменных слоёв. Перед началом работы по любой из них нужно раскрыть spec до полного формата выше.

| ID                           | Статус         | Route                              | Роль пользователя  | Назначение и основные блоки                                        | Состояния и UX-правила                                 | Что уже реализовано                                                     | Что не делать сейчас                   | Acceptance criteria                  | Зависимости                  |
| ---------------------------- | -------------- | ---------------------------------- | ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------- | ------------------------------------ | ---------------------------- |
| PAGE-FOR-STREAMERS           | IMPLEMENTED    | `/for-streamers`                   | guest/streamer     | Объяснить донаты, OBS, страницу автора, мягкую монетизацию.        | Static loading не нужен; mobile hero с одним CTA.      | Ролевой landing с preview flow и CTA регистрации.                       | Не делать generic SaaS.                | Стример понимает next action.        | i18n, role onboarding.       |
| PAGE-FOR-SELLERS             | IMPLEMENTED    | `/for-sellers`                     | guest/seller       | Объяснить продажи через авторов, Seller Lite/Pro, модерацию.       | LEGAL_REVIEW для налоговых формулировок.               | Ролевой landing с preview flow и осторожным текстом про выплаты/review. | Не обещать выплаты/налоги.             | Seller понимает ограничения MVP.     | seller profile, marketplace. |
| PAGE-FOR-BUYERS              | IMPLEMENTED    | `/for-buyers`                      | guest/buyer        | Объяснить безопасную покупку, поддержку автора, историю заказов.   | Safe deal без абсолютных гарантий.                     | Ролевой landing про преимущества marketplace и buyer order path.        | Не делать страховые обещания.          | Buyer понимает, что покупает.        | marketplace/order.           |
| PAGE-MARKETPLACE-CATEGORY    | PLANNED        | `/marketplace/categories/[slug]`   | guest/buyer        | Breadcrumbs, category description, filters, product grid.          | Empty category, restricted category warning.           | Нет.                                                                    | Не включать risky categories.          | Фильтры работают на mobile.          | categories/products.         |
| PAGE-CREATOR-STORE           | FUTURE         | `/creators/[slug]/store`           | guest/buyer        | Витрина автора, подборки, partner disclosure, promo.               | Empty store, product unavailable, attribution visible. | Нет.                                                                    | DO_NOT_BUILD_YET до v0.4.              | Покупатель видит вклад автора.       | CreatorStore, StoreItem.     |
| PAGE-SAFE-DEAL               | PAYMENT_REVIEW | `/safe-deal`                       | guest/buyer/seller | Объяснить hold, confirmation, disputes, refunds.                   | LEGAL_REVIEW_REQUIRED для гарантий.                    | Нет.                                                                    | Не обещать абсолютную защиту.          | Текст проверен legal/payment.        | provider/legal review.       |
| PAGE-FAQ                     | PLANNED        | `/faq`                             | all                | Ответы по донатам, покупкам, ролям, поддержке.                     | Search/no result future.                               | Нет.                                                                    | Не писать финальный legal copy.        | FAQ покрывает support top questions. | support workflows.           |
| PAGE-TERMS                   | LEGAL_REVIEW   | `/legal/terms`                     | all                | Legal placeholder.                                                 | Clearly marked placeholder.                            | Нет.                                                                    | Не писать финальный договор.           | LEGAL_REVIEW_REQUIRED виден в docs.  | legal review.                |
| PAGE-PRIVACY                 | LEGAL_REVIEW   | `/legal/privacy`                   | all                | Privacy placeholder.                                               | Clearly marked placeholder.                            | Нет.                                                                    | Не писать финальную политику.          | LEGAL_REVIEW_REQUIRED виден в docs.  | legal review.                |
| PAGE-AUTH-RESET              | BLOCKED        | `/auth/reset-password`             | guest              | Email request, token form, success.                                | Token expired/error states.                            | Нет.                                                                    | Не делать UI без backend.              | Flow one-time and limited.           | password reset backend.      |
| PAGE-AUTH-VERIFY             | BLOCKED        | `/auth/verify`                     | guest/user         | Email/phone verification status.                                   | Pending/expired/resend states.                         | Нет.                                                                    | Не имитировать verified.               | Verification status clear.           | verification backend.        |
| PAGE-AUTH-ROLE               | PLANNED        | `/auth/role`                       | authenticated      | Выбор/добавление роли после регистрации.                           | Multi-role explanation.                                | Нет.                                                                    | Не добавлять admin role.               | Роль ведёт в нужный onboarding.      | role APIs.                   |
| PAGE-ONBOARDING              | PLANNED        | `/onboarding`                      | authenticated      | Checklist by role.                                                 | Empty/new user states.                                 | Нет.                                                                    | Не строить длинный wizard без данных.  | User reaches next dashboard.         | role switcher.               |
| PAGE-ME-SETTINGS             | PLANNED        | `/me/settings`                     | authenticated      | Account preferences, theme, locale, notifications, security links. | Save/error/unauthorized; mobile compact settings list. | Нет; часть настроек временно в `/me/profile`.                           | Не смешивать Studio/Seller controls.   | Settings separated from profile.     | user preferences.            |
| PAGE-BUYER-DASHBOARD         | IMPLEMENTED    | `/buyer`                           | buyer              | Overview orders, statuses, mock totals.                            | Empty first purchase.                                  | Да.                                                                     | Не добавлять fake recommendations.     | Next action clear.                   | orders.                      |
| PAGE-BUYER-PURCHASES         | PLANNED        | `/buyer/purchases`                 | buyer              | Purchases list with statuses.                                      | Empty/history, filters.                                | Нет.                                                                    | Не показывать чужие orders.            | Buyer sees own purchases.            | orders.                      |
| PAGE-BUYER-DISPUTE           | FUTURE         | `/buyer/disputes/[id]`             | buyer              | Dispute timeline/evidence/deadlines.                               | LEGAL_REVIEW wording.                                  | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.              | Buyer sees deadlines/evidence.       | disputes, files.             |
| PAGE-BUYER-FAVORITES         | FUTURE         | `/buyer/favorites`                 | buyer              | Saved products/creators.                                           | Empty favorites.                                       | Нет.                                                                    | Не делать до product UX.               | Saved items list.                    | products.                    |
| PAGE-BUYER-PROMOCODES        | FUTURE         | `/buyer/promocodes`                | buyer              | Active/used promo codes.                                           | Expired/empty states.                                  | Нет.                                                                    | Не делать до PromoCode.                | Promo status clear.                  | PromoCode.                   |
| PAGE-BUYER-SETTINGS          | PLANNED        | `/buyer/settings`                  | buyer              | Buyer profile, locale, notifications.                              | Save/error/unauthorized.                               | Частично в `/me/profile`.                                               | Не смешивать seller/studio.            | Settings scoped to buyer.            | user preferences.            |
| PAGE-STUDIO-PUBLIC-PAGE      | PLANNED        | `/studio/page`                     | streamer           | Public title/description/status/avatar/banner.                     | Preview, hidden/blocked states.                        | Частично в `/me/profile`.                                               | Не делать drag-and-drop editor.        | Public page settings clear.          | storage upload.              |
| PAGE-STUDIO-DONATIONS        | PLANNED        | `/studio/donations`                | streamer           | Donation list, filters, totals.                                    | Empty, loading, error.                                 | API есть, UI нет.                                                       | Не добавлять payouts.                  | Creator sees donation history.       | studio donations API.        |
| PAGE-STUDIO-GOALS            | PARTIAL        | `/studio/goals`                    | streamer           | Goals list/create/edit/pause.                                      | Empty first goal, validation.                          | Частично в `/me/profile`.                                               | Не добавлять complex campaigns.        | Goal lifecycle clear.                | goals API.                   |
| PAGE-STUDIO-ALERTS           | PLANNED        | `/studio/alerts`                   | streamer           | Alert style settings, preview.                                     | Preview fallback.                                      | Нет.                                                                    | Не делать custom designer.             | Alert preview before OBS.            | widget config.               |
| PAGE-STUDIO-WIDGETS          | PARTIAL        | `/studio/widgets`                  | streamer           | Widget list, token create/rotate, preview.                         | Token visible once, revoked state.                     | Частично в `/me/profile`.                                               | Не показывать token повторно.          | OBS setup understandable.            | widgets API.                 |
| PAGE-STUDIO-STORE            | FUTURE         | `/studio/store`                    | streamer           | Manage creator store.                                              | Empty store setup.                                     | Нет.                                                                    | DO_NOT_BUILD_YET до v0.4.              | Store items ordered.                 | marketplace.                 |
| PAGE-STUDIO-PARTNERS         | FUTURE         | `/studio/partners`                 | streamer           | Partner products and attribution.                                  | Empty partner catalog.                                 | Нет.                                                                    | Не делать ad exchange.                 | Disclosure clear.                    | AffiliateLink.               |
| PAGE-STUDIO-PROMOCODES       | FUTURE         | `/studio/promocodes`               | streamer           | Creator promo codes.                                               | Expired/usage states.                                  | Нет.                                                                    | До PromoCode domain не делать.         | Promo use transparent.               | PromoCode.                   |
| PAGE-STUDIO-ANALYTICS        | FUTURE         | `/studio/analytics`                | streamer           | Donation/store analytics.                                          | No data state.                                         | Нет.                                                                    | Не показывать fake metrics.            | Metrics traceable.                   | analytics snapshots.         |
| PAGE-STUDIO-PAYOUTS          | PAYMENT_REVIEW | `/studio/payouts`                  | streamer           | Balance/payout requests.                                           | Pending/failed/held states.                            | Нет.                                                                    | Не делать до v0.6 review.              | Money states accurate.               | wallet/payout provider.      |
| PAGE-STUDIO-SETTINGS         | PLANNED        | `/studio/settings`                 | streamer           | Creator settings, privacy, notifications.                          | Save/error states.                                     | Частично в `/me/profile`.                                               | Не смешивать account settings.         | Scoped settings.                     | user/creator APIs.           |
| PAGE-SELLER-PRODUCTS         | IMPLEMENTED    | `/seller/products`                 | seller             | Products list, moderation statuses.                                | Empty first product.                                   | Да.                                                                     | Не делать risky categories.            | Seller sees product status.          | products.                    |
| PAGE-SELLER-PRODUCT-NEW      | IMPLEMENTED    | `/seller/products/new`             | seller             | Product creation form.                                             | Validation, draft save.                                | Да.                                                                     | Не автопубликовать без moderation.     | Product draft created.               | products/categories.         |
| PAGE-SELLER-PRODUCT-EDIT     | PLANNED        | `/seller/products/[id]/edit`       | seller             | Edit product details.                                              | Published/pending restrictions.                        | Нет.                                                                    | Не менять old order snapshots.         | Changes versioned/safe.              | products.                    |
| PAGE-SELLER-ORDERS           | IMPLEMENTED    | `/seller/orders`                   | seller             | Orders queue.                                                      | Empty and action states.                               | Да.                                                                     | Не смешивать payouts.                  | Seller sees next action.             | orders.                      |
| PAGE-SELLER-DEALS            | PAYMENT_REVIEW | `/seller/deals`                    | seller             | Safe deal statuses.                                                | Held/disputed/deadline states.                         | Нет.                                                                    | Не делать до v0.5.                     | Deal status clear.                   | safe deal.                   |
| PAGE-SELLER-DISPUTES         | FUTURE         | `/seller/disputes`                 | seller             | Dispute queue and evidence.                                        | Deadline states.                                       | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.              | Seller sees response deadline.       | disputes.                    |
| PAGE-SELLER-PROMOCODES       | FUTURE         | `/seller/promocodes`               | seller             | Promo code creation and usage.                                     | Limit/expired states.                                  | Нет.                                                                    | Не делать до PromoCode.                | Promo conflicts handled.             | PromoCode.                   |
| PAGE-SELLER-AFFILIATE        | FUTURE         | `/seller/partners`                 | seller             | Partner percent/campaigns.                                         | Empty creator partners.                                | Нет.                                                                    | Не делать ad exchange.                 | Attribution transparent.             | affiliate model.             |
| PAGE-SELLER-ANALYTICS        | FUTURE         | `/seller/analytics`                | seller             | Sales/product/creator analytics.                                   | No data state.                                         | Нет.                                                                    | No fake metrics.                       | Metrics sourced.                     | orders/events.               |
| PAGE-SELLER-PAYOUTS          | PAYMENT_REVIEW | `/seller/payouts`                  | seller             | Available/frozen/pending payout.                                   | Pending/rejected/failed.                               | Нет.                                                                    | Не называть банковским счётом.         | Ledger matches UI.                   | wallet/payouts.              |
| PAGE-SELLER-SETTINGS         | PLANNED        | `/seller/settings`                 | seller             | Seller profile and policies.                                       | Save/error states.                                     | Частично в `/me/profile`.                                               | Не добавлять Pro verification здесь.   | Settings scoped.                     | seller profile.              |
| PAGE-SELLER-VERIFY-PRO       | LEGAL_REVIEW   | `/seller/verification/pro`         | seller             | Pro request and document placeholders.                             | Pending/rejected states.                               | Нет.                                                                    | Не собирать лишние данные.             | LEGAL_REVIEW before fields.          | legal/file security.         |
| PAGE-ADMIN-DASHBOARD         | PLANNED        | `/admin`                           | admin              | Overview queues and risks.                                         | Empty queues.                                          | Частично root admin app.                                                | Не делать vanity metrics.              | Admin sees priority queues.          | admin APIs.                  |
| PAGE-ADMIN-SELLERS           | PLANNED        | `/admin/sellers`                   | admin              | Seller moderation/list.                                            | Empty/filter states.                                   | Нет.                                                                    | Не блокировать без audit.              | Seller actions auditable.            | seller profiles.             |
| PAGE-ADMIN-STREAMERS         | PLANNED        | `/admin/streamers`                 | admin              | Creator moderation/list.                                           | Empty/filter states.                                   | Нет.                                                                    | Не менять public pages без audit.      | Actions auditable.                   | creator profiles.            |
| PAGE-ADMIN-PRODUCTS          | PARTIAL        | `/admin/products`                  | admin              | Product moderation.                                                | Pending/rejected states.                               | Частично в root admin app.                                              | Не approve risky categories.           | Moderation reason captured.          | products/categories.         |
| PAGE-ADMIN-CATEGORIES        | PLANNED        | `/admin/categories`                | admin              | Category management.                                               | Restricted/legal flags.                                | Нет.                                                                    | Не открывать risky categories.         | Flags visible.                       | category model.              |
| PAGE-ADMIN-ORDERS            | PLANNED        | `/admin/orders`                    | admin              | Order lookup/read-only.                                            | Not found/permission.                                  | Нет.                                                                    | Не добавлять manual money changes.     | Data minimal.                        | orders.                      |
| PAGE-ADMIN-DEALS             | PAYMENT_REVIEW | `/admin/deals`                     | admin              | Deal overview/actions later.                                       | Held/disputed states.                                  | Нет.                                                                    | Не менять money statuses без review.   | Provider-agnostic.                   | safe deal/ledger.            |
| PAGE-ADMIN-DISPUTES          | FUTURE         | `/admin/disputes`                  | admin              | Arbitration queue.                                                 | Evidence/deadline states.                              | Нет.                                                                    | DO_NOT_BUILD_YET до v0.7.              | Decision audited.                    | disputes/refunds.            |
| PAGE-ADMIN-PAYOUTS           | PAYMENT_REVIEW | `/admin/payouts`                   | admin              | Payout review queue.                                               | Pending/processing/failed.                             | Нет.                                                                    | Не approve real payouts.               | Audit mandatory.                     | payout provider.             |
| PAGE-ADMIN-PAYMENTS          | PAYMENT_REVIEW | `/admin/payments`                  | admin              | Payment list/status.                                               | Provider webhook states.                               | Нет.                                                                    | Не показывать secrets.                 | Status mapping clear.                | payment provider.            |
| PAGE-ADMIN-MODERATION        | PLANNED        | `/admin/moderation`                | admin              | Unified moderation queues.                                         | Empty queues.                                          | Нет.                                                                    | Не делать auto-ban.                    | Next action visible.                 | products/profiles.           |
| PAGE-ADMIN-ANTIFRAUD         | FUTURE         | `/admin/anti-fraud`                | admin              | Risk flags queue.                                                  | Severity/open/resolved.                                | Нет.                                                                    | Не делать ML scoring.                  | Manual review clear.                 | RiskFlag.                    |
| PAGE-ADMIN-AUDIT             | PLANNED        | `/admin/audit-log`                 | admin              | Audit log viewer.                                                  | Empty/filter/no access.                                | Нет.                                                                    | Не редактировать audit.                | Mask sensitive data.                 | audit logs.                  |
| PAGE-ADMIN-SETTINGS          | FUTURE         | `/admin/settings`                  | admin              | Platform settings.                                                 | Confirmation states.                                   | Нет.                                                                    | Не хранить provider secrets в UI.      | Dangerous changes confirmed.         | provider config policy.      |
| PAGE-WIDGET-GOAL             | PLANNED        | `/goal?token=...`                  | OBS                | Donation goal overlay.                                             | Waiting/no goal/reconnect.                             | Нет.                                                                    | Не делать без goal config.             | Goal updates realtime.               | goals WS event.              |
| PAGE-WIDGET-PURCHASE         | FUTURE         | `/purchase-alert?token=...`        | OBS                | Purchase alert.                                                    | Waiting/live/error.                                    | Нет.                                                                    | DO_NOT_BUILD_YET до purchase events.   | Purchase event dedupe.               | marketplace events.          |
| PAGE-WIDGET-FEED             | FUTURE         | `/activity-feed?token=...`         | OBS                | Activity feed overlay.                                             | Empty/feed overflow.                                   | Нет.                                                                    | Не делать unified feed без model.      | Events ordered/deduped.              | activity model.              |
| PAGE-WIDGET-PREVIEW          | PLANNED        | `/studio/widgets/preview`          | streamer           | Studio preview of widgets.                                         | Mock event states.                                     | Нет.                                                                    | Не использовать real token in preview. | Preview matches OBS.                 | widget config.               |
| PAGE-WIDGET-SETTINGS-PREVIEW | PLANNED        | `/studio/widgets/settings-preview` | streamer           | Settings preview panel.                                            | Save/error preview.                                    | Нет.                                                                    | Не делать drag-and-drop editor.        | Changes visible before save.         | widget config.               |
