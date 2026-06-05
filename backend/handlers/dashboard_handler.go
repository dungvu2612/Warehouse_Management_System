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

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service services.DashboardService
}

func NewDashboardHandler(service services.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	roleRaw, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing auth context"})
		return
	}

	role, ok := roleRaw.(string)
	if !ok || strings.TrimSpace(role) == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid auth role"})
		return
	}

	stats, err := h.service.GetStatsByRole(role)
	if err != nil {
		if errors.Is(err, services.ErrDashboardForbiddenRole) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden - insufficient role"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
