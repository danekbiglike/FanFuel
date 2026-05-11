FROM golang:1.25-alpine AS builder

WORKDIR /src

COPY services/go.mod services/go.sum ./services/
WORKDIR /src/services
RUN go mod download

COPY services/internal ./internal
COPY services/worker ./worker

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/worker ./worker/cmd/worker

FROM alpine:3.21

RUN adduser -D -H fanfuel

COPY --from=builder /out/worker /usr/local/bin/worker

USER fanfuel
EXPOSE 8082

CMD ["worker"]
