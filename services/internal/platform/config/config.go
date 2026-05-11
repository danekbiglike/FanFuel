package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type ServiceConfig struct {
	Name                string
	Environment         string
	Port                string
	DatabaseURL         string
	RedisAddress        string
	JWTSecret           string
	AccessTokenTTL      time.Duration
	CORSAllowedOrigins  []string
	AdminBootstrapEmail string
}

func LoadServiceConfig(serviceName string, defaultPort string) ServiceConfig {
	return ServiceConfig{
		Name:                serviceName,
		Environment:         getEnv("APP_ENV", "development"),
		Port:                getEnv(serviceEnvKey(serviceName, "PORT"), getEnv("PORT", defaultPort)),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		RedisAddress:        getEnv("REDIS_ADDR", "redis:6379"),
		JWTSecret:           getEnv("JWT_SECRET", "dev_jwt_secret_change_me"),
		AccessTokenTTL:      getEnvDurationMinutes("ACCESS_TOKEN_TTL_MINUTES", 60),
		CORSAllowedOrigins:  getEnvList("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173"),
		AdminBootstrapEmail: strings.ToLower(getEnv("ADMIN_BOOTSTRAP_EMAIL", "")),
	}
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func serviceEnvKey(serviceName string, suffix string) string {
	replacer := strings.NewReplacer("-", "_", ".", "_")
	normalized := strings.ToUpper(replacer.Replace(serviceName))
	return normalized + "_" + suffix
}

func getEnvDurationMinutes(key string, fallbackMinutes int) time.Duration {
	raw := getEnv(key, strconv.Itoa(fallbackMinutes))
	minutes, err := strconv.Atoi(raw)
	if err != nil || minutes <= 0 {
		minutes = fallbackMinutes
	}

	return time.Duration(minutes) * time.Minute
}

func getEnvList(key string, fallback string) []string {
	raw := getEnv(key, fallback)
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))

	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}

	return values
}
