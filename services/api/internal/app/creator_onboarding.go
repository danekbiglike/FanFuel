package app

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

type CreatorOnboardingRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func normalizeCreatorOnboarding(req CreatorOnboardingRequest) (CreatorOnboardingRequest, bool) {
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	n := utf8.RuneCountInString(req.Title)
	return req, n >= 2 && n <= 80 && utf8.RuneCountInString(req.Description) <= 1000
}

func (a *App) handleCreatorOnboarding(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}
	var req CreatorOnboardingRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	updated, err := a.store.CreateCreatorDraft(r.Context(), user.User.ID, req)
	if err != nil {
		mapError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Store) CreateCreatorDraft(ctx context.Context, userID string, req CreatorOnboardingRequest) (*CurrentUser, error) {
	req, valid := normalizeCreatorOnboarding(req)
	if !valid {
		return nil, errValidation
	}
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	// Блокировка пользователя сериализует повторные сохранения из нескольких вкладок.
	var status string
	if err := tx.QueryRow(ctx, `SELECT status FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&status); err != nil {
		return nil, err
	}
	if status != "active" {
		return nil, errForbidden
	}
	var existingID string
	err = tx.QueryRow(ctx, `SELECT id FROM creator_profiles WHERE user_id = $1`, userID).Scan(&existingID)
	if err == nil {
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		return s.GetCurrentUser(ctx, userID)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	var profileID, baseSlug string
	if err := tx.QueryRow(ctx, `SELECT id, slug FROM profiles WHERE user_id = $1`, userID).Scan(&profileID, &baseSlug); err != nil {
		return nil, err
	}
	creatorSlug, err := s.nextCreatorSlug(ctx, tx, baseSlug)
	if err != nil {
		return nil, err
	}
	if err := s.grantRole(ctx, tx, userID, RoleStreamer); err != nil {
		return nil, err
	}
	var creatorID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO creator_profiles (user_id, profile_id, creator_slug, title, description, status)
		VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING id
	`, userID, profileID, creatorSlug, req.Title, req.Description).Scan(&creatorID); err != nil {
		return nil, err
	}
	if err := s.recordAudit(ctx, tx, &userID, "creator.onboarding", "creator_profile", &creatorID, nil, nil, map[string]string{"status": "draft"}); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return s.GetCurrentUser(ctx, userID)
}
