package routes

/*
- Mục đích: Dang ky endpoint stock transactions chỉ xem cho audit/warehouse monitoring.
- Phụ thuộc: stock_transaction repository/service/handler + middleware.
- Hợp đồng API: GET /stock-transactions.
- Role access: ADMIN + WAREHOUSE.
- Ghi chú bảo trì: Frontend dashboard va warehouse-overview phu thuoc endpoint nay.
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
		// ADMIN và WAREHOUSE đều có nhu cầu xem lịch sử giao dịch kho
		stockTransactions.GET("", middleware.RequireRoles("ADMIN", "WAREHOUSE"), handler.GetStockTransactions)
	}
}
