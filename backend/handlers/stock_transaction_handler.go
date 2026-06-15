package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'stock_transaction'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewStockTransactionHandler
- GetStockTransactions

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"net/http"

	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type StockTransactionHandler struct {
	service services.StockTransactionService
}

func NewStockTransactionHandler(service services.StockTransactionService) *StockTransactionHandler {
	return &StockTransactionHandler{service: service}
}

func (h *StockTransactionHandler) GetStockTransactions(c echo.Context) {
	transactions, err := h.service.GetByFilters(services.StockTransactionQuery{
		ProductIDRaw:       c.QueryParam("product_id"),
		TrayIDRaw:          c.QueryParam("tray_id"),
		CreatedByRaw:       c.QueryParam("created_by"),
		TransactionTypeRaw: c.QueryParam("transaction_type"),
		LimitRaw:           c.QueryParam("limit"),
	})
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, transactions)
}
