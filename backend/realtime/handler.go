package realtime

import (
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
}

// HandleWebSocket nâng cấp HTTP request thành WebSocket connection.
func HandleWebSocket(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "websocket upgrade failed"})
	}

	NewClient(DefaultHub, conn).Start()
	return nil
}

func checkOrigin(r *http.Request) bool {
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return true
	}
	if isSameHostOrigin(origin, r.Host) {
		return true
	}

	allowedOrigins := parseOriginList(os.Getenv("WS_ALLOWED_ORIGINS"))
	if len(allowedOrigins) == 0 {
		allowedOrigins = parseOriginList(os.Getenv("CORS_ALLOWED_ORIGINS"))
	}
	if len(allowedOrigins) == 0 {
		return true
	}

	for _, allowedOrigin := range allowedOrigins {
		if origin == allowedOrigin {
			return true
		}
	}
	return false
}

func isSameHostOrigin(origin string, requestHost string) bool {
	parsedOrigin, err := url.Parse(origin)
	if err != nil {
		return false
	}
	return parsedOrigin.Host == requestHost
}

func parseOriginList(raw string) []string {
	values := strings.Split(raw, ",")
	results := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			results = append(results, value)
		}
	}
	return results
}
