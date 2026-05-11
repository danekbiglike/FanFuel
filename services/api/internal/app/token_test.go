package app

import (
	"testing"
	"time"
)

func TestTokenServiceCreatesAndParsesAccessToken(t *testing.T) {
	service := NewTokenService("test_secret", time.Minute)
	user := CurrentUser{
		User: User{ID: "00000000-0000-0000-0000-000000000001"},
		Roles: []Role{
			RoleBuyer,
			RoleStreamer,
		},
	}

	token, expiresAt, err := service.CreateAccessToken(user)
	if err != nil {
		t.Fatalf("create token: %v", err)
	}
	if token == "" {
		t.Fatal("expected token")
	}
	if !expiresAt.After(time.Now()) {
		t.Fatal("expected future expiration")
	}

	claims, err := service.ParseAccessToken(token)
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}

	if claims.Subject != user.User.ID {
		t.Fatalf("expected subject %q, got %q", user.User.ID, claims.Subject)
	}
	if len(claims.Roles) != 2 || claims.Roles[1] != RoleStreamer {
		t.Fatalf("unexpected roles: %#v", claims.Roles)
	}
}
