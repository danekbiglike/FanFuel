package app

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/events"
	"github.com/jackc/pgx/v5"
)

func (s *Store) CreateDonation(ctx context.Context, req CreateDonationRequest, idempotencyKey string, requestHash string) (*CreateDonationResponse, error) {
	idempotencyKey = strings.TrimSpace(idempotencyKey)
	if idempotencyKey == "" {
		return nil, errIdempotencyKey
	}

	req.Currency = normalizeCurrency(req.Currency)
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	req.Message = strings.TrimSpace(req.Message)
	req.CreatorSlug = normalizeSlug(req.CreatorSlug)
	req.CreatorProfileID = strings.TrimSpace(req.CreatorProfileID)
	req.DonationGoalID = strings.TrimSpace(req.DonationGoalID)

	if !validDonationAmount(req.AmountMinor) || !validCurrency(req.Currency) || !validDonationMessage(req.Message) {
		return nil, errValidation
	}
	if req.DisplayName == "" {
		req.DisplayName = "FanFuel Supporter"
	}
	if !validDonationDisplayName(req.DisplayName) {
		return nil, errValidation
	}

	if existing, err := s.getIdempotentDonation(ctx, idempotencyKey, requestHash); err != nil || existing != nil {
		return existing, err
	}

	creatorID, err := s.resolveDonationCreator(ctx, req.CreatorProfileID, req.CreatorSlug)
	if err != nil {
		return nil, err
	}
	if req.DonationGoalID != "" {
		if err := s.validateGoalForDonation(ctx, creatorID, req.DonationGoalID, req.Currency); err != nil {
			return nil, err
		}
	}

	paymentResult, err := s.paymentProvider.CreatePayment(ctx, CreatePaymentRequest{
		AmountMinor:    req.AmountMinor,
		Currency:       req.Currency,
		Purpose:        "donation",
		IdempotencyKey: idempotencyKey,
	})
	if err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var paymentID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO payments (status, purpose, amount_minor, currency, provider, provider_payment_id, idempotency_key)
		VALUES ($1, 'donation', $2, $3, $4, $5, $6)
		RETURNING id
	`, paymentResult.Status, req.AmountMinor, req.Currency, paymentResult.Provider, paymentResult.ProviderPaymentID, idempotencyKey).Scan(&paymentID); err != nil {
		return nil, err
	}

	confirmationURL := "/api/v1/mock/payments/" + paymentID + "/succeed"
	if _, err := tx.Exec(ctx, `
		UPDATE payments
		SET confirmation_url = $1
		WHERE id = $2
	`, confirmationURL, paymentID); err != nil {
		return nil, err
	}

	var goalID *string
	if req.DonationGoalID != "" {
		goalID = &req.DonationGoalID
	}

	var donationID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO donations (
			creator_profile_id, donation_goal_id, payment_id, status,
			display_name, message, amount_minor, currency, is_anonymous, idempotency_key
		)
		VALUES ($1, $2, $3, 'payment_pending', $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, creatorID, goalID, paymentID, req.DisplayName, req.Message, req.AmountMinor, req.Currency, req.IsAnonymous, idempotencyKey).Scan(&donationID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}

		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO idempotency_keys (scope, idempotency_key, request_hash, donation_id, payment_id)
		VALUES ('donations.create', $1, $2, $3, $4)
	`, idempotencyKey, requestHash, donationID, paymentID); err != nil {
		if isUniqueViolation(err) {
			return nil, errIdempotencyConflict
		}

		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getDonationResponse(ctx, donationID)
}

