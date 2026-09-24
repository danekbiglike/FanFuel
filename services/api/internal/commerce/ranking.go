package commerce

import (
	"math"
	"sort"
	"strings"
)

type SearchIntent struct {
	Text      string
	Format    string
	Ambiguous bool
}

// Распознаются только отдельные явные слова. Конфликт форматов требует уточнения, не расширения фильтра.
func ParseIntent(query string) SearchIntent {
	out := SearchIntent{Text: strings.TrimSpace(query)}
	formats := map[string]bool{}
	for _, w := range strings.Fields(Normalize(query)) {
		switch w {
		case "ключ", "ключи", "key":
			formats["license_key"] = true
		case "гифт", "gift":
			formats["gift"] = true
		}
	}
	q := Normalize(query)
	if strings.Contains(q, "общий аккаунт") || strings.Contains(q, "shared account") {
		formats["shared_account"] = true
	}
	if strings.Contains(q, "личный аккаунт") || strings.Contains(q, "personal account") {
		formats["personal_account"] = true
	}
	if len(formats) > 1 {
		out.Ambiguous = true
		return out
	}
	for f := range formats {
		out.Format = f
	}
	if out.Format != "" {
		for _, phrase := range []string{"общий аккаунт", "личный аккаунт", "shared account", "personal account"} {
			q = strings.ReplaceAll(q, phrase, " ")
		}
		words := []string{}
		for _, word := range strings.Fields(q) {
			switch word {
			case "ключ", "ключи", "key", "гифт", "gift":
			default:
				words = append(words, word)
			}
		}
		out.Text = strings.Join(words, " ")
	}
	return out
}

type RankedItem struct {
	ID, SellerID, WorkKey         string
	Relevance, Quality, Freshness float64
	Tags                          []string
}

func bounded(x float64) float64 {
	if math.IsNaN(x) || x < 0 {
		return 0
	}
	if x > 1 {
		return 1
	}
	return x
}

// Commission отсутствует в ранжировании намеренно. Издатель может ограничить повторения продавца/произведения.
func Diversify(input []RankedItem, limit, maxSeller int) []RankedItem {
	candidates := append([]RankedItem(nil), input...)
	score := func(x RankedItem) float64 {
		return .8*bounded(x.Relevance) + .15*bounded(x.Quality) + .05*bounded(x.Freshness)
	}
	sort.SliceStable(candidates, func(i, j int) bool {
		a, b := score(candidates[i]), score(candidates[j])
		if a == b {
			return candidates[i].ID < candidates[j].ID
		}
		return a > b
	})
	out := []RankedItem{}
	if limit <= 0 || maxSeller <= 0 {
		return out
	}
	sellers := map[string]int{}
	ids := map[string]bool{}
	for _, x := range candidates {
		if ids[x.ID] || sellers[x.SellerID] >= maxSeller {
			continue
		}
		ids[x.ID] = true
		sellers[x.SellerID]++
		out = append(out, x)
		if len(out) == limit {
			break
		}
	}
	return out
}
