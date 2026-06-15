package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'pick_log'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- PickLogRoutes

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func PickLogRoutes(r *echo.Echo) {
	repo := repositories.NewPickLogRepository(config.DB)
	service := services.NewPickLogService(repo)
	handler := handlers.NewPickLogHandler(service)

	pickLogs := r.Group("/pick-logs")
	pickLogs.Use(middleware.AuthRequired())
	{
		pickLogs.GET("", adapt(handler.GetPickLogs), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}
}
