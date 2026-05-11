package health

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
)

type Response struct {
	Service     string `json:"service"`
	Status      string `json:"status"`
	Environment string `json:"environment"`
	CheckedAt   string `json:"checked_at"`
}

func Handler(cfg config.ServiceConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, Response{
			Service:     cfg.Name,
			Status:      "ok",
			Environment: cfg.Environment,
			CheckedAt:   time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func ReadyHandler(cfg config.ServiceConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, Response{
			Service:     cfg.Name,
			Status:      "ok",
			Environment: cfg.Environment,
			CheckedAt:   time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, response Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(response)
}
