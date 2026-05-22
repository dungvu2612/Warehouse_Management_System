package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'pick_log'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewPickLogHandler
- GetPickLogs

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"net/http"

	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

type PickLogHandler struct {
	service services.PickLogService
}

func NewPickLogHandler(service services.PickLogService) *PickLogHandler {
	return &PickLogHandler{service: service}
}

func (h *PickLogHandler) GetPickLogs(c *gin.Context) {
	logs, err := h.service.GetByFilters(services.PickLogQuery{
		OrderIDRaw:  c.Query("order_id"),
		PickedByRaw: c.Query("picked_by"),
		DateFromRaw: c.Query("date_from"),
		DateToRaw:   c.Query("date_to"),
		LimitRaw:    c.Query("limit"),
	})
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
