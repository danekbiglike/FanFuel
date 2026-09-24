package commerce

import (
	"math"
	"testing"
	"time"
)

func identity() Identity {
	return Identity{Source: "steam", ExternalID: "123", WorkTitle: "Example 2", Format: "license_key", Platform: "steam", Edition: "standard", Region: "ru", Language: "ru", License: "personal", Bundle: "none"}
}
func TestIdentityBoundaries(t *testing.T) {
	a := identity()
	key := a.VariantKey("seller-a")
	if key == "" || key != a.VariantKey("seller-b") {
		t.Fatal("shared canonical identity")
	}
	for _, f := range []string{"gift", "personal_account", "shared_account"} {
		b := a
		b.Format = f
		if b.VariantKey("seller-a") == key {
			t.Fatal("format collision")
		}
	}
	b := a
	b.Region = ""
	if b.VariantKey("s") != "" {
		t.Fatal("unknown region")
	}
	b.Region = "unknown"
	if b.VariantKey("s") != "" {
		t.Fatal("placeholder is not a known region")
	}
	b = a
	b.ExternalID = "app/123"
	if b.VariantKey("seller-a") != key {
		t.Fatal("canonical namespace")
	}
	a.Source = "seller"
	if a.VariantKey("a") == a.VariantKey("b") {
		t.Fatal("unverified cross-seller match")
	}
}
func TestMoney(t *testing.T) {
	if (Rates{Promo: 500, Storefront: 500}).Validate() == nil {
		t.Fatal("equal rates")
	}
	if (Rates{Promo: 100, Storefront: 500}).Validate() != nil {
		t.Fatal("rates")
	}
	x, e := Allocate(999, 1000, 13)
	if e != nil || x.Creator != 99 || x.Seller != 887 || x.Buyer != 999 {
		t.Fatal(x, e)
	}
	if _, e = Total(math.MaxInt64, 2); e == nil {
		t.Fatal("overflow")
	}
	v, e := Share(math.MaxInt64, 10000)
	if e != nil || v != math.MaxInt64 {
		t.Fatal("max share")
	}
	var refunded int64
	for i := int64(0); i < 999; i++ {
		r, e := RefundShare(999, 99, i, 1)
		if e != nil {
			t.Fatal(e)
		}
		refunded += r
	}
	if refunded != 99 {
		t.Fatal("refund conservation")
	}
}
func TestChoice(t *testing.T) {
	a := &Candidate{CreatorID: "a", Channel: "storefront", BPS: 1000}
	b := &Candidate{CreatorID: "b", Channel: "promo", BPS: 200}
	if _, e := Choose(a, b, ""); e != ErrChoice {
		t.Fatal("silent attribution")
	}
	if x, e := Choose(a, b, "promo"); e != nil || x != b {
		t.Fatal("choice")
	}
	b.CreatorID = "a"
	if x, _ := Choose(a, b, ""); x != a {
		t.Fatal("same creator store rate")
	}
	if _, e := Choose(nil, b, "storefront"); e == nil {
		t.Fatal("missing channel")
	}
}
func TestReference(t *testing.T) {
	now := time.Now()
	xs := []Observation{}
	for n, v := range []int64{980, 990, 1000, 1010, 1020, 999999} {
		xs = append(xs, Observation{SellerID: string(rune('a' + n)), Variant: "v", Currency: "RUB", Amount: v, At: now, Eligible: true})
	}
	xs = append(xs, Observation{SellerID: "a", Variant: "v", Currency: "RUB", Amount: 1000000, At: now, Eligible: true})
	r := MarketPrice(xs, "v", "RUB", now)
	if r.Status != "observed" || r.Median != 1000 || r.Sellers != 5 || r.Excluded != 1 {
		t.Fatal(r)
	}
	if r := MarketPrice(xs[:4], "v", "RUB", now); r.Status != "insufficient" {
		t.Fatal(r)
	}
	if r := MarketPrice(xs, "v", "USD", now); r.Status != "insufficient" {
		t.Fatal("currency mix")
	}
}
func TestColdStart(t *testing.T) {
	if Conversion(0, 0, true).Status != "insufficient" {
		t.Fatal("cold start")
	}
	if Conversion(100, 101, true).Status != "invalid" {
		t.Fatal("denominator")
	}
	x := Conversion(1000, 50, true)
	if x.Low >= .05 || x.High <= .05 {
		t.Fatal(x)
	}
	if len(PriceSignals(100, 4000, PriceReference{Status: "insufficient"})) != 0 {
		t.Fatal("fabricated warning")
	}
}
func TestIntentAndDiversity(t *testing.T) {
	if !ParseIntent("игра ключ или гифт").Ambiguous {
		t.Fatal("ambiguous format")
	}
	if ParseIntent("ключница").Format != "" {
		t.Fatal("partial match")
	}
	xs := Diversify([]RankedItem{{ID: "1", SellerID: "s", Relevance: 1}, {ID: "2", SellerID: "s", Relevance: .9}, {ID: "3", SellerID: "t", Relevance: .8}}, 3, 1)
	if len(xs) != 2 || xs[1].ID != "3" {
		t.Fatal(xs)
	}
}
func FuzzAllocation(f *testing.F) {
	f.Add(int64(999), 1000)
	f.Fuzz(func(t *testing.T, amount int64, bps int) {
		if amount < 0 || bps < 0 || bps > 5000 {
			return
		}
		x, e := Allocate(amount, bps, 0)
		if e != nil || x.Seller+x.Creator != amount || x.Creator < 0 {
			t.Fatal(x, e)
		}
	})
}
