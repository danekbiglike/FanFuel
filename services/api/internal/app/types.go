package app

import "time"

type Role string

const (
	RoleBuyer     Role = "buyer"
	RoleStreamer  Role = "streamer"
	RoleSeller    Role = "seller"
	RoleAdmin     Role = "admin"
	RoleSupport   Role = "support"
	RoleModerator Role = "moderator"
)

type RegisterRequest struct {
	RegistrationToken string `json:"registration_token"`
	Password          string `json:"password"`
	Locale            string `json:"locale"`
	TimeZone          string `json:"time_zone"`
}

type IdentifyRequest struct {
	Email string `json:"email"`
}

type IdentifyResponse struct {
	NextAction string `json:"next_action"`
}

type StartEmailVerificationRequest struct {
	Email  string `json:"email"`
	Locale string `json:"locale"`
}

type StartEmailVerificationResponse struct {
	ChallengeID       string    `json:"challenge_id"`
	Email             string    `json:"email"`
	ExpiresAt         time.Time `json:"expires_at"`
	ResendAvailableAt time.Time `json:"resend_available_at"`
}

type VerifyEmailRequest struct {
	ChallengeID string `json:"challenge_id"`
	Code        string `json:"code"`
}

type VerifyEmailResponse struct {
	RegistrationToken string    `json:"registration_token"`
	ExpiresAt         time.Time `json:"expires_at"`
}

type EmailVerificationChallenge struct {
	ID                string
	Email             string
	Locale            string
	CodeDigest        string
	AttemptCount      int
	MaxAttempts       int
	ExpiresAt         time.Time
	ResendAvailableAt time.Time
	VerifiedAt        *time.Time
	CompletedAt       *time.Time
	InvalidatedAt     *time.Time
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateProfileRequest struct {
	DisplayName string `json:"display_name"`
	Slug        string `json:"slug"`
	Bio         string `json:"bio"`
}

type UpdateCreatorProfileRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type UpdateSellerProfileRequest struct {
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	SellerType  string `json:"seller_type"`
}

type UpdateUserPreferencesRequest struct {
	ThemePreference *string `json:"themePreference"`
	Locale          *string `json:"locale"`
}

type UpdateUserStatusRequest struct {
	Status string `json:"status"`
}

type User struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	Status          string     `json:"status"`
	DefaultLocale   string     `json:"default_locale"`
	TimeZone        string     `json:"time_zone"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty"`
}

type Profile struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	DisplayName     string     `json:"display_name"`
	Slug            string     `json:"slug"`
	Bio             string     `json:"bio"`
	NameConfirmedAt *time.Time `json:"-"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type CreatorProfile struct {
	ID                       string    `json:"id"`
	UserID                   string    `json:"user_id"`
	ProfileID                string    `json:"profile_id"`
	CreatorSlug              string    `json:"creator_slug"`
	Title                    string    `json:"title"`
	Description              string    `json:"description"`
	DonationsEnabled         bool      `json:"donations_enabled"`
	StoreEnabled             bool      `json:"store_enabled"`
	PartnerDisclosureEnabled bool      `json:"partner_disclosure_enabled"`
	Status                   string    `json:"status"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}

type SellerProfile struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"user_id"`
	SellerType         string    `json:"seller_type"`
	Status             string    `json:"status"`
	DisplayName        string    `json:"display_name"`
	Description        string    `json:"description"`
	VerificationStatus string    `json:"verification_status"`
	RatingAvg          float64   `json:"rating_avg"`
	RatingCount        int       `json:"rating_count"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type CurrentUser struct {
	User                 User            `json:"user"`
	Roles                []Role          `json:"roles"`
	Profile              *Profile        `json:"profile,omitempty"`
	ProfileNameConfirmed *time.Time      `json:"profile_name_confirmed_at,omitempty"`
	CreatorProfile       *CreatorProfile `json:"creator_profile,omitempty"`
	SellerProfile        *SellerProfile  `json:"seller_profile,omitempty"`
}

type UserPreferences struct {
	UserID          string    `json:"user_id"`
	ThemePreference string    `json:"themePreference"`
	Locale          string    `json:"locale"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type AuthResponse struct {
	AccessToken string      `json:"access_token"`
	TokenType   string      `json:"token_type"`
	ExpiresAt   time.Time   `json:"expires_at"`
	User        CurrentUser `json:"user"`
}

type PublicProfileResponse struct {
	Profile        Profile         `json:"profile"`
	CreatorProfile *CreatorProfile `json:"creator_profile,omitempty"`
	SellerProfile  *SellerProfile  `json:"seller_profile,omitempty"`
}

type PublicCreatorResponse struct {
	Profile Profile        `json:"profile"`
	Creator CreatorProfile `json:"creator"`
}

type AdminUserListResponse struct {
	Items      []AdminUserSummary `json:"items"`
	Pagination Pagination         `json:"pagination"`
}

type AdminUserSummary struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Status        string    `json:"status"`
	DefaultLocale string    `json:"default_locale"`
	CreatedAt     time.Time `json:"created_at"`
	DisplayName   string    `json:"display_name"`
	Slug          string    `json:"slug"`
	Roles         []Role    `json:"roles"`
}

type Pagination struct {
	Limit      int  `json:"limit"`
	Offset     int  `json:"offset"`
	Total      int  `json:"total"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
	NextOffset *int `json:"next_offset,omitempty"`
	PrevOffset *int `json:"prev_offset,omitempty"`
}
