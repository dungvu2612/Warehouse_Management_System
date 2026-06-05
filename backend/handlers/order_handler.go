package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'order'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewOrderHandler
- parseOrderID
- parsePickingTaskID
- CreateOrder
- GetOrders
- GetOrderByID
- ScanOrderForPicking
- ConfirmPickingTask
- FinishOrder
- GetOrderPickingTasks
- GetOrderProgress

Luu y khi sua:
- Khong dua query DB vao handler; giu handler la transport-only de de test va de maintain.
*/

import (
	"errors"
	"net/http"
	"strconv"

	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

// OrderHandler xử lý transport layer cho module order/picking.
type OrderHandler struct {
	service services.OrderService
}

// NewOrderHandler khởi tạo handler order theo dependency injection.
func NewOrderHandler(service services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

// createOrderRequest là DTO request tạo order từ BOM.
type createOrderRequest struct {
	CustomerName    string             `json:"customer_name" binding:"required"`
	CustomerPhone   string             `json:"customer_phone"`
	CustomerAddress string             `json:"customer_address"`
	Items           []orderItemRequest `json:"items" binding:"required,min=1,dive"`
}

// scanOrderRequest là DTO request quét order_code.
type scanOrderRequest struct {
	OrderCode string `json:"order_code" binding:"required"`
}

type updateOrderRequest struct {
	CustomerName    string             `json:"customer_name" binding:"required"`
	CustomerPhone   string             `json:"customer_phone"`
	CustomerAddress string             `json:"customer_address"`
	Items           []orderItemRequest `json:"items" binding:"required,min=1,dive"`
}

type orderItemRequest struct {
	ProductID uint    `json:"product_id" binding:"required,gt=0"`
	Quantity  int     `json:"quantity" binding:"required,gt=0"`
	UnitPrice float64 `json:"unit_price" binding:"gte=0"`
}

type verifyTrayRequest struct {
	TrayQRCode string `json:"tray_qr_code" binding:"required"`
}

type scanProductRequest struct {
	TrayQRCode    string `json:"tray_qr_code" binding:"required"`
	ProductQRCode string `json:"product_qr_code" binding:"required"`
	Note          string `json:"note"`
}

func parseOrderID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid order id"})
		return 0, false
	}
	return uint(id), true
}

func parsePickingTaskID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid picking task id"})
		return 0, false
	}
	return uint(id), true
}

func respondOrderReadError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrOrderInvalidID):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	case errors.Is(err, repositories.ErrOrderEntityNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

func respondOrderDomainError(c *gin.Context, status int, errorCode string, message string) {
	c.JSON(status, gin.H{
		"error_code": errorCode,
		"error":      message,
	})
}

// CreateOrder tạo order từ BOM và sinh order_items theo machine_qty.
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	order, err := h.service.Create(services.OrderCreateInput{
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		Items:           mapOrderItems(req.Items),
		CreatedBy:       createdBy,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderBOMNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderBOMNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderBOMHasNoItems):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderBOMHasNoItems.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) UpdateOrder(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	var req updateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	order, err := h.service.Update(services.OrderUpdateInput{
		OrderID:         orderID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		Items:           mapOrderItems(req.Items),
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID), errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderCannotEditNonPending):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_ALREADY_PICKING_CANNOT_EDIT", err.Error())
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, order)
}

func mapOrderItems(items []orderItemRequest) []services.OrderItemInput {
	results := make([]services.OrderItemInput, 0, len(items))
	for _, item := range items {
		results = append(results, services.OrderItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		})
	}
	return results
}

func (h *OrderHandler) DeleteOrder(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	if err := h.service.Delete(orderID); err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderCannotDelete):
			c.JSON(http.StatusConflict, gin.H{"error": repositories.ErrOrderCannotDelete.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "order deleted"})
}

