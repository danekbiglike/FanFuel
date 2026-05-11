FROM golang:1.25-alpine AS builder

WORKDIR /src

COPY services/go.mod services/go.sum ./services/
WORKDIR /src/services
RUN go mod download

COPY services/internal ./internal
COPY services/ws ./ws

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/ws ./ws/cmd/ws

FROM alpine:3.21

RUN adduser -D -H fanfuel

COPY --from=builder /out/ws /usr/local/bin/ws

USER fanfuel
EXPOSE 8081

CMD ["ws"]
