package routes

/*
Senior Handover Note:
- Purpose: Dang ky endpoint import receipt va role policy.
- Dependencies: import_receipt repository/service/handler + middleware.
- API contract: /import-receipts create/list/detail.
- Role access: ADMIN tao phieu; ADMIN + WAREHOUSE xem lich su.
- Maintenance notes: Permission map nay dong bo voi frontend ImportReceiptsPage.
*/

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

func ImportReceiptRoutes(r *gin.Engine) {
	repo := repositories.NewImportReceiptRepository(config.DB)
	service := services.NewImportReceiptService(repo)
	handler := handlers.NewImportReceiptHandler(service)

	importReceipts := r.Group("/import-receipts")
	importReceipts.Use(middleware.AuthRequired())
	{
		importReceipts.POST("", middleware.RequireRoles("ADMIN"), handler.CreateImportReceipt)
		importReceipts.GET("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetImportReceipts)
		importReceipts.GET("/:id", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetImportReceiptByID)
	}
}
