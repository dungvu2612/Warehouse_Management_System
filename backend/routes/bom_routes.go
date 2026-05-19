package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func BOMRoutes(r *gin.Engine) {
	boms := r.Group("/boms")
	boms.Use(middleware.AuthRequired())
	{
		// Tạo BOM chỉ cho ADMIN
		boms.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateBOM)
		// Xem BOM cho cả ADMIN và STAFF
		boms.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetBOMs)
		boms.GET("/:id/items", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetBOMItems)
	}
}
