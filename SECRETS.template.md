# SECRETS.template.md

ВНИМАНИЕ: это шаблон для перечня секретов и ответственных за них. Реальные значения нельзя хранить в Git.

## Общие правила

- Реальные `.env`, `SECRETS.md`, `SERVER_ACCESS.md`, дампы БД, приватные ключи и токены не коммитить.
- Для локальной разработки использовать `.env.local` или `.env`, которые попадают в `.gitignore`.
- Для staging/production хранить секреты в менеджере секретов, переменных окружения сервера или защищённом хранилище провайдера.
- При подозрении на утечку секрет считается скомпрометированным и должен быть ротирован.

## Application

APP_ENV:
APP_BASE_URL:
API_BASE_URL:
WS_BASE_URL:

## Database

POSTGRES_HOST:
POSTGRES_PORT:
POSTGRES_DB:
POSTGRES_USER:
POSTGRES_PASSWORD:

## Redis

REDIS_HOST:
REDIS_PORT:
REDIS_PASSWORD:

## Auth

JWT_SECRET:
SESSION_SECRET:
OAUTH_CLIENT_ID:
OAUTH_CLIENT_SECRET:

## S3/R2

S3_ENDPOINT:
S3_REGION:
S3_PUBLIC_BUCKET:
S3_PRIVATE_BUCKET:
S3_ACCESS_KEY_ID:
S3_SECRET_ACCESS_KEY:
CDN_BASE_URL:

## Payment Providers

PAYMENT_PROVIDER:
TOME_API_KEY:
TOME_SECRET_KEY:
YOOKASSA_SHOP_ID:
YOOKASSA_SECRET_KEY:

## Mail / Notifications

SMTP_HOST:
SMTP_PORT:
SMTP_USER:
SMTP_PASSWORD:
MAIL_FROM:

## Rotation

Дата последней проверки:
Ответственный:
Что ротировано:
Следующая плановая проверка:
