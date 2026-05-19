package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func ImportReceiptRoutes(r *gin.Engine) {
	importReceipts := r.Group("/import-receipts")
	importReceipts.Use(middleware.AuthRequired())
	{
		importReceipts.POST("", middleware.RequireRoles("ADMIN"), handlers.CreateImportReceipt)
		importReceipts.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetImportReceipts)
		importReceipts.GET("/:id", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetImportReceiptByID)
	}
}
