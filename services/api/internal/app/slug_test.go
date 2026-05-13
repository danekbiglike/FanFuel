package app

import "testing"

func TestNormalizeSlug(t *testing.T) {
	tests := map[string]string{
		"Streamer Name":      "streamer-name",
		"  Seller---Pro  ":   "seller-pro",
		"Яркий автор":        "user",
		"ab":                 "ab-user",
		"valid-slug-123":     "valid-slug-123",
		"spaces and symbols": "spaces-and-symbols",
	}

	for input, expected := range tests {
		if actual := normalizeSlug(input); actual != expected {
			t.Fatalf("normalizeSlug(%q): expected %q, got %q", input, expected, actual)
		}
	}
}

func TestNormalizeOptionalSlug(t *testing.T) {
	tests := map[string]string{
		"":              "",
		"   ":           "",
		" OBS Packs ":   "obs-packs",
		"Яркий автор":   "user",
		"valid-slug-1":  "valid-slug-1",
		"ab":            "ab-user",
		"category/user": "category-user",
	}

	for input, expected := range tests {
		if actual := normalizeOptionalSlug(input); actual != expected {
			t.Fatalf("normalizeOptionalSlug(%q): expected %q, got %q", input, expected, actual)
		}
	}
}
