package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/server"
)

func main() {
	cfg := config.LoadServiceConfig("worker", "8082")

	if err := server.Run(context.Background(), cfg, registerRoutes); err != nil {
		slog.Error("service stopped", "service", cfg.Name, "error", err)
		os.Exit(1)
	}
}

func registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/worker/foundation", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"service":"worker","status":"foundation_ready"}`))
	})
}
