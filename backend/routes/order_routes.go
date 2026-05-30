package routes

/*
Senior Handover Note:
- Purpose: Dang ky endpoint module order va policy role cho flow picking.
- Dependencies: order repository/service/handler + auth/role middleware.
- API contract: /orders CRUD scan/confirm/finish/progress.
- Role access: ADMIN + WAREHOUSE duoc van hanh picking flow; VIEWER khong duoc truy cap endpoint nay.
- Maintenance notes: Neu doi role contract, cap nhat RequireRoles dong bo voi frontend guard.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

func OrderRoutes(r *gin.Engine) {
	repo := repositories.NewOrderRepository(config.DB)
	service := services.NewOrderService(repo)
	handler := handlers.NewOrderHandler(service)

	orders := r.Group("/orders")
	orders.Use(middleware.AuthRequired())
	{
		// Tạo order từ BOM: chỉ ADMIN.
		orders.POST("", middleware.RequireRoles("ADMIN"), handler.CreateOrder)
		orders.PUT("/:id", middleware.RequireRoles("ADMIN"), handler.UpdateOrder)
		orders.DELETE("/:id", middleware.RequireRoles("ADMIN"), handler.DeleteOrder)
		// Staff/Admin quét order để vào luồng picking.
		orders.POST("/scan", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.ScanOrderForPicking)
		orders.GET("/scan/:qr_code", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.ScanOrderForPickingByQRCode)
		orders.POST("/picking-tasks/:id/verify-tray", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.VerifyPickingTaskTray)
		orders.POST("/picking-tasks/:id/scan-product", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.ScanProductForPickingTask)
		// Legacy endpoint confirm theo quantity da duoc thay the boi scan-product flow va khong expose nua.
		// Kết thúc đơn thủ công (có thể kèm cảnh báo thiếu hàng).
		orders.POST("/:id/finish", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.FinishOrder)
		orders.GET("/:id/picking-tasks", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetOrderPickingTasks)
		orders.GET("/:id/progress", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetOrderProgress)
		// Xem order cho ADMIN và WAREHOUSE.
		orders.GET("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetOrders)
		orders.GET("/:id", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetOrderByID)
	}
}
