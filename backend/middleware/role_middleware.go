package middleware

import (
	"net/http"
	"quan_ly_kho/utils"
	"strings"

	"github.com/labstack/echo/v4"
)

func RequireRoles(allowedRoles ...string) echo.MiddlewareFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, role := range allowedRoles {
		allowed[utils.NormalizeRole(role)] = struct{}{}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			roleRaw := c.Get("role")
			roleValue, ok := roleRaw.(string)
			if !ok {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "missing auth context",
				})
			}

			role := utils.NormalizeRole(strings.TrimSpace(roleValue))
			if _, ok := allowed[role]; !ok {
				return c.JSON(http.StatusForbidden, echo.Map{
					"error": "forbidden - insufficient role",
				})
			}

			return next(c)
		}
	}
}
