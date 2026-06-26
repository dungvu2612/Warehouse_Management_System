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
- GetProductCodePreview
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

	"github.com/labstack/echo/v4"
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
	ProductCode      string   `json:"product_code" binding:"omitempty,max=100"`
	QRCode           string   `json:"qr_code" binding:"omitempty,max=100"`
	ProductName      string   `json:"product_name" binding:"required,max=255"`
	ProductType      string   `json:"product_type" binding:"omitempty,max=30"`
	ImageURL         string   `json:"image_url"`
	Description      string   `json:"description"`
	Unit             string   `json:"unit" binding:"omitempty,max=50"`
	MinStock         int      `json:"min_stock" binding:"gte=0"`
	Price            float64  `json:"price" binding:"gte=0"`
	DifficultyWeight *float64 `json:"difficulty_weight"`
}

func parseProductID(c echo.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid product id"})
		return 0, false
	}
	return uint(id), true
}

func toProductInput(req productRequest) services.ProductInput {
	input := services.ProductInput{
		ProductCode: req.ProductCode,
		QRCode:      req.QRCode,
		ProductName: req.ProductName,
		ProductType: req.ProductType,
		ImageURL:    req.ImageURL,
		Description: req.Description,
		Unit:        req.Unit,
		MinStock:    req.MinStock,
		Price:       req.Price,
	}
	if req.DifficultyWeight != nil {
		input.DifficultyWeight = *req.DifficultyWeight
	}
	return input
}

// ScanProductByQRCode tra product + inventory/trays theo qr_code de ho tro workflow scan PDA.
func (h *ProductHandler) ScanProductByQRCode(c echo.Context) {
	qrCode := c.Param("qr_code")
	result, err := h.service.ScanByQRCode(qrCode)
	if err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func mapProductServiceError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidProductID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidProductType):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidProductPayload):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "product_name is required and numeric fields must be >= 0"})
	case errors.Is(err, services.ErrInvalidProductDifficulty):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
	case errors.Is(err, repositories.ErrProductEntityNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
	case errors.Is(err, repositories.ErrProductEntityCodeExists):
		c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
	case errors.Is(err, repositories.ErrProductEntityNameExists):
		c.JSON(http.StatusConflict, echo.Map{"error": "product_name already exists"})
	case errors.Is(err, repositories.ErrProductUsedInActiveBOM):
		c.JSON(http.StatusConflict, echo.Map{
			"error_code": "PRODUCT_USED_IN_ACTIVE_BOM",
			"error":      "Sản phẩm này đang được sử dụng trong BOM active. Hãy vào BOM để: xóa linh kiện này khỏi BOM, thay bằng linh kiện khác, hoặc ngừng sử dụng BOM.",
		})
	case errors.Is(err, repositories.ErrProductEntityInUse):
		c.JSON(http.StatusConflict, echo.Map{"error": "Sản phẩm đang được sử dụng trong nghiệp vụ kho, chưa thể xóa."})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
}

// GetProductCodePreview preview mã product_code dựa trên product_type + product_name.
func (h *ProductHandler) GetProductCodePreview(c echo.Context) {
	productType := c.QueryParam("product_type")
	productName := c.QueryParam("product_name")

	code, err := h.service.PreviewCode(productType, productName)
	if err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"product_code": code,
	})
}

// CreateProduct tạo product mới (ADMIN).
func (h *ProductHandler) CreateProduct(c echo.Context) {
	var req productRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
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
func (h *ProductHandler) GetProducts(c echo.Context) {
	products, err := h.service.GetAllActive()
	if err != nil {
		mapProductServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProductByID lấy chi tiết 1 product active.
func (h *ProductHandler) GetProductByID(c echo.Context) {
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
func (h *ProductHandler) UpdateProduct(c echo.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	var req productRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
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
func (h *ProductHandler) DeleteProduct(c echo.Context) {
	id, ok := parseProductID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		mapProductServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, echo.Map{"message": "Xóa sản phẩm thành công."})
}
