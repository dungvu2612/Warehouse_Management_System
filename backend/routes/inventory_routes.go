package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'inventory'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- InventoryRoutes

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

func InventoryRoutes(r *gin.Engine) {
	repo := repositories.NewInventoryRepository(config.DB)
	service := services.NewInventoryService(repo)
	handler := handlers.NewInventoryHandler(service)

	inventory := r.Group("/inventory")
	inventory.Use(middleware.AuthRequired())
	{
		// ADMIN và STAFF đều cần xem tồn kho để vận hành picking
		inventory.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetInventory)
		// Chỉ ADMIN được tạo tồn ban đầu
		inventory.POST("", middleware.RequireRoles("ADMIN"), handler.CreateInventory)
		// Chỉ ADMIN được điều chỉnh tồn kho
		inventory.PATCH("/:id/adjust", middleware.RequireRoles("ADMIN"), handler.AdjustInventory)
	}
}
