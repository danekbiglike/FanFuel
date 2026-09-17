package app

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	db                  *pgxpool.Pool
	adminBootstrapEmail string
	allowAdminBootstrap bool
	paymentProvider     PaymentProvider
}

func NewStore(db *pgxpool.Pool, adminBootstrapEmail string, allowAdminBootstrap bool, paymentProvider PaymentProvider) *Store {
	return &Store{
		db:                  db,
		adminBootstrapEmail: strings.ToLower(strings.TrimSpace(adminBootstrapEmail)),
		allowAdminBootstrap: allowAdminBootstrap,
		paymentProvider:     paymentProvider,
	}
}

func (s *Store) RegisterVerifiedUser(ctx context.Context, req RegisterRequest, email string, challengeID string) (*CurrentUser, error) {
	email, ok := normalizeEmail(email)
	if !ok || !validPassword(req.Password) || challengeID == "" {
		return nil, errValidation
	}

	displayName := defaultDisplayName(email)

	passwordHash, err := hashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var challengeEmail string
	var verifiedAt *time.Time
	var completedAt *time.Time
	var invalidatedAt *time.Time
	if err := tx.QueryRow(ctx, `
		SELECT email, verified_at, completed_at, invalidated_at
		FROM email_verification_challenges
		WHERE id = $1 AND purpose = 'registration'
		FOR UPDATE
	`, challengeID).Scan(&challengeEmail, &verifiedAt, &completedAt, &invalidatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errVerificationTokenInvalid
		}
		return nil, err
	}
	if !strings.EqualFold(challengeEmail, email) || verifiedAt == nil || completedAt != nil || invalidatedAt != nil {
		return nil, errVerificationTokenInvalid
	}

	var userID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO users (email, email_verified_at, password_hash, status, default_locale, time_zone)
		VALUES ($1, now(), $2, 'active', $3, $4)
		RETURNING id
	`, email, passwordHash, normalizeLocale(req.Locale), normalizeTimeZone(req.TimeZone)).Scan(&userID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}

		return nil, err
	}

	if err := s.grantRole(ctx, tx, userID, RoleBuyer); err != nil {
		return nil, err
	}

	profileSlug, err := s.nextProfileSlug(ctx, tx, normalizeSlug(emailLocalPart(email)))
	if err != nil {
		return nil, err
	}

	var profileID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO profiles (user_id, display_name, slug)
		VALUES ($1, $2, $3)
		RETURNING id
	`, userID, displayName, profileSlug).Scan(&profileID); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO buyer_profiles (user_id, preferred_locale)
		VALUES ($1, $2)
	`, userID, normalizeLocale(req.Locale)); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO user_preferences (user_id, theme_preference, locale)
		VALUES ($1, 'system', $2)
	`, userID, normalizeLocale(req.Locale)); err != nil {
		return nil, err
	}

	if s.shouldBootstrapAdmin(ctx, tx, email) {
		if err := s.grantRole(ctx, tx, userID, RoleAdmin); err != nil {
			return nil, err
		}
	}

	if err := s.recordAudit(ctx, tx, &userID, "auth.register", "user", &userID, nil, nil, nil); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE email_verification_challenges
		SET completed_at = now()
		WHERE id = $1
	`, challengeID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM users
			WHERE lower(email) = lower($1) AND deleted_at IS NULL
		)
	`, email).Scan(&exists)
	return exists, err
}

