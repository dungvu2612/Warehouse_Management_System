package routes

/*
Dang ky endpoint inventory + scanner workflows (adjust/putaway/stocktaking).
Tai khoan STAFF hien duoc normalize thanh WAREHOUSE trong JWT de tuong thich route cu.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func InventoryRoutes(r *echo.Echo) {
	repo := repositories.NewInventoryRepository(config.DB)
	service := services.NewInventoryService(repo)
	handler := handlers.NewInventoryHandler(service)

	inventory := r.Group("/inventory")
	inventory.Use(middleware.AuthRequired())
	{
		// ADMIN và WAREHOUSE đều cần xem tồn kho để vận hành picking
		inventory.GET("", adapt(handler.GetInventory), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Chỉ ADMIN được tạo tồn ban đầu
		inventory.POST("", adapt(handler.CreateInventory), middleware.RequireRoles("ADMIN"))
		// Chỉ ADMIN được điều chỉnh tồn kho
		inventory.PATCH("/:id/adjust", adapt(handler.AdjustInventory), middleware.RequireRoles("ADMIN"))
		// Luồng scanner: dieu chinh ton theo tray QR.
		inventory.POST("/adjust-by-tray", adapt(handler.AdjustByTray), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Luồng scanner: nhập kho theo product QR + tray QR, cộng tồn và ghi IMPORT ngay.
		inventory.POST("/putaway", adapt(handler.Putaway), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Endpoint legacy cho yêu cầu putaway cũ nếu DB còn dữ liệu trước đây.
		inventory.GET("/putaway-requests", adapt(handler.GetPutawayRequests), middleware.RequireRoles("ADMIN"))
		inventory.POST("/putaway-requests/:id/approve", adapt(handler.ApprovePutawayRequest), middleware.RequireRoles("ADMIN"))
		inventory.POST("/putaway-requests/:id/reject", adapt(handler.RejectPutawayRequest), middleware.RequireRoles("ADMIN"))
		// Luồng scanner: stocktaking nhanh theo tray QR.
		inventory.POST("/stocktaking", adapt(handler.Stocktaking), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}
}
