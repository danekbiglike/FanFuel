package app

import (
	"strings"
	"testing"
)

func TestAuthValidationBoundaries(t *testing.T) {
	if _, ok := normalizeEmail("Person <person@example.com>"); ok {
		t.Fatal("display-name email must not be accepted")
	}
	if email, ok := normalizeEmail(" PERSON@example.com "); !ok || email != "person@example.com" {
		t.Fatalf("unexpected normalized email %q, valid=%v", email, ok)
	}
	if !validPassword("password") {
		t.Fatal("eight-character password should be valid")
	}
	if validPassword(strings.Repeat("я", 37)) {
		t.Fatal("password above bcrypt 72-byte limit must be rejected")
	}
}
