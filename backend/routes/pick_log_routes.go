package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func PickLogRoutes(r *gin.Engine) {
	pickLogs := r.Group("/pick-logs")
	pickLogs.Use(middleware.AuthRequired())
	{
		pickLogs.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetPickLogs)
	}
}
