package notifications

import (
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
}

func HandleWebSocket(c echo.Context) error {
	identity, err := authenticateWebSocket(c.QueryParam("token"))
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid notification token"})
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "notification websocket upgrade failed"})
	}

	client := NewClient(DefaultHub, identity)
	DefaultHub.Register(client)
	defer DefaultHub.Unregister(client)
	defer conn.Close()

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case item, ok := <-client.send:
			if !ok {
				return nil
			}
			if err := conn.WriteJSON(item); err != nil {
				return nil
			}
		case <-ticker.C:
			if err := conn.WriteControl(websocket.PingMessage, []byte("ping"), time.Now().Add(5*time.Second)); err != nil {
				return nil
			}
		case <-done:
			return nil
		}
	}
}

func authenticateWebSocket(token string) (ClientIdentity, error) {
	claims, err := utils.ParseToken(strings.TrimSpace(token))
	if err != nil {
		return ClientIdentity{}, err
	}

	var user models.User
	if err := config.DB.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return ClientIdentity{}, err
		}
		return ClientIdentity{}, err
	}
	if !user.IsActive {
		return ClientIdentity{}, gorm.ErrRecordNotFound
	}
	return ClientIdentity{UserID: user.ID, Role: utils.NormalizeRole(user.Role)}, nil
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
