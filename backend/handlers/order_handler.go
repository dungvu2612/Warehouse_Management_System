package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	// Nhóm lỗi nghiệp vụ picking/order để map HTTP status ổn định.
	errOrderAlreadyClosed      = errors.New("order already closed")
	errOrderHasNoItems         = errors.New("order has no items")
	errTaskAlreadyConfirmed    = errors.New("picking task already confirmed")
	errOrderAlreadyCompleted   = errors.New("order already completed, cannot pick")
	errInsufficientStock       = errors.New("insufficient stock")
	errOrderAlreadyCompleted2  = errors.New("order already completed")
	errOrderCancelled          = errors.New("order is cancelled")
	errOrderNotInPickingStatus = errors.New("order is not in picking status")
)

// wrongTrayError dùng để trả message rõ ràng khi worker scan sai tray.
type wrongTrayError struct {
	Expected string
	Got      string
}

func (e wrongTrayError) Error() string {
	return fmt.Sprintf("wrong tray. Expected: %s, Got: %s", e.Expected, e.Got)
}

// quantityExceededError dùng khi nhập số lượng vượt quá phần còn lại cần lấy.
type quantityExceededError struct {
	Max int
}

func (e quantityExceededError) Error() string {
	return fmt.Sprintf("quantity exceeds required amount (max: %d)", e.Max)
}

type createOrderRequest struct {
	BOMID        uint   `json:"bom_id" binding:"required,gt=0"`
	MachineQty   int    `json:"machine_qty" binding:"required,gt=0"`
	CustomerName string `json:"customer_name"`
}

type scanOrderRequest struct {
	OrderCode string `json:"order_code" binding:"required"`
}

type confirmPickingRequest struct {
	TrayCode string `json:"tray_code" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,gt=0"`
	Note     string `json:"note"`
}

// POST /orders
// Tạo order với phần tử linh kiện từ BOM, status khởi tạo là PENDING.
// Ở phần nhỏ này: chỉ tạo order + order_items, chưa sinh picking_tasks.
func CreateOrder(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	userIDValue, _ := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	var createdOrder models.Order
	// Transaction đảm bảo tạo order header + items là atomic.
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		var bom models.BOM
		if err := tx.First(&bom, req.BOMID).Error; err != nil {
			return err
		}

		var bomItems []models.BOMItem
		if err := tx.Where("bom_id = ?", bom.ID).Find(&bomItems).Error; err != nil {
			return err
		}
		if len(bomItems) == 0 {
			return errors.New("bom has no items")
		}

		orderCode := fmt.Sprintf("ORD-%d", time.Now().UnixNano())
		order := models.Order{
			OrderCode:    orderCode,
			CustomerName: req.CustomerName,
			Status:       utils.OrderStatusPending,
			TotalAmount:  0,
			QRCode:       orderCode,
		}
		if createdBy > 0 {
			order.CreatedBy = &createdBy
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		// Nhân số lượng BOM với số lượng máy đặt để ra nhu cầu thực tế của order.
		orderItems := make([]models.OrderItem, 0, len(bomItems))
		for _, item := range bomItems {
			orderItems = append(orderItems, models.OrderItem{
				OrderID:   order.ID,
				ProductID: item.ComponentProductID,
				Quantity:  item.Quantity * req.MachineQty,
				UnitPrice: 0,
			})
		}

		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		if err := tx.Preload("Items").First(&order, order.ID).Error; err != nil {
			return err
		}

		createdOrder = order
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "bom not found",
			})
			return
		}
		if txErr.Error() == "bom has no items" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "bom has no items",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, createdOrder)
}

// GET /orders
// Lấy danh sách order, hỗ trợ filter theo status.
func GetOrders(c *gin.Context) {
	var orders []models.Order

	query := config.DB.Model(&models.Order{}).Order("id DESC")

	if status := strings.ToUpper(strings.TrimSpace(c.Query("status"))); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GET /orders/:id
// Lấy chi tiết order kèm order_items.
func GetOrderByID(c *gin.Context) {
	orderIDRaw := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid order id",
		})
		return
	}

	var order models.Order
	if err := config.DB.Preload("Items").First(&order, uint(orderID)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "order not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, order)
}

