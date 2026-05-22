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
	BOMID        uint   `json:"bom_id" binding:"required,gt=0"`
	MachineQty   int    `json:"machine_qty" binding:"required,gt=0"`
	CustomerName string `json:"customer_name"`
}

// scanOrderRequest là DTO request quét order_code.
type scanOrderRequest struct {
	OrderCode string `json:"order_code" binding:"required"`
}

// confirmPickingRequest là DTO request xác nhận picking task.
type confirmPickingRequest struct {
	TrayCode string `json:"tray_code" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,gt=0"`
	Note     string `json:"note"`
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
		BOMID:        req.BOMID,
		MachineQty:   req.MachineQty,
		CustomerName: req.CustomerName,
		CreatedBy:    createdBy,
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

// GetOrders lấy danh sách orders, hỗ trợ filter status.
func (h *OrderHandler) GetOrders(c *gin.Context) {
	orders, err := h.service.GetAll(c.Query("status"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// GetOrderByID lấy chi tiết order kèm items.
func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, err := h.service.GetByID(orderID)
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

// ConfirmPickingTask xác nhận số lượng đã pick cho 1 task cụ thể.
func (h *OrderHandler) ConfirmPickingTask(c *gin.Context) {
	taskID, ok := parsePickingTaskID(c)
	if !ok {
		return
	}

	var req confirmPickingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	task, remaining, err := h.service.ConfirmPicking(services.OrderConfirmPickingInput{
		TaskID:   taskID,
		TrayCode: req.TrayCode,
		Quantity: req.Quantity,
		Note:     req.Note,
		UserID:   userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidPickingTaskID):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrOrderTrayCodeRequired):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		case errors.Is(err, repositories.ErrConfirmTaskDependencyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": repositories.ErrConfirmTaskDependencyNotFound.Error()})
		case errors.Is(err, repositories.ErrPickingTaskAlreadyConfirmed):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrPickingTaskAlreadyConfirmed.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
			c.JSON(http.StatusBadRequest, gin.H{"error": repositories.ErrOrderAlreadyCompletedCannotPick.Error()})
		case errors.Is(err, repositories.ErrOrderInsufficientStock):
			c.JSON(http.StatusConflict, gin.H{"error": repositories.ErrOrderInsufficientStock.Error()})
		default:
			var wrongTrayErr repositories.OrderWrongTrayError
			if errors.As(err, &wrongTrayErr) {
				c.JSON(http.StatusBadRequest, gin.H{"error": wrongTrayErr.Error()})
				return
			}
			var qtyErr repositories.OrderQuantityExceededError
			if errors.As(err, &qtyErr) {
				c.JSON(http.StatusBadRequest, gin.H{"error": qtyErr.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "picking task confirmed successfully",
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
