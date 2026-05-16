package handlers

import (
	"errors"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type productRequest struct {
	ProductCode string  `json:"product_code" binding:"required,max=100"`
	ProductName string  `json:"product_name" binding:"required,max=255"`
	Description string  `json:"description"`
	Unit        string  `json:"unit" binding:"omitempty,max=50"`
	MinStock    int     `json:"min_stock" binding:"gte=0"`
	Price       float64 `json:"price" binding:"gte=0"`
}

func invalidProductPayload(c *gin.Context, message string) {
	c.JSON(http.StatusUnprocessableEntity, gin.H{
		"error": message,
	})
}

func parseProductID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid product id",
		})
		return 0, false
	}
	return uint(id), true
}

func isUniqueViolation(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}

	return strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}

func CreateProduct(c *gin.Context) {

	var req productRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		invalidProductPayload(c, err.Error())
		return
	}

	req.ProductCode = strings.TrimSpace(req.ProductCode)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Unit = strings.TrimSpace(req.Unit)

	if req.ProductCode == "" || req.ProductName == "" {
		invalidProductPayload(c, "product_code and product_name are required")
		return
	}

	if req.Unit == "" {
		req.Unit = "pcs"
	}

	product := models.Product{
		ProductCode: req.ProductCode,
		ProductName: req.ProductName,
		Description: req.Description,
		Unit:        req.Unit,
		MinStock:    req.MinStock,
		Price:       req.Price,
		IsActive:    true,
	}

	if err := config.DB.Create(&product).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "product_code already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func GetProducts(c *gin.Context) {

	var products []models.Product

	result := config.DB.Where("is_active = ?", true).Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, products)
}

func GetProductByID(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	var product models.Product
	if err := config.DB.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
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

	c.JSON(http.StatusOK, product)
}

func UpdateProduct(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	var req productRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		invalidProductPayload(c, err.Error())
		return
	}

	req.ProductCode = strings.TrimSpace(req.ProductCode)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.Unit = strings.TrimSpace(req.Unit)

	if req.ProductCode == "" || req.ProductName == "" {
		invalidProductPayload(c, "product_code and product_name are required")
		return
	}

	if req.Unit == "" {
		req.Unit = "pcs"
	}

	var product models.Product
	if err := config.DB.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
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

	product.ProductCode = req.ProductCode
	product.ProductName = req.ProductName
	product.Description = req.Description
	product.Unit = req.Unit
	product.MinStock = req.MinStock
	product.Price = req.Price

	if err := config.DB.Save(&product).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "product_code already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	var product models.Product
	if err := config.DB.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
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

	if err := config.DB.Model(&product).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "product deactivated successfully",
	})
}
