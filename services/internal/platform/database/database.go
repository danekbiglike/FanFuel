package database

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, errors.New("database url is required")
	}

	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	poolConfig.MaxConns = 10
	poolConfig.MinConns = 1
	poolConfig.MaxConnIdleTime = 10 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}
