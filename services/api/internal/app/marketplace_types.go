package app

import (
	"encoding/json"
	"github.com/fanfuel/fanfuel/services/api/internal/commerce"
	"time"
)

const (
	defaultListLimit = 20
	maxListLimit     = 100
)

type CreateProductRequest struct {
	CategoryID          string `json:"category_id"`
	Kind                string `json:"kind"`
	Title               string `json:"title"`
	Slug                string `json:"slug"`
	Description         string `json:"description"`
	Terms               string `json:"terms"`
	PriceAmountMinor    int64  `json:"price_amount_minor"`
	Currency            string `json:"currency"`
	DeliveryType        string `json:"delivery_type"`
	AffiliatePercentBps int    `json:"affiliate_percent_bps"`
}

type UpdateProductRequest struct {
	CategoryID          string `json:"category_id"`
	Kind                string `json:"kind"`
	Title               string `json:"title"`
	Slug                string `json:"slug"`
	Description         string `json:"description"`
	Terms               string `json:"terms"`
	PriceAmountMinor    int64  `json:"price_amount_minor"`
	Currency            string `json:"currency"`
	DeliveryType        string `json:"delivery_type"`
	AffiliatePercentBps int    `json:"affiliate_percent_bps"`
}

type RejectProductRequest struct {
	ModerationNote string `json:"moderation_note"`
}

type CreateOrderRequest struct {
	QuoteFingerprint  string `json:"quote_fingerprint,omitempty"`
	Storefront        string `json:"storefront,omitempty"`
	AttributionChoice string `json:"attribution_choice,omitempty"`
	ProductID         string `json:"product_id"`
	Quantity          int    `json:"quantity"`
	CreatorProfileID  string `json:"creator_profile_id"`
	PromoCode         string `json:"promo_code"`
	AcceptedTerms     bool   `json:"accepted_terms"`
}

type ReviewOrderRequest struct {
	Rating int    `json:"rating"`
	Text   string `json:"text"`
}

type ProductCategory struct {
	ID                  string    `json:"id"`
	ParentID            string    `json:"parent_id,omitempty"`
	Slug                string    `json:"slug"`
	NameI18nKey         string    `json:"name_i18n_key"`
	DescriptionI18nKey  string    `json:"description_i18n_key"`
	Status              string    `json:"status"`
	RequiresLegalReview bool      `json:"requires_legal_review"`
	SortOrder           int       `json:"sort_order"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type SellerSummary struct {
	ID                 string  `json:"id"`
	DisplayName        string  `json:"display_name"`
	SellerType         string  `json:"seller_type"`
	Status             string  `json:"status"`
	VerificationStatus string  `json:"verification_status"`
	RatingAvg          float64 `json:"rating_avg"`
	RatingCount        int     `json:"rating_count"`
}

type Product struct {
	CoverURL             string            `json:"cover_url,omitempty"`
	Identity             commerce.Identity `json:"identity"`
	VariantKey           string            `json:"variant_key"`
	PromoBPS             int               `json:"promo_bps"`
	StorefrontBPS        int               `json:"storefront_bps"`
	CommissionConfigured bool              `json:"commission_configured"`
	ID                   string            `json:"id"`
	SellerProfileID      string            `json:"seller_profile_id"`
	CategoryID           string            `json:"category_id"`
	Kind                 string            `json:"kind"`
	Status               string            `json:"status"`
	Title                string            `json:"title"`
	Slug                 string            `json:"slug"`
	Description          string            `json:"description"`
	Terms                string            `json:"terms"`
	PriceAmountMinor     int64             `json:"price_amount_minor"`
	Currency             string            `json:"currency"`
	DeliveryType         string            `json:"delivery_type"`
	AffiliatePercentBps  int               `json:"affiliate_percent_bps"`
	SafeDealRequired     bool              `json:"safe_deal_required"`
	ModerationNote       string            `json:"moderation_note,omitempty"`
	PublishedAt          *time.Time        `json:"published_at,omitempty"`
	CreatedAt            time.Time         `json:"created_at"`
	UpdatedAt            time.Time         `json:"updated_at"`
	Category             *ProductCategory  `json:"category,omitempty"`
	Seller               *SellerSummary    `json:"seller,omitempty"`
	Reviews              []Review          `json:"reviews,omitempty"`
}

type Order struct {
	ID                  string          `json:"id"`
	BuyerUserID         string          `json:"buyer_user_id"`
	SellerProfileID     string          `json:"seller_profile_id"`
	ProductID           string          `json:"product_id"`
	DealID              string          `json:"deal_id,omitempty"`
	PaymentID           string          `json:"payment_id"`
	Status              string          `json:"status"`
	Quantity            int             `json:"quantity"`
	GrossAmountMinor    int64           `json:"gross_amount_minor"`
	DiscountAmountMinor int64           `json:"discount_amount_minor"`
	TotalAmountMinor    int64           `json:"total_amount_minor"`
	Currency            string          `json:"currency"`
	TermsSnapshotJSON   json.RawMessage `json:"terms_snapshot_json"`
	CreatorProfileID    string          `json:"creator_profile_id,omitempty"`
	PromoCode           string          `json:"promo_code,omitempty"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type Deal struct {
	ID                       string     `json:"id"`
	OrderID                  string     `json:"order_id"`
	Status                   string     `json:"status"`
	GrossAmountMinor         int64      `json:"gross_amount_minor"`
	SellerAmountMinor        int64      `json:"seller_amount_minor"`
	CreatorAmountMinor       int64      `json:"creator_amount_minor"`
	PlatformFeeMinor         int64      `json:"platform_fee_minor"`
	ProviderFeeMinor         int64      `json:"provider_fee_minor"`
	Currency                 string     `json:"currency"`
	BuyerResponseDeadlineAt  *time.Time `json:"buyer_response_deadline_at,omitempty"`
	SellerResponseDeadlineAt *time.Time `json:"seller_response_deadline_at,omitempty"`
	AutoConfirmAt            *time.Time `json:"auto_confirm_at,omitempty"`
	CompletedAt              *time.Time `json:"completed_at,omitempty"`
	CreatedAt                time.Time  `json:"created_at"`
	UpdatedAt                time.Time  `json:"updated_at"`
}

type Review struct {
	ID              string    `json:"id"`
	OrderID         string    `json:"order_id"`
	BuyerUserID     string    `json:"buyer_user_id"`
	SellerProfileID string    `json:"seller_profile_id"`
	ProductID       string    `json:"product_id"`
	Rating          int       `json:"rating"`
	Text            string    `json:"text"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type ProductCategoryListResponse struct {
	Items []ProductCategory `json:"items"`
}

type ProductListResponse struct {
	Items      []Product  `json:"items"`
	Pagination Pagination `json:"pagination"`
}

type OrderListResponse struct {
	Items      []OrderDetail `json:"items"`
	Pagination Pagination    `json:"pagination"`
}

type OrderDetail struct {
	Order   Order   `json:"order"`
	Deal    Deal    `json:"deal"`
	Payment Payment `json:"payment"`
	Product Product `json:"product"`
	Review  *Review `json:"review,omitempty"`
}
