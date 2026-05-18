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

type trayRequest struct {
	TrayCode    string `json:"tray_code" binding:"required,max=100"`
	ProductID   uint   `json:"product_id" binding:"required,gt=0"`
	LocationID  uint   `json:"location_id" binding:"required,gt=0"`
	QRCode      string `json:"qr_code" binding:"required"`
	Description string `json:"description"`
}

// POST /trays
// Tạo khay chứa hàng, mỗi product chỉ gắn 1 tray duy nhất.
func CreateTray(c *gin.Context) {
	var req trayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	req.TrayCode = strings.TrimSpace(req.TrayCode)
	req.QRCode = strings.TrimSpace(req.QRCode)

	if req.TrayCode == "" || req.QRCode == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "tray_code and qr_code are required",
		})
		return
	}

	// Kiểm tra product có tồn tại không
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

	// Kiểm tra location có tồn tại không
	var location models.Location
	if err := config.DB.Where("id = ? AND is_active = ?", req.LocationID, true).First(&location).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "location not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	tray := models.Tray{
		TrayCode:    req.TrayCode,
		ProductID:   req.ProductID,
		LocationID:  req.LocationID,
		QRCode:      req.QRCode,
		Description: req.Description,
		IsActive:    true,
	}

	if err := config.DB.Create(&tray).Error; err != nil {
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "tray_code or product_id already exists",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, tray)
}

// GET /trays
// Lấy danh sách khay đang active.
func GetTrays(c *gin.Context) {
	var trays []models.Tray
	if err := config.DB.Where("is_active = ?", true).Find(&trays).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, trays)
}

// helper nhỏ nếu sau này cần parse tray id
func parseTrayID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid tray id",
		})
		return 0, false
	}
	return uint(id), true
}
