package realtime

import (
	"strings"

	"github.com/labstack/echo/v4"
)

// DataChangeMiddleware phát event realtime sau các request ghi dữ liệu thành công.
func DataChangeMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if !shouldBroadcast(c) {
				return err
			}
			DefaultHub.Broadcast(NewDataChangedEvent(c.Request().Method, c.Request().URL.Path))
			return err
		}
	}
}

func shouldBroadcast(c echo.Context) bool {
	status := c.Response().Status
	if status < 200 || status >= 300 {
		return false
	}

	method := c.Request().Method
	if method != "POST" && method != "PUT" && method != "PATCH" && method != "DELETE" {
		return false
	}

	path := c.Request().URL.Path
	if path == "/ws" || strings.HasPrefix(path, "/ws/") {
		return false
	}
	if path == "/auth/login" {
		return false
	}

	return true
}

func resourceFromPath(path string) string {
	path = strings.Trim(path, "/")
	if path == "" {
		return "unknown"
	}
	return strings.Split(path, "/")[0]
}

func actionFromMethod(method string) string {
	switch method {
	case "POST":
		return "created"
	case "PUT", "PATCH":
		return "updated"
	case "DELETE":
		return "deleted"
	default:
		return "changed"
	}
}
