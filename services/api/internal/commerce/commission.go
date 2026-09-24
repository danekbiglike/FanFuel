package commerce

import "math"

type Rates struct {
	Promo      int `json:"promo_bps"`
	Storefront int `json:"storefront_bps"`
}

func (r Rates) Validate() error {
	if r.Promo <= 0 || r.Storefront <= r.Promo || r.Storefront > 5000 {
		return ErrInvalid
	}
	return nil
}

type Candidate struct {
	CreatorID   string `json:"creator_id"`
	CreatorName string `json:"creator_name"`
	Channel     string `json:"channel"`
	BPS         int    `json:"bps"`
}
type Allocation struct {
	Buyer    int64 `json:"buyer_amount_minor"`
	Creator  int64 `json:"creator_amount_minor"`
	Seller   int64 `json:"seller_amount_minor"`
	Platform int64 `json:"platform_amount_minor"`
}

func Total(unit int64, quantity int) (int64, error) {
	if unit <= 0 || quantity < 1 || quantity > 100 || unit > math.MaxInt64/int64(quantity) {
		return 0, ErrInvalid
	}
	return unit * int64(quantity), nil
}

// Умножение разбито на частное и остаток для защиты от переполнения.
func Share(amount int64, bps int) (int64, error) {
	if amount < 0 || bps < 0 || bps > 10000 {
		return 0, ErrInvalid
	}
	return amount/10000*int64(bps) + (amount%10000)*int64(bps)/10000, nil
}
func Allocate(total int64, creatorBPS int, platformFee int64) (Allocation, error) {
	c, err := Share(total, creatorBPS)
	if err != nil || platformFee < 0 || platformFee > total-c {
		return Allocation{}, ErrInvalid
	}
	return Allocation{Buyer: total, Creator: c, Seller: total - c - platformFee, Platform: platformFee}, nil
}
func Choose(store, promo *Candidate, choice string) (*Candidate, error) {
	if choice != "" && choice != "none" && choice != "storefront" && choice != "promo" {
		return nil, ErrInvalid
	}
	if choice == "none" {
		return nil, nil
	}
	if choice == "storefront" {
		if store == nil {
			return nil, ErrInvalid
		}
		return store, nil
	}
	if choice == "promo" {
		if promo == nil {
			return nil, ErrInvalid
		}
		return promo, nil
	}
	if store != nil && promo != nil && store.CreatorID != promo.CreatorID {
		return nil, ErrChoice
	}
	if store != nil {
		return store, nil
	}
	return promo, nil
}

// RefundShare распределяет частичные возвраты по накопительному итогу без потери копеек.
func RefundShare(original, creator, refundedBefore, refund int64) (int64, error) {
	if original <= 0 || creator < 0 || creator > original || refundedBefore < 0 || refund < 0 || refundedBefore > original-refund {
		return 0, ErrInvalid
	}
	// big.Int используется только для двух произведений в редком пути возврата.
	return proportional(creator, refundedBefore+refund, original) - proportional(creator, refundedBefore, original), nil
}
