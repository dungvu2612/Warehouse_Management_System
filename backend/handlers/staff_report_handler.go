package handlers

import (
	"errors"
	"net/http"

	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type StaffReportHandler struct {
	service services.StaffReportService
}

func NewStaffReportHandler(service services.StaffReportService) *StaffReportHandler {
	return &StaffReportHandler{service: service}
}

func (h *StaffReportHandler) GetStaffPerformance(c echo.Context) {
	response, err := h.service.GetStaffPerformance(services.StaffPerformanceQuery{
		FromDate: c.QueryParam("from_date"),
		ToDate:   c.QueryParam("to_date"),
		WorkType: c.QueryParam("work_type"),
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrStaffReportInvalidDateRange):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Khoảng thời gian báo cáo không hợp lệ."})
		case errors.Is(err, services.ErrStaffReportInvalidWorkType):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Loại công việc không hợp lệ."})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, response)
}
