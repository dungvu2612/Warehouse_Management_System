package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'dashboard'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewDashboardHandler
- GetDashboardStats

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"net/http"

	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service services.DashboardService
}

func NewDashboardHandler(service services.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
