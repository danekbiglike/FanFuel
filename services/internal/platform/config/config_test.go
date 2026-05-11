package config

import "testing"

func TestLoadServiceConfigUsesServicePort(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("API_PORT", "18080")
	t.Setenv("PORT", "9999")

	cfg := LoadServiceConfig("api", "8080")

	if cfg.Environment != "test" {
		t.Fatalf("expected test environment, got %q", cfg.Environment)
	}

	if cfg.Port != "18080" {
		t.Fatalf("expected service port, got %q", cfg.Port)
	}
}

func TestLoadServiceConfigFallsBackToDefaultPort(t *testing.T) {
	cfg := LoadServiceConfig("ws", "8081")

	if cfg.Port != "8081" {
		t.Fatalf("expected default port, got %q", cfg.Port)
	}
}
