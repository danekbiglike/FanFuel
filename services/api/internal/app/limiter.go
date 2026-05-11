package app

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type rateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clients map[string]rateBucket
}

type rateBucket struct {
	count     int
	expiresAt time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		limit:   limit,
		window:  window,
		clients: make(map[string]rateBucket),
	}
}

func (l *rateLimiter) Allow(key string) bool {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	bucket, ok := l.clients[key]
	if !ok || now.After(bucket.expiresAt) {
		l.clients[key] = rateBucket{count: 1, expiresAt: now.Add(l.window)}
		return true
	}

	if bucket.count >= l.limit {
		return false
	}

	bucket.count++
	l.clients[key] = bucket
	return true
}

func clientKey(r *http.Request) string {
	forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil || host == "" {
		return r.RemoteAddr
	}

	return host
}
