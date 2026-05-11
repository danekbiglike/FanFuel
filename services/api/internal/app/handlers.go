package app

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func (a *App) handleFoundation(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "api",
		"status":  "auth_profiles_ready",
	})
}

func (a *App) handleRegister(w http.ResponseWriter, r *http.Request) {
	if !a.authLimiter.Allow("register:" + clientKey(r)) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "rate_limited", "errors.rateLimited", nil)
		return
	}

	var req RegisterRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user, err := a.store.RegisterUser(r.Context(), req)
	if err != nil {
		mapError(w, err)
		return
	}

	a.writeAuthResponse(w, *user)
}

func (a *App) handleLogin(w http.ResponseWriter, r *http.Request) {
	if !a.authLimiter.Allow("login:" + clientKey(r)) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "rate_limited", "errors.rateLimited", nil)
		return
	}

	var req LoginRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	user, err := a.store.Login(r.Context(), req)
	if err != nil {
		mapError(w, err)
		return
	}

	a.writeAuthResponse(w, *user)
}

func (a *App) handleLogout(w http.ResponseWriter, _ *http.Request) {
	writeNoContent(w)
}

func (a *App) handleMe(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func (a *App) handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	var req UpdateProfileRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	updated, err := a.store.UpdateProfile(r.Context(), user.User.ID, req)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *App) handleGetPreferences(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	preferences, err := a.store.GetUserPreferences(r.Context(), user.User.ID)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, preferences)
}

func (a *App) handleUpdatePreferences(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	var req UpdateUserPreferencesRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	preferences, err := a.store.UpdateUserPreferences(r.Context(), user.User.ID, req)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, preferences)
}

func (a *App) handleUpdateCreatorProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	var req UpdateCreatorProfileRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	updated, err := a.store.UpdateCreatorProfile(r.Context(), user.User.ID, req)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *App) handleUpdateSellerProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	var req UpdateSellerProfileRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	updated, err := a.store.UpdateSellerProfile(r.Context(), user.User.ID, req)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (a *App) handlePublicProfile(w http.ResponseWriter, r *http.Request) {
	slug := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/profiles/"), "/")
	if slug == "" {
		mapError(w, errNotFound)
		return
	}

	profile, err := a.store.GetPublicProfile(r.Context(), slug)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (a *App) handlePublicCreator(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/creators/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	slug := parts[0]
	if len(parts) == 2 && parts[1] == "donations" && r.Method == http.MethodGet {
		response, err := a.store.GetPublicDonationList(r.Context(), slug, parseQueryInt(r, "limit", defaultDonationLimit))
		if err != nil {
			mapError(w, err)
			return
		}

		writeJSON(w, http.StatusOK, response)
		return
	}

	if len(parts) == 2 && parts[1] == "goals" && r.Method == http.MethodGet {
		response, err := a.store.GetPublicGoals(r.Context(), slug)
		if err != nil {
			mapError(w, err)
			return
		}

		writeJSON(w, http.StatusOK, response)
		return
	}

	if len(parts) != 1 || r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}

	creator, err := a.store.GetPublicCreator(r.Context(), slug)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, creator)
}

func (a *App) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleAdmin)
	if !ok || user == nil {
		return
	}

	limit := parseQueryInt(r, "limit", 25)
	offset := parseQueryInt(r, "offset", 0)

	response, err := a.store.ListAdminUsers(r.Context(), limit, offset)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleAdminUserRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/users/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	user, ok := a.requireRole(w, r, RoleAdmin)
	if !ok || user == nil {
		return
	}

	targetUserID := parts[0]

	if len(parts) == 1 && r.Method == http.MethodGet {
		target, err := a.store.GetAdminUser(r.Context(), targetUserID)
		if err != nil {
			mapError(w, err)
			return
		}

		writeJSON(w, http.StatusOK, target)
		return
	}

	if len(parts) == 2 && parts[1] == "status" && r.Method == http.MethodPatch {
		var req UpdateUserStatusRequest
		if !decodeJSON(w, r, &req) {
			return
		}

		target, err := a.store.UpdateUserStatus(r.Context(), user.User.ID, targetUserID, req)
		if err != nil {
			mapError(w, err)
			return
		}

		writeJSON(w, http.StatusOK, target)
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
}

func (a *App) requireAuth(w http.ResponseWriter, r *http.Request) (*CurrentUser, bool) {
	rawToken := bearerToken(r)
	if rawToken == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized", "errors.unauthorized", nil)
		return nil, false
	}

	claims, err := a.tokens.ParseAccessToken(rawToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized", "errors.unauthorized", nil)
		return nil, false
	}

	user, err := a.store.GetCurrentUser(r.Context(), claims.Subject)
	if err != nil {
		mapError(w, err)
		return nil, false
	}

	if user.User.Status != "active" {
		writeError(w, http.StatusForbidden, "forbidden", "forbidden", "errors.forbidden", nil)
		return nil, false
	}

	return user, true
}

func (a *App) requireRole(w http.ResponseWriter, r *http.Request, roles ...Role) (*CurrentUser, bool) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return nil, false
	}

	if !hasRole(user, roles...) {
		mapError(w, errForbidden)
		return nil, false
	}

	return user, true
}

func (a *App) writeAuthResponse(w http.ResponseWriter, user CurrentUser) {
	token, expiresAt, err := a.tokens.CreateAccessToken(user)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresAt:   expiresAt,
		User:        user,
	})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", "invalid_json", "errors.invalidJson", nil)
		return false
	}

	return true
}

func parseQueryInt(r *http.Request, key string, fallback int) int {
	value, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return fallback
	}

	return value
}
