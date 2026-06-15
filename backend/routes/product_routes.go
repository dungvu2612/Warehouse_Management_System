package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'product'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- ProductRoutes

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

func ProductRoutes(r *echo.Echo) {
	repo := repositories.NewProductRepository(config.DB)
	service := services.NewProductService(repo)
	handler := handlers.NewProductHandler(service)

	products := r.Group("/products")
	products.Use(middleware.AuthRequired())
	{
		products.GET("", adapt(handler.GetProducts))
		products.GET("/code-preview", adapt(handler.GetProductCodePreview))
		products.GET("/scan/:qr_code", adapt(handler.ScanProductByQRCode))
		products.GET("/:id", adapt(handler.GetProductByID))
		products.POST("", adapt(handler.CreateProduct), middleware.RequireRoles("ADMIN"))
		products.PUT("/:id", adapt(handler.UpdateProduct), middleware.RequireRoles("ADMIN"))
		products.DELETE("/:id", adapt(handler.DeleteProduct), middleware.RequireRoles("ADMIN"))
	}
}
