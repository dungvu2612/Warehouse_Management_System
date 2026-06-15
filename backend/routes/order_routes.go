package routes

/*
Dang ky endpoint module order va policy role cho flow picking.
Chi ADMIN va WAREHOUSE duoc truy cap.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func OrderRoutes(r *echo.Echo) {
	repo := repositories.NewOrderRepository(config.DB)
	service := services.NewOrderService(repo)
	handler := handlers.NewOrderHandler(service)

	orders := r.Group("/orders")
	orders.Use(middleware.AuthRequired())
	{
		// Tạo order từ BOM: chỉ ADMIN.
		orders.POST("", adapt(handler.CreateOrder), middleware.RequireRoles("ADMIN"))
		orders.PUT("/:id", adapt(handler.UpdateOrder), middleware.RequireRoles("ADMIN"))
		orders.DELETE("/:id", adapt(handler.DeleteOrder), middleware.RequireRoles("ADMIN"))
		// Staff/Admin quét order để vào luồng picking.
		orders.POST("/scan", adapt(handler.ScanOrderForPicking), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		orders.GET("/scan/:qr_code", adapt(handler.ScanOrderForPickingByQRCode), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		orders.POST("/picking-tasks/:id/verify-tray", adapt(handler.VerifyPickingTaskTray), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		orders.POST("/picking-tasks/:id/scan-product", adapt(handler.ScanProductForPickingTask), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Legacy endpoint confirm theo quantity da duoc thay the boi scan-product flow va khong expose nua.
		// Kết thúc đơn thủ công (có thể kèm cảnh báo thiếu hàng).
		orders.POST("/:id/finish", adapt(handler.FinishOrder), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		orders.GET("/:id/picking-tasks", adapt(handler.GetOrderPickingTasks), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		orders.GET("/:id/progress", adapt(handler.GetOrderProgress), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Xem danh sách order chỉ dành cho ADMIN; chi tiết order cần mở cho WAREHOUSE để staff picking vào được task.
		orders.GET("", adapt(handler.GetOrders), middleware.RequireRoles("ADMIN"))
		orders.GET("/:id", adapt(handler.GetOrderByID), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}

	adminPicking := r.Group("/admin/picking/orders")
	adminPicking.Use(middleware.AuthRequired(), middleware.RequireRoles("ADMIN"))
	{
		adminPicking.PATCH("/:order_id/assign", adapt(handler.AdminAssignPickingOrder))
		adminPicking.PATCH("/:order_id/unassign", adapt(handler.AdminUnassignPickingOrder))
	}
}
