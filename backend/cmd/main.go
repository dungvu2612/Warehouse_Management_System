package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"quan_ly_kho/config"
	"quan_ly_kho/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	_ = godotenv.Load()
	config.ConnectDatabase()
	config.RunDatabaseMigrations()
	config.SeedDefaultUsers()

	r := gin.Default()
	// Cấu hình CORS để frontend (vite :5173) gọi được API backend (:8080) trên browser.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     envList("CORS_ALLOWED_ORIGINS", []string{"http://localhost:5173"}),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Server running",
		})
	})

	routes.AuthRoutes(r)
	routes.AuditRoutes(r)
	routes.BOMRoutes(r)
	routes.DashboardRoutes(r)
	routes.ImportReceiptRoutes(r)
	routes.InventoryRoutes(r)
	routes.OrderRoutes(r)
	routes.StaffRoutes(r)
	routes.PickLogRoutes(r)
	routes.StockTransactionRoutes(r)
	routes.LocationRoutes(r)
	routes.TrayRoutes(r)
	routes.ProductRoutes(r)
	routes.UserRoutes(r)

	serveFrontend(r)

	host := envValue("APP_HOST", "0.0.0.0")
	port := envValue("APP_PORT", "8080")
	r.Run(host + ":" + port)
}

func serveFrontend(r *gin.Engine) {
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
		r.Static("/assets", assetsDir)
	}
	r.StaticFile("/favicon.ico", filepath.Join(distDir, "favicon.ico"))

	indexFile := filepath.Join(distDir, "index.html")
	r.NoRoute(func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		if isAPIRoute(c.Request.URL.Path) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.File(indexFile)
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
		"/audit",
		"/boms",
		"/dashboard",
		"/health",
		"/import-receipts",
		"/inventory",
		"/locations",
		"/orders",
		"/pick-logs",
		"/products",
		"/staff",
		"/stock-transactions",
		"/trays",
		"/users",
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
