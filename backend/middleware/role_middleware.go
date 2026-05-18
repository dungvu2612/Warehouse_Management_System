package middleware

import (
	"net/http"
	"quan_ly_kho/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, role := range allowedRoles {
		allowed[utils.NormalizeRole(role)] = struct{}{}
	}

	return func(c *gin.Context) {
		roleRaw, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing auth context",
			})
			c.Abort()
			return
		}

		role := utils.NormalizeRole(strings.TrimSpace(roleRaw.(string)))
		if _, ok := allowed[role]; !ok {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "forbidden - insufficient role",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
