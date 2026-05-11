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
