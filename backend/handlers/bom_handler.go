package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'bom'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewBOMHandler
- CreateBOM
- UpdateBOM
- DeleteBOM
- GetBOMs
- GetBOMItems

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

// BOMHandler xử lý transport layer cho module BOM.
type BOMHandler struct {
	service services.BOMService
}

// NewBOMHandler khởi tạo handler BOM theo dependency injection.
func NewBOMHandler(service services.BOMService) *BOMHandler {
	return &BOMHandler{service: service}
}

// createBOMItemRequest là DTO item của request tạo/cập nhật BOM.
type createBOMItemRequest struct {
	ComponentProductID uint `json:"component_product_id" binding:"required,gt=0"`
	Quantity           int  `json:"quantity" binding:"required,gt=0"`
}

// createBOMRequest là DTO request tạo BOM.
type createBOMRequest struct {
	ProductID   uint                   `json:"product_id" binding:"required,gt=0"`
	BOMName     string                 `json:"bom_name"`
	Description string                 `json:"description"`
	Items       []createBOMItemRequest `json:"items" binding:"required,min=1,dive"`
}

// updateBOMRequest là DTO request cập nhật BOM.
type updateBOMRequest struct {
	ProductID   uint                   `json:"product_id" binding:"required,gt=0"`
	BOMName     string                 `json:"bom_name"`
	Description string                 `json:"description"`
	Items       []createBOMItemRequest `json:"items" binding:"required,min=1,dive"`
}

func mapBOMServiceError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidBOMPayload):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_BOM_PAYLOAD", "error": "Dữ liệu BOM không hợp lệ."})
	case errors.Is(err, services.ErrInvalidBOMID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_BOM_ID", "error": "Mã BOM không hợp lệ."})
	case errors.Is(err, repositories.ErrBOMDuplicateComponent):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "BOM_DUPLICATE_COMPONENT", "error": "Không được chọn trùng linh kiện trong cùng BOM."})
	case errors.Is(err, repositories.ErrBOMParentProductNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "BOM_PARENT_PRODUCT_NOT_FOUND", "error": "Không tìm thấy thành phẩm cha hoặc thành phẩm đã bị khóa."})
	case errors.Is(err, repositories.ErrBOMComponentProductsNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "BOM_COMPONENT_PRODUCTS_NOT_FOUND", "error": "Một hoặc nhiều linh kiện không tồn tại hoặc đã bị khóa."})
	case errors.Is(err, repositories.ErrBOMParentMustBeFinishedGood):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "BOM_PARENT_MUST_BE_FINISHED_GOOD", "error": "Sản phẩm cha của BOM phải là thành phẩm FINISHED_GOOD."})
	case errors.Is(err, repositories.ErrBOMComponentsMustBeComponents):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "BOM_COMPONENTS_MUST_BE_COMPONENTS", "error": "Tất cả dòng linh kiện trong BOM phải là sản phẩm loại COMPONENT."})
	case errors.Is(err, repositories.ErrBOMNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "BOM_NOT_FOUND", "error": "Không tìm thấy BOM."})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error_code": "BOM_INTERNAL_ERROR", "error": err.Error()})
	}
}

// CreateBOM tạo BOM + danh sách BOM items trong cùng transaction.
func (h *BOMHandler) CreateBOM(c echo.Context) {
	var req createBOMRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	// Lấy user_id từ auth context để lưu created_by cho BOM.
	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	items := make([]services.BOMCreateItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.BOMCreateItemInput{
			ComponentProductID: item.ComponentProductID,
			Quantity:           item.Quantity,
		})
	}

	bom, err := h.service.Create(services.BOMCreateInput{
		ProductID:   req.ProductID,
		BOMName:     req.BOMName,
		Description: req.Description,
		CreatedBy:   createdBy,
		Items:       items,
	})
	if err != nil {
		mapBOMServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, bom)
}

// UpdateBOM cập nhật BOM header + thay danh sách BOM items.
func (h *BOMHandler) UpdateBOM(c echo.Context) {
	bomIDRaw := c.Param("id")
	bomID, err := strconv.ParseUint(bomIDRaw, 10, 64)
	if err != nil || bomID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid bom id"})
		return
	}

	var req updateBOMRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	items := make([]services.BOMCreateItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.BOMCreateItemInput{
			ComponentProductID: item.ComponentProductID,
			Quantity:           item.Quantity,
		})
	}

	bom, serviceErr := h.service.Update(services.BOMUpdateInput{
		BOMID:       uint(bomID),
		ProductID:   req.ProductID,
		BOMName:     req.BOMName,
		Description: req.Description,
		Items:       items,
	})
	if serviceErr != nil {
		mapBOMServiceError(c, serviceErr)
		return
	}

	c.JSON(http.StatusOK, bom)
}

// DeleteBOM xóa BOM và toàn bộ BOM items liên quan.
func (h *BOMHandler) DeleteBOM(c echo.Context) {
	bomIDRaw := c.Param("id")
	bomID, err := strconv.ParseUint(bomIDRaw, 10, 64)
	if err != nil || bomID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid bom id"})
		return
	}

	if serviceErr := h.service.Delete(uint(bomID)); serviceErr != nil {
		mapBOMServiceError(c, serviceErr)
		return
	}

	c.JSON(http.StatusOK, echo.Map{"message": "bom deleted successfully"})
}

// GetBOMs trả danh sách BOM, hỗ trợ filter product_id.
func (h *BOMHandler) GetBOMs(c echo.Context) {
	boms, err := h.service.GetAll(services.BOMListQuery{ProductIDRaw: c.QueryParam("product_id")})
	if err != nil {
		if err.Error() == "invalid product_id" {
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid product_id"})
			return
		}
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, boms)
}

// GetBOMItems trả chi tiết 1 BOM và danh sách component items của BOM đó.
func (h *BOMHandler) GetBOMItems(c echo.Context) {
	bomIDRaw := c.Param("id")
	bomID, err := strconv.ParseUint(bomIDRaw, 10, 64)
	if err != nil || bomID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid bom id"})
		return
	}

	bom, items, serviceErr := h.service.GetItemsByBOMID(uint(bomID))
	if serviceErr != nil {
		mapBOMServiceError(c, serviceErr)
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"bom":   bom,
		"items": items,
	})
}
