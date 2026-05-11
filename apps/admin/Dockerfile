FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm install

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json* ./
COPY package.json tsconfig.base.json ./
COPY apps/admin ./apps/admin
COPY packages/i18n ./packages/i18n
COPY packages/types ./packages/types
COPY packages/ui ./packages/ui

WORKDIR /app/apps/admin
EXPOSE 3001

CMD ["npm", "run", "dev"]

