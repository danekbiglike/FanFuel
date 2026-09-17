package app

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCreatorOnboardingRequiresAuthentication(t *testing.T) {
	a := &App{}
	mux := http.NewServeMux()
	a.RegisterRoutes(mux)
	recorder := httptest.NewRecorder()
	mux.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/studio/onboarding", strings.NewReader(`{"title":"Автор"}`)))
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
}

func TestNormalizeCreatorOnboarding(t *testing.T) {
	for _, tc := range []struct {
		name        string
		title       string
		description string
		valid       bool
	}{
		{"empty", "  ", "", false},
		{"short", " Я ", "", false},
		{"unicode", strings.Repeat("Я", 80), strings.Repeat("Ю", 1000), true},
		{"long title", strings.Repeat("Я", 81), "", false},
		{"long description", "Автор", strings.Repeat("Ю", 1001), false},
		{"optional description", "Автор", "", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, valid := normalizeCreatorOnboarding(CreatorOnboardingRequest{Title: tc.title, Description: tc.description})
			if valid != tc.valid {
				t.Fatalf("valid = %v, want %v", valid, tc.valid)
			}
		})
	}
	req, _ := normalizeCreatorOnboarding(CreatorOnboardingRequest{Title: " Автор ", Description: " Описание \n"})
	if req.Title != "Автор" || req.Description != "Описание" {
		t.Fatal("whitespace not normalized")
	}
}
