package routes

/*
Mo ta file:
- File nay dang ky endpoint va wiring dependency injection cho module 'stock_transaction'.
- Noi day quy dinh policy middleware/auth/role truoc khi request vao handler.

Luong xu ly:
1) Khoi tao repository -> service -> handler cho module.
2) Gan middleware cho group route (neu co).
3) Map URL + HTTP method vao handler method cu the.

Cac ham chinh:
- StockTransactionRoutes

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

func StockTransactionRoutes(r *gin.Engine) {
	repo := repositories.NewStockTransactionRepository(config.DB)
	service := services.NewStockTransactionService(repo)
	handler := handlers.NewStockTransactionHandler(service)

	stockTransactions := r.Group("/stock-transactions")
	stockTransactions.Use(middleware.AuthRequired())
	{
		// ADMIN và STAFF đều có nhu cầu xem lịch sử giao dịch kho
		stockTransactions.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handler.GetStockTransactions)
	}
}
