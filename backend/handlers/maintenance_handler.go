package handlers

import (
	"errors"
	"net/http"

	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type MaintenanceHandler struct {
	service services.MaintenanceService
}

func NewMaintenanceHandler(service services.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{service: service}
}

type purgeInactiveRequest struct {
	RetentionDays int  `json:"retention_days"`
	DryRun        bool `json:"dry_run"`
}

func (h *MaintenanceHandler) PurgeInactiveMasterData(c echo.Context) {
	var req purgeInactiveRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	result, err := h.service.PurgeInactiveMasterData(services.PurgeInactiveInput{
		RetentionDays: req.RetentionDays,
		DryRun:        req.DryRun,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidPurgeRetention):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
