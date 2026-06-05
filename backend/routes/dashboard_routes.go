package routes

/* Route dashboard cho ADMIN và WAREHOUSE. */

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

func DashboardRoutes(r *gin.Engine) {
	repo := repositories.NewDashboardRepository(config.DB)
	service := services.NewDashboardService(repo)
	handler := handlers.NewDashboardHandler(service)

	dashboard := r.Group("/dashboard")
	dashboard.Use(middleware.AuthRequired())
	{
		dashboard.GET("/stats", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetDashboardStats)
	}
}
