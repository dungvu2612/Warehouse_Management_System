package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"strings"

	"github.com/gin-gonic/gin"
)

type locationRequest struct {
	LocationCode string `json:"location_code" binding:"required,max=100"`
	Shelf        string `json:"shelf" binding:"omitempty,max=50"`
	Description  string `json:"description"`
}

// POST /locations
// Tạo vị trí/kệ mới trong kho
func CreateLocation(c *gin.Context) {
	var req locationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	req.LocationCode = strings.TrimSpace(req.LocationCode)
	req.Shelf = strings.TrimSpace(req.Shelf)

	if req.LocationCode == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "location_code is required",
		})
		return
	}

	location := models.Location{
		LocationCode: req.LocationCode,
		Shelf:        req.Shelf,
		Description:  req.Description,
		IsActive:     true,
	}

	if err := config.DB.Create(&location).Error; err != nil {
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "location_code already exists",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, location)
}

// GET /locations
// Lấy danh sách vị trí đang active
func GetLocations(c *gin.Context) {
	var locations []models.Location

	if err := config.DB.Where("is_active = ?", true).Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, locations)
}
