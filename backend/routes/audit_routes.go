package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'audit'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- AuditRoutes

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

func AuditRoutes(r *gin.Engine) {
	repo := repositories.NewAuditRepository(config.DB)
	service := services.NewAuditService(repo)
	handler := handlers.NewAuditHandler(service)

	audit := r.Group("/audit")
	audit.Use(middleware.AuthRequired())
	{
		// Admin/staff đều cần quyền xem báo cáo đối soát để kiểm tra nghiệp vụ.
		audit.GET("/consistency/:order_id", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetOrderAuditConsistency)
	}
}