func (s *Store) CreateEmailVerificationChallenge(ctx context.Context, challenge EmailVerificationChallenge) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollbackTx(ctx, tx)
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext(lower($1)))`, challenge.Email); err != nil {
		return err
	}

	var resendAvailableAt time.Time
	var verifiedAt *time.Time
	err = tx.QueryRow(ctx, `
		SELECT resend_available_at, verified_at
		FROM email_verification_challenges
		WHERE lower(email) = lower($1)
		  AND purpose = 'registration'
		  AND invalidated_at IS NULL
		  AND completed_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1
		FOR UPDATE
	`, challenge.Email).Scan(&resendAvailableAt, &verifiedAt)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	if err == nil && time.Now().UTC().Before(resendAvailableAt) {
		return errVerificationResendLimited
	}
	if verifiedAt != nil && time.Now().UTC().Before(verifiedAt.Add(15*time.Minute)) {
		return errVerificationResendLimited
	}

	if _, err := tx.Exec(ctx, `
		UPDATE email_verification_challenges
		SET invalidated_at = now()
		WHERE lower(email) = lower($1)
		  AND purpose = 'registration'
		  AND invalidated_at IS NULL
		  AND completed_at IS NULL
	`, challenge.Email); err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO email_verification_challenges (
			id, email, purpose, locale, code_digest, max_attempts,
			expires_at, resend_available_at
		) VALUES ($1, $2, 'registration', $3, $4, $5, $6, $7)
	`, challenge.ID, challenge.Email, challenge.Locale, challenge.CodeDigest,
		challenge.MaxAttempts, challenge.ExpiresAt, challenge.ResendAvailableAt)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Store) InvalidateEmailVerificationChallenge(ctx context.Context, challengeID string) {
	_, _ = s.db.Exec(ctx, `
		UPDATE email_verification_challenges
		SET invalidated_at = COALESCE(invalidated_at, now())
		WHERE id = $1
	`, challengeID)
}

