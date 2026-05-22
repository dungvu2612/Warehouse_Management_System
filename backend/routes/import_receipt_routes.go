package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'import_receipt'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- ImportReceiptRoutes

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

func ImportReceiptRoutes(r *gin.Engine) {
	repo := repositories.NewImportReceiptRepository(config.DB)
	service := services.NewImportReceiptService(repo)
	handler := handlers.NewImportReceiptHandler(service)

	importReceipts := r.Group("/import-receipts")
	importReceipts.Use(middleware.AuthRequired())
	{
		importReceipts.POST("", middleware.RequireRoles("ADMIN"), handler.CreateImportReceipt)
		importReceipts.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetImportReceipts)
		importReceipts.GET("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetImportReceiptByID)
	}
}
