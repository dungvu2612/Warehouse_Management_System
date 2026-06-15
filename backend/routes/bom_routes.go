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

	"github.com/labstack/echo/v4"
)

func BOMRoutes(r *echo.Echo) {
	repo := repositories.NewBOMRepository(config.DB)
	service := services.NewBOMService(repo)
	handler := handlers.NewBOMHandler(service)

	boms := r.Group("/boms")
	boms.Use(middleware.AuthRequired())
	{
		// Cho phép cả ADMIN và WAREHOUSE tạo BOM theo yêu cầu vận hành.
		boms.POST("", adapt(handler.CreateBOM), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Cho phép cả ADMIN và WAREHOUSE cập nhật BOM.
		boms.PUT("/:id", adapt(handler.UpdateBOM), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		// Cho phép cả ADMIN và WAREHOUSE xóa BOM.
		boms.DELETE("/:id", adapt(handler.DeleteBOM), middleware.RequireRoles("ADMIN", "WAREHOUSE"))

		// Xem BOM cho cả ADMIN và WAREHOUSE.
		boms.GET("", adapt(handler.GetBOMs), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		boms.GET("/:id/items", adapt(handler.GetBOMItems), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}
}
