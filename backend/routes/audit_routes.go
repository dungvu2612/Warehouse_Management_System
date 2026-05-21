package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func AuditRoutes(r *gin.Engine) {
	audit := r.Group("/audit")
	audit.Use(middleware.AuthRequired())
	{
		// Admin/staff đều cần quyền xem báo cáo đối soát để kiểm tra nghiệp vụ.
		audit.GET("/consistency/:order_id", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetOrderAuditConsistency)
	}
}
