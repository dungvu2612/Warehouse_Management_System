package routes

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func MaintenanceRoutes(r *echo.Echo) {
	repo := repositories.NewMaintenanceRepository(config.DB)
	service := services.NewMaintenanceService(repo)
	handler := handlers.NewMaintenanceHandler(service)

	maintenance := r.Group("/maintenance")
	maintenance.Use(middleware.AuthRequired())
	{
		maintenance.POST("/archive-inactive", adapt(handler.ArchiveInactiveMasterData), middleware.RequireRoles("ADMIN"))
	}
}
