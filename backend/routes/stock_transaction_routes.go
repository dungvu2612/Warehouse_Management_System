package routes

import (
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"

	"github.com/gin-gonic/gin"
)

func StockTransactionRoutes(r *gin.Engine) {
	stockTransactions := r.Group("/stock-transactions")
	stockTransactions.Use(middleware.AuthRequired())
	{
		// ADMIN và STAFF đều có nhu cầu xem lịch sử giao dịch kho
		stockTransactions.GET("", middleware.RequireRoles("ADMIN", "STAFF"), handlers.GetStockTransactions)
	}
}
