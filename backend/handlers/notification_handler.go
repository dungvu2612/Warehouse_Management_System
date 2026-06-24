package handlers

import (
	"net/http"
	"strconv"

	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type NotificationHandler struct {
	service services.NotificationService
}

func NewNotificationHandler(service services.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) GetSummary(c echo.Context) {
	userID, role := currentNotificationUser(c)
	limit := parseNotificationLimit(c.QueryParam("limit"), 10)
	summary, err := h.service.GetSummary(userID, role, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *NotificationHandler) GetNotifications(c echo.Context) {
	userID, role := currentNotificationUser(c)
	limit := parseNotificationLimit(c.QueryParam("limit"), 50)
	items, err := h.service.GetItems(userID, role, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, echo.Map{"items": items})
}

func (h *NotificationHandler) MarkAllRead(c echo.Context) {
	c.JSON(http.StatusOK, echo.Map{"message": "Đã đánh dấu thông báo là đã xem."})
}

func currentNotificationUser(c echo.Context) (uint, string) {
	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	roleValue := c.Get("role")
	role, _ := roleValue.(string)
	return userID, role
}

func parseNotificationLimit(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}
	if value > 100 {
		return 100
	}
	return value
}
