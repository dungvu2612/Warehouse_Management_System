package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

const (
	loginRateLimitMaxAttempts = 15
	loginRateLimitLockTime    = 10 * time.Minute
	loginRateLimitBucketTTL   = 20 * time.Minute
)

type loginRateLimitBucket struct {
	count       int
	lockedUntil time.Time
	lastSeen    time.Time
}

type loginRateLimiter struct {
	mu      sync.Mutex
	buckets map[string]loginRateLimitBucket
}

var defaultLoginRateLimiter = &loginRateLimiter{
	buckets: make(map[string]loginRateLimitBucket),
}

func LoginRateLimit() echo.MiddlewareFunc {
	return defaultLoginRateLimiter.middleware
}

func (l *loginRateLimiter) middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		now := time.Now()
		ip := c.RealIP()
		if ip == "" {
			ip = c.Request().RemoteAddr
		}

		l.mu.Lock()
		l.cleanup(now)

		bucket := l.buckets[ip]
		if !bucket.lockedUntil.IsZero() && now.After(bucket.lockedUntil) {
			bucket = newLoginRateLimitBucket(now)
		}

		if !bucket.lockedUntil.IsZero() && now.Before(bucket.lockedUntil) {
			retryAfterSeconds := int(time.Until(bucket.lockedUntil).Seconds())
			if retryAfterSeconds < 0 {
				retryAfterSeconds = 0
			}
			l.buckets[ip] = bucket
			l.mu.Unlock()
			return c.JSON(http.StatusTooManyRequests, echo.Map{
				"error_code":          "LOGIN_RATE_LIMITED",
				"error":               "too many login attempts",
				"retry_after":         retryAfterSeconds,
				"retry_after_seconds": retryAfterSeconds,
				"locked_until":        bucket.lockedUntil.Format(time.RFC3339),
			})
		}

		bucket.lastSeen = now
		l.buckets[ip] = bucket
		l.mu.Unlock()

		err := next(c)
		l.recordResult(ip, c.Response().Status)
		return err
	}
}

func newLoginRateLimitBucket(now time.Time) loginRateLimitBucket {
	return loginRateLimitBucket{
		count:    0,
		lastSeen: now,
	}
}

func (l *loginRateLimiter) recordResult(ip string, status int) {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	if status >= http.StatusOK && status < http.StatusMultipleChoices {
		delete(l.buckets, ip)
		return
	}

	if status != http.StatusUnauthorized {
		return
	}

	bucket := l.buckets[ip]
	if !bucket.lockedUntil.IsZero() && now.After(bucket.lockedUntil) {
		bucket = newLoginRateLimitBucket(now)
	}
	bucket.count++
	if bucket.count >= loginRateLimitMaxAttempts {
		bucket.lockedUntil = now.Add(loginRateLimitLockTime)
	}
	bucket.lastSeen = now
	l.buckets[ip] = bucket
}

func (l *loginRateLimiter) cleanup(now time.Time) {
	for ip, bucket := range l.buckets {
		if now.Sub(bucket.lastSeen) > loginRateLimitBucketTTL {
			delete(l.buckets, ip)
		}
	}
}
