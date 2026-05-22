package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'product'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewProductHandler
- parseProductID
- toProductInput
- mapProductServiceError
- CreateProduct
- GetProducts
- GetProductByID
- UpdateProduct
- DeleteProduct

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"net/http"
	"strconv"

	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

// ProductHandler chỉ xử lý transport layer (HTTP), không chứa business logic.
type ProductHandler struct {
	service services.ProductService
}

func NewProductHandler(service services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

// Request DTO cho layer HTTP.
type productRequest struct {
	ProductCode string  `json:"product_code" binding:"required,max=100"`
	ProductName string  `json:"product_name" binding:"required,max=255"`
	ProductType string  `json:"product_type" binding:"omitempty,max=30"`
	Description string  `json:"description"`
	Unit        string  `json:"unit" binding:"omitempty,max=50"`
	MinStock    int     `json:"min_stock" binding:"gte=0"`
	Price       float64 `json:"price" binding:"gte=0"`
}

func parseProductID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid product id"})
		return 0, false
	}
	return uint(id), true
}

func toProductInput(req productRequest) services.ProductInput {
	return services.ProductInput{
		ProductCode: req.ProductCode,
		ProductName: req.ProductName,
		ProductType: req.ProductType,
		Description: req.Description,
		Unit:        req.Unit,
		MinStock:    req.MinStock,
		Price:       req.Price,
	}
}

func mapProductServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidProductID):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidProductType):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidProductPayload):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "product_code and product_name are required"})
	case errors.Is(err, repositories.ErrProductEntityNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrProductEntityCodeExists):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

// CreateProduct tạo product mới (ADMIN).
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req productRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	product, err := h.service.Create(toProductInput(req))
	if err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, product)
}

// GetProducts trả danh sách product active.
func (h *ProductHandler) GetProducts(c *gin.Context) {
	products, err := h.service.GetAllActive()
	if err != nil {
		mapProductServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProductByID lấy chi tiết 1 product active.
func (h *ProductHandler) GetProductByID(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	product, err := h.service.GetByID(id)
	if err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, product)
}

// UpdateProduct cập nhật product (ADMIN).
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	var req productRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	product, err := h.service.Update(id, toProductInput(req))
	if err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct xóa mềm product (is_active=false, ADMIN).
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deactivated successfully"})
}
