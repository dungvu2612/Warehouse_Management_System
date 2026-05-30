package routes

/*
Senior Handover Note:
- Purpose: Dang ky endpoint stock transactions read-only cho audit/warehouse monitoring.
- Dependencies: stock_transaction repository/service/handler + middleware.
- API contract: GET /stock-transactions.
- Role access: ADMIN + WAREHOUSE.
- Maintenance notes: Frontend dashboard va warehouse-overview phu thuoc endpoint nay.
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
