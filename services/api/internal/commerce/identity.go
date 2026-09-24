// Package commerce содержит независимые от HTTP и БД правила маркетплейса.
package commerce

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

var ErrInvalid = errors.New("invalid commerce input")
var ErrChoice = errors.New("attribution choice required")

type Identity struct {
	Source       string `json:"source"`
	ExternalID   string `json:"external_id"`
	WorkTitle    string `json:"work_title"`
	Format       string `json:"format"`
	Platform     string `json:"platform"`
	Edition      string `json:"edition"`
	Region       string `json:"region"`
	Language     string `json:"language"`
	DurationDays int    `json:"duration_days"`
	License      string `json:"license"`
	Bundle       string `json:"bundle"`
}

// Normalize сохраняет значимые цифры, пунктуацию и язык: fuzzy-match не является идентичностью.
func Normalize(s string) string {
	return strings.Join(strings.Fields(strings.ToLower(norm.NFKC.String(s))), " ")
}

var externalPattern = regexp.MustCompile(`^[a-zA-Z0-9._:/-]{1,120}$`)
var steamPattern = regexp.MustCompile(`^(app|sub|bundle)/[1-9][0-9]*$`)
var steamNumber = regexp.MustCompile(`^[1-9][0-9]*$`)
var promoPattern = regexp.MustCompile(`^[A-Z0-9][A-Z0-9_-]{2,23}$`)

func PromoCode(s string) (string, error) {
	s = strings.ToUpper(strings.TrimSpace(s))
	if !promoPattern.MatchString(s) {
		return "", ErrInvalid
	}
	return s, nil
}

func (i Identity) Canonical() (Identity, error) {
	i.Source = Normalize(i.Source)
	i.ExternalID = strings.TrimSpace(i.ExternalID)
	i.WorkTitle = strings.TrimSpace(i.WorkTitle)
	i.Format = Normalize(i.Format)
	i.Platform = Normalize(i.Platform)
	i.Edition = Normalize(i.Edition)
	i.Region = Normalize(i.Region)
	i.Language = Normalize(i.Language)
	i.License = Normalize(i.License)
	i.Bundle = Normalize(i.Bundle)
	switch i.Source {
	case "steam", "gog", "itch", "publisher", "seller":
	default:
		return i, ErrInvalid
	}
	switch i.Format {
	case "unspecified", "digital_file", "license_key", "gift", "personal_account", "shared_account", "service", "subscription":
	default:
		return i, ErrInvalid
	}
	if len([]rune(i.WorkTitle)) < 2 || len([]rune(i.WorkTitle)) > 180 || i.DurationDays < 0 || i.DurationDays > 36500 {
		return i, ErrInvalid
	}
	for _, s := range []string{i.Platform, i.Edition, i.Region, i.Language, i.License, i.Bundle} {
		if len([]rune(s)) > 100 || strings.IndexFunc(s, unicode.IsControl) >= 0 {
			return i, ErrInvalid
		}
	}
	if i.ExternalID != "" && !externalPattern.MatchString(i.ExternalID) {
		return i, ErrInvalid
	}
	if i.Source != "seller" && i.ExternalID == "" {
		return i, ErrInvalid
	}
	if i.Source == "steam" {
		if steamNumber.MatchString(i.ExternalID) {
			i.ExternalID = "app/" + i.ExternalID
		}
		if !steamPattern.MatchString(i.ExternalID) {
			return i, ErrInvalid
		}
	}
	// ID издателя обязательно содержит пространство имён: vendor.example:asset-123.
	if i.Source == "publisher" {
		prefix, local, ok := strings.Cut(i.ExternalID, ":")
		if !ok || prefix == "" || local == "" {
			return i, ErrInvalid
		}
	}
	return i, nil
}
func hash(value any) string {
	raw, _ := json.Marshal(value)
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}
func (i Identity) WorkKey(sellerID string) string {
	if i.Source == "seller" {
		return "seller:" + hash([]string{sellerID, Normalize(i.WorkTitle), i.ExternalID})
	}
	return i.Source + ":" + i.ExternalID
}

// VariantKey пуст при неизвестном существенном атрибуте. Явное none/standard/global отличается от неизвестности.
func (i Identity) VariantKey(sellerID string) string {
	canonical, err := i.Canonical()
	if err != nil {
		return ""
	}
	i = canonical
	if i.Format == "unspecified" {
		return ""
	}
	for _, value := range []string{i.Platform, i.Edition, i.Region, i.Language, i.License, i.Bundle} {
		switch value {
		case "", "unknown", "unspecified", "not specified", "n/a", "неизвестно", "не указано":
			return ""
		}
	}
	return "v1:" + hash([]any{i.WorkKey(sellerID), i.Format, i.Platform, i.Edition, i.Region, i.Language, i.DurationDays, i.License, i.Bundle})
}
func (i Identity) AllowedForPublication() bool {
	return i.Format == "digital_file" || i.Format == "service"
}

// TitleSimilarity годится только для списка кандидатов редактора, никогда для автоматического merge.
func TitleSimilarity(a, b string) float64 {
	tokens := func(s string) map[string]bool {
		m := map[string]bool{}
		for _, t := range strings.FieldsFunc(Normalize(s), func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsNumber(r) }) {
			m[t] = true
		}
		return m
	}
	x, y := tokens(a), tokens(b)
	union := len(x)
	inter := 0
	for t := range y {
		if x[t] {
			inter++
		} else {
			union++
		}
	}
	if union == 0 {
		return 0
	}
	return float64(inter) / float64(union)
}
