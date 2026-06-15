package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'auth'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewAuthHandler
- Login
- authUserResponse

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"net/http"

	"quan_ly_kho/models"
	"quan_ly_kho/services"
	"quan_ly_kho/utils"

	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	service services.AuthService
}

func NewAuthHandler(service services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c echo.Context) {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	token, user, err := h.service.Login(req.Username, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidAuthPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrInvalidCredentials):
			c.JSON(http.StatusUnauthorized, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"access_token": token,
		"token_type":   "Bearer",
		"user":         authUserResponse(user),
	})
}

func (h *AuthHandler) Me(c echo.Context) {
	role, _ := c.Get("role").(string)
	c.JSON(http.StatusOK, echo.Map{
		"user": echo.Map{
			"id":       c.Get("user_id"),
			"username": c.Get("username"),
			"role":     utils.NormalizeRole(role),
		},
	})
}

func authUserResponse(user *models.User) echo.Map {
	return echo.Map{
		"id":        user.ID,
		"username":  user.Username,
		"full_name": user.FullName,
		"role":      utils.NormalizeRole(user.Role),
	}
}
