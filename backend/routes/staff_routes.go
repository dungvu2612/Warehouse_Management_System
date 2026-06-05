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

	"github.com/gin-gonic/gin"
)

func StaffRoutes(r *gin.Engine) {
	repo := repositories.NewOrderRepository(config.DB)
	service := services.NewOrderService(repo)
	handler := handlers.NewOrderHandler(service)

	staff := r.Group("/staff")
	staff.Use(middleware.AuthRequired())
	{
		staff.GET("/tasks", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetStaffTasks)
	}
}
