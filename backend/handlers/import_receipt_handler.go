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

	"github.com/labstack/echo/v4"
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
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

// createImportReceiptRequest là DTO request tạo phiếu nhập.
type createImportReceiptRequest struct {
	SupplierName string                           `json:"supplier_name"`
	Note         string                           `json:"note"`
	Items        []createImportReceiptItemRequest `json:"items" binding:"required,min=1,dive"`
}

type confirmImportReceiptItemRequest struct {
	TrayCode string `json:"tray_code"`
	TrayID   uint   `json:"tray_id"`
	Quantity int    `json:"quantity" binding:"required,gt=0"`
	Note     string `json:"note"`
}

type assignImportReceiptItemRequest struct {
	StaffID uint `json:"staff_id" binding:"required,gt=0"`
}

// CreateImportReceipt tạo phiếu nhập kế hoạch; chưa cộng tồn kho.
func (h *ImportReceiptHandler) CreateImportReceipt(c echo.Context) {
	var req createImportReceiptRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	// Lấy user_id từ auth context để ghi created_by.
	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	// Map request items sang input service.
	items := make([]services.ImportReceiptCreateItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.ImportReceiptCreateItemInput{
			ProductID: item.ProductID,
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
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Dữ liệu phiếu nhập không hợp lệ."})
		case errors.Is(err, repositories.ErrImportReceiptDuplicateItem):
			c.JSON(http.StatusBadRequest, echo.Map{"error": "Không được trùng sản phẩm trong cùng một phiếu nhập."})
		case errors.Is(err, repositories.ErrImportReceiptTrayMismatch):
			c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrProductNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": "product or tray not found"})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": "product or tray not found"})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, echo.Map{
		"message": "Tạo phiếu nhập thành công. Nhân viên có thể nhận việc nhập kho từ phiếu này.",
		"receipt": receipt,
		"items":   createdItems,
	})
}

func parseImportReceiptID(c echo.Context) (uint, bool) {
	idRaw := c.Param("id")
	id, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Phiếu nhập không hợp lệ."})
		return 0, false
	}
	return uint(id), true
}

func respondImportReceiptWriteError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidImportReceiptPayload):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Dữ liệu phiếu nhập không hợp lệ."})
	case errors.Is(err, services.ErrInvalidImportReceiptID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Phiếu nhập không hợp lệ."})
	case errors.Is(err, repositories.ErrImportReceiptDuplicateItem):
		c.JSON(http.StatusBadRequest, echo.Map{"error": "Không được trùng sản phẩm trong cùng một phiếu nhập."})
	case errors.Is(err, repositories.ErrImportReceiptNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error": "Không tìm thấy phiếu nhập."})
	case errors.Is(err, repositories.ErrImportReceiptLocked):
		c.JSON(http.StatusConflict, echo.Map{"error": "Phiếu nhập đã có người nhận hoặc đã phát sinh nhập kho, không thể sửa/xóa."})
	case errors.Is(err, repositories.ErrProductNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error": "Không tìm thấy sản phẩm."})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
}

func (h *ImportReceiptHandler) UpdateImportReceipt(c echo.Context) {
	id, ok := parseImportReceiptID(c)
	if !ok {
		return
	}

	var req createImportReceiptRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	items := make([]services.ImportReceiptCreateItemInput, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, services.ImportReceiptCreateItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		})
	}

	receipt, err := h.service.Update(services.ImportReceiptUpdateInput{
		ID:           id,
		SupplierName: req.SupplierName,
		Note:         req.Note,
		Items:        items,
	})
	if err != nil {
		respondImportReceiptWriteError(c, err)
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "Cập nhật phiếu nhập thành công.",
		"receipt": receipt,
	})
}

func (h *ImportReceiptHandler) DeleteImportReceipt(c echo.Context) {
	id, ok := parseImportReceiptID(c)
	if !ok {
		return
	}
	if err := h.service.Delete(id); err != nil {
		respondImportReceiptWriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, echo.Map{"message": "Xóa phiếu nhập thành công."})
}

// GetImportReceipts trả danh sách phiếu nhập mới nhất trước.
func (h *ImportReceiptHandler) GetImportReceipts(c echo.Context) {
	receipts, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, receipts)
}

// GetImportReceiptByID trả chi tiết 1 phiếu nhập.
func (h *ImportReceiptHandler) GetImportReceiptByID(c echo.Context) {
	id, ok := parseImportReceiptID(c)
	if !ok {
		return
	}

	receipt, err := h.service.GetByID(id)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidImportReceiptID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrImportReceiptNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, receipt)
}

func currentImportUser(c echo.Context) (uint, string) {
	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	roleValue := c.Get("role")
	role, _ := roleValue.(string)
	return userID, role
}

func parseImportItemID(c echo.Context) (uint, bool) {
	idRaw := c.Param("item_id")
	id, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{
			"error_code": "INVALID_IMPORT_RECEIPT_ITEM",
			"error":      "Dòng phiếu nhập không hợp lệ.",
		})
		return 0, false
	}
	return uint(id), true
}

