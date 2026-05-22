package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'order'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- OrderRoutes

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

func OrderRoutes(r *gin.Engine) {
	repo := repositories.NewOrderRepository(config.DB)
	service := services.NewOrderService(repo)
	handler := handlers.NewOrderHandler(service)

	orders := r.Group("/orders")
	orders.Use(middleware.AuthRequired())
	{
		// Tạo order từ BOM: chỉ ADMIN.
		orders.POST("", middleware.RequireRoles("ADMIN"), handler.CreateOrder)
		// Staff/Admin quét order để vào luồng picking.
		orders.POST("/scan", middleware.RequireRoles("ADMIN", "STAFF"), handler.ScanOrderForPicking)
		// Staff/Admin xác nhận từng picking task sau khi quét đúng tray.
		orders.PATCH("/picking-tasks/:id/confirm", middleware.RequireRoles("ADMIN", "STAFF"), handler.ConfirmPickingTask)
		// Kết thúc đơn thủ công (có thể kèm cảnh báo thiếu hàng).
		orders.POST("/:id/finish", middleware.RequireRoles("ADMIN", "STAFF"), handler.FinishOrder)
		orders.GET("/:id/picking-tasks", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetOrderPickingTasks)
		orders.GET("/:id/progress", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetOrderProgress)
		// Xem order cho ADMIN và STAFF.
		orders.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetOrders)
		orders.GET("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetOrderByID)
	}
}
