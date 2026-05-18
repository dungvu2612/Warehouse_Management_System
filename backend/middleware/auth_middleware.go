package middleware

import (
	"net/http"
	"quan_ly_kho/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header",
			})
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			if err == jwt.ErrTokenExpired || strings.Contains(strings.ToLower(err.Error()), "token is expired") {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "token expired",
				})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "invalid token",
				})
			}
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", utils.NormalizeRole(claims.Role))
		c.Next()
	}
}