func respondImportTaskError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidImportReceiptItemID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_IMPORT_RECEIPT_ITEM", "error": "Dòng phiếu nhập không hợp lệ."})
	case errors.Is(err, repositories.ErrImportReceiptItemNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "IMPORT_RECEIPT_ITEM_NOT_FOUND", "error": "Không tìm thấy công việc nhập kho."})
	case errors.Is(err, repositories.ErrImportTaskAlreadyAssigned):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "IMPORT_TASK_ALREADY_ASSIGNED", "error": "Công việc đã được nhân viên khác nhận."})
	case errors.Is(err, repositories.ErrImportTaskNotClaimed):
		c.JSON(http.StatusForbidden, echo.Map{"error_code": "IMPORT_TASK_NOT_CLAIMED", "error": "Bạn cần nhận việc trước khi nhập kho."})
	case errors.Is(err, repositories.ErrImportTaskNotAssignedToYou):
		c.JSON(http.StatusForbidden, echo.Map{"error_code": "IMPORT_TASK_NOT_ASSIGNED_TO_YOU", "error": "Bạn không phải người phụ trách công việc này."})
	case errors.Is(err, repositories.ErrImportTaskAlreadyDone):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "IMPORT_TASK_ALREADY_DONE", "error": "Công việc nhập kho đã hoàn thành."})
	case errors.Is(err, repositories.ErrImportTaskHasQuantity):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "IMPORT_TASK_HAS_QUANTITY", "error": "Công việc đã có dữ liệu nhập kho, không thể gỡ phân công trực tiếp."})
	case errors.Is(err, repositories.ErrImportQuantityExceeded):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "IMPORT_QUANTITY_EXCEEDED", "error": "Số lượng nhập vượt quá số lượng dự kiến."})
	case errors.Is(err, repositories.ErrInvalidImportQuantity):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "INVALID_IMPORT_QUANTITY", "error": "Số lượng thực nhập không hợp lệ."})
	case errors.Is(err, repositories.ErrTrayNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "TRAY_NOT_FOUND", "error": "Không tìm thấy khay hoặc khay không thuộc sản phẩm cần nhập."})
	case errors.Is(err, repositories.ErrStaffNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "STAFF_NOT_FOUND", "error": "Không tìm thấy nhân viên."})
	case errors.Is(err, repositories.ErrInvalidStaffRole):
		c.JSON(http.StatusBadRequest, echo.Map{"error_code": "INVALID_STAFF_ROLE", "error": "Người được gán phải là nhân viên."})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
}

// GetStaffImportTasks trả danh sách công việc nhập kho để ghép vào trang Tác vụ kho.
func (h *ImportReceiptHandler) GetStaffImportTasks(c echo.Context) {
	userID, role := currentImportUser(c)
	rows, err := h.service.GetStaffImportTasks(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GetImportTaskSummary trả số lượng việc nhập chờ/đang xử lý cho sidebar.
func (h *ImportReceiptHandler) GetImportTaskSummary(c echo.Context) {
	userID, role := currentImportUser(c)
	row, err := h.service.GetImportTaskSummary(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, row)
}

// ClaimImportReceiptItem cho STAFF nhận một dòng phiếu nhập.
func (h *ImportReceiptHandler) ClaimImportReceiptItem(c echo.Context) {
	itemID, ok := parseImportItemID(c)
	if !ok {
		return
	}
	userID, _ := currentImportUser(c)
	item, err := h.service.ClaimImportReceiptItem(itemID, userID)
	if err != nil {
		respondImportTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Nhận việc nhập kho thành công.",
		"item":    item,
	})
}

// ConfirmImportReceiptItem cho STAFF xác nhận số lượng nhập thực tế.
func (h *ImportReceiptHandler) ConfirmImportReceiptItem(c echo.Context) {
	itemID, ok := parseImportItemID(c)
	if !ok {
		return
	}
	var req confirmImportReceiptItemRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}
	userID, _ := currentImportUser(c)
	item, err := h.service.ConfirmImportReceiptItem(services.ImportReceiptConfirmInput{
		ItemID:   itemID,
		UserID:   userID,
		TrayCode: req.TrayCode,
		TrayID:   req.TrayID,
		Quantity: req.Quantity,
		Note:     req.Note,
	})
	if err != nil {
		respondImportTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Nhập kho thành công. Tồn kho đã được cập nhật.",
		"item":    item,
	})
}

// AdminAssignImportReceiptItem cho ADMIN gán công việc nhập kho cho nhân viên.
func (h *ImportReceiptHandler) AdminAssignImportReceiptItem(c echo.Context) {
	itemID, ok := parseImportItemID(c)
	if !ok {
		return
	}
	var req assignImportReceiptItemRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}
	item, err := h.service.AssignImportReceiptItem(services.ImportReceiptAssignInput{
		ItemID:  itemID,
		StaffID: req.StaffID,
	})
	if err != nil {
		respondImportTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Đã gán công việc nhập kho cho nhân viên.",
		"item":    item,
	})
}

// AdminUnassignImportReceiptItem cho ADMIN gỡ phân công công việc nhập kho.
func (h *ImportReceiptHandler) AdminUnassignImportReceiptItem(c echo.Context) {
	itemID, ok := parseImportItemID(c)
	if !ok {
		return
	}
	item, err := h.service.UnassignImportReceiptItem(itemID)
	if err != nil {
		respondImportTaskError(c, err)
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Đã gỡ phân công công việc nhập kho.",
		"item":    item,
	})
}
