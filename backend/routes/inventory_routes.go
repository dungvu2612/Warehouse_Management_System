package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func InventoryRoutes(r *gin.Engine) {
	inventory := r.Group("/inventory")
	inventory.Use(middleware.AuthRequired())
	{
		// ADMIN và STAFF đều cần xem tồn kho để vận hành picking
		inventory.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetInventory)
		// Chỉ ADMIN được tạo tồn ban đầu
		inventory.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateInventory)
		// Chỉ ADMIN được điều chỉnh tồn kho
		inventory.PATCH("/:id/adjust", middleware.RequireRoles("ADMIN"), handlers.AdjustInventory)
	}
}
