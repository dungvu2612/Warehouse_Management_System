package handlers

/*
- Mục đích: HTTP transport layer cho Dashboard role-based.
- Phụ thuộc: Dashboard service + auth middleware context (`role`).
- Hợp đồng API: GET /dashboard/stats tra payload tong hop theo role.
- Role access: Middleware da chan role; handler van fallback 403 neu role context sai.
- Ghi chú bảo trì: Neu thay doi response shape, cap nhat service truoc roi toi handler.
*/

import (
	"errors"
	"net/http"
	"strings"

	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	service services.DashboardService
}

func NewDashboardHandler(service services.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetDashboardStats(c echo.Context) {
	roleRaw := c.Get("role")
	if roleRaw == nil {
		c.JSON(http.StatusUnauthorized, echo.Map{"error": "missing auth context"})
		return
	}

	role, ok := roleRaw.(string)
	if !ok || strings.TrimSpace(role) == "" {
		c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid auth role"})
		return
	}

	stats, err := h.service.GetStatsByRole(role, services.DashboardStatsQuery{
		RevenueFromDate: c.QueryParam("revenue_from_date"),
		RevenueToDate:   c.QueryParam("revenue_to_date"),
	})
	if err != nil {
		if errors.Is(err, services.ErrDashboardForbiddenRole) {
			c.JSON(http.StatusForbidden, echo.Map{"error": "forbidden - insufficient role"})
			return
		}
		if errors.Is(err, services.ErrDashboardInvalidDateRange) {
			c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid revenue date range"})
			return
		}
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
