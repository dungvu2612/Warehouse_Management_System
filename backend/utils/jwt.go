package utils

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func NormalizeRole(role string) string {
	normalized := strings.ToUpper(strings.TrimSpace(role))
	if normalized == "WAREHOUSE" {
		return "STAFF"
	}
	return normalized
}

func jwtSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "change-me-in-production"
	}
	return secret
}

func jwtExpiry() time.Duration {
	// Default: 24h
	hours := 24
	if env := os.Getenv("JWT_EXPIRES_HOURS"); env != "" {
		if parsed, err := time.ParseDuration(env + "h"); err == nil {
			return parsed
		}
	}
	return time.Duration(hours) * time.Hour
}

func GenerateToken(userID uint, username, role string) (string, error) {
	now := time.Now()
	claims := AuthClaims{
		UserID:   userID,
		Username: username,
		Role:     NormalizeRole(role),
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(jwtExpiry())),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret()))
}

func ParseToken(tokenString string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("invalid signing method")
		}
		return []byte(jwtSecret()), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
