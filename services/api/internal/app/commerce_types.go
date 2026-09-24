package app

import "github.com/fanfuel/fanfuel/services/api/internal/commerce"

type CommerceProductInput struct {
	Identity      commerce.Identity `json:"identity"`
	PromoBPS      int               `json:"promo_bps"`
	StorefrontBPS int               `json:"storefront_bps"`
}
type StoreDesign struct {
	AvatarMediaID   string   `json:"avatar_media_id,omitempty"`
	BannerMediaID   string   `json:"banner_media_id,omitempty"`
	Banner          string   `json:"banner"`
	Avatar          string   `json:"avatar"`
	Accent          string   `json:"accent"`
	Layout          string   `json:"layout"`
	Blocks          []string `json:"blocks"`
	Headline        string   `json:"headline"`
	About           string   `json:"about"`
	DonatePlacement string   `json:"donate_placement"`
}
type CreatorCommerce struct {
	CreatorID         string         `json:"creator_id"`
	Slug              string         `json:"slug"`
	Title             string         `json:"title"`
	Published         bool           `json:"published"`
	DonationsEnabled  bool           `json:"donations_enabled"`
	StorefrontEnabled bool           `json:"storefront_enabled"`
	PromoEnabled      bool           `json:"promo_enabled"`
	PromoCode         string         `json:"promo_code"`
	Design            StoreDesign    `json:"design"`
	Revision          int            `json:"revision"`
	ProductIDs        []string       `json:"product_ids"`
	Products          []Product      `json:"products"`
	Stats             []CommerceStat `json:"stats"`
}
type CommerceStat struct {
	Currency  string `json:"currency"`
	Orders    int    `json:"orders"`
	Pending   int64  `json:"pending_minor"`
	Completed int64  `json:"completed_minor"`
}
type CommerceQuote struct {
	Fingerprint    string              `json:"fingerprint"`
	ProductID      string              `json:"product_id"`
	Currency       string              `json:"currency"`
	Quantity       int                 `json:"quantity"`
	Storefront     *commerce.Candidate `json:"storefront"`
	Promo          *commerce.Candidate `json:"promo"`
	Selected       *commerce.Candidate `json:"selected"`
	ChoiceRequired bool                `json:"choice_required"`
	Allocation     commerce.Allocation `json:"allocation"`
	PromoCode      string              `json:"promo_code"`
}
type ProductInsights struct {
	Product    Product                     `json:"product"`
	Offers     []Product                   `json:"offers"`
	Reference  commerce.PriceReference     `json:"reference"`
	Signals    []string                    `json:"signals"`
	Conversion commerce.ConversionEstimate `json:"conversion"`
}
