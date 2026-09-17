package app

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenService struct {
	secret []byte
	ttl    time.Duration
}

type accessClaims struct {
	Roles    []Role `json:"roles"`
	TokenUse string `json:"token_use,omitempty"`
	jwt.RegisteredClaims
}

type registrationClaims struct {
	Email       string `json:"email"`
	ChallengeID string `json:"challenge_id"`
	TokenUse    string `json:"token_use"`
	jwt.RegisteredClaims
}

func NewTokenService(secret string, ttl time.Duration) TokenService {
	return TokenService{
		secret: []byte(secret),
		ttl:    ttl,
	}
}

func (s TokenService) CreateAccessToken(user CurrentUser) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(s.ttl)

	claims := accessClaims{
		Roles:    user.Roles,
		TokenUse: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.User.ID,
			Issuer:    "fanfuel-api",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	value, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, err
	}

	return value, expiresAt, nil
}

func (s TokenService) ParseAccessToken(rawToken string) (*accessClaims, error) {
	token, err := jwt.ParseWithClaims(rawToken, &accessClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}

		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*accessClaims)
	if !ok || !token.Valid || (claims.TokenUse != "" && claims.TokenUse != "access") {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (s TokenService) CreateRegistrationToken(email string, challengeID string) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(15 * time.Minute)
	claims := registrationClaims{
		Email:       email,
		ChallengeID: challengeID,
		TokenUse:    "registration",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   challengeID,
			Issuer:    "fanfuel-api",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	value, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, err
	}

	return value, expiresAt, nil
}

func (s TokenService) ParseRegistrationToken(rawToken string) (*registrationClaims, error) {
	token, err := jwt.ParseWithClaims(rawToken, &registrationClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*registrationClaims)
	if !ok || !token.Valid || claims.TokenUse != "registration" || claims.Email == "" || claims.ChallengeID == "" {
		return nil, errors.New("invalid registration token")
	}

	return claims, nil
}
