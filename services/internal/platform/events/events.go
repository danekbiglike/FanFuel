package events

import (
	"context"
	"time"
)

type Envelope struct {
	EventID      string    `json:"event_id"`
	EventType    string    `json:"event_type"`
	EventVersion int       `json:"event_version"`
	OccurredAt   time.Time `json:"occurred_at"`
	Channel      string    `json:"channel"`
	Payload      any       `json:"payload"`
}

type Publisher interface {
	Publish(ctx context.Context, event Envelope) error
}
