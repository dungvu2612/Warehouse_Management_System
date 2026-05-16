package main

import (
	"quan_ly_kho/config"
	"quan_ly_kho/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	_ = godotenv.Load()

	config.ConnectDatabase()

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Server running",
		})
	})

	routes.ProductRoutes(r)

	r.Run(":8080")
}