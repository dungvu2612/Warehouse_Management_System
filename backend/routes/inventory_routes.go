package routes

/*
Dang ky endpoint inventory + scanner workflows (adjust/putaway/stocktaking).
Chi ADMIN va WAREHOUSE duoc truy cap.
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
		// Luồng scanner: dieu chinh ton theo tray QR.
		inventory.POST("/adjust-by-tray", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.AdjustByTray)
		// Luồng scanner: putaway theo product QR + tray QR.
		inventory.POST("/putaway", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.Putaway)
		// Admin duyet/tu choi yeu cau putaway.
		inventory.GET("/putaway-requests", middleware.RequireRoles("ADMIN"), handler.GetPutawayRequests)
		inventory.POST("/putaway-requests/:id/approve", middleware.RequireRoles("ADMIN"), handler.ApprovePutawayRequest)
		inventory.POST("/putaway-requests/:id/reject", middleware.RequireRoles("ADMIN"), handler.RejectPutawayRequest)
		// Luồng scanner: stocktaking nhanh theo tray QR.
		inventory.POST("/stocktaking", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.Stocktaking)
	}
}
