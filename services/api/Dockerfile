FROM golang:1.25-alpine AS builder

WORKDIR /src

COPY services/go.mod services/go.sum ./services/
WORKDIR /src/services
RUN go mod download

COPY services/internal ./internal
COPY services/api ./api

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./api/cmd/api

FROM alpine:3.21

RUN adduser -D -H fanfuel

COPY --from=builder /out/api /usr/local/bin/api

USER fanfuel
EXPOSE 8080

CMD ["api"]
