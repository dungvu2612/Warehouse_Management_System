package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func TrayRoutes(r *gin.Engine) {
	trays := r.Group("/trays")
	trays.Use(middleware.AuthRequired())
	{
		trays.GET("", handlers.GetTrays)
		trays.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateTray)
	}
}