func (s *Store) VerifyEmailChallenge(ctx context.Context, challengeID string, codeDigest string) (*EmailVerificationChallenge, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var challenge EmailVerificationChallenge
	err = tx.QueryRow(ctx, `
		SELECT id, email, locale, code_digest, attempt_count, max_attempts,
			expires_at, resend_available_at, verified_at, completed_at, invalidated_at
		FROM email_verification_challenges
		WHERE id = $1 AND purpose = 'registration'
		FOR UPDATE
	`, challengeID).Scan(
		&challenge.ID, &challenge.Email, &challenge.Locale, &challenge.CodeDigest,
		&challenge.AttemptCount, &challenge.MaxAttempts, &challenge.ExpiresAt,
		&challenge.ResendAvailableAt, &challenge.VerifiedAt, &challenge.CompletedAt,
		&challenge.InvalidatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errVerificationCodeInvalid
		}
		return nil, err
	}

	now := time.Now().UTC()
	if challenge.VerifiedAt != nil || challenge.CompletedAt != nil || challenge.InvalidatedAt != nil {
		return nil, errVerificationCodeInvalid
	}
	if !now.Before(challenge.ExpiresAt) {
		return nil, errVerificationCodeExpired
	}
	if challenge.AttemptCount >= challenge.MaxAttempts {
		return nil, errVerificationAttemptsExhausted
	}
	if !hmacDigestEqual(challenge.CodeDigest, codeDigest) {
		challenge.AttemptCount++
		_, updateErr := tx.Exec(ctx, `
			UPDATE email_verification_challenges
			SET attempt_count = $2
			WHERE id = $1
		`, challenge.ID, challenge.AttemptCount)
		if updateErr != nil {
			return nil, updateErr
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		if challenge.AttemptCount >= challenge.MaxAttempts {
			return nil, errVerificationAttemptsExhausted
		}
		return nil, errVerificationCodeInvalid
	}

	if _, err := tx.Exec(ctx, `
		UPDATE email_verification_challenges
		SET verified_at = now()
		WHERE id = $1
	`, challenge.ID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	challenge.VerifiedAt = &now
	return &challenge, nil
}

func (s *Store) Login(ctx context.Context, req LoginRequest) (*CurrentUser, error) {
	email, ok := normalizeEmail(req.Email)
	if !ok {
		return nil, errInvalidCredentials
	}

	var userID string
	var passwordHash string
	var status string
	var emailVerifiedAt *time.Time
	if err := s.db.QueryRow(ctx, `
		SELECT id, password_hash, status, email_verified_at
		FROM users
		WHERE lower(email) = lower($1) AND deleted_at IS NULL
	`, email).Scan(&userID, &passwordHash, &status, &emailVerifiedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errInvalidCredentials
		}

		return nil, err
	}

	if status != "active" || emailVerifiedAt == nil || !verifyPassword(req.Password, passwordHash) {
		return nil, errInvalidCredentials
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) GetCurrentUser(ctx context.Context, userID string) (*CurrentUser, error) {
	var user User
	if err := s.db.QueryRow(ctx, `
		SELECT id, email, email_verified_at, status, default_locale, time_zone, created_at, updated_at, deleted_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`, userID).Scan(
		&user.ID,
		&user.Email,
		&user.EmailVerifiedAt,
		&user.Status,
		&user.DefaultLocale,
		&user.TimeZone,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	roles, err := s.getRoles(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	profile, err := s.getProfileByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	var profileNameConfirmedAt *time.Time
	if profile != nil {
		profileNameConfirmedAt = profile.NameConfirmedAt
	}

	creatorProfile, err := s.getCreatorProfileByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	sellerProfile, err := s.getSellerProfileByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &CurrentUser{
		User:                 user,
		Roles:                roles,
		Profile:              profile,
		ProfileNameConfirmed: profileNameConfirmedAt,
		CreatorProfile:       creatorProfile,
		SellerProfile:        sellerProfile,
	}, nil
}

func (s *Store) UpdateProfile(ctx context.Context, userID string, req UpdateProfileRequest) (*CurrentUser, error) {
	displayName := strings.TrimSpace(req.DisplayName)
	if !validDisplayName(displayName) {
		return nil, errValidation
	}

	current, err := s.getProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if current == nil {
		return nil, errNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	slug := normalizeSlug(req.Slug)
	if req.Slug == "" || slug == current.Slug {
		slug = current.Slug
	} else {
		availableSlug, err := s.nextProfileSlug(ctx, tx, slug)
		if err != nil {
			return nil, err
		}
		slug = availableSlug
	}

	if _, err := tx.Exec(ctx, `
		UPDATE profiles
		SET display_name = $1, slug = $2, bio = $3,
			name_confirmed_at = COALESCE(name_confirmed_at, now())
		WHERE user_id = $4 AND deleted_at IS NULL
	`, displayName, slug, strings.TrimSpace(req.Bio), userID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}

		return nil, err
	}

	if err := s.recordAudit(ctx, tx, &userID, "profile.update", "profile", nil, nil, nil, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) UpdateCreatorProfile(ctx context.Context, userID string, req UpdateCreatorProfileRequest) (*CurrentUser, error) {
	if !s.userHasRole(ctx, userID, RoleStreamer) {
		return nil, errForbidden
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "published"
	}

	if !validCreatorStatus(status) {
		return nil, errValidation
	}

	if _, err := s.db.Exec(ctx, `
		UPDATE creator_profiles
		SET title = $1, description = $2, status = $3
		WHERE user_id = $4
	`, strings.TrimSpace(req.Title), strings.TrimSpace(req.Description), status, userID); err != nil {
		return nil, err
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) UpdateSellerProfile(ctx context.Context, userID string, req UpdateSellerProfileRequest) (*CurrentUser, error) {
	if !s.userHasRole(ctx, userID, RoleSeller) {
		return nil, errForbidden
	}

	displayName := strings.TrimSpace(req.DisplayName)
	if !validDisplayName(displayName) {
		return nil, errValidation
	}

	sellerType := strings.TrimSpace(req.SellerType)
	if sellerType == "" {
		sellerType = "lite"
	}
	if !validSellerType(sellerType) {
		return nil, errValidation
	}

	if _, err := s.db.Exec(ctx, `
		UPDATE seller_profiles
		SET display_name = $1, description = $2, seller_type = $3
		WHERE user_id = $4 AND deleted_at IS NULL
	`, displayName, strings.TrimSpace(req.Description), sellerType, userID); err != nil {
		return nil, err
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) GetUserPreferences(ctx context.Context, userID string) (*UserPreferences, error) {
	if _, err := s.db.Exec(ctx, `
		INSERT INTO user_preferences (user_id, theme_preference, locale)
		SELECT id, 'system', default_locale
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
		ON CONFLICT (user_id) DO NOTHING
	`, userID); err != nil {
		return nil, err
	}

	var preferences UserPreferences
	if err := s.db.QueryRow(ctx, `
		SELECT user_id, theme_preference, locale, created_at, updated_at
		FROM user_preferences
		WHERE user_id = $1
	`, userID).Scan(
		&preferences.UserID,
		&preferences.ThemePreference,
		&preferences.Locale,
		&preferences.CreatedAt,
		&preferences.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &preferences, nil
}

func (s *Store) UpdateUserPreferences(ctx context.Context, userID string, req UpdateUserPreferencesRequest) (*UserPreferences, error) {
	current, err := s.GetUserPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	themePreference := current.ThemePreference
	if req.ThemePreference != nil {
		themePreference = strings.ToLower(strings.TrimSpace(*req.ThemePreference))
		if !validThemePreference(themePreference) {
			return nil, errValidation
		}
	}

	locale := current.Locale
	if req.Locale != nil {
		locale = strings.ToLower(strings.TrimSpace(*req.Locale))
		if !validLocale(locale) {
			return nil, errValidation
		}
	}

	if _, err := s.db.Exec(ctx, `
		UPDATE user_preferences
		SET theme_preference = $1, locale = $2
		WHERE user_id = $3
	`, themePreference, locale, userID); err != nil {
		return nil, err
	}

	return s.GetUserPreferences(ctx, userID)
}

func (s *Store) GetPublicProfile(ctx context.Context, slug string) (*PublicProfileResponse, error) {
	var profile Profile
	if err := s.db.QueryRow(ctx, `
		SELECT p.id, p.user_id, p.display_name, p.slug, p.bio, p.name_confirmed_at, p.created_at, p.updated_at
		FROM profiles p
		JOIN users u ON u.id = p.user_id
		WHERE lower(p.slug) = lower($1) AND p.deleted_at IS NULL AND u.deleted_at IS NULL AND u.status = 'active'
	`, normalizeSlug(slug)).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.DisplayName,
		&profile.Slug,
		&profile.Bio,
		&profile.NameConfirmedAt,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	creatorProfile, err := s.getCreatorProfileByUserID(ctx, profile.UserID)
	if err != nil {
		return nil, err
	}

	if creatorProfile != nil && creatorProfile.Status != "published" {
		creatorProfile = nil
	}

	sellerProfile, err := s.getSellerProfileByUserID(ctx, profile.UserID)
	if err != nil {
		return nil, err
	}

	return &PublicProfileResponse{
		Profile:        profile,
		CreatorProfile: creatorProfile,
		SellerProfile:  sellerProfile,
	}, nil
}

func (s *Store) GetPublicCreator(ctx context.Context, slug string) (*PublicCreatorResponse, error) {
	var profile Profile
	var creator CreatorProfile
	if err := s.db.QueryRow(ctx, `
		SELECT
			p.id, p.user_id, p.display_name, p.slug, p.bio, p.name_confirmed_at, p.created_at, p.updated_at,
			c.id, c.user_id, c.profile_id, c.creator_slug, c.title, c.description,
			c.donations_enabled, c.store_enabled, c.partner_disclosure_enabled,
			c.status, c.created_at, c.updated_at
		FROM creator_profiles c
		JOIN profiles p ON p.id = c.profile_id
		JOIN users u ON u.id = c.user_id
		WHERE lower(c.creator_slug) = lower($1)
			AND p.deleted_at IS NULL
			AND u.deleted_at IS NULL
			AND u.status = 'active'
			AND c.status = 'published'
	`, normalizeSlug(slug)).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.DisplayName,
		&profile.Slug,
		&profile.Bio,
		&profile.NameConfirmedAt,
		&profile.CreatedAt,
		&profile.UpdatedAt,
		&creator.ID,
		&creator.UserID,
		&creator.ProfileID,
		&creator.CreatorSlug,
		&creator.Title,
		&creator.Description,
		&creator.DonationsEnabled,
		&creator.StoreEnabled,
		&creator.PartnerDisclosureEnabled,
		&creator.Status,
		&creator.CreatedAt,
		&creator.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}

		return nil, err
	}

	return &PublicCreatorResponse{
		Profile: profile,
		Creator: creator,
	}, nil
}

func (s *Store) ListAdminUsers(ctx context.Context, limit int, offset int) (*AdminUserListResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 25
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	if err := s.db.QueryRow(ctx, `
		SELECT count(*)
		FROM users
		WHERE deleted_at IS NULL
	`).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT u.id, u.email, u.status, u.default_locale, u.created_at,
			COALESCE(p.display_name, ''), COALESCE(p.slug, '')
		FROM users u
		LEFT JOIN profiles p ON p.user_id = u.id AND p.deleted_at IS NULL
		WHERE u.deleted_at IS NULL
		ORDER BY u.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminUserSummary, 0, limit)
	for rows.Next() {
		var item AdminUserSummary
		if err := rows.Scan(
			&item.ID,
			&item.Email,
			&item.Status,
			&item.DefaultLocale,
			&item.CreatedAt,
			&item.DisplayName,
			&item.Slug,
		); err != nil {
			return nil, err
		}

		roles, err := s.getRoles(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		item.Roles = roles
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &AdminUserListResponse{
		Items:      items,
		Pagination: pagination(limit, offset, total),
	}, nil
}

func (s *Store) GetAdminUser(ctx context.Context, userID string) (*CurrentUser, error) {
	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) UpdateUserStatus(ctx context.Context, actorUserID string, userID string, req UpdateUserStatusRequest) (*CurrentUser, error) {
	status := strings.TrimSpace(req.Status)
	if !validStatus(status) {
		return nil, errValidation
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	commandTag, err := tx.Exec(ctx, `
		UPDATE users
		SET status = $1
		WHERE id = $2 AND deleted_at IS NULL
	`, status, userID)
	if err != nil {
		return nil, err
	}
	if commandTag.RowsAffected() == 0 {
		return nil, errNotFound
	}

	if err := s.recordAudit(ctx, tx, &actorUserID, "admin.user_status.update", "user", &userID, nil, nil, map[string]string{
		"status": status,
	}); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.GetCurrentUser(ctx, userID)
}

func (s *Store) grantRole(ctx context.Context, tx pgx.Tx, userID string, role Role) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO user_roles (user_id, role)
		VALUES ($1, $2)
		ON CONFLICT (user_id, role) DO NOTHING
	`, userID, string(role))
	return err
}

func (s *Store) createCreatorProfile(ctx context.Context, tx pgx.Tx, userID string, profileID string, baseSlug string) error {
	if err := s.grantRole(ctx, tx, userID, RoleStreamer); err != nil {
		return err
	}

	creatorSlug, err := s.nextCreatorSlug(ctx, tx, baseSlug)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO creator_profiles (user_id, profile_id, creator_slug, status)
		VALUES ($1, $2, $3, 'published')
	`, userID, profileID, creatorSlug)
	return err
}

func (s *Store) createSellerProfile(ctx context.Context, tx pgx.Tx, userID string, displayName string) error {
	if err := s.grantRole(ctx, tx, userID, RoleSeller); err != nil {
		return err
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO seller_profiles (user_id, display_name)
		VALUES ($1, $2)
	`, userID, displayName)
	return err
}

func (s *Store) getRoles(ctx context.Context, userID string) ([]Role, error) {
	rows, err := s.db.Query(ctx, `
		SELECT role
		FROM user_roles
		WHERE user_id = $1
		ORDER BY role
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]Role, 0)
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *Store) getProfileByUserID(ctx context.Context, userID string) (*Profile, error) {
	var profile Profile
	if err := s.db.QueryRow(ctx, `
		SELECT id, user_id, display_name, slug, bio, name_confirmed_at, created_at, updated_at
		FROM profiles
		WHERE user_id = $1 AND deleted_at IS NULL
	`, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.DisplayName,
		&profile.Slug,
		&profile.Bio,
		&profile.NameConfirmedAt,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &profile, nil
}

func (s *Store) getCreatorProfileByUserID(ctx context.Context, userID string) (*CreatorProfile, error) {
	var profile CreatorProfile
	if err := s.db.QueryRow(ctx, `
		SELECT id, user_id, profile_id, creator_slug, title, description,
			donations_enabled, store_enabled, partner_disclosure_enabled,
			status, created_at, updated_at
		FROM creator_profiles
		WHERE user_id = $1
	`, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.ProfileID,
		&profile.CreatorSlug,
		&profile.Title,
		&profile.Description,
		&profile.DonationsEnabled,
		&profile.StoreEnabled,
		&profile.PartnerDisclosureEnabled,
		&profile.Status,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &profile, nil
}

func (s *Store) getSellerProfileByUserID(ctx context.Context, userID string) (*SellerProfile, error) {
	var profile SellerProfile
	if err := s.db.QueryRow(ctx, `
		SELECT id, user_id, seller_type, status, display_name, description,
			verification_status, rating_avg::float8, rating_count, created_at, updated_at
		FROM seller_profiles
		WHERE user_id = $1 AND deleted_at IS NULL
	`, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.SellerType,
		&profile.Status,
		&profile.DisplayName,
		&profile.Description,
		&profile.VerificationStatus,
		&profile.RatingAvg,
		&profile.RatingCount,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &profile, nil
}

func (s *Store) userHasRole(ctx context.Context, userID string, role Role) bool {
	var exists bool
	if err := s.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM user_roles
			WHERE user_id = $1 AND role = $2
		)
	`, userID, string(role)).Scan(&exists); err != nil {
		return false
	}

	return exists
}

func (s *Store) shouldBootstrapAdmin(ctx context.Context, tx pgx.Tx, email string) bool {
	if !s.allowAdminBootstrap || s.adminBootstrapEmail == "" || email != s.adminBootstrapEmail {
		return false
	}

	var exists bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM user_roles
			WHERE role = 'admin'
		)
	`).Scan(&exists); err != nil {
		return false
	}

	return !exists
}

func (s *Store) nextProfileSlug(ctx context.Context, tx pgx.Tx, baseSlug string) (string, error) {
	return s.nextSlug(ctx, tx, "profiles", baseSlug)
}

func (s *Store) nextCreatorSlug(ctx context.Context, tx pgx.Tx, baseSlug string) (string, error) {
	return s.nextSlug(ctx, tx, "creator_profiles", baseSlug)
}

func (s *Store) nextSlug(ctx context.Context, tx pgx.Tx, kind string, baseSlug string) (string, error) {
	slug := normalizeSlug(baseSlug)

	for attempt := 0; attempt < 8; attempt++ {
		candidate := slug
		if attempt > 0 {
			candidate = strings.TrimRight(slug, "-")
			if len(candidate) > 56 {
				candidate = candidate[:56]
			}
			candidate = candidate + "-" + randomSuffix(6)
		}

		exists, err := s.slugExists(ctx, tx, kind, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}

	return "", errConflict
}

func (s *Store) slugExists(ctx context.Context, tx pgx.Tx, kind string, slug string) (bool, error) {
	var query string
	switch kind {
	case "profiles":
		query = "SELECT EXISTS(SELECT 1 FROM profiles WHERE lower(slug) = lower($1) AND deleted_at IS NULL)"
	case "creator_profiles":
		query = "SELECT EXISTS(SELECT 1 FROM creator_profiles WHERE lower(creator_slug) = lower($1))"
	default:
		return false, errValidation
	}

	var exists bool
	if err := tx.QueryRow(ctx, query, slug).Scan(&exists); err != nil {
		return false, err
	}

	return exists, nil
}

func (s *Store) recordAudit(ctx context.Context, tx pgx.Tx, actorUserID *string, action string, entityType string, entityID *string, ipAddress *string, userAgent *string, metadata any) error {
	metadataValue := []byte(`{}`)
	if metadata != nil {
		value, err := json.Marshal(metadata)
		if err != nil {
			return err
		}
		metadataValue = value
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, ip_address, user_agent, metadata_json)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, actorUserID, action, entityType, entityID, ipAddress, userAgent, metadataValue)
	return err
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func defaultDisplayName(email string) string {
	value := emailLocalPart(email)
	if validDisplayName(value) {
		return value
	}

	return "FanFuel User"
}

func emailLocalPart(email string) string {
	local, _, found := strings.Cut(email, "@")
	if !found || strings.TrimSpace(local) == "" {
		return "user"
	}

	return strings.TrimSpace(local)
}

func pagination(limit int, offset int, total int) Pagination {
	nextOffset := offset + limit
	prevOffset := offset - limit
	if prevOffset < 0 {
		prevOffset = 0
	}

	result := Pagination{
		Limit:   limit,
		Offset:  offset,
		Total:   total,
		HasNext: nextOffset < total,
		HasPrev: offset > 0,
	}

	if result.HasNext {
		result.NextOffset = &nextOffset
	}
	if result.HasPrev {
		result.PrevOffset = &prevOffset
	}

	return result
}
