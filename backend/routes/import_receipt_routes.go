package routes

/*
- Mục đích: Dang ky endpoint import receipt va role policy.
- Phụ thuộc: import_receipt repository/service/handler + middleware.
- Hợp đồng API: /import-receipts create/list/detail.
- Role access: ADMIN tao phieu; ADMIN + WAREHOUSE xem lich su.
- Ghi chú bảo trì: Permission map nay dong bo voi frontend ImportReceiptsPage.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func ImportReceiptRoutes(r *echo.Echo) {
	repo := repositories.NewImportReceiptRepository(config.DB)
	service := services.NewImportReceiptService(repo)
	handler := handlers.NewImportReceiptHandler(service)

	importReceipts := r.Group("/import-receipts")
	importReceipts.Use(middleware.AuthRequired())
	{
		importReceipts.POST("", adapt(handler.CreateImportReceipt), middleware.RequireRoles("ADMIN"))
		importReceipts.GET("", adapt(handler.GetImportReceipts), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		importReceipts.GET("/:id", adapt(handler.GetImportReceiptByID), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		importReceipts.PUT("/:id", adapt(handler.UpdateImportReceipt), middleware.RequireRoles("ADMIN"))
		importReceipts.DELETE("/:id", adapt(handler.DeleteImportReceipt), middleware.RequireRoles("ADMIN"))
	}

	staff := r.Group("/staff/import-receipt-items")
	staff.Use(middleware.AuthRequired())
	{
		staff.GET("", adapt(handler.GetStaffImportTasks), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		staff.GET("/summary", adapt(handler.GetImportTaskSummary), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		staff.POST("/:item_id/claim", adapt(handler.ClaimImportReceiptItem), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		staff.POST("/:item_id/confirm", adapt(handler.ConfirmImportReceiptItem), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}

	admin := r.Group("/admin/import-receipt-items")
	admin.Use(middleware.AuthRequired(), middleware.RequireRoles("ADMIN"))
	{
		admin.PATCH("/:item_id/assign", adapt(handler.AdminAssignImportReceiptItem))
		admin.PATCH("/:item_id/unassign", adapt(handler.AdminUnassignImportReceiptItem))
	}
}
