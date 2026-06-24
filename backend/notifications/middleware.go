package notifications

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type ComputedService interface {
	GetItems(userID uint, role string, limit int) ([]Item, error)
}

func DataChangeMiddleware(service ComputedService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			status := c.Response().Status
			method := c.Request().Method
			path := c.Request().URL.Path

			if shouldBroadcastScanError(status, path) {
				broadcastScanError(c, status, path)
				return err
			}

			if shouldBroadcastComputed(status, method, path) {
				DefaultHub.BroadcastToAll(NewItem(
					"NOTIFICATIONS_REFRESH",
					"NOTIFICATIONS_REFRESH",
					LevelInfo,
					"Thông báo cập nhật",
					"Dữ liệu thông báo đã thay đổi.",
					time.Now(),
					"",
				))
			}
			return err
		}
	}
}

func shouldBroadcastComputed(status int, method string, path string) bool {
	if status < 200 || status >= 300 {
		return false
	}
	if method != http.MethodPost && method != http.MethodPut && method != http.MethodPatch && method != http.MethodDelete {
		return false
	}
	if strings.HasPrefix(path, "/notifications") || strings.HasPrefix(path, "/ws") || path == "/auth/login" {
		return false
	}
	return true
}

func shouldBroadcastScanError(status int, path string) bool {
	if status < 400 || status >= 500 {
		return false
	}
	return strings.Contains(path, "/scan") || strings.Contains(path, "scan-product") || strings.Contains(path, "verify-tray")
}

func broadcastScanError(c echo.Context, status int, path string) {
	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	if userID == 0 {
		return
	}
	item := NewItem(
		fmt.Sprintf("SCAN_ERROR-%d-%s", userID, strings.ReplaceAll(path, "/", "-")),
		"SCAN_ERROR",
		LevelError,
		"Lỗi quét QR",
		"Vừa có thao tác quét QR không hợp lệ. Vui lòng kiểm tra lại mã quét.",
		time.Now(),
		"",
	)
	DefaultHub.BroadcastToUser(userID, item)
}
