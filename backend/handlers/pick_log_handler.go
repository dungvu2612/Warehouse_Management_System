package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GET /pick-logs
// Xem audit log cho luồng picking, hỗ trợ filter theo order/staff/ngày.
func GetPickLogs(c *gin.Context) {
	var logs []models.PickLog
	query := config.DB.Model(&models.PickLog{})

	// Filter theo đơn hàng để truy vết 1 phiên picking cụ thể.
	if orderIDRaw := c.Query("order_id"); orderIDRaw != "" {
		orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
		if err != nil || orderID == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid order_id",
			})
			return
		}
		query = query.Where("order_id = ?", uint(orderID))
	}

	// Filter theo nhân viên đã thao tác pick.
	if pickedByRaw := c.Query("picked_by"); pickedByRaw != "" {
		pickedBy, err := strconv.ParseUint(pickedByRaw, 10, 64)
		if err != nil || pickedBy == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid picked_by",
			})
			return
		}
		query = query.Where("picked_by = ?", uint(pickedBy))
	}

	// date_from/date_to dùng format YYYY-MM-DD để team vận hành dễ nhập.
	if dateFromRaw := c.Query("date_from"); dateFromRaw != "" {
		dateFrom, err := time.Parse("2006-01-02", dateFromRaw)
		if err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid date_from format, expected YYYY-MM-DD",
			})
			return
		}
		query = query.Where("picked_at >= ?", dateFrom)
	}

	if dateToRaw := c.Query("date_to"); dateToRaw != "" {
		dateTo, err := time.Parse("2006-01-02", dateToRaw)
		if err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid date_to format, expected YYYY-MM-DD",
			})
			return
		}
		// include hết ngày date_to (đến 23:59:59).
		query = query.Where("picked_at < ?", dateTo.Add(24*time.Hour))
	}

	// Giới hạn số bản ghi trả về để tránh query quá nặng.
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

	if err := query.Order("picked_at DESC").Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, logs)
}
