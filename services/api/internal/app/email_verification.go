package app

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"time"
)

const (
	emailVerificationTTL      = 10 * time.Minute
	emailVerificationCooldown = time.Minute
	emailVerificationAttempts = 5
)

type emailVerificationService struct {
	secret []byte
}

func newEmailVerificationService(secret string) emailVerificationService {
	return emailVerificationService{secret: []byte(secret)}
}

func (s emailVerificationService) NewChallenge() (string, string, string, error) {
	challengeID, err := randomUUID()
	if err != nil {
		return "", "", "", err
	}

	var codeBytes [4]byte
	if _, err := rand.Read(codeBytes[:]); err != nil {
		return "", "", "", err
	}
	value := (uint32(codeBytes[0])<<24 | uint32(codeBytes[1])<<16 | uint32(codeBytes[2])<<8 | uint32(codeBytes[3])) % 1000000
	code := fmt.Sprintf("%06d", value)
	return challengeID, code, s.Digest(challengeID, code), nil
}

func (s emailVerificationService) Digest(challengeID string, code string) string {
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write([]byte(challengeID))
	_, _ = mac.Write([]byte{0})
	_, _ = mac.Write([]byte(code))
	return hex.EncodeToString(mac.Sum(nil))
}

func (s emailVerificationService) Matches(challengeID string, code string, expected string) bool {
	return hmacDigestEqual(s.Digest(challengeID, code), expected)
}

func hmacDigestEqual(actualDigest string, expectedDigest string) bool {
	actual, err := hex.DecodeString(actualDigest)
	if err != nil {
		return false
	}
	expected, err := hex.DecodeString(expectedDigest)
	if err != nil {
		return false
	}
	return hmac.Equal(actual, expected)
}

func validVerificationCode(code string) bool {
	if len(code) != 6 {
		return false
	}
	_, err := strconv.Atoi(code)
	return err == nil
}

func validChallengeID(value string) bool {
	if len(value) != 36 {
		return false
	}
	for index, character := range []byte(value) {
		if index == 8 || index == 13 || index == 18 || index == 23 {
			if character != '-' {
				return false
			}
			continue
		}
		if !((character >= '0' && character <= '9') || (character >= 'a' && character <= 'f') || (character >= 'A' && character <= 'F')) {
			return false
		}
	}
	return true
}

func randomUUID() (string, error) {
	var value [16]byte
	if _, err := rand.Read(value[:]); err != nil {
		return "", err
	}
	value[6] = (value[6] & 0x0f) | 0x40
	value[8] = (value[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		value[0:4], value[4:6], value[6:8], value[8:10], value[10:16]), nil
}
