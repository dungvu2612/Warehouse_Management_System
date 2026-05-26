package handlers

/*
Senior Handover Note:
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

	"github.com/gin-gonic/gin"
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

func parseTrayID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid tray id"})
		return 0, false
	}
	return uint(id), true
}

func mapTrayServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidTrayID):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidTrayPayload):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrTrayNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrProductNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrLocationNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrTrayCodeExists):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

// CreateTray tạo khay chứa hàng.
func (h *TrayHandler) CreateTray(c *gin.Context) {
	var req trayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
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
func (h *TrayHandler) GetTrays(c *gin.Context) {
	trays, err := h.service.GetAllActive()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trays)
}

// UpdateTray cap nhat khay (ADMIN).
func (h *TrayHandler) UpdateTray(c *gin.Context) {
	id, ok := parseTrayID(c)
	if !ok {
		return
	}

	var req trayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
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
func (h *TrayHandler) DeleteTray(c *gin.Context) {
	id, ok := parseTrayID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		mapTrayServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tray deactivated successfully"})
}
