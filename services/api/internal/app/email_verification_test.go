package app

import (
	"regexp"
	"strings"
	"testing"
)

func TestEmailVerificationCodeAndDigest(t *testing.T) {
	service := newEmailVerificationService("test_secret")
	challengeID, code, digest, err := service.NewChallenge()
	if err != nil {
		t.Fatalf("new challenge: %v", err)
	}
	if !regexp.MustCompile(`^[0-9]{6}$`).MatchString(code) {
		t.Fatalf("unexpected code %q", code)
	}
	if !regexp.MustCompile(`^[0-9a-f-]{36}$`).MatchString(challengeID) {
		t.Fatalf("unexpected challenge id %q", challengeID)
	}
	if !service.Matches(challengeID, code, digest) {
		t.Fatal("expected digest match")
	}
	if service.Matches(challengeID, "000000", digest) && code != "000000" {
		t.Fatal("unexpected digest match for another code")
	}
}

func TestVerificationEmailLocalizationAndMasking(t *testing.T) {
	_, ruText, ruHTML := verificationEmailCopy("ru", "123456")
	_, enText, enHTML := verificationEmailCopy("en", "123456")
	for _, value := range []string{ruText, ruHTML, enText, enHTML} {
		if !strings.Contains(value, "123456") {
			t.Fatalf("verification copy does not contain code: %q", value)
		}
	}
	if got := maskEmail("person@example.com"); got != "pe***@example.com" {
		t.Fatalf("maskEmail = %q", got)
	}
}

func TestValidChallengeID(t *testing.T) {
	valid := "c7472a7e-6fc1-4c30-83ae-b7b6840f176b"
	if !validChallengeID(valid) {
		t.Fatalf("expected %q to be valid", valid)
	}
	for _, value := range []string{"", "not-a-uuid", "c7472a7e6fc14c3083aeb7b6840f176b", "z7472a7e-6fc1-4c30-83ae-b7b6840f176b"} {
		if validChallengeID(value) {
			t.Fatalf("expected %q to be invalid", value)
		}
	}
}
