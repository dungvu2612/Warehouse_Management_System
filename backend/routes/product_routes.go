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

	"github.com/gin-gonic/gin"
)

func ProductRoutes(r *gin.Engine) {
	repo := repositories.NewProductRepository(config.DB)
	service := services.NewProductService(repo)
	handler := handlers.NewProductHandler(service)

	products := r.Group("/products")
	products.Use(middleware.AuthRequired())
	{
		products.GET("", handler.GetProducts)
		products.GET("/code-preview", handler.GetProductCodePreview)
		products.GET("/:id", handler.GetProductByID)
		products.POST("", middleware.RequireRoles("ADMIN"), handler.CreateProduct)
		products.PUT("/:id", middleware.RequireRoles("ADMIN"), handler.UpdateProduct)
		products.DELETE("/:id", middleware.RequireRoles("ADMIN"), handler.DeleteProduct)
	}
}
