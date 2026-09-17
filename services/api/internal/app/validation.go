package app

import (
	"net/mail"
	"strings"
	"unicode/utf8"
)

func normalizeEmail(email string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return "", false
	}

	parsed, err := mail.ParseAddress(normalized)
	if err != nil || !strings.EqualFold(parsed.Address, normalized) || len(normalized) > 254 {
		return "", false
	}

	return normalized, true
}

func maskEmail(email string) string {
	local, domain, ok := strings.Cut(email, "@")
	if !ok || local == "" || domain == "" {
		return "***"
	}
	visible := []rune(local)
	prefix := string(visible[0])
	if len(visible) > 1 {
		prefix += string(visible[1])
	}
	return prefix + "***@" + domain
}

func normalizeLocale(locale string) string {
	switch strings.ToLower(strings.TrimSpace(locale)) {
	case "en":
		return "en"
	default:
		return "ru"
	}
}

func validLocale(locale string) bool {
	switch strings.ToLower(strings.TrimSpace(locale)) {
	case "ru", "en":
		return true
	default:
		return false
	}
}

func normalizeTimeZone(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "Europe/Moscow"
	}

	return trimmed
}

func validThemePreference(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "system", "light", "dark":
		return true
	default:
		return false
	}
}

func validDisplayName(value string) bool {
	length := utf8.RuneCountInString(strings.TrimSpace(value))
	return length >= 2 && length <= 80
}

func validPassword(value string) bool {
	length := utf8.RuneCountInString(value)
	return length >= 8 && len([]byte(value)) <= 72
}

func validStatus(value string) bool {
	switch value {
	case "active", "blocked", "pending_verification", "deleted":
		return true
	default:
		return false
	}
}

func validCreatorStatus(value string) bool {
	switch value {
	case "draft", "published", "hidden", "blocked":
		return true
	default:
		return false
	}
}

func validSellerType(value string) bool {
	switch value {
	case "lite", "pro":
		return true
	default:
		return false
	}
}

func normalizeCurrency(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func validCurrency(value string) bool {
	switch normalizeCurrency(value) {
	case "RUB", "USD", "EUR":
		return true
	default:
		return false
	}
}

func validDonationAmount(amountMinor int64) bool {
	return amountMinor >= 100 && amountMinor <= 50000000
}

func validDonationMessage(value string) bool {
	return utf8.RuneCountInString(strings.TrimSpace(value)) <= 240
}

func validDonationDisplayName(value string) bool {
	length := utf8.RuneCountInString(strings.TrimSpace(value))
	return length >= 2 && length <= 80
}

func validDonationGoalStatus(value string) bool {
	switch value {
	case "active", "paused", "completed", "archived":
		return true
	default:
		return false
	}
}

func validProductKind(value string) bool {
	switch value {
	case "digital_asset", "obs_pack", "design_asset", "coaching", "digital_service":
		return true
	default:
		return false
	}
}

func validDeliveryType(value string) bool {
	switch value {
	case "manual", "digital_file", "session":
		return true
	default:
		return false
	}
}

func validProductStatus(value string) bool {
	switch value {
	case "draft", "pending_moderation", "published", "rejected", "hidden", "archived":
		return true
	default:
		return false
	}
}

func validProductTitle(value string) bool {
	length := utf8.RuneCountInString(strings.TrimSpace(value))
	return length >= 2 && length <= 140
}

func validProductDescription(value string) bool {
	return utf8.RuneCountInString(strings.TrimSpace(value)) <= 4000
}

func validProductTerms(value string) bool {
	length := utf8.RuneCountInString(strings.TrimSpace(value))
	return length >= 10 && length <= 4000
}

func validProductPrice(amountMinor int64) bool {
	return amountMinor >= 100 && amountMinor <= 100000000
}

func validAffiliatePercentBps(value int) bool {
	return value >= 0 && value <= 5000
}

func validQuantity(value int) bool {
	return value >= 1 && value <= 20
}

func validReviewRating(value int) bool {
	return value >= 1 && value <= 5
}

func validReviewText(value string) bool {
	return utf8.RuneCountInString(strings.TrimSpace(value)) <= 1200
}
