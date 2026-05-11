package app

import (
	"log/slog"
	"net/http"
	"strings"
)

func (a *App) handleCreateDonation(w http.ResponseWriter, r *http.Request) {
	var req CreateDonationRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	requestHash, err := canonicalRequestHash(req)
	if err != nil {
		mapError(w, err)
		return
	}

	response, err := a.store.CreateDonation(r.Context(), req, r.Header.Get("Idempotency-Key"), requestHash)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (a *App) handlePaymentRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/payments/"), "/")
	if path == "" || strings.Contains(path, "/") {
		mapError(w, errNotFound)
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}

	payment, err := a.store.GetPayment(r.Context(), path)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, payment)
}

func (a *App) handleMockPaymentRoutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/mock/payments/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	var succeeded bool
	switch parts[1] {
	case "succeed":
		succeeded = true
	case "fail":
		succeeded = false
	default:
		mapError(w, errNotFound)
		return
	}

	result, err := a.store.CompleteMockPayment(r.Context(), parts[0], succeeded)
	if err != nil {
		mapError(w, err)
		return
	}

	for _, event := range result.Events {
		if err := a.publisher.Publish(r.Context(), event); err != nil {
			slog.Warn("event publish failed", "event_type", event.EventType, "channel", event.Channel, "error", err)
		}
	}

	if result.Order != nil {
		writeJSON(w, http.StatusOK, result.Order)
		return
	}

	writeJSON(w, http.StatusOK, CreateDonationResponse{
		Donation: result.Donation,
		Payment:  result.Payment,
	})
}

func (a *App) handleStudioDonations(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleStreamer)
	if !ok {
		return
	}

	response, err := a.store.GetStudioDonations(r.Context(), user.User.ID, parseQueryInt(r, "limit", defaultDonationLimit))
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleStudioGoals(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleStreamer)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		response, err := a.store.ListStudioGoals(r.Context(), user.User.ID)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, response)
	case http.MethodPost:
		var req CreateDonationGoalRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		goal, err := a.store.CreateDonationGoal(r.Context(), user.User.ID, req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, goal)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}

func (a *App) handleStudioGoalRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleStreamer)
	if !ok {
		return
	}

	goalID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/studio/goals/"), "/")
	if goalID == "" || strings.Contains(goalID, "/") {
		mapError(w, errNotFound)
		return
	}
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}

	var req UpdateDonationGoalRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	goal, err := a.store.UpdateDonationGoal(r.Context(), user.User.ID, goalID, req)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, goal)
}

func (a *App) handleStudioWidgets(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleStreamer)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		response, err := a.store.ListWidgets(r.Context(), user.User.ID)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, response)
	case http.MethodPost:
		var req CreateWidgetRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		widget, err := a.store.CreateWidget(r.Context(), user.User.ID, req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, widget)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}

func (a *App) handleStudioWidgetRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleStreamer)
	if !ok {
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/studio/widgets/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] != "rotate-token" {
		mapError(w, errNotFound)
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}

	widget, err := a.store.RotateWidgetToken(r.Context(), user.User.ID, parts[0])
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, widget)
}
