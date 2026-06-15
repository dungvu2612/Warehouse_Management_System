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

	"github.com/labstack/echo/v4"
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

type adjustByTrayRequest struct {
	TrayQRCode    string `json:"tray_qr_code" binding:"required"`
	Delta         int    `json:"delta"`
	Note          string `json:"note"`
	ReferenceCode string `json:"reference_code"`
}

type putawayRequest struct {
	ProductQRCode string `json:"product_qr_code" binding:"required"`
	TrayQRCode    string `json:"tray_qr_code" binding:"required"`
	Quantity      int    `json:"quantity" binding:"required,gt=0"`
	Note          string `json:"note"`
	ReferenceCode string `json:"reference_code"`
}

type stocktakingRequest struct {
	TrayQRCode    string `json:"tray_qr_code" binding:"required"`
	PhysicalQty   int    `json:"physical_qty" binding:"gte=0"`
	Note          string `json:"note"`
	ReferenceCode string `json:"reference_code"`
}

type rejectPutawayRequest struct {
	Reason string `json:"reason"`
}

func (h *InventoryHandler) GetInventory(c echo.Context) {
	inventories, err := h.service.GetAll(services.InventoryListQuery{
		ProductIDRaw: c.QueryParam("product_id"),
		TrayIDRaw:    c.QueryParam("tray_id"),
	})
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, inventories)
}

func (h *InventoryHandler) CreateInventory(c echo.Context) {
	var req createInventoryRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
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
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrTrayProductMismatch):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryAlreadyExists):
			c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, inventory)
}

func (h *InventoryHandler) AdjustInventory(c echo.Context) {
	idRaw := c.Param("id")
	inventoryID, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || inventoryID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid inventory id"})
		return
	}

	var req adjustInventoryRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
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
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrInsufficientStock):
			c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "inventory adjusted successfully",
		"data":    updated,
	})
}

func (h *InventoryHandler) AdjustByTray(c echo.Context) {
	var req adjustByTrayRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	updated, err := h.service.AdjustByTray(services.AdjustByTrayInput{
		TrayQRCode:    req.TrayQRCode,
		Delta:         req.Delta,
		Note:          req.Note,
		CreatedBy:     createdBy,
		ReferenceCode: req.ReferenceCode,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidAdjustPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrInsufficientStock):
			c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "inventory adjusted by tray successfully",
		"data":    updated,
	})
}

func (h *InventoryHandler) Putaway(c echo.Context) {
	var req putawayRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	updated, err := h.service.Putaway(services.PutawayInput{
		ProductQRCode: req.ProductQRCode,
		TrayQRCode:    req.TrayQRCode,
		Quantity:      req.Quantity,
		Note:          req.Note,
		CreatedBy:     createdBy,
		ReferenceCode: req.ReferenceCode,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidInventoryFilter):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrProductNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Nhập kho thành công. Tồn kho đã được cập nhật và lịch sử nhập kho đã được ghi nhận.",
		"data":    updated,
	})
}

func (h *InventoryHandler) GetPutawayRequests(c echo.Context) {
	status := c.QueryParam("status")
	rows, err := h.service.GetPutawayRequests(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *InventoryHandler) ApprovePutawayRequest(c echo.Context) {
	idRaw := c.Param("id")
	requestID, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || requestID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid putaway request id"})
		return
	}

	userIDValue := c.Get("user_id")
	approvedBy, _ := userIDValue.(uint)

	req, inv, err := h.service.ApprovePutawayRequest(services.PutawayApprovalActionInput{
		RequestID:  uint(requestID),
		ApprovedBy: approvedBy,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidInventoryID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrPutawayRequestNotPending):
			c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrPutawayRequestNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrProductNotFound), errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "đã duyệt yêu cầu nhập kho",
		"request": req,
		"data":    inv,
	})
}

func (h *InventoryHandler) RejectPutawayRequest(c echo.Context) {
	idRaw := c.Param("id")
	requestID, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || requestID == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid putaway request id"})
		return
	}
	var body rejectPutawayRequest
	if err := c.Bind(&body); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	approvedBy, _ := userIDValue.(uint)

	req, err := h.service.RejectPutawayRequest(services.PutawayApprovalActionInput{
		RequestID:  uint(requestID),
		ApprovedBy: approvedBy,
		Reason:     body.Reason,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidInventoryID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, services.ErrPutawayRequestNotPending):
			c.JSON(http.StatusConflict, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrPutawayRequestNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "đã từ chối yêu cầu nhập kho",
		"request": req,
	})
}

func (h *InventoryHandler) Stocktaking(c echo.Context) {
	var req stocktakingRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	result, err := h.service.Stocktake(services.StocktakeInput{
		TrayQRCode:    req.TrayQRCode,
		PhysicalQty:   req.PhysicalQty,
		Note:          req.Note,
		CreatedBy:     createdBy,
		ReferenceCode: req.ReferenceCode,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidInventoryFilter):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrTrayNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrInventoryNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "stocktaking adjustment successful",
		"data":    result.Inventory,
		"delta":   result.Delta,
	})
}
