package app

import (
	"crypto/rand"
	"math/big"
	"regexp"
	"strings"
)

var slugCleanup = regexp.MustCompile(`[^a-z0-9]+`)

func normalizeSlug(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = slugCleanup.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")

	if normalized == "" {
		normalized = "user"
	}

	if len(normalized) < 3 {
		normalized = normalized + "-user"
	}

	if len(normalized) > 64 {
		normalized = strings.Trim(normalized[:64], "-")
	}

	if len(normalized) < 3 {
		return "user"
	}

	return normalized
}

func randomSuffix(length int) string {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
	var builder strings.Builder

	for i := 0; i < length; i++ {
		index, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			builder.WriteByte(alphabet[i%len(alphabet)])
			continue
		}

		builder.WriteByte(alphabet[index.Int64()])
	}

	return builder.String()
}
