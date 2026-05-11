package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"slices"
	"syscall"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/health"
)

func Run(ctx context.Context, cfg config.ServiceConfig, register func(mux *http.ServeMux)) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", health.Handler(cfg))
	mux.HandleFunc("/readyz", health.ReadyHandler(cfg))

	if register != nil {
		register(mux)
	}

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           corsMiddleware(cfg, mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	shutdownCtx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	errs := make(chan error, 1)
	go func() {
		slog.Info("service started", "service", cfg.Name, "port", cfg.Port)
		errs <- server.ListenAndServe()
	}()

	select {
	case <-shutdownCtx.Done():
		timeoutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(timeoutCtx)
	case err := <-errs:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}

		return err
	}
}

func corsMiddleware(cfg config.ServiceConfig, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (cfg.Environment != "production" || slices.Contains(cfg.CORSAllowedOrigins, origin)) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
