package routes

/*
Nhóm route cho điểm vào tác vụ staff/picking.
Chỉ ADMIN và WAREHOUSE được truy cập.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func StaffRoutes(r *echo.Echo) {
	repo := repositories.NewOrderRepository(config.DB)
	service := services.NewOrderService(repo)
	handler := handlers.NewOrderHandler(service)

	staff := r.Group("/staff")
	staff.Use(middleware.AuthRequired())
	{
		staff.GET("/tasks", adapt(handler.GetStaffTasks), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		staff.GET("/task-summary", adapt(handler.GetStaffTaskSummary), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		staff.POST("/orders/:order_id/claim", adapt(handler.ClaimStaffOrder), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}
}
