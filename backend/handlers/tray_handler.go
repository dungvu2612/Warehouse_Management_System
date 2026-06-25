package handlers

/*
Thông tin ghi chú:
- File nay la transport layer HTTP cho module Tray, da mo rong CRUD va payload create/update khong nhap tray_code/qr_code.
- Phu thuoc vao TrayService va domain errors de map dung HTTP status code.
- Luu y bao tri: tray_code/qr_code duoc service sinh tu dong theo location_code, handler khong nhan 2 field nay tu client.

Mo ta file:
- File nay la transport layer HTTP cho module 'tray'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewTrayHandler
- CreateTray
- GetTrays

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

type TrayHandler struct {
	service services.TrayService
}

func NewTrayHandler(service services.TrayService) *TrayHandler {
	return &TrayHandler{service: service}
}

type trayRequest struct {
	ProductID   uint   `json:"product_id" binding:"required,gt=0"`
	LocationID  uint   `json:"location_id" binding:"required,gt=0"`
	Description string `json:"description"`
}

func parseTrayID(c echo.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid tray id"})
		return 0, false
	}
	return uint(id), true
}

func mapTrayServiceError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidTrayID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_TRAY_ID", "error": "Mã khay không hợp lệ."})
	case errors.Is(err, services.ErrInvalidTrayPayload):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_TRAY_PAYLOAD", "error": "Vui lòng chọn sản phẩm và vị trí hợp lệ."})
	case errors.Is(err, repositories.ErrTrayNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "TRAY_NOT_FOUND", "error": "Không tìm thấy khay hoặc khay đã bị khóa."})
	case errors.Is(err, repositories.ErrProductNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "TRAY_PRODUCT_NOT_FOUND", "error": "Không tìm thấy sản phẩm hoặc sản phẩm đã bị khóa."})
	case errors.Is(err, repositories.ErrLocationNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "TRAY_LOCATION_NOT_FOUND", "error": "Không tìm thấy vị trí hoặc vị trí đã bị khóa."})
	case errors.Is(err, repositories.ErrTrayCodeExists):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "TRAY_CODE_EXISTS", "error": "Mã khay tự sinh đã tồn tại, vui lòng thử lại."})
	case errors.Is(err, repositories.ErrTrayPairExists):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "TRAY_PAIR_EXISTS", "error": "Sản phẩm này đã có khay active tại vị trí đã chọn."})
	case errors.Is(err, repositories.ErrTrayInUse):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "TRAY_IN_USE", "error": "Khay đang được dùng trong nghiệp vụ kho, chưa thể xóa."})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error_code": "TRAY_INTERNAL_ERROR", "error": err.Error()})
	}
}

// CreateTray tạo khay chứa hàng.
func (h *TrayHandler) CreateTray(c echo.Context) {
	var req trayRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	tray, err := h.service.Create(req.ProductID, req.LocationID, req.Description)
	if err != nil {
		mapTrayServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, tray)
}

// GetTrays lấy danh sách khay active.
func (h *TrayHandler) GetTrays(c echo.Context) {
	trays, err := h.service.GetAllActive()
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trays)
}

// ScanTrayByQRCode tra thong tin tray + ton kho theo qr_code de phuc vu HT730 scan workflow.
func (h *TrayHandler) ScanTrayByQRCode(c echo.Context) {
	qrCode := c.Param("qr_code")
	result, err := h.service.ScanByQRCode(qrCode)
	if err != nil {
		mapTrayServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateTray cap nhat khay (ADMIN).
func (h *TrayHandler) UpdateTray(c echo.Context) {
	id, ok := parseTrayID(c)
	if !ok {
		return
	}

	var req trayRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	tray, err := h.service.Update(id, req.ProductID, req.LocationID, req.Description)
	if err != nil {
		mapTrayServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, tray)
}

// DeleteTray xoa mem khay (is_active=false, ADMIN).
func (h *TrayHandler) DeleteTray(c echo.Context) {
	id, ok := parseTrayID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		mapTrayServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, echo.Map{"message": "tray deactivated successfully"})
}