// GetOrders lấy danh sách orders, hỗ trợ filter status.
func (h *OrderHandler) GetOrders(c *gin.Context) {
	orders, err := h.service.GetAll(c.Query("status"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// GetStaffTasks tra danh sach cong viec can picking cho staff.
func (h *OrderHandler) GetStaffTasks(c *gin.Context) {
	rows, err := h.service.GetStaffTasks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GetOrderByID lấy chi tiết order kèm picking tasks/progress/shortage.
func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, err := h.service.GetByID(orderID)
	if err != nil {
		respondOrderReadError(c, err)
		return
	}

	c.JSON(http.StatusOK, order)
}

// ScanOrderForPicking quét order_code để sinh tasks (nếu chưa có) và chuyển order sang PICKING.
func (h *OrderHandler) ScanOrderForPicking(c *gin.Context) {
	var req scanOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	order, tasks, err := h.service.ScanForPicking(services.OrderScanInput{
		OrderCode: req.OrderCode,
		UserID:    userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderCodeIsRequired):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": services.ErrOrderCodeIsRequired.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyClosed):
			c.JSON(http.StatusBadRequest, gin.H{"error": "order already completed or cancelled"})
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderHasNoItems.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order scanned successfully",
		"order":   order,
		"tasks":   tasks,
	})
}

// ScanOrderForPickingByQRCode hỗ trợ luồng quét GET /orders/scan/:qr_code cho HT730 keyboard wedge.
func (h *OrderHandler) ScanOrderForPickingByQRCode(c *gin.Context) {
	qrCode := c.Param("qr_code")

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	order, tasks, err := h.service.ScanForPicking(services.OrderScanInput{
		OrderCode: qrCode,
		UserID:    userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderCodeIsRequired):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": services.ErrOrderCodeIsRequired.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyClosed):
			c.JSON(http.StatusBadRequest, gin.H{"error": "order already completed or cancelled"})
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderHasNoItems.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order scanned successfully",
		"order":   order,
		"tasks":   tasks,
	})
}

// VerifyPickingTaskTray verify tray QR cho picking task.
func (h *OrderHandler) VerifyPickingTaskTray(c *gin.Context) {
	taskID, ok := parsePickingTaskID(c)
	if !ok {
		return
	}

	var req verifyTrayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	roleRaw, _ := c.Get("role")
	currentRole, _ := roleRaw.(string)

	task, err := h.service.VerifyTray(services.OrderVerifyTrayInput{
		TaskID:      taskID,
		TrayQRCode:  req.TrayQRCode,
		CurrentRole: currentRole,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderUnauthorizedRole):
			respondOrderDomainError(c, http.StatusForbidden, "UNAUTHORIZED", services.ErrOrderUnauthorizedRole.Error())
		case errors.Is(err, services.ErrOrderInvalidPickingTaskID):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "INVALID_PICKING_TASK_ID", err.Error())
		case errors.Is(err, services.ErrOrderTrayCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "TRAY_QR_REQUIRED", err.Error())
		case errors.Is(err, repositories.ErrConfirmTaskDependencyNotFound), errors.Is(err, repositories.ErrTrayQRNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "TRAY_QR_NOT_FOUND", "tray qr not found")
		case errors.Is(err, repositories.ErrPickingTaskAlreadyDone):
			respondOrderDomainError(c, http.StatusBadRequest, "TASK_DONE", repositories.ErrPickingTaskAlreadyDone.Error())
		case errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_COMPLETED", repositories.ErrOrderAlreadyCompletedCannotPick.Error())
		default:
			var wrongTrayErr repositories.OrderWrongTrayError
			if errors.As(err, &wrongTrayErr) {
				respondOrderDomainError(c, http.StatusBadRequest, "WRONG_TRAY", wrongTrayErr.Error())
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "tray verified",
		"task":    task,
	})
}

