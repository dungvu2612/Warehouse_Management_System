package routes

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func StaffReportRoutes(r *echo.Echo) {
	repo := repositories.NewStaffReportRepository(config.DB)
	service := services.NewStaffReportService(repo)
	handler := handlers.NewStaffReportHandler(service)

	reports := r.Group("/admin/reports")
	reports.Use(middleware.AuthRequired(), middleware.RequireRoles("ADMIN"))
	{
		reports.GET("/staff-performance", adapt(handler.GetStaffPerformance))
	}
}
