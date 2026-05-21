package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

/*
Luồng xử lý Audit Consistency:
1) Nhận order_id cần soát.
2) Tính tổng qty từ pick_logs theo order_id.
3) Tính tổng qty từ stock_transactions loại EXPORT theo reference_code của order.
4) Trả về so sánh 2 phía để nhanh chóng phát hiện lệch log.
*/

type auditConsistencyResponse struct {
	OrderID          uint   `json:"order_id"`
	OrderCode        string `json:"order_code"`
	PickLogsTotalQty int64  `json:"pick_logs_total_qty"`
	ExportTxTotalQty int64  `json:"export_tx_total_qty"`
	IsConsistent     bool   `json:"is_consistent"`
}

// GET /audit/consistency/:order_id
// Soát nhanh tính nhất quán giữa pick_logs và stock_transactions (EXPORT) của 1 order.
func GetOrderAuditConsistency(c *gin.Context) {
	orderIDRaw := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid order id",
		})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, uint(orderID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "order not found",
		})
		return
	}

	var pickLogsTotal int64
	if err := config.DB.Model(&models.PickLog{}).
		Where("order_id = ?", order.ID).
		Select("COALESCE(SUM(picked_quantity), 0)").
		Scan(&pickLogsTotal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var exportTxTotal int64
	if err := config.DB.Model(&models.StockTransaction{}).
		Where("reference_code = ? AND transaction_type = ?", order.OrderCode, utils.StockTxTypeExport).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&exportTxTotal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := auditConsistencyResponse{
		OrderID:          order.ID,
		OrderCode:        order.OrderCode,
		PickLogsTotalQty: pickLogsTotal,
		ExportTxTotalQty: exportTxTotal,
		IsConsistent:     pickLogsTotal == exportTxTotal,
	}

	c.JSON(http.StatusOK, resp)
}
