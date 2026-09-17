package app

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
	"github.com/fanfuel/fanfuel/services/internal/platform/events"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	cfg          config.ServiceConfig
	store        *Store
	tokens       TokenService
	authLimiter  *rateLimiter
	publisher    events.Publisher
	emailSender  EmailSender
	verification emailVerificationService
}

func New(cfg config.ServiceConfig, db *pgxpool.Pool) (*App, error) {
	if cfg.Environment == "production" && cfg.JWTSecret == "dev_jwt_secret_change_me" {
		return nil, errors.New("JWT_SECRET must be configured in production")
	}
	if cfg.Environment == "production" && strings.TrimSpace(cfg.SMTPHost) == "" {
		return nil, errors.New("SMTP_HOST must be configured in production")
	}

	return &App{
		cfg:          cfg,
		store:        NewStore(db, cfg.AdminBootstrapEmail, cfg.Environment != "production", NewMockPaymentProvider()),
		tokens:       NewTokenService(cfg.JWTSecret, cfg.AccessTokenTTL),
		authLimiter:  newRateLimiter(20, time.Minute),
		publisher:    events.NewRedisPublisher(cfg.RedisAddress),
		emailSender:  newEmailSender(cfg),
		verification: newEmailVerificationService(cfg.JWTSecret),
	}, nil
}

func (a *App) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/foundation", method(http.MethodGet, a.handleFoundation))
	mux.HandleFunc("/api/v1/auth/register", method(http.MethodPost, a.handleRegister))
	mux.HandleFunc("/api/v1/auth/login", method(http.MethodPost, a.handleLogin))
	mux.HandleFunc("/api/v1/auth/identify", method(http.MethodPost, a.handleIdentify))
	mux.HandleFunc("/api/v1/auth/email-verification/start", method(http.MethodPost, a.handleStartEmailVerification))
	mux.HandleFunc("/api/v1/auth/email-verification/verify", method(http.MethodPost, a.handleVerifyEmail))
	mux.HandleFunc("/api/v1/auth/logout", method(http.MethodPost, a.handleLogout))
	mux.HandleFunc("/api/v1/auth/me", method(http.MethodGet, a.handleMe))
	mux.HandleFunc("/api/v1/me/profile", method(http.MethodPatch, a.handleUpdateProfile))
	mux.HandleFunc("/api/v1/me/preferences", a.handlePreferences)
	mux.HandleFunc("/api/v1/categories", method(http.MethodGet, a.handleCategories))
	mux.HandleFunc("/api/v1/products", method(http.MethodGet, a.handleProducts))
	mux.HandleFunc("/api/v1/products/", method(http.MethodGet, a.handleProductRoutes))
	mux.HandleFunc("/api/v1/studio/profile", method(http.MethodPatch, a.handleUpdateCreatorProfile))
	mux.HandleFunc("/api/v1/studio/onboarding", method(http.MethodPost, a.handleCreatorOnboarding))
	mux.HandleFunc("/api/v1/seller/profile", method(http.MethodPatch, a.handleUpdateSellerProfile))
	mux.HandleFunc("/api/v1/seller/products", a.handleSellerProducts)
	mux.HandleFunc("/api/v1/seller/products/", a.handleSellerProductRoutes)
	mux.HandleFunc("/api/v1/seller/orders", method(http.MethodGet, a.handleSellerOrders))
	mux.HandleFunc("/api/v1/seller/orders/", a.handleSellerOrderRoutes)
	mux.HandleFunc("/api/v1/donations", method(http.MethodPost, a.handleCreateDonation))
	mux.HandleFunc("/api/v1/orders", method(http.MethodPost, a.handleOrders))
	mux.HandleFunc("/api/v1/orders/", method(http.MethodGet, a.handleOrderRoutes))
	mux.HandleFunc("/api/v1/buyer/orders", method(http.MethodGet, a.handleBuyerOrders))
	mux.HandleFunc("/api/v1/buyer/orders/", a.handleBuyerOrderRoutes)
	mux.HandleFunc("/api/v1/profiles/", method(http.MethodGet, a.handlePublicProfile))
	mux.HandleFunc("/api/v1/creators/", method(http.MethodGet, a.handlePublicCreator))
	mux.HandleFunc("/api/v1/payments/", a.handlePaymentRoutes)
	mux.HandleFunc("/api/v1/mock/payments/", a.handleMockPaymentRoutes)
	mux.HandleFunc("/api/v1/studio/donations", method(http.MethodGet, a.handleStudioDonations))
	mux.HandleFunc("/api/v1/studio/goals", a.handleStudioGoals)
	mux.HandleFunc("/api/v1/studio/goals/", a.handleStudioGoalRoutes)
	mux.HandleFunc("/api/v1/studio/widgets", a.handleStudioWidgets)
	mux.HandleFunc("/api/v1/studio/widgets/", a.handleStudioWidgetRoutes)
	mux.HandleFunc("/api/v1/admin/users", method(http.MethodGet, a.handleAdminUsers))
	mux.HandleFunc("/api/v1/admin/users/", a.handleAdminUserRoutes)
	mux.HandleFunc("/api/v1/admin/products", method(http.MethodGet, a.handleAdminProducts))
	mux.HandleFunc("/api/v1/admin/products/", a.handleAdminProductRoutes)
}

func (a *App) handlePreferences(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		a.handleGetPreferences(w, r)
	case http.MethodPatch:
		a.handleUpdatePreferences(w, r)
	case http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}

func method(expectedMethod string, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if r.Method != expectedMethod {
			writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
			return
		}

		handler(w, r)
	}
}

func hasRole(user *CurrentUser, allowedRoles ...Role) bool {
	for _, userRole := range user.Roles {
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				return true
			}
		}
	}

	return false
}

func bearerToken(r *http.Request) string {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return ""
	}

	prefix := "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}
