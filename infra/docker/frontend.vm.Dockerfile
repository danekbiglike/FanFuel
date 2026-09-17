FROM node:22-alpine AS source
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci

FROM source AS web-build
ARG NEXT_PUBLIC_API_BASE_URL=https://fanfuel.ru
ARG NEXT_PUBLIC_WIDGET_BASE_URL=https://fanfuel.ru/widget/
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_WIDGET_BASE_URL=$NEXT_PUBLIC_WIDGET_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @fanfuel/web

FROM node:22-alpine AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=web-build --chown=node:node /app /app
USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM source AS static-build
ARG VITE_API_BASE_URL=https://fanfuel.ru
ARG VITE_WS_BASE_URL=wss://fanfuel.ru
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_WS_BASE_URL=$VITE_WS_BASE_URL
RUN npm run build -w @fanfuel/widget -- --base=/widget/ && npm run build -w @fanfuel/admin

FROM nginx:stable-alpine AS widget
COPY infra/nginx/static.conf /etc/nginx/conf.d/default.conf
COPY --from=static-build /app/apps/widget/dist /usr/share/nginx/html

FROM nginx:stable-alpine AS admin
COPY infra/nginx/static.conf /etc/nginx/conf.d/default.conf
COPY --from=static-build /app/apps/admin/dist /usr/share/nginx/html
