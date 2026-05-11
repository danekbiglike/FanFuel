package main

import (
	"context"
	"log/slog"
	"os"

	apiapp "github.com/fanfuel/fanfuel/services/api/internal/app"
	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/database"
	"github.com/fanfuel/fanfuel/services/internal/platform/server"
)

func main() {
	cfg := config.LoadServiceConfig("api", "8080")
	ctx := context.Background()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "service", cfg.Name, "error", err)
		os.Exit(1)
	}
	defer db.Close()

	app, err := apiapp.New(cfg, db)
	if err != nil {
		slog.Error("api initialization failed", "service", cfg.Name, "error", err)
		os.Exit(1)
	}

	if err := server.Run(ctx, cfg, app.RegisterRoutes); err != nil {
		slog.Error("service stopped", "service", cfg.Name, "error", err)
		os.Exit(1)
	}
}
