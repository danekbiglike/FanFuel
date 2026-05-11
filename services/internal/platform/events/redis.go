package events

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/redis/go-redis/v9"
)

type RedisPublisher struct {
	client *redis.Client
}

func NewRedisPublisher(address string) *RedisPublisher {
	address = strings.TrimSpace(address)
	if address == "" {
		return nil
	}

	return &RedisPublisher{
		client: redis.NewClient(&redis.Options{Addr: address}),
	}
}

func (p *RedisPublisher) Publish(ctx context.Context, event Envelope) error {
	if p == nil || p.client == nil {
		return nil
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return p.client.Publish(ctx, event.Channel, payload).Err()
}

func (p *RedisPublisher) Close() error {
	if p == nil || p.client == nil {
		return nil
	}

	return p.client.Close()
}
