package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'audit'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewAuditHandler
- GetOrderAuditConsistency

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

type AuditHandler struct {
	service services.AuditService
}

func NewAuditHandler(service services.AuditService) *AuditHandler {
	return &AuditHandler{service: service}
}

func (h *AuditHandler) GetOrderAuditConsistency(c echo.Context) {
	orderIDRaw := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid order id"})
		return
	}

	result, err := h.service.GetOrderConsistency(uint(orderID))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidOrderID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
