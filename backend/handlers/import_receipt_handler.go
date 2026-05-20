package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type createImportReceiptItemRequest struct {
	ProductID uint `json:"product_id" binding:"required,gt=0"`
	TrayID    uint `json:"tray_id" binding:"required,gt=0"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

type createImportReceiptRequest struct {
	SupplierName string                           `json:"supplier_name"`
	Note         string                           `json:"note"`
	Items        []createImportReceiptItemRequest `json:"items" binding:"required,min=1,dive"`
}

// POST /import-receipts
// Tạo phiếu nhập kho và cộng tồn kho trong cùng transaction.
func CreateImportReceipt(c *gin.Context) {
	var req createImportReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	// chặn duplicate product+tray trong cùng phiếu ngay ở input
	seen := make(map[string]struct{}, len(req.Items))
	for _, item := range req.Items {
		key := fmt.Sprintf("%d-%d", item.ProductID, item.TrayID)
		if _, ok := seen[key]; ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "duplicate product_id and tray_id in import receipt",
			})
			return
		}
		seen[key] = struct{}{}
	}

	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	var createdReceipt models.ImportReceipt
	var createdItems []models.ImportReceiptItem

	// Transaction nhập kho:
	// 1) tạo receipt
	// 2) cộng/tạo inventory
	// 3) ghi receipt items
	// 4) ghi stock transaction IMPORT
	// => tất cả thành công hoặc rollback toàn bộ.
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		receiptCode := fmt.Sprintf("IMP-%d", time.Now().UnixNano())
		receipt := models.ImportReceipt{
			ReceiptCode:  receiptCode,
			SupplierName: req.SupplierName,
			Note:         req.Note,
		}
		if createdBy > 0 {
			receipt.CreatedBy = &createdBy
		}

		if err := tx.Create(&receipt).Error; err != nil {
			return err
		}

		items := make([]models.ImportReceiptItem, 0, len(req.Items))
		for _, item := range req.Items {
			// check tray tồn tại và tray phải gắn đúng product
			var tray models.Tray
			if err := tx.Where("id = ? AND is_active = ?", item.TrayID, true).First(&tray).Error; err != nil {
				return err
			}
			if tray.ProductID != item.ProductID {
				return errors.New("tray does not belong to the provided product")
			}

			// check product tồn tại
			var product models.Product
			if err := tx.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
				return err
			}

			// Lock row inventory để tránh race condition khi nhập cùng lúc.
			// Nếu chưa có row thì tạo mới theo cặp (product_id, tray_id).
			var inventory models.Inventory
			findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("product_id = ? AND tray_id = ?", item.ProductID, item.TrayID).
				First(&inventory).Error

			if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
				return findErr
			}

			beforeQty := 0
			afterQty := item.Quantity
			if errors.Is(findErr, gorm.ErrRecordNotFound) {
				inventory = models.Inventory{
					ProductID: item.ProductID,
					TrayID:    item.TrayID,
					Quantity:  item.Quantity,
				}
				if err := tx.Create(&inventory).Error; err != nil {
					return err
				}
			} else {
				// Row đã tồn tại thì cộng dồn tồn kho.
				beforeQty = inventory.Quantity
				inventory.Quantity = inventory.Quantity + item.Quantity
				afterQty = inventory.Quantity
				if err := tx.Save(&inventory).Error; err != nil {
					return err
				}
			}

			receiptItem := models.ImportReceiptItem{
				ReceiptID: receipt.ID,
				ProductID: item.ProductID,
				TrayID:    item.TrayID,
				Quantity:  item.Quantity,
			}
			if err := tx.Create(&receiptItem).Error; err != nil {
				return err
			}
			items = append(items, receiptItem)

			trayID := item.TrayID
			stockTx := models.StockTransaction{
				TransactionType: utils.StockTxTypeImport,
				ProductID:       item.ProductID,
				TrayID:          &trayID,
				Quantity:        item.Quantity,
				BeforeQuantity:  beforeQty,
				AfterQuantity:   afterQty,
				ReferenceCode:   receipt.ReceiptCode,
				Note:            req.Note,
			}
			if createdBy > 0 {
				stockTx.CreatedBy = &createdBy
			}
			if err := tx.Create(&stockTx).Error; err != nil {
				return err
			}
		}

		if err := tx.Preload("Items").First(&receipt, receipt.ID).Error; err != nil {
			return err
		}

		createdReceipt = receipt
		createdItems = items
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "product or tray not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"receipt": createdReceipt,
		"items":   createdItems,
	})
}

// GET /import-receipts
// Danh sách phiếu nhập.
func GetImportReceipts(c *gin.Context) {
	var receipts []models.ImportReceipt
	if err := config.DB.Preload("Items").Order("id DESC").Find(&receipts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, receipts)
}

// GET /import-receipts/:id
// Chi tiết phiếu nhập.
func GetImportReceiptByID(c *gin.Context) {
	idRaw := c.Param("id")
	id, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid import receipt id",
		})
		return
	}

	var receipt models.ImportReceipt
	if err := config.DB.Preload("Items").First(&receipt, uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "import receipt not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, receipt)
}
