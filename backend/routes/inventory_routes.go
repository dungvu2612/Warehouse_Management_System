package routes

/*
Senior Handover Note:
- Purpose: Dang ky endpoint inventory + scanner workflows (adjust/putaway/stocktaking).
- Dependencies: inventory repository/service/handler + auth/role middleware.
- API contract: /inventory, /inventory/adjust-by-tray, /inventory/putaway, /inventory/stocktaking.
- Role access: ADMIN + WAREHOUSE duoc xem/van hanh scanner workflows; VIEWER chi xem dashboard.
- Maintenance notes: Batch role update can dong bo frontend permission guard.
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
		// ADMIN và WAREHOUSE đều cần xem tồn kho để vận hành picking
		inventory.GET("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetInventory)
		// Chỉ ADMIN được tạo tồn ban đầu
		inventory.POST("", middleware.RequireRoles("ADMIN"), handler.CreateInventory)
		// Chỉ ADMIN được điều chỉnh tồn kho
		inventory.PATCH("/:id/adjust", middleware.RequireRoles("ADMIN"), handler.AdjustInventory)
		// Scanner workflow: dieu chinh ton theo tray QR.
		inventory.POST("/adjust-by-tray", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.AdjustByTray)
		// Scanner workflow: putaway theo product QR + tray QR.
		inventory.POST("/putaway", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.Putaway)
		// Admin duyet/tu choi yeu cau putaway.
		inventory.GET("/putaway-requests", middleware.RequireRoles("ADMIN"), handler.GetPutawayRequests)
		inventory.POST("/putaway-requests/:id/approve", middleware.RequireRoles("ADMIN"), handler.ApprovePutawayRequest)
		inventory.POST("/putaway-requests/:id/reject", middleware.RequireRoles("ADMIN"), handler.RejectPutawayRequest)
		// Scanner workflow: stocktaking nhanh theo tray QR.
		inventory.POST("/stocktaking", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.Stocktaking)
	}
}
