FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/widget/package.json apps/widget/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/types/package.json packages/types/package.json

RUN npm install

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json* ./
COPY package.json tsconfig.base.json ./
COPY apps/widget ./apps/widget
COPY packages/i18n ./packages/i18n
COPY packages/sdk ./packages/sdk
COPY packages/types ./packages/types

WORKDIR /app/apps/widget
EXPOSE 5173

CMD ["npm", "run", "dev"]

