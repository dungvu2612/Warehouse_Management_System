package middleware

import (
	"errors"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func AuthRequired() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if header == "" {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "missing authorization header",
				})
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "invalid authorization header",
				})
			}

			claims, err := utils.ParseToken(parts[1])
			if err != nil {
				if err == jwt.ErrTokenExpired || strings.Contains(strings.ToLower(err.Error()), "token is expired") {
					return c.JSON(http.StatusUnauthorized, echo.Map{
						"error": "token expired",
					})
				}
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "invalid token",
				})
			}

			var user models.User
			if err := config.DB.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return c.JSON(http.StatusUnauthorized, echo.Map{
						"error_code": "ACCOUNT_NOT_FOUND",
						"error":      "account not found",
					})
				}
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error_code": "AUTH_USER_CHECK_FAILED",
					"error":      "cannot verify account status",
				})
			}
			if !user.IsActive {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error_code": "ACCOUNT_DISABLED",
					"error":      "account disabled",
				})
			}

			c.Set("user_id", user.ID)
			c.Set("username", user.Username)
			c.Set("role", utils.NormalizeRole(user.Role))
			return next(c)
		}
	}
}