// POST /orders/scan
// Giả lập quét QR order: lấy order_code, sinh picking_tasks và chuyển status sang PICKING.
func ScanOrderForPicking(c *gin.Context) {
	var req scanOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	orderCode := strings.TrimSpace(req.OrderCode)
	if orderCode == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "order_code is required",
		})
		return
	}

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	var updatedOrder models.Order
	var tasks []models.PickingTask

	// Transaction để đảm bảo scan order không sinh task trùng khi nhiều request đồng thời.
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Where("order_code = ?", orderCode).First(&order).Error; err != nil {
			return err
		}

		if order.Status == utils.OrderStatusCompleted || order.Status == utils.OrderStatusCancelled {
			return errOrderAlreadyClosed
		}

		// Nếu order đã PICKING và đã có task rồi thì không tạo lại.
		var existingTaskCount int64
		if err := tx.Model(&models.PickingTask{}).Where("order_id = ?", order.ID).Count(&existingTaskCount).Error; err != nil {
			return err
		}

		if existingTaskCount == 0 {
			var orderItems []models.OrderItem
			if err := tx.Where("order_id = ?", order.ID).Find(&orderItems).Error; err != nil {
				return err
			}
			if len(orderItems) == 0 {
				return errOrderHasNoItems
			}

			// Mỗi order_item tương ứng 1 picking task để staff pick theo từng linh kiện.
			tasks = make([]models.PickingTask, 0, len(orderItems))
			for _, item := range orderItems {
				var tray models.Tray
				if err := tx.Where("product_id = ? AND is_active = ?", item.ProductID, true).First(&tray).Error; err != nil {
					return err
				}

				tasks = append(tasks, models.PickingTask{
					OrderID:          order.ID,
					ProductID:        item.ProductID,
					TrayID:           tray.ID,
					RequiredQuantity: item.Quantity,
					PickedQuantity:   0,
					Verified:         false,
					Status:           utils.PickingStatusWaiting,
					AssignedTo:       &userID,
				})
			}

			if err := tx.Create(&tasks).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
				return err
			}
		}

		order.Status = utils.OrderStatusPicking
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		updatedOrder = order
		if existingTaskCount == 0 {
			// tasks đã được tạo mới ở nhánh trên, giữ nguyên slice
			return nil
		}

		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "order not found",
			})
			return
		}

		if errors.Is(txErr, errOrderAlreadyClosed) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order already completed or cancelled",
			})
			return
		}

		if errors.Is(txErr, errOrderHasNoItems) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order has no items",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	// Nếu quét lại order đã có task, load lại để response luôn đầy đủ.
	if len(tasks) == 0 {
		_ = config.DB.Where("order_id = ?", updatedOrder.ID).Order("id ASC").Find(&tasks).Error
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order scanned successfully",
		"order":   updatedOrder,
		"tasks":   tasks,
	})
}

// PATCH /picking-tasks/:id/confirm
// Staff nhập số lượng đã lấy sau khi scan đúng vị trí.
func ConfirmPickingTask(c *gin.Context) {
	taskIDRaw := c.Param("id")
	taskID, err := strconv.ParseUint(taskIDRaw, 10, 64)
	if err != nil || taskID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid picking task id",
		})
		return
	}

	var req confirmPickingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	req.TrayCode = strings.TrimSpace(req.TrayCode)
	req.Note = strings.TrimSpace(req.Note)
	if req.TrayCode == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "tray_code is required",
		})
		return
	}

	userIDValue, _ := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	var responseTask models.PickingTask
	// Transaction xuất kho: lock task + lock inventory + ghi log theo 1 đơn vị commit.
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		var task models.PickingTask
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&task, uint(taskID)).Error; err != nil {
			return err
		}

		if task.Status == utils.PickingStatusDone {
			return errTaskAlreadyConfirmed
		}

		var order models.Order
		if err := tx.Where("id = ?", task.OrderID).First(&order).Error; err != nil {
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return errOrderAlreadyCompleted
		}

		var tray models.Tray
		if err := tx.Where("id = ? AND is_active = ?", task.TrayID, true).First(&tray).Error; err != nil {
			return err
		}
		if !strings.EqualFold(tray.TrayCode, req.TrayCode) {
			return wrongTrayError{Expected: tray.TrayCode, Got: req.TrayCode}
		}

		remainingRequired := task.RequiredQuantity - task.PickedQuantity
		if remainingRequired <= 0 {
			return errTaskAlreadyConfirmed
		}
		if req.Quantity > remainingRequired {
			return quantityExceededError{Max: remainingRequired}
		}

		var inventory models.Inventory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("product_id = ? AND tray_id = ?", task.ProductID, task.TrayID).
			First(&inventory).Error; err != nil {
			return err
		}

		// Không cho xuất vượt tồn kho thực tế.
		if req.Quantity > inventory.Quantity {
			return errInsufficientStock
		}

		beforeQty := inventory.Quantity
		afterQty := inventory.Quantity - req.Quantity

		inventory.Quantity = afterQty
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		task.PickedQuantity = task.PickedQuantity + req.Quantity
		task.Verified = true
		if task.PickedQuantity >= task.RequiredQuantity {
			task.Status = utils.PickingStatusDone
		} else {
			// Chưa lấy đủ số lượng yêu cầu thì giữ trạng thái PICKING.
			task.Status = utils.PickingStatusPicking
		}
		if err := tx.Save(&task).Error; err != nil {
			return err
		}

		trayID := task.TrayID
		pickedBy := userID
		pickLog := models.PickLog{
			PickingTaskID:  &task.ID,
			OrderID:        &task.OrderID,
			ProductID:      &task.ProductID,
			TrayID:         &trayID,
			PickedQuantity: req.Quantity,
			PickedBy:       &pickedBy,
			Note:           req.Note,
		}
		if err := tx.Create(&pickLog).Error; err != nil {
			return err
		}

		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeExport,
			ProductID:       task.ProductID,
			TrayID:          &trayID,
			Quantity:        req.Quantity,
			BeforeQuantity:  beforeQty,
			AfterQuantity:   afterQty,
			ReferenceCode:   order.OrderCode,
			Note:            req.Note,
		}
		if userID > 0 {
			stockTx.CreatedBy = &userID
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		// Nếu tất cả task đã done thì hoàn tất order tự động.
		var remaining int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ?", task.OrderID, utils.PickingStatusDone).
			Count(&remaining).Error; err != nil {
			return err
		}
		if remaining == 0 {
			if err := tx.Model(&order).Update("status", utils.OrderStatusCompleted).Error; err != nil {
				return err
			}
			order.Status = utils.OrderStatusCompleted
		}

		responseTask = task
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "picking task or inventory not found",
			})
			return
		}
		if errors.Is(txErr, errTaskAlreadyConfirmed) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "picking task already confirmed",
			})
			return
		}
		if errors.Is(txErr, errOrderAlreadyCompleted) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order already completed, cannot pick",
			})
			return
		}
		var wrongTrayErr wrongTrayError
		if errors.As(txErr, &wrongTrayErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": wrongTrayErr.Error(),
			})
			return
		}
		var qtyErr quantityExceededError
		if errors.As(txErr, &qtyErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": qtyErr.Error(),
			})
			return
		}
		if errors.Is(txErr, errInsufficientStock) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "insufficient stock",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "picking task confirmed successfully",
		"task":               responseTask,
		"remaining_quantity": responseTask.RequiredQuantity - responseTask.PickedQuantity,
	})
}

