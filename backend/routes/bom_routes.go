package routes

/*
- Mục đích: Dang ky endpoint module BOM va role policy.
- Phụ thuộc: bom repository/service/handler + middleware.
- Hợp đồng API: /boms CRUD + items.
- Role access: ADMIN + WAREHOUSE duoc quan ly BOM.
- Ghi chú bảo trì: Permission BOM phai dong bo voi Orders/Picking vi BOM la nguon sinh task.
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
		// Cho phép cả ADMIN và WAREHOUSE tạo BOM theo yêu cầu vận hành.
		boms.POST("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.CreateBOM)
		// Cho phép cả ADMIN và WAREHOUSE cập nhật BOM.
		boms.PUT("/:id", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.UpdateBOM)
		// Cho phép cả ADMIN và WAREHOUSE xóa BOM.
		boms.DELETE("/:id", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.DeleteBOM)

		// Xem BOM cho cả ADMIN và WAREHOUSE.
		boms.GET("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetBOMs)
		boms.GET("/:id/items", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetBOMItems)
	}
}
