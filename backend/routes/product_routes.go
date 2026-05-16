package routes

import (
	"quan_ly_kho/handlers"

	"github.com/gin-gonic/gin"
)

func ProductRoutes(r *gin.Engine) {

	r.POST("/products", handlers.CreateProduct)

	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)
	r.PUT("/products/:id", handlers.UpdateProduct)
	r.DELETE("/products/:id", handlers.DeleteProduct)
}
