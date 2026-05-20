package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"github.com/gin-gonic/gin"
)

/*
Luồng xử lý Dashboard Stats:
1) Đếm số order theo từng trạng thái chính (PENDING, PICKING, COMPLETED).
2) Tính tổng tồn kho (sum inventory.quantity) để biết năng lực kho hiện tại.
3) Đếm số sản phẩm low-stock (quantity < min_stock) để cảnh báo sớm.
4) Trả payload gọn cho frontend dashboard hiển thị card thống kê.
*/

type dashboardStatsResponse struct {
	OrdersPending   int64 `json:"orders_pending"`
	OrdersPicking   int64 `json:"orders_picking"`
	OrdersCompleted int64 `json:"orders_completed"`
	TotalStockQty   int64 `json:"total_stock_qty"`
	LowStockCount   int64 `json:"low_stock_count"`
}

// GET /dashboard/stats
// Trả về thống kê tổng quan phục vụ dashboard vận hành.
func GetDashboardStats(c *gin.Context) {
	var resp dashboardStatsResponse

	// Đếm số order theo trạng thái
	if err := config.DB.Model(&models.Order{}).
		Where("status = ?", utils.OrderStatusPending).
		Count(&resp.OrdersPending).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Model(&models.Order{}).
		Where("status = ?", utils.OrderStatusPicking).
		Count(&resp.OrdersPicking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Model(&models.Order{}).
		Where("status = ?", utils.OrderStatusCompleted).
		Count(&resp.OrdersCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Tổng tồn kho hiện có (sum quantity của bảng inventory)
	if err := config.DB.Model(&models.Inventory{}).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&resp.TotalStockQty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Đếm số sản phẩm có tồn kho thấp hơn ngưỡng min_stock
	// Dùng LEFT JOIN để cả sản phẩm chưa có row inventory cũng được xét như 0 tồn.
	lowStockQuery := `
		SELECT COUNT(*) FROM products p
		LEFT JOIN (
			SELECT product_id, SUM(quantity) AS total_qty
			FROM inventory
			GROUP BY product_id
		) inv ON inv.product_id = p.id
		WHERE p.is_active = TRUE
		  AND COALESCE(inv.total_qty, 0) < p.min_stock
	`
	if err := config.DB.Raw(lowStockQuery).Scan(&resp.LowStockCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
