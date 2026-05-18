package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func LocationRoutes(r *gin.Engine) {
	locations := r.Group("/locations")
	locations.Use(middleware.AuthRequired())
	{
		locations.GET("", handlers.GetLocations)
		locations.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateLocation)
	}
}
