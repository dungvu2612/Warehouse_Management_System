package handlers

/*
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
	TrayCode    string `json:"tray_code" binding:"required,max=100"`
	ProductID   uint   `json:"product_id" binding:"required,gt=0"`
	LocationID  uint   `json:"location_id" binding:"required,gt=0"`
	QRCode      string `json:"qr_code" binding:"required"`
	Description string `json:"description"`
}

// CreateTray tạo khay chứa hàng.
func (h *TrayHandler) CreateTray(c *gin.Context) {
	var req trayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	tray, err := h.service.Create(req.TrayCode, req.ProductID, req.LocationID, req.QRCode, req.Description)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidTrayPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrProductNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrLocationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayCodeExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
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
