package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'dashboard'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- DashboardRoutes

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
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
		// ADMIN và STAFF đều có thể xem dashboard tổng quan.
		dashboard.GET("/stats", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetDashboardStats)
	}
}
