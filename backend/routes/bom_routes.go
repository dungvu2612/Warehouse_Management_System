package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'bom'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- BOMRoutes

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

func BOMRoutes(r *gin.Engine) {
	repo := repositories.NewBOMRepository(config.DB)
	service := services.NewBOMService(repo)
	handler := handlers.NewBOMHandler(service)

	boms := r.Group("/boms")
	boms.Use(middleware.AuthRequired())
	{
		// Cho phép cả ADMIN và STAFF tạo BOM theo yêu cầu vận hành.
		boms.POST("", middleware.RequireRoles("ADMIN", "STAFF"), handler.CreateBOM)
		// Cho phép cả ADMIN và STAFF cập nhật BOM.
		boms.PUT("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handler.UpdateBOM)
		// Cho phép cả ADMIN và STAFF xóa BOM.
		boms.DELETE("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handler.DeleteBOM)

		// Xem BOM cho cả ADMIN và STAFF.
		boms.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetBOMs)
		boms.GET("/:id/items", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetBOMItems)
	}
}
