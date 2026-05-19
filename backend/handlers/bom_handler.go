package handlers

import (
	"errors"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type createBOMItemRequest struct {
	ComponentProductID uint `json:"component_product_id" binding:"required,gt=0"`
	Quantity           int  `json:"quantity" binding:"required,gt=0"`
}

type createBOMRequest struct {
	ProductID   uint                   `json:"product_id" binding:"required,gt=0"`
	BOMName     string                 `json:"bom_name"`
	Description string                 `json:"description"`
	Items       []createBOMItemRequest `json:"items" binding:"required,min=1,dive"`
}

// POST /boms
// Tạo BOM + danh sách linh kiện trong cùng 1 transaction.
func CreateBOM(c *gin.Context) {
	var req createBOMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	req.BOMName = strings.TrimSpace(req.BOMName)

	// Validate duplicate component trong cùng request để fail sớm, rõ message.
	componentSeen := make(map[uint]struct{}, len(req.Items))
	for _, item := range req.Items {
		if _, exists := componentSeen[item.ComponentProductID]; exists {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "duplicate component in BOM",
			})
			return
		}
		componentSeen[item.ComponentProductID] = struct{}{}
	}

	var createdBOM models.BOM
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		// 1) Check product cha có tồn tại/active không
		var parentProduct models.Product
		if err := tx.Where("id = ? AND is_active = ?", req.ProductID, true).First(&parentProduct).Error; err != nil {
			return err
		}

		// 2) Check toàn bộ component có tồn tại/active không
		componentIDs := make([]uint, 0, len(req.Items))
		for _, item := range req.Items {
			componentIDs = append(componentIDs, item.ComponentProductID)
		}

		var activeComponents []models.Product
		if err := tx.Where("id IN ? AND is_active = ?", componentIDs, true).Find(&activeComponents).Error; err != nil {
			return err
		}

		if len(activeComponents) != len(componentIDs) {
			return errors.New("one or more component products not found or inactive")
		}

		// 3) Tạo BOM header
		bom := models.BOM{
			ProductID:   req.ProductID,
			BOMName:     req.BOMName,
			Description: req.Description,
		}
		if err := tx.Create(&bom).Error; err != nil {
			return err
		}

		// 4) Tạo danh sách BOM items
		items := make([]models.BOMItem, 0, len(req.Items))
		for _, item := range req.Items {
			items = append(items, models.BOMItem{
				BOMID:              bom.ID,
				ComponentProductID: item.ComponentProductID,
				Quantity:           item.Quantity,
			})
		}

		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		// preload để response có đủ thông tin cơ bản,
		//tx.Preload("Product").Preload("Items.ComponentProduct").First(&bom, bom.ID)
		if err := tx.Preload("Items").First(&bom, bom.ID).Error; err != nil {
			return err
		}

		createdBOM = bom
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "parent product not found or inactive",
			})
			return
		}

		if txErr.Error() == "one or more component products not found or inactive" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": txErr.Error(),
			})
			return
		}

		if isUniqueConstraintError(txErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "duplicate component in BOM",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, createdBOM)
}

// GET /boms
// Lấy danh sách BOM (kèm thông tin sản phẩm cha).
func GetBOMs(c *gin.Context) {
	var boms []models.BOM

	query := config.DB.Model(&models.BOM{}).Preload("Product").Order("id DESC")

	// filter theo product_id nếu cần
	if productIDRaw := strings.TrimSpace(c.Query("product_id")); productIDRaw != "" {
		productID, err := strconv.ParseUint(productIDRaw, 10, 64)
		if err != nil || productID == 0 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error": "invalid product_id",
			})
			return
		}
		query = query.Where("product_id = ?", uint(productID))
	}

	if err := query.Find(&boms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, boms)
}

// GET /boms/:id/items
// Xem chi tiết linh kiện của 1 BOM.
func GetBOMItems(c *gin.Context) {
	bomIDRaw := c.Param("id")
	bomID, err := strconv.ParseUint(bomIDRaw, 10, 64)
	if err != nil || bomID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid bom id",
		})
		return
	}

	var bom models.BOM
	if err := config.DB.Preload("Product").First(&bom, uint(bomID)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "bom not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var items []models.BOMItem
	if err := config.DB.Where("bom_id = ?", bom.ID).
		Preload("ComponentProduct").
		Order("id ASC").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bom":   bom,
		"items": items,
	})
}
