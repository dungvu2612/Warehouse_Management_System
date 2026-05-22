package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'import_receipt'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewImportReceiptHandler
- CreateImportReceipt
- GetImportReceipts
- GetImportReceiptByID

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

// ImportReceiptHandler xử lý transport layer cho import receipt.
type ImportReceiptHandler struct {
	service services.ImportReceiptService
}

// NewImportReceiptHandler khởi tạo handler import receipt.
func NewImportReceiptHandler(service services.ImportReceiptService) *ImportReceiptHandler {
	return &ImportReceiptHandler{service: service}
}

// createImportReceiptItemRequest là DTO item từ request body.
type createImportReceiptItemRequest struct {
	ProductID uint `json:"product_id" binding:"required,gt=0"`
	TrayID    uint `json:"tray_id" binding:"required,gt=0"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

// createImportReceiptRequest là DTO request tạo phiếu nhập.
type createImportReceiptRequest struct {
	SupplierName string                           `json:"supplier_name"`
	Note         string                           `json:"note"`
	Items        []createImportReceiptItemRequest `json:"items" binding:"required,min=1,dive"`
}

// CreateImportReceipt tạo phiếu nhập và cập nhật tồn kho trong transaction.
func (h *ImportReceiptHandler) CreateImportReceipt(c *gin.Context) {
	var req createImportReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Lấy user_id từ auth context để ghi created_by.
	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	// Map request items sang input service.
	items := make([]services.ImportReceiptCreateItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.ImportReceiptCreateItemInput{
			ProductID: item.ProductID,
			TrayID:    item.TrayID,
			Quantity:  item.Quantity,
		})
	}

	receipt, createdItems, err := h.service.Create(services.ImportReceiptCreateInput{
		SupplierName: req.SupplierName,
		Note:         req.Note,
		CreatedBy:    createdBy,
		Items:        items,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidImportReceiptPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrImportReceiptDuplicateItem):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrImportReceiptTrayMismatch):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrProductNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "product or tray not found"})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "product or tray not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"receipt": receipt,
		"items":   createdItems,
	})
}

// GetImportReceipts trả danh sách phiếu nhập mới nhất trước.
func (h *ImportReceiptHandler) GetImportReceipts(c *gin.Context) {
	receipts, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, receipts)
}

// GetImportReceiptByID trả chi tiết 1 phiếu nhập.
func (h *ImportReceiptHandler) GetImportReceiptByID(c *gin.Context) {
	idRaw := c.Param("id")
	id, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid import receipt id"})
		return
	}

	receipt, err := h.service.GetByID(uint(id))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidImportReceiptID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrImportReceiptNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, receipt)
}
