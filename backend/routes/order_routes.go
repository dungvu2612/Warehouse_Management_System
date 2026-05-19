package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func OrderRoutes(r *gin.Engine) {
	orders := r.Group("/orders")
	orders.Use(middleware.AuthRequired())
	{
		// Tạo order từ BOM: chỉ ADMIN.
		orders.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateOrder)
		// Staff/Admin quét order để vào luồng picking.
		orders.POST("/scan", middleware.RequireRoles("ADMIN", "STAFF"), handlers.ScanOrderForPicking)
		// Staff xác nhận từng picking task sau khi quét đúng tray.
		orders.PATCH("/picking-tasks/:id/confirm", middleware.RequireRoles("ADMIN", "STAFF"), handlers.ConfirmPickingTask)
		orders.GET("/:id/picking-tasks", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetOrderPickingTasks)
		orders.GET("/:id/progress", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetOrderProgress)
		// Xem order cho ADMIN và STAFF.
		orders.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetOrders)
		orders.GET("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetOrderByID)
	}
}