func (s *Store) CompleteMockPayment(ctx context.Context, paymentID string, succeeded bool) (*MockPaymentCompletionResult, error) {
	status := "failed"
	eventType := "payment.failed"
	if succeeded {
		status = "succeeded"
		eventType = "payment.succeeded"
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var payment Payment
	if err := tx.QueryRow(ctx, paymentSelectSQL()+`
		WHERE id = $1 AND purpose IN ('donation', 'order')
		FOR UPDATE
	`, paymentID).Scan(paymentScanTargets(&payment)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	providerEventID := fmt.Sprintf("mock.%s.%s", payment.ProviderPaymentID, status)
	var webhookID string
	err = tx.QueryRow(ctx, `
		INSERT INTO provider_webhooks (provider, provider_event_id, event_type, status, payload_json)
		VALUES ($1, $2, $3, 'received', $4::jsonb)
		ON CONFLICT (provider, provider_event_id) DO NOTHING
		RETURNING id
	`, payment.Provider, providerEventID, eventType, fmt.Sprintf(`{"payment_id":"%s"}`, payment.ID)).Scan(&webhookID)
	if errors.Is(err, pgx.ErrNoRows) {
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}

		if payment.Purpose == "order" {
			response, err := s.getOrderDetailByPaymentID(ctx, paymentID)
			if err != nil {
				return nil, err
			}
			return &MockPaymentCompletionResult{Order: response, Payment: response.Payment}, nil
		}

		response, err := s.getDonationResponseByPaymentID(ctx, paymentID)
		if err != nil {
			return nil, err
		}
		return &MockPaymentCompletionResult{Donation: response.Donation, Payment: response.Payment}, nil
	}
	if err != nil {
		return nil, err
	}

	if payment.Status == "succeeded" || payment.Status == "failed" {
		if _, err := tx.Exec(ctx, `
			UPDATE provider_webhooks
			SET status = 'ignored', processed_at = now()
			WHERE id = $1
		`, webhookID); err != nil {
			return nil, err
		}

		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}

		if payment.Purpose == "order" {
			response, err := s.getOrderDetailByPaymentID(ctx, paymentID)
			if err != nil {
				return nil, err
			}
			return &MockPaymentCompletionResult{Order: response, Payment: response.Payment}, nil
		}

		response, err := s.getDonationResponseByPaymentID(ctx, paymentID)
		if err != nil {
			return nil, err
		}
		return &MockPaymentCompletionResult{Donation: response.Donation, Payment: response.Payment}, nil
	}

	var orderDetail *OrderDetail
	if payment.Purpose == "order" {
		orderDetail, err = s.CompleteMockOrderPaymentTx(ctx, tx, payment, succeeded)
		if err != nil {
			return nil, err
		}
	} else {
		var paidAt any
		if succeeded {
			paidAt = time.Now().UTC()
		}

		if _, err := tx.Exec(ctx, `
			UPDATE payments
			SET status = $1, paid_at = $2
			WHERE id = $3
		`, status, paidAt, payment.ID); err != nil {
			return nil, err
		}

		donationStatus := "failed"
		if succeeded {
			donationStatus = "paid"
		}
		if _, err := tx.Exec(ctx, `
			UPDATE donations
			SET status = $1, paid_at = $2
			WHERE payment_id = $3
		`, donationStatus, paidAt, payment.ID); err != nil {
			return nil, err
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE provider_webhooks
		SET status = 'processed', processed_at = now()
		WHERE id = $1
	`, webhookID); err != nil {
		return nil, err
	}

	updatedPayment, err := s.getPaymentTx(ctx, tx, payment.ID)
	if err != nil {
		return nil, err
	}

	var donation *Donation
	var goal *DonationGoal
	if payment.Purpose == "donation" {
		donation, err = s.getDonationByPaymentIDTx(ctx, tx, payment.ID)
		if err != nil {
			return nil, err
		}
		if donation.DonationGoalID != nil && succeeded {
			updatedGoal, err := s.recalculateGoalTx(ctx, tx, *donation.DonationGoalID)
			if err != nil {
				return nil, err
			}
			goal = updatedGoal
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	result := &MockPaymentCompletionResult{
		Payment: *updatedPayment,
		Order:   orderDetail,
	}
	if donation != nil {
		result.Donation = *donation
	}
	if succeeded {
		if donation != nil {
			result.Events = append(result.Events, donationAlertEvent(*donation))
		}
		if goal != nil {
			result.Events = append(result.Events, donationGoalEvent(*goal))
		}
	}

	return result, nil
}

func (s *Store) GetPayment(ctx context.Context, paymentID string) (*Payment, error) {
	var payment Payment
	if err := s.db.QueryRow(ctx, paymentSelectSQL()+`
		WHERE id = $1
	`, paymentID).Scan(paymentScanTargets(&payment)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &payment, nil
}

func (s *Store) GetPublicDonationList(ctx context.Context, creatorSlug string, limit int) (*DonationListResponse, error) {
	creatorID, err := s.resolveDonationCreator(ctx, "", creatorSlug)
	if err != nil {
		return nil, err
	}
	if limit <= 0 || limit > maxDonationLimit {
		limit = defaultDonationLimit
	}

	rows, err := s.db.Query(ctx, donationSelectSQL()+`
		WHERE creator_profile_id = $1 AND status = 'paid'
		ORDER BY paid_at DESC NULLS LAST, created_at DESC
		LIMIT $2
	`, creatorID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items, err := scanDonationRows(rows)
	if err != nil {
		return nil, err
	}

	topDonors, err := s.getTopDonors(ctx, creatorID)
	if err != nil {
		return nil, err
	}

	return &DonationListResponse{Items: items, TopDonors: topDonors}, nil
}

func (s *Store) GetPublicGoals(ctx context.Context, creatorSlug string) (*DonationGoalListResponse, error) {
	creatorID, err := s.resolveDonationCreator(ctx, "", creatorSlug)
	if err != nil {
		return nil, err
	}

	goals, err := s.listGoalsByCreator(ctx, creatorID, true)
	if err != nil {
		return nil, err
	}

	return &DonationGoalListResponse{Items: goals}, nil
}

func (s *Store) GetStudioDonations(ctx context.Context, userID string, limit int) (*DonationListResponse, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}
	if limit <= 0 || limit > maxDonationLimit {
		limit = defaultDonationLimit
	}

	rows, err := s.db.Query(ctx, donationSelectSQL()+`
		WHERE creator_profile_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, creator.ID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items, err := scanDonationRows(rows)
	if err != nil {
		return nil, err
	}

	topDonors, err := s.getTopDonors(ctx, creator.ID)
	if err != nil {
		return nil, err
	}

	return &DonationListResponse{Items: items, TopDonors: topDonors}, nil
}

func (s *Store) ListStudioGoals(ctx context.Context, userID string) (*DonationGoalListResponse, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	goals, err := s.listGoalsByCreator(ctx, creator.ID, false)
	if err != nil {
		return nil, err
	}

	return &DonationGoalListResponse{Items: goals}, nil
}

func (s *Store) CreateDonationGoal(ctx context.Context, userID string, req CreateDonationGoalRequest) (*DonationGoal, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	title := strings.TrimSpace(req.Title)
	currency := normalizeCurrency(req.Currency)
	if !validDisplayName(title) || req.TargetAmountMinor <= 0 || !validCurrency(currency) {
		return nil, errValidation
	}

	var goal DonationGoal
	if err := s.db.QueryRow(ctx, `
		INSERT INTO donation_goals (creator_profile_id, title, description, target_amount_minor, currency)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, creator_profile_id, title, description, target_amount_minor,
			current_amount_minor, currency, status, sort_order, created_at, updated_at
	`, creator.ID, title, strings.TrimSpace(req.Description), req.TargetAmountMinor, currency).Scan(goalScanTargets(&goal)...); err != nil {
		return nil, err
	}

	return &goal, nil
}

func (s *Store) UpdateDonationGoal(ctx context.Context, userID string, goalID string, req UpdateDonationGoalRequest) (*DonationGoal, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	title := strings.TrimSpace(req.Title)
	if !validDisplayName(title) || req.TargetAmountMinor <= 0 || !validDonationGoalStatus(req.Status) {
		return nil, errValidation
	}

	var goal DonationGoal
	if err := s.db.QueryRow(ctx, `
		UPDATE donation_goals
		SET title = $1, description = $2, target_amount_minor = $3, status = $4
		WHERE id = $5 AND creator_profile_id = $6 AND deleted_at IS NULL
		RETURNING id, creator_profile_id, title, description, target_amount_minor,
			current_amount_minor, currency, status, sort_order, created_at, updated_at
	`, title, strings.TrimSpace(req.Description), req.TargetAmountMinor, req.Status, strings.TrimSpace(goalID), creator.ID).Scan(goalScanTargets(&goal)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &goal, nil
}

func (s *Store) ListWidgets(ctx context.Context, userID string) (*WidgetListResponse, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	rows, err := s.db.Query(ctx, widgetSelectSQL()+`
		WHERE creator_profile_id = $1
		ORDER BY created_at DESC
	`, creator.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	widgets, err := scanWidgetRows(rows)
	if err != nil {
		return nil, err
	}

	return &WidgetListResponse{Items: widgets}, nil
}

func (s *Store) CreateWidget(ctx context.Context, userID string, req CreateWidgetRequest) (*Widget, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	token, tokenHash, err := newWidgetToken()
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = "OBS alert"
	}

	var widget Widget
	if err := s.db.QueryRow(ctx, `
		INSERT INTO widgets (creator_profile_id, name, token_hash)
		VALUES ($1, $2, $3)
		RETURNING id, creator_profile_id, kind, status, name, expires_at, created_at, updated_at
	`, creator.ID, name, tokenHash).Scan(widgetScanTargets(&widget)...); err != nil {
		return nil, err
	}
	widget.Token = token
	widget.ConnectPath = "/?token=" + token

	return &widget, nil
}

func (s *Store) RotateWidgetToken(ctx context.Context, userID string, widgetID string) (*Widget, error) {
	creator, err := s.getCreatorProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if creator == nil {
		return nil, errForbidden
	}

	token, tokenHash, err := newWidgetToken()
	if err != nil {
		return nil, err
	}

	var widget Widget
	if err := s.db.QueryRow(ctx, `
		UPDATE widgets
		SET token_hash = $1, token_rotated_at = now(), status = 'active'
		WHERE id = $2 AND creator_profile_id = $3
		RETURNING id, creator_profile_id, kind, status, name, expires_at, created_at, updated_at
	`, tokenHash, strings.TrimSpace(widgetID), creator.ID).Scan(widgetScanTargets(&widget)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}
	widget.Token = token
	widget.ConnectPath = "/?token=" + token

	return &widget, nil
}

func (s *Store) getIdempotentDonation(ctx context.Context, idempotencyKey string, requestHash string) (*CreateDonationResponse, error) {
	var storedHash string
	var donationID string
	err := s.db.QueryRow(ctx, `
		SELECT request_hash, donation_id
		FROM idempotency_keys
		WHERE scope = 'donations.create' AND idempotency_key = $1
	`, idempotencyKey).Scan(&storedHash, &donationID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if storedHash != requestHash {
		return nil, errIdempotencyConflict
	}

	return s.getDonationResponse(ctx, donationID)
}

func (s *Store) getDonationResponse(ctx context.Context, donationID string) (*CreateDonationResponse, error) {
	var donation Donation
	if err := s.db.QueryRow(ctx, donationSelectSQL()+`
		WHERE id = $1
	`, donationID).Scan(donationScanTargets(&donation)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	payment, err := s.GetPayment(ctx, donation.PaymentID)
	if err != nil {
		return nil, err
	}

	return &CreateDonationResponse{Donation: donation, Payment: *payment}, nil
}

func (s *Store) getDonationResponseByPaymentID(ctx context.Context, paymentID string) (*CreateDonationResponse, error) {
	var donation Donation
	if err := s.db.QueryRow(ctx, donationSelectSQL()+`
		WHERE payment_id = $1
	`, paymentID).Scan(donationScanTargets(&donation)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	payment, err := s.GetPayment(ctx, paymentID)
	if err != nil {
		return nil, err
	}

	return &CreateDonationResponse{Donation: donation, Payment: *payment}, nil
}

func (s *Store) resolveDonationCreator(ctx context.Context, creatorID string, creatorSlug string) (string, error) {
	var id string
	if strings.TrimSpace(creatorID) != "" {
		if err := s.db.QueryRow(ctx, `
			SELECT c.id
			FROM creator_profiles c
			JOIN users u ON u.id = c.user_id
			WHERE c.id = $1
				AND c.donations_enabled = true
				AND c.status = 'published'
				AND u.status = 'active'
				AND u.deleted_at IS NULL
		`, strings.TrimSpace(creatorID)).Scan(&id); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return "", errNotFound
			}

			return "", err
		}
		return id, nil
	}

	if strings.TrimSpace(creatorSlug) == "" {
		return "", errValidation
	}

	if err := s.db.QueryRow(ctx, `
		SELECT c.id
		FROM creator_profiles c
		JOIN users u ON u.id = c.user_id
		WHERE lower(c.creator_slug) = lower($1)
			AND c.donations_enabled = true
			AND c.status = 'published'
			AND u.status = 'active'
			AND u.deleted_at IS NULL
	`, normalizeSlug(creatorSlug)).Scan(&id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errNotFound
		}

		return "", err
	}

	return id, nil
}

func (s *Store) validateGoalForDonation(ctx context.Context, creatorID string, goalID string, currency string) error {
	var exists bool
	if err := s.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM donation_goals
			WHERE id = $1
				AND creator_profile_id = $2
				AND currency = $3
				AND status IN ('active', 'paused')
				AND deleted_at IS NULL
		)
	`, goalID, creatorID, currency).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return errValidation
	}

	return nil
}

func (s *Store) getDonationByPaymentIDTx(ctx context.Context, tx pgx.Tx, paymentID string) (*Donation, error) {
	var donation Donation
	if err := tx.QueryRow(ctx, donationSelectSQL()+`
		WHERE payment_id = $1
	`, paymentID).Scan(donationScanTargets(&donation)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &donation, nil
}

func (s *Store) getPaymentTx(ctx context.Context, tx pgx.Tx, paymentID string) (*Payment, error) {
	var payment Payment
	if err := tx.QueryRow(ctx, paymentSelectSQL()+`
		WHERE id = $1
	`, paymentID).Scan(paymentScanTargets(&payment)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &payment, nil
}

func (s *Store) recalculateGoalTx(ctx context.Context, tx pgx.Tx, goalID string) (*DonationGoal, error) {
	var total int64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(sum(d.amount_minor), 0)
		FROM donations d
		JOIN donation_goals g ON g.id = d.donation_goal_id
		WHERE d.donation_goal_id = $1 AND d.status = 'paid' AND d.currency = g.currency
	`, goalID).Scan(&total); err != nil {
		return nil, err
	}

	var goal DonationGoal
	if err := tx.QueryRow(ctx, `
		UPDATE donation_goals
		SET current_amount_minor = $1,
			status = CASE
				WHEN status = 'archived' THEN status
				WHEN $1 >= target_amount_minor THEN 'completed'
				WHEN status = 'paused' THEN status
				ELSE 'active'
			END
		WHERE id = $2 AND deleted_at IS NULL
		RETURNING id, creator_profile_id, title, description, target_amount_minor,
			current_amount_minor, currency, status, sort_order, created_at, updated_at
	`, total, goalID).Scan(goalScanTargets(&goal)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &goal, nil
}

func (s *Store) listGoalsByCreator(ctx context.Context, creatorID string, publicOnly bool) ([]DonationGoal, error) {
	statusFilter := "status IN ('active', 'completed')"
	if !publicOnly {
		statusFilter = "status IN ('active', 'paused', 'completed', 'archived')"
	}

	rows, err := s.db.Query(ctx, goalSelectSQL()+`
		WHERE creator_profile_id = $1 AND deleted_at IS NULL AND `+statusFilter+`
		ORDER BY sort_order, created_at DESC
	`, creatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := make([]DonationGoal, 0)
	for rows.Next() {
		var goal DonationGoal
		if err := rows.Scan(goalScanTargets(&goal)...); err != nil {
			return nil, err
		}
		goals = append(goals, goal)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return goals, nil
}

func (s *Store) getTopDonors(ctx context.Context, creatorID string) ([]TopDonor, error) {
	rows, err := s.db.Query(ctx, `
		SELECT display_name, currency, sum(amount_minor)::bigint, count(*)::int
		FROM donations
		WHERE creator_profile_id = $1 AND status = 'paid' AND is_anonymous = false
		GROUP BY display_name, currency
		ORDER BY sum(amount_minor) DESC, count(*) DESC
		LIMIT 10
	`, creatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]TopDonor, 0)
	for rows.Next() {
		var item TopDonor
		if err := rows.Scan(&item.DisplayName, &item.Currency, &item.TotalAmountMinor, &item.DonationCount); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func canonicalRequestHash(value any) (string, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:]), nil
}

func donationSelectSQL() string {
	return `
		SELECT id, creator_profile_id, donation_goal_id, payment_id, status,
			display_name,
			CASE WHEN is_anonymous THEN '' ELSE display_name END AS public_name,
			message, amount_minor, currency, is_anonymous, paid_at, created_at, updated_at
		FROM donations
	`
}

func donationScanTargets(donation *Donation) []any {
	return []any{
		&donation.ID,
		&donation.CreatorProfileID,
		&donation.DonationGoalID,
		&donation.PaymentID,
		&donation.Status,
		&donation.DisplayName,
		&donation.PublicName,
		&donation.Message,
		&donation.AmountMinor,
		&donation.Currency,
		&donation.IsAnonymous,
		&donation.PaidAt,
		&donation.CreatedAt,
		&donation.UpdatedAt,
	}
}

func scanDonationRows(rows pgx.Rows) ([]Donation, error) {
	items := make([]Donation, 0)
	for rows.Next() {
		var donation Donation
		if err := rows.Scan(donationScanTargets(&donation)...); err != nil {
			return nil, err
		}
		items = append(items, donation)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func paymentSelectSQL() string {
	return `
		SELECT id, status, purpose, amount_minor, currency, provider,
			provider_payment_id, confirmation_url, paid_at, created_at, updated_at
		FROM payments
	`
}

func paymentScanTargets(payment *Payment) []any {
	return []any{
		&payment.ID,
		&payment.Status,
		&payment.Purpose,
		&payment.AmountMinor,
		&payment.Currency,
		&payment.Provider,
		&payment.ProviderPaymentID,
		&payment.ConfirmationURL,
		&payment.PaidAt,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	}
}

func goalSelectSQL() string {
	return `
		SELECT id, creator_profile_id, title, description, target_amount_minor,
			current_amount_minor, currency, status, sort_order, created_at, updated_at
		FROM donation_goals
	`
}

func goalScanTargets(goal *DonationGoal) []any {
	return []any{
		&goal.ID,
		&goal.CreatorProfileID,
		&goal.Title,
		&goal.Description,
		&goal.TargetAmountMinor,
		&goal.CurrentAmountMinor,
		&goal.Currency,
		&goal.Status,
		&goal.SortOrder,
		&goal.CreatedAt,
		&goal.UpdatedAt,
	}
}

func widgetSelectSQL() string {
	return `
		SELECT id, creator_profile_id, kind, status, name, expires_at, created_at, updated_at
		FROM widgets
	`
}

func widgetScanTargets(widget *Widget) []any {
	return []any{
		&widget.ID,
		&widget.CreatorProfileID,
		&widget.Kind,
		&widget.Status,
		&widget.Name,
		&widget.ExpiresAt,
		&widget.CreatedAt,
		&widget.UpdatedAt,
	}
}

func scanWidgetRows(rows pgx.Rows) ([]Widget, error) {
	items := make([]Widget, 0)
	for rows.Next() {
		var widget Widget
		if err := rows.Scan(widgetScanTargets(&widget)...); err != nil {
			return nil, err
		}
		items = append(items, widget)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func donationAlertEvent(donation Donation) events.Envelope {
	return events.Envelope{
		EventID:      "evt_" + randomSuffix(24),
		EventType:    "donation.alert.created",
		EventVersion: 1,
		OccurredAt:   time.Now().UTC(),
		Channel:      "creator:" + donation.CreatorProfileID + ":alerts",
		Payload: map[string]any{
			"donation_id":  donation.ID,
			"display_name": donation.PublicName,
			"is_anonymous": donation.IsAnonymous,
			"amount_minor": donation.AmountMinor,
			"currency":     donation.Currency,
			"message":      donation.Message,
		},
	}
}

func donationGoalEvent(goal DonationGoal) events.Envelope {
	return events.Envelope{
		EventID:      "evt_" + randomSuffix(24),
		EventType:    "donation.goal.updated",
		EventVersion: 1,
		OccurredAt:   time.Now().UTC(),
		Channel:      "creator:" + goal.CreatorProfileID + ":goals",
		Payload: map[string]any{
			"goal_id":              goal.ID,
			"title":                goal.Title,
			"target_amount_minor":  goal.TargetAmountMinor,
			"current_amount_minor": goal.CurrentAmountMinor,
			"currency":             goal.Currency,
			"status":               goal.Status,
		},
	}
}
