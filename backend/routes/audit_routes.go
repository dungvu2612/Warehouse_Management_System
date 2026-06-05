package routes

/*
- Mục đích: Dang ky endpoint audit consistency.
- Phụ thuộc: audit repository/service/handler + role middleware.
- Hợp đồng API: GET /audit/consistency/:order_id.
- Role access: ADMIN + WAREHOUSE.
- Ghi chú bảo trì: Permission can phu hop module dashboard va order detail audit tab.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

func AuditRoutes(r *gin.Engine) {
	repo := repositories.NewAuditRepository(config.DB)
	service := services.NewAuditService(repo)
	handler := handlers.NewAuditHandler(service)

	audit := r.Group("/audit")
	audit.Use(middleware.AuthRequired())
	{
		// Admin/staff đều cần quyền xem báo cáo đối soát để kiểm tra nghiệp vụ.
		audit.GET("/consistency/:order_id", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetOrderAuditConsistency)
	}
}
