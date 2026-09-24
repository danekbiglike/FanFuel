package commerce

import (
	"math"
	"math/big"
	"sort"
	"time"
)

func proportional(a, b, c int64) int64 {
	x := big.NewInt(a)
	x.Mul(x, big.NewInt(b))
	x.Quo(x, big.NewInt(c))
	return x.Int64()
}

type Observation struct {
	SellerID, Variant, Currency string
	Amount                      int64
	At                          time.Time
	Eligible                    bool
}
type PriceReference struct {
	Status   string    `json:"status"`
	Median   int64     `json:"median_minor"`
	Low      int64     `json:"low_minor"`
	High     int64     `json:"high_minor"`
	Sellers  int       `json:"sellers"`
	Excluded int       `json:"excluded"`
	AsOf     time.Time `json:"as_of"`
}

func median(xs []int64) int64 {
	n := len(xs)
	if n%2 == 1 {
		return xs[n/2]
	}
	return xs[n/2-1] + (xs[n/2]-xs[n/2-1])/2
}

// Одна свежая минимальная цена на продавца. Недостаточная выборка не превращается в «рыночную цену».
func MarketPrice(input []Observation, variant, currency string, now time.Time) PriceReference {
	out := PriceReference{Status: "insufficient", AsOf: now}
	if variant == "" {
		out.Status = "unmatched"
		return out
	}
	sellers := map[string]int64{}
	for _, o := range input {
		if !o.Eligible || o.SellerID == "" || o.Variant != variant || o.Currency != currency || o.Amount <= 0 || o.At.After(now) || now.Sub(o.At) > 30*24*time.Hour {
			continue
		}
		if old, ok := sellers[o.SellerID]; !ok || o.Amount < old {
			sellers[o.SellerID] = o.Amount
		}
	}
	xs := make([]int64, 0, len(sellers))
	for _, v := range sellers {
		xs = append(xs, v)
	}
	out.Sellers = len(xs)
	if len(xs) < 5 {
		return out
	}
	sort.Slice(xs, func(i, j int) bool { return xs[i] < xs[j] })
	m := median(xs)
	deviations := make([]int64, len(xs))
	for k, v := range xs {
		if v > m {
			deviations[k] = v - m
		} else {
			deviations[k] = m - v
		}
	}
	sort.Slice(deviations, func(i, j int) bool { return deviations[i] < deviations[j] })
	mad := median(deviations)
	filtered := []int64{}
	for _, v := range xs {
		d := v - m
		if d < 0 {
			d = -d
		}
		threshold := math.Max(float64(m)*.30, 4.4478*float64(mad))
		if float64(d) <= threshold {
			filtered = append(filtered, v)
		} else {
			out.Excluded++
		}
	}
	out.Sellers = len(filtered)
	if len(filtered) < 5 {
		return out
	}
	out.Status = "observed"
	out.Median = median(filtered)
	out.Low = filtered[(len(filtered)-1)/4]
	out.High = filtered[(len(filtered)-1)*3/4]
	return out
}

type ConversionEstimate struct {
	Status   string  `json:"status"`
	Rate     float64 `json:"rate"`
	Low      float64 `json:"low"`
	High     float64 `json:"high"`
	Visitors int64   `json:"visitors"`
}

// Wilson: только уникальные посетители и завершённые атрибутированные покупки в созревшем окне.
func Conversion(visitors, buyers int64, mature bool) ConversionEstimate {
	out := ConversionEstimate{Status: "insufficient", Visitors: visitors}
	if visitors < 0 || buyers < 0 || buyers > visitors {
		out.Status = "invalid"
		return out
	}
	if !mature || visitors < 100 {
		return out
	}
	n := float64(visitors)
	p := float64(buyers) / n
	z := 1.959963984540054
	den := 1 + z*z/n
	center := (p + z*z/(2*n)) / den
	half := z * math.Sqrt(p*(1-p)/n+z*z/(4*n*n)) / den
	out.Status = "estimated"
	out.Rate = p
	out.Low = math.Max(0, center-half)
	out.High = math.Min(1, center+half)
	return out
}
func PriceSignals(price int64, storeBPS int, reference PriceReference) []string {
	out := []string{}
	if reference.Status != "observed" || reference.Median <= 0 {
		return out
	}
	ratio := float64(price) / float64(reference.Median)
	if ratio > 1.25 {
		out = append(out, "above_observed_price")
	}
	if storeBPS >= 2500 && ratio <= 1.05 {
		out = append(out, "verify_terms_and_seller")
	}
	return out
}

// BayesianRating сглаживает малые выборки, не создаёт вымышленные отзывы в UI.
func BayesianRating(sum float64, count int, priorMean float64, priorWeight int) float64 {
	if count < 0 || priorWeight <= 0 || priorMean < 1 || priorMean > 5 || sum < float64(count) || sum > 5*float64(count) {
		return 0
	}
	return (sum + priorMean*float64(priorWeight)) / float64(count+priorWeight)
}
