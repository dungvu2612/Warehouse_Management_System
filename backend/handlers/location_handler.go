package handlers

/*
Thông tin ghi chú:
- File nay la HTTP transport cho module location, da mo rong them endpoint update/delete.
- Phu thuoc vao LocationService va domain errors tu services/repositories de map dung status code.
- Khong dua nghiep vu DB vao handler; chi bind/validate request va map response.

Mo ta file:
- File nay la transport layer HTTP cho module 'location'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewLocationHandler
- CreateLocation
- GetLocations

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

type LocationHandler struct {
	service services.LocationService
}

func NewLocationHandler(service services.LocationService) *LocationHandler {
	return &LocationHandler{service: service}
}

type locationRequest struct {
	LocationCode string `json:"location_code" binding:"required,max=100"`
	Shelf        string `json:"shelf" binding:"omitempty,max=50"`
	Description  string `json:"description"`
}

func parseLocationID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid location id"})
		return 0, false
	}
	return uint(id), true
}

func mapLocationServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidLocationID):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, services.ErrInvalidLocationPayload):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrLocationCodeExists):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrLocationNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

// CreateLocation tạo vị trí/kệ mới.
func (h *LocationHandler) CreateLocation(c *gin.Context) {
	var req locationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	location, err := h.service.Create(req.LocationCode, req.Shelf, req.Description)
	if err != nil {
		mapLocationServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, location)
}

// GetLocations lấy danh sách location active.
func (h *LocationHandler) GetLocations(c *gin.Context) {
	locations, err := h.service.GetAllActive()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, locations)
}

// GetLocationTrays lay danh sach khay dang thuoc location, kem tong ton va so san pham.
func (h *LocationHandler) GetLocationTrays(c *gin.Context) {
	id, ok := parseLocationID(c)
	if !ok {
		return
	}

	result, err := h.service.GetTraysByLocationID(id)
	if err != nil {
		mapLocationServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateLocation cap nhat location (ADMIN).
func (h *LocationHandler) UpdateLocation(c *gin.Context) {
	id, ok := parseLocationID(c)
	if !ok {
		return
	}

	var req locationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	location, err := h.service.Update(id, req.LocationCode, req.Shelf, req.Description)
	if err != nil {
		mapLocationServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, location)
}

// DeleteLocation xoa mem location (is_active=false, ADMIN).
func (h *LocationHandler) DeleteLocation(c *gin.Context) {
	id, ok := parseLocationID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		mapLocationServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "location deactivated successfully"})
}
