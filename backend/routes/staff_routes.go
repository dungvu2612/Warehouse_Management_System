package routes

/*
Senior Handover Note:
- Purpose: Route group cho staff tasks/picking entry point sau replacement refactor.
- Dependencies: order repository/service/handler + auth middleware.
- API contract: GET /staff/tasks.
- Business rules: staff task list is the entry point for warehouse workers.
- Replacement refactor notes: replacement refactor, no duplicate picking flow.
- Scanner workflow notes: Staff route chi tra du lieu danh sach; scanner thao tac qua order scan/picking endpoints.
- Permission notes: ADMIN + WAREHOUSE duoc truy cap; VIEWER khong duoc thao tac.
- Maintenance notes: Neu mo rong staff module, bo sung endpoints trong group nay.
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
