package app

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/events"
)

const (
	defaultDonationLimit = 20
	maxDonationLimit     = 50
)

type CreateDonationRequest struct {
	CreatorProfileID string `json:"creator_profile_id"`
	CreatorSlug      string `json:"creator_slug"`
	AmountMinor      int64  `json:"amount_minor"`
	Currency         string `json:"currency"`
	DisplayName      string `json:"display_name"`
	Message          string `json:"message"`
	IsAnonymous      bool   `json:"is_anonymous"`
	DonationGoalID   string `json:"donation_goal_id"`
	PromoCode        string `json:"promo_code"`
}

type CreateDonationGoalRequest struct {
	Title             string `json:"title"`
	Description       string `json:"description"`
	TargetAmountMinor int64  `json:"target_amount_minor"`
	Currency          string `json:"currency"`
}

type UpdateDonationGoalRequest struct {
	Title             string `json:"title"`
	Description       string `json:"description"`
	TargetAmountMinor int64  `json:"target_amount_minor"`
	Status            string `json:"status"`
}

type CreateWidgetRequest struct {
	Name string `json:"name"`
}

type Donation struct {
	ID               string     `json:"id"`
	CreatorProfileID string     `json:"creator_profile_id"`
	DonationGoalID   *string    `json:"donation_goal_id,omitempty"`
	PaymentID        string     `json:"payment_id"`
	Status           string     `json:"status"`
	DisplayName      string     `json:"display_name"`
	PublicName       string     `json:"public_name"`
	Message          string     `json:"message"`
	AmountMinor      int64      `json:"amount_minor"`
	Currency         string     `json:"currency"`
	IsAnonymous      bool       `json:"is_anonymous"`
	PaidAt           *time.Time `json:"paid_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type Payment struct {
	ID                string     `json:"id"`
	Status            string     `json:"status"`
	Purpose           string     `json:"purpose"`
	AmountMinor       int64      `json:"amount_minor"`
	Currency          string     `json:"currency"`
	Provider          string     `json:"provider"`
	ProviderPaymentID string     `json:"provider_payment_id"`
	ConfirmationURL   string     `json:"confirmation_url"`
	PaidAt            *time.Time `json:"paid_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type DonationGoal struct {
	ID                 string    `json:"id"`
	CreatorProfileID   string    `json:"creator_profile_id"`
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	TargetAmountMinor  int64     `json:"target_amount_minor"`
	CurrentAmountMinor int64     `json:"current_amount_minor"`
	Currency           string    `json:"currency"`
	Status             string    `json:"status"`
	SortOrder          int       `json:"sort_order"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Widget struct {
	ID               string     `json:"id"`
	CreatorProfileID string     `json:"creator_profile_id"`
	Kind             string     `json:"kind"`
	Status           string     `json:"status"`
	Name             string     `json:"name"`
	Token            string     `json:"token,omitempty"`
	ConnectPath      string     `json:"connect_path,omitempty"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CreateDonationResponse struct {
	Donation Donation `json:"donation"`
	Payment  Payment  `json:"payment"`
}

type DonationListResponse struct {
	Items     []Donation `json:"items"`
	TopDonors []TopDonor `json:"top_donors"`
}

type TopDonor struct {
	DisplayName      string `json:"display_name"`
	TotalAmountMinor int64  `json:"total_amount_minor"`
	Currency         string `json:"currency"`
	DonationCount    int    `json:"donation_count"`
}

type DonationGoalListResponse struct {
	Items []DonationGoal `json:"items"`
}

type WidgetListResponse struct {
	Items []Widget `json:"items"`
}

type MockPaymentCompletionResult struct {
	Donation Donation
	Payment  Payment
	Order    *OrderDetail
	Events   []events.Envelope
}

func newWidgetToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}

	token := base64.RawURLEncoding.EncodeToString(raw)
	hash := hashWidgetToken(token)
	return token, hash, nil
}

func hashWidgetToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