// POST /orders/:id/finish
// Kết thúc order thủ công. Nếu còn task chưa đủ số lượng thì trả cảnh báo thiếu.
func FinishOrder(c *gin.Context) {
	orderIDRaw := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid order id",
		})
		return
	}

	var shortageItems []gin.H
	var updatedOrder models.Order

	// Finish thủ công: cho phép chốt đơn dù thiếu, nhưng trả cảnh báo shortage rõ ràng.
	txErr := config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, uint(orderID)).Error; err != nil {
			return err
		}

		if order.Status == utils.OrderStatusCompleted {
			return errOrderAlreadyCompleted2
		}
		if order.Status == utils.OrderStatusCancelled {
			return errOrderCancelled
		}
		// Chỉ cho phép finish ở trạng thái PICKING để tránh đóng nhầm order vừa tạo.
		if order.Status != utils.OrderStatusPicking {
			return errOrderNotInPickingStatus
		}

		var tasks []models.PickingTask
		if err := tx.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
			return err
		}

		for _, task := range tasks {
			if task.PickedQuantity < task.RequiredQuantity {
				shortageItems = append(shortageItems, gin.H{
					"picking_task_id": task.ID,
					"product_id":      task.ProductID,
					"required_qty":    task.RequiredQuantity,
					"picked_qty":      task.PickedQuantity,
					"missing_qty":     task.RequiredQuantity - task.PickedQuantity,
				})
			}
		}

		order.Status = utils.OrderStatusCompleted
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		updatedOrder = order
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "order not found",
			})
			return
		}
		if errors.Is(txErr, errOrderAlreadyCompleted2) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order already completed",
			})
			return
		}
		if errors.Is(txErr, errOrderCancelled) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order is cancelled",
			})
			return
		}
		if errors.Is(txErr, errOrderNotInPickingStatus) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "order must be in PICKING status before finish",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": txErr.Error(),
		})
		return
	}

	if len(shortageItems) > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "order completed with shortage",
			"order":   updatedOrder,
			"shortage": gin.H{
				"has_shortage": true,
				"items":        shortageItems,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "order completed successfully",
		"order":   updatedOrder,
		"shortage": gin.H{
			"has_shortage": false,
			"items":        []any{},
		},
	})
}

// GET /orders/:id/picking-tasks
// Lấy toàn bộ picking tasks của order để staff theo dõi.
func GetOrderPickingTasks(c *gin.Context) {
	orderIDRaw := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid order id",
		})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, uint(orderID)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "order not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var tasks []models.PickingTask
	if err := config.DB.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": order.ID,
		"status":   order.Status,
		"tasks":    tasks,
	})
}

// GET /orders/:id/progress
// Trả tiến độ picking của order: done/total + phần trăm.
func GetOrderProgress(c *gin.Context) {
	orderIDRaw := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDRaw, 10, 64)
	if err != nil || orderID == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "invalid order id",
		})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, uint(orderID)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "order not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var total int64
	if err := config.DB.Model(&models.PickingTask{}).Where("order_id = ?", order.ID).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var done int64
	if err := config.DB.Model(&models.PickingTask{}).
		Where("order_id = ? AND status = ?", order.ID, utils.PickingStatusDone).
		Count(&done).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	percent := 0.0
	if total > 0 {
		percent = (float64(done) / float64(total)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":     order.ID,
		"order_status": order.Status,
		"done_tasks":   done,
		"total_tasks":  total,
		"progress":     percent,
	})
}
