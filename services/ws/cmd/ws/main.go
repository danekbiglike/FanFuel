package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/coder/websocket"
	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/database"
	"github.com/fanfuel/fanfuel/services/internal/platform/server"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type gateway struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func main() {
	cfg := config.LoadServiceConfig("ws", "8081")
	ctx := context.Background()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "service", cfg.Name, "error", err)
		os.Exit(1)
	}
	defer db.Close()

	gw := &gateway{
		db:    db,
		redis: redis.NewClient(&redis.Options{Addr: cfg.RedisAddress}),
	}
	defer func() {
		if err := gw.redis.Close(); err != nil {
			slog.Warn("redis close failed", "error", err)
		}
	}()

	if err := server.Run(ctx, cfg, gw.registerRoutes); err != nil {
		slog.Error("service stopped", "service", cfg.Name, "error", err)
		os.Exit(1)
	}
}

func (g *gateway) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/ws/foundation", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"service":"ws","status":"donate_realtime_ready"}`))
	})
	mux.HandleFunc("/ws/alerts", g.handleAlerts)
}

func (g *gateway) handleAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method_not_allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	creatorID, err := g.validateWidgetToken(r.Context(), token)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	go func() {
		for {
			if _, _, err := conn.Read(ctx); err != nil {
				cancel()
				return
			}
		}
	}()

	pubsub := g.redis.Subscribe(
		ctx,
		"creator:"+creatorID+":alerts",
		"creator:"+creatorID+":goals",
	)
	defer pubsub.Close()

	if _, err := pubsub.Receive(ctx); err != nil {
		slog.Warn("redis subscribe failed", "creator_id", creatorID, "error", err)
		_ = conn.Close(websocket.StatusInternalError, "subscribe_failed")
		return
	}

	heartbeat := time.NewTicker(25 * time.Second)
	defer heartbeat.Stop()

	messages := pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case <-heartbeat.C:
			if err := conn.Ping(ctx); err != nil {
				return
			}
		case message := <-messages:
			if message == nil {
				return
			}
			if err := conn.Write(ctx, websocket.MessageText, []byte(message.Payload)); err != nil {
				return
			}
		}
	}
}

func (g *gateway) validateWidgetToken(ctx context.Context, token string) (string, error) {
	if token == "" {
		return "", errors.New("empty token")
	}

	sum := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(sum[:])

	var creatorID string
	if err := g.db.QueryRow(ctx, `
		SELECT creator_profile_id
		FROM widgets
		WHERE token_hash = $1
			AND status = 'active'
			AND (expires_at IS NULL OR expires_at > now())
	`, tokenHash).Scan(&creatorID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("invalid token")
		}

		return "", err
	}

	return creatorID, nil
}
