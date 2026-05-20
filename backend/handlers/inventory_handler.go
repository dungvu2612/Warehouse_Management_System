package handlers

import (
	"errors"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type createInventoryRequest struct {
	ProductID uint `json:"product_id" binding:"required,gt=0"`
	TrayID    uint `json:"tray_id" binding:"required,gt=0"`
	Quantity  int  `json:"quantity" binding:"gte=0"`
}

type adjustInventoryRequest struct {
	Delta int    `json:"delta"`
	Note  string `json:"note"`
}

// GET /inventory
// Lấy danh sách tồn kho, có thể lọc theo product_id và tray_id.
func GetInventory(c *gin.Context) {
	var inventories []models.Inventory

	query := config.DB.Model(&models.Inventory{})

	// filter theo product_id nếu client truyền vào
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

	// filter theo tray_id nếu client truyền vào
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

	if err := query.Find(&inventories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, inventories)
}

// POST /inventory
// Tạo tồn kho ban đầu cho cặp product_id + tray_id.
func CreateInventory(c *gin.Context) {
	var req createInventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Kiểm tra product có tồn tại và đang active không
	var product models.Product
	if err := config.DB.Where("id = ? AND is_active = ?", req.ProductID, true).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "product not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Kiểm tra tray có tồn tại và đang active không
	var tray models.Tray
	if err := config.DB.Where("id = ? AND is_active = ?", req.TrayID, true).First(&tray).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "tray not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Rule nghiệp vụ: inventory phải khớp product đang gắn với tray
	if tray.ProductID != req.ProductID {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "tray does not belong to the provided product",
		})
		return
	}

	inventory := models.Inventory{
		ProductID: req.ProductID,
		TrayID:    req.TrayID,
		Quantity:  req.Quantity,
	}

	if err := config.DB.Create(&inventory).Error; err != nil {
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "inventory for this product and tray already exists",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, inventory)
}

// PATCH /inventory/:id/adjust
// Điều chỉnh tồn kho theo delta (ví dụ: +10, -3).
func AdjustInventory(c *gin.Context) {
	idRaw := c.Param("id")
	inventoryID, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || inventoryID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid inventory id",
		})
		return
	}

	var req adjustInventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.Delta == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "delta must not be 0",
		})
		return
	}

	note := strings.TrimSpace(req.Note)
	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	var updated models.Inventory
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		var inventory models.Inventory

		// lock row để tránh race condition khi có nhiều request adjust cùng lúc
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", uint(inventoryID)).
			First(&inventory).Error; err != nil {
			return err
		}

		newQuantity := inventory.Quantity + req.Delta
		if newQuantity < 0 {
			return errors.New("insufficient inventory quantity")
		}

		beforeQuantity := inventory.Quantity
		inventory.Quantity = newQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		trayID := inventory.TrayID
		transaction := models.StockTransaction{
			TransactionType: utils.StockTxTypeAdjust,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        req.Delta,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   newQuantity,
			Note:            note,
		}
		if createdBy > 0 {
			transaction.CreatedBy = &createdBy
		}

		// Ghi log trong cùng transaction để đảm bảo tính nhất quán dữ liệu.
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		updated = inventory
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "inventory not found",
			})
			return
		}

		if txErr.Error() == "insufficient inventory quantity" {
			c.JSON(http.StatusConflict, gin.H{
				"error": "insufficient inventory quantity",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "inventory adjusted successfully",
		"data":    updated,
	})
}