// ScanProductForPickingTask scan product QR tung lan (quantity=1) va tru kho atomic.
func (h *OrderHandler) ScanProductForPickingTask(c *gin.Context) {
	taskID, ok := parsePickingTaskID(c)
	if !ok {
		return
	}

	var req scanProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	roleRaw, _ := c.Get("role")
	currentRole, _ := roleRaw.(string)

	task, remaining, err := h.service.ScanProduct(services.OrderScanProductInput{
		TaskID:        taskID,
		TrayQRCode:    req.TrayQRCode,
		ProductQRCode: req.ProductQRCode,
		Note:          req.Note,
		UserID:        userID,
		CurrentRole:   currentRole,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderUnauthorizedRole):
			respondOrderDomainError(c, http.StatusForbidden, "UNAUTHORIZED", services.ErrOrderUnauthorizedRole.Error())
		case errors.Is(err, services.ErrOrderInvalidPickingTaskID):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "INVALID_PICKING_TASK_ID", err.Error())
		case errors.Is(err, services.ErrOrderTrayCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "TRAY_QR_REQUIRED", err.Error())
		case errors.Is(err, services.ErrOrderProductCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "PRODUCT_QR_REQUIRED", err.Error())
		case errors.Is(err, repositories.ErrPickingTaskAlreadyDone):
			respondOrderDomainError(c, http.StatusBadRequest, "TASK_DONE", repositories.ErrPickingTaskAlreadyDone.Error())
		case errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_COMPLETED", repositories.ErrOrderAlreadyCompletedCannotPick.Error())
		case errors.Is(err, repositories.ErrOrderInsufficientStock):
			respondOrderDomainError(c, http.StatusConflict, "INSUFFICIENT_STOCK", repositories.ErrOrderInsufficientStock.Error())
		case errors.Is(err, repositories.ErrProductQRNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "PRODUCT_QR_NOT_FOUND", repositories.ErrProductQRNotFound.Error())
		case errors.Is(err, repositories.ErrTrayQRNotFound), errors.Is(err, repositories.ErrConfirmTaskDependencyNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "TRAY_QR_NOT_FOUND", "tray qr not found")
		case errors.Is(err, repositories.ErrPickingTaskWrongProduct):
			respondOrderDomainError(c, http.StatusBadRequest, "WRONG_PRODUCT", repositories.ErrPickingTaskWrongProduct.Error())
		default:
			var wrongTrayErr repositories.OrderWrongTrayError
			if errors.As(err, &wrongTrayErr) {
				respondOrderDomainError(c, http.StatusBadRequest, "WRONG_TRAY", wrongTrayErr.Error())
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "product scanned successfully",
		"task":               task,
		"remaining_quantity": remaining,
	})
}

// FinishOrder kết thúc order thủ công và trả cảnh báo thiếu hàng nếu có.
func (h *OrderHandler) FinishOrder(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, shortageItems, err := h.service.Finish(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyCompleted):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderAlreadyCompleted.Error()})
		case errors.Is(err, repositories.ErrOrderCancelled):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderCancelled.Error()})
		case errors.Is(err, repositories.ErrOrderNotInPickingStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "order must be in PICKING status before finish"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if len(shortageItems) > 0 {
		items := make([]gin.H, 0, len(shortageItems))
		for _, item := range shortageItems {
			items = append(items, gin.H{
				"picking_task_id": item.PickingTaskID,
				"product_id":      item.ProductID,
				"required_qty":    item.RequiredQty,
				"picked_qty":      item.PickedQty,
				"missing_qty":     item.MissingQty,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "order completed with shortage",
			"order":   order,
			"shortage": gin.H{
				"has_shortage": true,
				"items":        items,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order completed successfully",
		"order":   order,
		"shortage": gin.H{
			"has_shortage": false,
			"items":        []any{},
		},
	})
}

// GetOrderPickingTasks trả danh sách task của order để staff theo dõi.
func (h *OrderHandler) GetOrderPickingTasks(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, tasks, err := h.service.GetPickingTasks(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": order.ID,
		"status":   order.Status,
		"tasks":    tasks,
	})
}

// GetOrderProgress trả done/total/progress (%) cho order hiện tại.
func (h *OrderHandler) GetOrderProgress(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	progress, err := h.service.GetProgress(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":     progress.OrderID,
		"order_status": progress.OrderStatus,
		"done_tasks":   progress.DoneTasks,
		"total_tasks":  progress.TotalTasks,
		"progress":     progress.Progress,
	})
}
