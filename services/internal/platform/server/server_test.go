package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/health"
)

func TestHealthHandler(t *testing.T) {
	cfg := config.ServiceConfig{Name: "api", Environment: "test", Port: "8080"}
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()

	health.Handler(cfg).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	if response.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("expected json content type")
	}
}
