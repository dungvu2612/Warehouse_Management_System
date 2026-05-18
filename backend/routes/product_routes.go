package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func ProductRoutes(r *gin.Engine) {
	products := r.Group("/products")
	products.Use(middleware.AuthRequired())
	{
		products.GET("", handlers.GetProducts)
		products.GET("/:id", handlers.GetProductByID)
		products.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateProduct)
		products.PUT("/:id", middleware.RequireRoles("ADMIN"), handlers.UpdateProduct)
		products.DELETE("/:id", middleware.RequireRoles("ADMIN"), handlers.DeleteProduct)
	}
}
