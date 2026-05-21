package main

import (
	"quan_ly_kho/config"
	"quan_ly_kho/routes"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	_ = godotenv.Load()

	config.ConnectDatabase()
	config.SeedDefaultUsers()

	r := gin.Default()
	// Cấu hình CORS để frontend (vite :5173) gọi được API backend (:8080) trên browser.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
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
	routes.PickLogRoutes(r)
	routes.StockTransactionRoutes(r)
	routes.LocationRoutes(r)
	routes.TrayRoutes(r)
	routes.ProductRoutes(r)

	r.Run(":8080")
}
