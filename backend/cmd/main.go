package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"quan_ly_kho/config"
	"quan_ly_kho/docs"
	"quan_ly_kho/notifications"
	"quan_ly_kho/realtime"
	"quan_ly_kho/repositories"
	"quan_ly_kho/routes"
	"quan_ly_kho/services"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

type validatingBinder struct {
	binder   echo.DefaultBinder
	validate *validator.Validate
}

func newValidatingBinder() *validatingBinder {
	validate := validator.New()
	validate.SetTagName("binding")
	return &validatingBinder{validate: validate}
}

func (b *validatingBinder) Bind(i interface{}, c echo.Context) error {
	if err := b.binder.Bind(i, c); err != nil {
		return err
	}
	return b.validate.Struct(i)
}

// @title WMS Warehouse Management API
// @version 1.0
// @description Tài liệu API cho hệ thống quản lý kho WMS.
// @description Hệ thống hỗ trợ quản lý sản phẩm, tồn kho, đơn hàng, nhập kho, picking, khay/kệ, người dùng và lịch sử kho.
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Nhập JWT token theo dạng: Bearer <token>
func main() {
	_ = godotenv.Load()
	docs.SwaggerInfo.BasePath = envValue("SWAGGER_BASE_PATH", "/api")
	config.ConnectDatabase()
	config.RunDatabaseMigrations()
	config.SeedDefaultUsers()

	e := echo.New()
	e.Binder = newValidatingBinder()
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins:     envList("CORS_ALLOWED_ORIGINS", []string{"http://localhost:5173"}),
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		ExposeHeaders:    []string{echo.HeaderContentLength},
		AllowCredentials: true,
		MaxAge:           int((12 * time.Hour).Seconds()),
	}))
	e.Use(realtime.DataChangeMiddleware())
	notificationRepo := repositories.NewNotificationRepository(config.DB)
	notificationService := services.NewNotificationService(notificationRepo)
	e.Use(notifications.DataChangeMiddleware(notificationService))

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{
			"message": "Server running",
		})
	})
	e.GET("/docs/*", echoSwagger.WrapHandler)
	e.GET("/ws", realtime.HandleWebSocket)

	routes.AuthRoutes(e)
	routes.AuditRoutes(e)
	routes.BOMRoutes(e)
	routes.DashboardRoutes(e)
	routes.ImportReceiptRoutes(e)
	routes.InventoryRoutes(e)
	routes.OrderRoutes(e)
	routes.StaffReportRoutes(e)
	routes.StaffRoutes(e)
	routes.PickLogRoutes(e)
	routes.StockTransactionRoutes(e)
	routes.LocationRoutes(e)
	routes.NotificationRoutes(e)
	routes.TrayRoutes(e)
	routes.ProductRoutes(e)
	routes.UserRoutes(e)

	serveFrontend(e)

	host := envValue("APP_HOST", "0.0.0.0")
	port := envValue("APP_PORT", "8080")
	e.Logger.Fatal(e.Start(host + ":" + port))
}

func serveFrontend(e *echo.Echo) {
	distDir := envValue("FRONTEND_DIST_DIR", "")
	if distDir == "" {
		distDir = firstExistingDir([]string{
			filepath.Join("..", "frontend", "dist"),
			filepath.Join("frontend", "dist"),
			"dist",
		})
	}
	if distDir == "" {
		return
	}

	assetsDir := filepath.Join(distDir, "assets")
	if _, err := os.Stat(assetsDir); err == nil {
		e.Static("/assets", assetsDir)
	}
	if _, err := os.Stat(filepath.Join(distDir, "favicon.ico")); err == nil {
		e.File("/favicon.ico", filepath.Join(distDir, "favicon.ico"))
	}
	if _, err := os.Stat(filepath.Join(distDir, "favicon.svg")); err == nil {
		e.File("/favicon.svg", filepath.Join(distDir, "favicon.svg"))
	}

	indexFile := filepath.Join(distDir, "index.html")
	e.GET("/*", func(c echo.Context) error {
		if isAPIRoute(c.Request().URL.Path) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "not found"})
		}
		return c.File(indexFile)
	})
}

func firstExistingDir(candidates []string) string {
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
	}
	return ""
}

func isAPIRoute(path string) bool {
	apiPrefixes := []string{
		"/auth",
		"/admin",
		"/audit",
		"/boms",
		"/dashboard",
		"/health",
		"/import-receipts",
		"/inventory",
		"/locations",
		"/notifications",
		"/orders",
		"/pick-logs",
		"/products",
		"/staff",
		"/stock-transactions",
		"/trays",
		"/users",
		"/ws",
	}
	for _, prefix := range apiPrefixes {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			return true
		}
	}
	return false
}

func envValue(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func envList(key string, fallback []string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	values := strings.Split(raw, ",")
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			result = append(result, value)
		}
	}
	if len(result) == 0 {
		return fallback
	}
	return result
}
