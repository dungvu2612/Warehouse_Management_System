package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'location'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- LocationRoutes

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

func LocationRoutes(r *echo.Echo) {
	repo := repositories.NewLocationRepository(config.DB)
	service := services.NewLocationService(repo)
	handler := handlers.NewLocationHandler(service)

	locations := r.Group("/locations")
	locations.Use(middleware.AuthRequired())
	{
		locations.GET("", adapt(handler.GetLocations))
		locations.GET("/:id/trays", adapt(handler.GetLocationTrays))
		locations.POST("", adapt(handler.CreateLocation), middleware.RequireRoles("ADMIN"))
		locations.PUT("/:id", adapt(handler.UpdateLocation), middleware.RequireRoles("ADMIN"))
		locations.DELETE("/:id", adapt(handler.DeleteLocation), middleware.RequireRoles("ADMIN"))
	}
}
