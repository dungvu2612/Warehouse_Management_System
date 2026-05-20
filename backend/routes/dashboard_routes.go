package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func DashboardRoutes(r *gin.Engine) {
	dashboard := r.Group("/dashboard")
	dashboard.Use(middleware.AuthRequired())
	{
		// ADMIN và STAFF đều có thể xem dashboard tổng quan.
		dashboard.GET("/stats", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetDashboardStats)
	}
}
