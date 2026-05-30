package routes

/*
Senior Handover Note:
- Purpose: Dang ky route dashboard va policy role-based.
- Dependencies: dashboard repository/service/handler + auth/role middleware.
- API contract: GET /dashboard/stats.
- Role access: ADMIN/WAREHOUSE/VIEWER duoc phep truy cap.
- Maintenance notes: Khong re-use role STAFF moi; neu can tuong thich du lieu cu da normalize o JWT.
*/

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
		dashboard.GET("/stats", middleware.RequireRoles("ADMIN", "WAREHOUSE", "VIEWER"), handler.GetDashboardStats)
	}
}
