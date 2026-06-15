package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'tray'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- TrayRoutes

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

func TrayRoutes(r *echo.Echo) {
	repo := repositories.NewTrayRepository(config.DB)
	service := services.NewTrayService(repo)
	handler := handlers.NewTrayHandler(service)

	trays := r.Group("/trays")
	trays.Use(middleware.AuthRequired())
	{
		trays.GET("", adapt(handler.GetTrays))
		trays.GET("/scan/:qr_code", adapt(handler.ScanTrayByQRCode))
		trays.POST("", adapt(handler.CreateTray), middleware.RequireRoles("ADMIN"))
		trays.PUT("/:id", adapt(handler.UpdateTray), middleware.RequireRoles("ADMIN"))
		trays.DELETE("/:id", adapt(handler.DeleteTray), middleware.RequireRoles("ADMIN"))
	}
}
