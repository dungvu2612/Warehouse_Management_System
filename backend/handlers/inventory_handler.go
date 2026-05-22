package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'inventory'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewInventoryHandler
- GetInventory
- CreateInventory
- AdjustInventory

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

type InventoryHandler struct {
	service services.InventoryService
}

func NewInventoryHandler(service services.InventoryService) *InventoryHandler {
	return &InventoryHandler{service: service}
}

type createInventoryRequest struct {
	ProductID uint `json:"product_id" binding:"required,gt=0"`
	TrayID    uint `json:"tray_id" binding:"required,gt=0"`
	Quantity  int  `json:"quantity" binding:"gte=0"`
}

type adjustInventoryRequest struct {
	Delta int    `json:"delta"`
	Note  string `json:"note"`
}

func (h *InventoryHandler) GetInventory(c *gin.Context) {
	inventories, err := h.service.GetAll(services.InventoryListQuery{
		ProductIDRaw: c.Query("product_id"),
		TrayIDRaw:    c.Query("tray_id"),
	})
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, inventories)
}

func (h *InventoryHandler) CreateInventory(c *gin.Context) {
	var req createInventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	inventory, err := h.service.Create(services.CreateInventoryInput{
		ProductID: req.ProductID,
		TrayID:    req.TrayID,
		Quantity:  req.Quantity,
	})
	if err != nil {
		switch {
		case errors.Is(err, repositories.ErrProductNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrTrayProductMismatch):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, inventory)
}

func (h *InventoryHandler) AdjustInventory(c *gin.Context) {
	idRaw := c.Param("id")
	inventoryID, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || inventoryID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid inventory id"})
		return
	}

	var req adjustInventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	updated, err := h.service.Adjust(services.AdjustInventoryInput{
		InventoryID: uint(inventoryID),
		Delta:       req.Delta,
		Note:        req.Note,
		CreatedBy:   createdBy,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidAdjustPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrInsufficientStock):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "inventory adjusted successfully",
		"data":    updated,
	})
}
