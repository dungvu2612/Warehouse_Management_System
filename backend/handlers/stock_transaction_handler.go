package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// GET /stock-transactions
// Xem lịch sử giao dịch kho, có hỗ trợ filter cơ bản.
func GetStockTransactions(c *gin.Context) {
	var transactions []models.StockTransaction
	query := config.DB.Model(&models.StockTransaction{})

	if productIDRaw := c.Query("product_id"); productIDRaw != "" {
		productID, err := strconv.ParseUint(productIDRaw, 10, 64)
		if err != nil || productID == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid product_id",
			})
			return
		}
		query = query.Where("product_id = ?", uint(productID))
	}

	if trayIDRaw := c.Query("tray_id"); trayIDRaw != "" {
		trayID, err := strconv.ParseUint(trayIDRaw, 10, 64)
		if err != nil || trayID == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid tray_id",
			})
			return
		}
		query = query.Where("tray_id = ?", uint(trayID))
	}

	if createdByRaw := c.Query("created_by"); createdByRaw != "" {
		createdBy, err := strconv.ParseUint(createdByRaw, 10, 64)
		if err != nil || createdBy == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid created_by",
			})
			return
		}
		query = query.Where("created_by = ?", uint(createdBy))
	}

	if txType := strings.ToUpper(strings.TrimSpace(c.Query("transaction_type"))); txType != "" {
		query = query.Where("transaction_type = ?", txType)
	}

	limit := 50
	if limitRaw := c.Query("limit"); limitRaw != "" {
		parsedLimit, err := strconv.Atoi(limitRaw)
		if err != nil || parsedLimit <= 0 || parsedLimit > 200 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid limit (1-200)",
			})
			return
		}
		limit = parsedLimit
	}

	if err := query.Order("created_at DESC").Limit(limit).Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, transactions)
}
