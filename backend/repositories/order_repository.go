package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'order'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewOrderRepository
- CreateFromBOM
- FindAll
- FindByIDWithItems
- ScanForPicking
- ConfirmPickingTask
- FinishOrder
- FindPickingTasksByOrderID
- GetOrderProgress

Luu y khi sua:
- Day la file transaction trong tam cua he thong (create/scan/confirm/finish).
- Khong bo lock row trong cac buoc tru ton va cap nhat task/order de tranh race condition.
*/

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// OrderProgressSummary biểu diễn tiến độ picking của 1 order.
type OrderProgressSummary struct {
	OrderID     uint
	OrderStatus string
	DoneTasks   int64
	TotalTasks  int64
	Progress    float64
}

// OrderDetailTaskRow la read-model phuc vu man chi tiet order/picking.
type OrderDetailTaskRow struct {
	PickingTaskID    uint
	OrderID          uint
	ProductID        uint
	ProductCode      string
	ProductName      string
	TrayID           uint
	TrayCode         string
	LocationCode     string
	RequiredQuantity int
	PickedQuantity   int
	InventoryQty     int
	Status           string
	Verified         bool
	AssignedTo       *uint
	AssignedAt       *time.Time
	StartedAt        *time.Time
	CompletedAt      *time.Time
	AssigneeName     string
	AssigneeUsername string
}

// OrderShortageItem biểu diễn 1 dòng thiếu hàng khi finish thủ công.
type OrderShortageItem struct {
	PickingTaskID uint
	ProductID     uint
	RequiredQty   int
	PickedQty     int
	MissingQty    int
}

// OrderShortagePreviewItem bieu dien linh kien thieu truoc khi tao don.
type OrderShortagePreviewItem struct {
	ProductID    uint
	ProductCode  string
	ProductName  string
	RequiredQty  int
	AvailableQty int
	MissingQty   int
}

// StaffTaskRow la read-model danh sach cong viec staff can xu ly.
type StaffTaskRow struct {
	ID               uint
	OrderCode        string
	CustomerName     string
	CustomerPhone    string
	CustomerAddress  string
	Status           string
	TotalItems       int
	PickedItems      int
	AssignedTo       *uint
	AssigneeName     string
	AssigneeUsername string
	CreatedAt        time.Time
}

// StaffTaskSummaryRow la so lieu badge task tren sidebar.
type StaffTaskSummaryRow struct {
	WaitingCount           int64
	PickingCount           int64
	MyPickingCount         int64
	PickingWaitingCount    int64
	PickingInProgressCount int64
	ImportWaitingCount     int64
	ImportInProgressCount  int64
}

type OrderItemUpsertInput struct {
	ProductID uint
	Quantity  int
	UnitPrice float64
}

// OrderRepository định nghĩa lớp data-access cho module order/picking.
type OrderRepository interface {
	CreateFromBOM(bomID uint, machineQty int, customerName string, customerPhone string, customerAddress string, createdBy uint) (*models.Order, error)
	CreateOrderWithItems(customerName string, customerPhone string, customerAddress string, items []OrderItemUpsertInput, createdBy uint) (*models.Order, error)
	FindAll(status *string) ([]models.Order, error)
	FindStaffTaskRows(userID uint, role string) ([]StaffTaskRow, error)
	GetStaffTaskSummary(userID uint, role string) (*StaffTaskSummaryRow, error)
	ClaimOrderForPicking(orderID uint, userID uint) (*models.Order, error)
	AssignOrderToStaff(orderID uint, staffID uint) (*models.Order, error)
	UnassignOrder(orderID uint) (*models.Order, error)
	FindByIDWithItems(orderID uint) (*models.Order, error)
	FindOrderDetailRows(orderID uint) (*models.Order, []OrderDetailTaskRow, error)
	ScanForPicking(orderCode string, userID uint) (*models.Order, []models.PickingTask, error)
	VerifyTrayForTask(taskID uint, trayQRCode string, userID uint) (*models.PickingTask, error)
	ScanProductForTask(taskID uint, trayQRCode string, productQRCode string, note string, userID uint) (*models.PickingTask, error)
	FinishOrder(orderID uint) (*models.Order, []OrderShortageItem, error)
	FindPickingTasksByOrderID(orderID uint) (*models.Order, []models.PickingTask, error)
	GetOrderProgress(orderID uint) (*OrderProgressSummary, error)
	UpdateOrderCustomer(orderID uint, customerName string, customerPhone string, customerAddress string) (*models.Order, error)
	UpdateOrderWithItems(orderID uint, customerName string, customerPhone string, customerAddress string, items []OrderItemUpsertInput) (*models.Order, error)
	DeleteOrder(orderID uint) error
	PreviewOrderShortage(items []OrderItemUpsertInput) ([]OrderShortagePreviewItem, error)
}

// Nhóm lỗi domain module order ở tầng repository.
var (
	ErrOrderEntityNotFound             = errors.New("order not found")
	ErrOrderBOMNotFound                = errors.New("bom not found")
	ErrOrderBOMHasNoItems              = errors.New("bom has no items")
	ErrOrderAlreadyClosed              = errors.New("order already closed")
	ErrOrderHasNoItems                 = errors.New("order has no items")
	ErrPickingTaskAlreadyDone          = errors.New("picking task already done")
	ErrOrderAlreadyCompletedCannotPick = errors.New("order already completed, cannot pick")
	ErrOrderInsufficientStock          = errors.New("insufficient stock")
	ErrOrderAlreadyCompleted           = errors.New("order already completed")
	ErrOrderCancelled                  = errors.New("order is cancelled")
	ErrOrderNotInPickingStatus         = errors.New("order is not in picking status")
	ErrConfirmTaskDependencyNotFound   = errors.New("picking task or inventory not found")
	ErrProductQRNotFound               = errors.New("product qr not found")
	ErrTrayQRNotFound                  = errors.New("tray qr not found")
	ErrPickingTaskWrongProduct         = errors.New("wrong product for picking task")
	ErrOrderCannotDelete               = errors.New("order cannot be deleted in current status")
	ErrOrderCannotEditNonPending       = errors.New("order is not pending, cannot edit")
	ErrOrderHasPickingLogs             = errors.New("order already has pick logs, cannot edit")
	ErrPickingTaskAlreadyAssigned      = errors.New("picking task already assigned")
	ErrPickingTaskNotClaimed           = errors.New("picking task not claimed")
	ErrPickingTaskNotAssignedToYou     = errors.New("picking task not assigned to current user")
	ErrCannotUnassignAfterPicking      = errors.New("cannot unassign after picking started")
	ErrCannotReassignAfterPicking      = errors.New("cannot reassign after picking started")
	ErrStaffNotFound                   = errors.New("staff not found")
	ErrInvalidStaffRole                = errors.New("invalid staff role")
)

// OrderWrongTrayError dùng để trả message rõ ràng khi scan sai khay.
type OrderWrongTrayError struct {
	Expected string
	Got      string
}

func (e OrderWrongTrayError) Error() string {
	return fmt.Sprintf("wrong tray. Expected: %s, Got: %s", e.Expected, e.Got)
}

type orderRepository struct {
	db *gorm.DB
}

// NewOrderRepository khởi tạo repository cho module order.
func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

// CreateFromBOM tạo order header + order items dựa trên BOM trong cùng transaction.
func (r *orderRepository) CreateFromBOM(bomID uint, machineQty int, customerName string, customerPhone string, customerAddress string, createdBy uint) (*models.Order, error) {
	var createdOrder models.Order

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1) Đọc BOM header.
		var bom models.BOM
		if err := tx.First(&bom, bomID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderBOMNotFound
			}
			return err
		}

		// 2) Đọc BOM items để tính nhu cầu thực tế.
		var bomItems []models.BOMItem
		if err := tx.Where("bom_id = ?", bom.ID).Find(&bomItems).Error; err != nil {
			return err
		}
		if len(bomItems) == 0 {
			return ErrOrderBOMHasNoItems
		}

		// 3) Tạo order header với trạng thái PENDING.
		orderCode, err := r.generateOrderCode(tx, time.Now())
		if err != nil {
			return err
		}
		order := models.Order{
			OrderCode:       orderCode,
			CustomerName:    customerName,
			CustomerPhone:   customerPhone,
			CustomerAddress: customerAddress,
			Status:          utils.OrderStatusPending,
			TotalAmount:     0,
			QRCode:          orderCode,
		}
		if createdBy > 0 {
			order.CreatedBy = &createdBy
		}
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		// 4) Sinh order_items = BOM quantity * machineQty.
		orderItems := make([]models.OrderItem, 0, len(bomItems))
		for _, item := range bomItems {
			orderItems = append(orderItems, models.OrderItem{
				OrderID:   order.ID,
				ProductID: item.ComponentProductID,
				Quantity:  item.Quantity * machineQty,
				UnitPrice: 0,
			})
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		// 5) Load lại order kèm items để trả response.
		if err := tx.Preload("Items").First(&order, order.ID).Error; err != nil {
			return err
		}

		createdOrder = order
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &createdOrder, nil
}

func (r *orderRepository) CreateOrderWithItems(customerName string, customerPhone string, customerAddress string, items []OrderItemUpsertInput, createdBy uint) (*models.Order, error) {
	var created models.Order

	err := r.db.Transaction(func(tx *gorm.DB) error {
		orderCode, err := r.generateOrderCode(tx, time.Now())
		if err != nil {
			return err
		}
		order := models.Order{
			OrderCode:       orderCode,
			CustomerName:    customerName,
			CustomerPhone:   customerPhone,
			CustomerAddress: customerAddress,
			Status:          utils.OrderStatusPending,
			TotalAmount:     0,
			QRCode:          orderCode,
		}
		if createdBy > 0 {
			order.CreatedBy = &createdBy
		}
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		totalAmount := 0.0
		orderItems := make([]models.OrderItem, 0, len(items))
		for _, item := range items {
			totalAmount += float64(item.Quantity) * item.UnitPrice
			orderItems = append(orderItems, models.OrderItem{
				OrderID:   order.ID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				UnitPrice: item.UnitPrice,
			})
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		pickingTasks, err := r.buildPickingTasksFromOrderItems(tx, order.ID, items)
		if err != nil {
			return err
		}
		if len(pickingTasks) == 0 {
			return ErrOrderHasNoItems
		}
		if err := tx.Create(&pickingTasks).Error; err != nil {
			return err
		}

		order.TotalAmount = totalAmount
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		if err := tx.Preload("Items").First(&order, order.ID).Error; err != nil {
			return err
		}
		created = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *orderRepository) PreviewOrderShortage(items []OrderItemUpsertInput) ([]OrderShortagePreviewItem, error) {
	type requiredProductSummary struct {
		RequiredQty int
	}

	returnItems := make([]OrderShortagePreviewItem, 0)
	requiredByProduct := make(map[uint]*requiredProductSummary)

	err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			var product models.Product
			if err := tx.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrOrderEntityNotFound
				}
				return err
			}

			if strings.EqualFold(product.ProductType, "FINISHED_GOOD") {
				var bom models.BOM
				if err := tx.Where("product_id = ?", product.ID).First(&bom).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return ErrOrderBOMNotFound
					}
					return err
				}

				var bomItems []models.BOMItem
				if err := tx.Where("bom_id = ?", bom.ID).Find(&bomItems).Error; err != nil {
					return err
				}
				if len(bomItems) == 0 {
					return ErrOrderBOMHasNoItems
				}

				for _, bomItem := range bomItems {
					requiredQty := bomItem.Quantity * item.Quantity
					if requiredQty <= 0 {
						continue
					}
					if _, exists := requiredByProduct[bomItem.ComponentProductID]; !exists {
						requiredByProduct[bomItem.ComponentProductID] = &requiredProductSummary{}
					}
					requiredByProduct[bomItem.ComponentProductID].RequiredQty += requiredQty
				}
				continue
			}

			if _, exists := requiredByProduct[item.ProductID]; !exists {
				requiredByProduct[item.ProductID] = &requiredProductSummary{}
			}
			requiredByProduct[item.ProductID].RequiredQty += item.Quantity
		}

		for productID, summary := range requiredByProduct {
			var product models.Product
			if err := tx.Where("id = ? AND is_active = ?", productID, true).First(&product).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrOrderEntityNotFound
				}
				return err
			}

			var inventoryTotal struct {
				TotalQty int
			}
			if err := tx.Table("inventory").
				Select("COALESCE(SUM(quantity), 0) AS total_qty").
				Where("product_id = ?", productID).
				Scan(&inventoryTotal).Error; err != nil {
				return err
			}

			if inventoryTotal.TotalQty >= summary.RequiredQty {
				continue
			}

			returnItems = append(returnItems, OrderShortagePreviewItem{
				ProductID:    productID,
				ProductCode:  product.ProductCode,
				ProductName:  product.ProductName,
				RequiredQty:  summary.RequiredQty,
				AvailableQty: inventoryTotal.TotalQty,
				MissingQty:   summary.RequiredQty - inventoryTotal.TotalQty,
			})
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return returnItems, nil
}

func (r *orderRepository) generateOrderCode(tx *gorm.DB, now time.Time) (string, error) {
	datePart := now.Format("060102")
	prefix := fmt.Sprintf("ORD-%s-", datePart)
	pattern := prefix + "%"

	var maxSeq int
	if err := tx.Raw(`
		SELECT COALESCE(
			MAX(
				CASE
					WHEN split_part(order_code, '-', 3) ~ '^[0-9]+$'
						THEN CAST(split_part(order_code, '-', 3) AS INTEGER)
					ELSE 0
				END
			),
			0
		) AS max_seq
		FROM orders
		WHERE order_code LIKE ?
	`, pattern).Scan(&maxSeq).Error; err != nil {
		return "", err
	}

	nextSeq := maxSeq + 1
	return fmt.Sprintf("%s%03d", prefix, nextSeq), nil
}

// FindAll lấy danh sách orders, hỗ trợ filter status.
func (r *orderRepository) FindAll(status *string) ([]models.Order, error) {
	var orders []models.Order
	query := r.db.Model(&models.Order{}).Order("id DESC")

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	if err := query.Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

// FindStaffTaskRows lay danh sach order dang cho nhan hoac dang duoc user hien tai xu ly.
func (r *orderRepository) FindStaffTaskRows(userID uint, role string) ([]StaffTaskRow, error) {
	rows := make([]StaffTaskRow, 0)
	baseSQL := `
		SELECT
			o.id,
			o.order_code,
			COALESCE(o.customer_name, '') AS customer_name,
			COALESCE(o.customer_phone, '') AS customer_phone,
			COALESCE(o.customer_address, '') AS customer_address,
			CASE
				WHEN SUM(CASE WHEN pt.assigned_to IS NOT NULL AND pt.status <> ? THEN 1 ELSE 0 END) > 0 THEN ?
				ELSE ?
			END AS status,
			o.created_at,
			COALESCE(SUM(pt.required_quantity), 0) AS total_items,
			COALESCE(SUM(pt.picked_quantity), 0) AS picked_items,
			MIN(pt.assigned_to) AS assigned_to,
			COALESCE(MAX(u.full_name), '') AS assignee_name,
			COALESCE(MAX(u.username), '') AS assignee_username
		FROM orders o
		INNER JOIN picking_tasks pt ON pt.order_id = o.id
		LEFT JOIN users u ON u.id = pt.assigned_to
		WHERE o.status NOT IN (?, ?)
			AND pt.status <> ?
	`
	args := []any{
		utils.PickingStatusDone,
		utils.PickingStatusPicking,
		utils.PickingStatusWaiting,
		utils.OrderStatusCompleted,
		utils.OrderStatusCancelled,
		utils.PickingStatusDone,
	}

	if strings.ToUpper(strings.TrimSpace(role)) != "ADMIN" {
		baseSQL += `
			AND (
				(pt.status = ? AND pt.assigned_to IS NULL)
				OR pt.assigned_to = ?
			)
		`
		args = append(args, utils.PickingStatusWaiting, userID)
	}

	baseSQL += `
		GROUP BY o.id, o.order_code, o.customer_name, o.customer_phone, o.customer_address, o.created_at
		ORDER BY
			CASE
				WHEN SUM(CASE WHEN pt.assigned_to IS NULL AND pt.status = ? THEN 1 ELSE 0 END) > 0 THEN 0
				ELSE 1
			END ASC,
			o.created_at DESC
	`
	args = append(args, utils.PickingStatusWaiting)

	err := r.db.Raw(baseSQL, args...).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *orderRepository) GetStaffTaskSummary(userID uint, role string) (*StaffTaskSummaryRow, error) {
	var summary StaffTaskSummaryRow

	if err := r.db.Raw(`
		SELECT COUNT(DISTINCT pt.order_id) AS waiting_count
		FROM picking_tasks pt
		INNER JOIN orders o ON o.id = pt.order_id
		WHERE pt.status = ?
			AND pt.assigned_to IS NULL
			AND o.status NOT IN (?, ?)
	`, utils.PickingStatusWaiting, utils.OrderStatusCompleted, utils.OrderStatusCancelled).Scan(&summary.WaitingCount).Error; err != nil {
		return nil, err
	}

	if err := r.db.Raw(`
		SELECT COUNT(DISTINCT pt.order_id) AS picking_count
		FROM picking_tasks pt
		INNER JOIN orders o ON o.id = pt.order_id
		WHERE pt.status = ?
			AND pt.assigned_to IS NOT NULL
			AND o.status NOT IN (?, ?)
	`, utils.PickingStatusPicking, utils.OrderStatusCompleted, utils.OrderStatusCancelled).Scan(&summary.PickingCount).Error; err != nil {
		return nil, err
	}

	if userID > 0 {
		if err := r.db.Raw(`
			SELECT COUNT(DISTINCT pt.order_id) AS my_picking_count
			FROM picking_tasks pt
			INNER JOIN orders o ON o.id = pt.order_id
			WHERE pt.status = ?
				AND pt.assigned_to = ?
				AND o.status NOT IN (?, ?)
		`, utils.PickingStatusPicking, userID, utils.OrderStatusCompleted, utils.OrderStatusCancelled).Scan(&summary.MyPickingCount).Error; err != nil {
			return nil, err
		}
	}

	if strings.ToUpper(strings.TrimSpace(role)) == "ADMIN" {
		summary.MyPickingCount = 0
		summary.PickingInProgressCount = summary.PickingCount
	} else {
		summary.PickingInProgressCount = summary.MyPickingCount
	}
	summary.PickingWaitingCount = summary.WaitingCount

	if err := r.db.Raw(`
		SELECT COUNT(*) AS import_waiting_count
		FROM import_receipt_items
		WHERE (status IS NULL OR status <> 'DONE')
			AND assigned_to IS NULL
	`).Scan(&summary.ImportWaitingCount).Error; err != nil {
		return nil, err
	}

	importProgressSQL := `
		SELECT COUNT(*) AS import_in_progress_count
		FROM import_receipt_items
		WHERE (status IS NULL OR status <> 'DONE')
			AND assigned_to IS NOT NULL
	`
	importProgressArgs := []interface{}{}
	if strings.ToUpper(strings.TrimSpace(role)) != "ADMIN" {
		importProgressSQL += " AND assigned_to = ?"
		importProgressArgs = append(importProgressArgs, userID)
	}
	if err := r.db.Raw(importProgressSQL, importProgressArgs...).Scan(&summary.ImportInProgressCount).Error; err != nil {
		return nil, err
	}

	summary.WaitingCount = summary.PickingWaitingCount + summary.ImportWaitingCount
	if strings.ToUpper(strings.TrimSpace(role)) == "ADMIN" {
		summary.PickingCount = summary.PickingInProgressCount + summary.ImportInProgressCount
	} else {
		summary.PickingCount = summary.MyPickingCount
	}

	return &summary, nil
}

func (r *orderRepository) ensurePickingTasksForOrderTx(tx *gorm.DB, orderID uint) error {
	var existingTaskCount int64
	if err := tx.Model(&models.PickingTask{}).Where("order_id = ?", orderID).Count(&existingTaskCount).Error; err != nil {
		return err
	}
	if existingTaskCount > 0 {
		return nil
	}

	var orderItems []models.OrderItem
	if err := tx.Where("order_id = ?", orderID).Find(&orderItems).Error; err != nil {
		return err
	}
	if len(orderItems) == 0 {
		return ErrOrderHasNoItems
	}

	inputs := make([]OrderItemUpsertInput, 0, len(orderItems))
	for _, item := range orderItems {
		inputs = append(inputs, OrderItemUpsertInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		})
	}

	tasks, err := r.buildPickingTasksFromOrderItems(tx, orderID, inputs)
	if err != nil {
		return err
	}
	if len(tasks) == 0 {
		return ErrOrderHasNoItems
	}
	return tx.Create(&tasks).Error
}

func (r *orderRepository) orderHasPickingDataTx(tx *gorm.DB, orderID uint) (bool, error) {
	var pickedQty int64
	if err := tx.Model(&models.PickingTask{}).
		Where("order_id = ? AND picked_quantity > 0", orderID).
		Count(&pickedQty).Error; err != nil {
		return false, err
	}
	if pickedQty > 0 {
		return true, nil
	}

	var pickLogCount int64
	if err := tx.Model(&models.PickLog{}).Where("order_id = ?", orderID).Count(&pickLogCount).Error; err != nil {
		return false, err
	}
	return pickLogCount > 0, nil
}

func (r *orderRepository) ClaimOrderForPicking(orderID uint, userID uint) (*models.Order, error) {
	var updated models.Order
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompleted
		}
		if order.Status == utils.OrderStatusCancelled {
			return ErrOrderCancelled
		}
		if err := r.ensurePickingTasksForOrderTx(tx, order.ID); err != nil {
			return err
		}

		var assignedToOther int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ? AND assigned_to IS NOT NULL AND assigned_to <> ?", order.ID, utils.PickingStatusDone, userID).
			Count(&assignedToOther).Error; err != nil {
			return err
		}
		if assignedToOther > 0 {
			return ErrPickingTaskAlreadyAssigned
		}

		var activeTasks int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ?", order.ID, utils.PickingStatusDone).
			Count(&activeTasks).Error; err != nil {
			return err
		}
		if activeTasks == 0 {
			return ErrPickingTaskAlreadyDone
		}

		now := time.Now()
		result := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status = ? AND assigned_to IS NULL", order.ID, utils.PickingStatusWaiting).
			Updates(map[string]any{
				"status":      utils.PickingStatusPicking,
				"assigned_to": userID,
				"assigned_at": now,
				"started_at":  gorm.Expr("COALESCE(started_at, ?)", now),
				"updated_at":  now,
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			var assignedToMe int64
			if err := tx.Model(&models.PickingTask{}).
				Where("order_id = ? AND status <> ? AND assigned_to = ?", order.ID, utils.PickingStatusDone, userID).
				Count(&assignedToMe).Error; err != nil {
				return err
			}
			if assignedToMe == 0 {
				return ErrPickingTaskAlreadyAssigned
			}
		}

		order.Status = utils.OrderStatusPicking
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		updated = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *orderRepository) AssignOrderToStaff(orderID uint, staffID uint) (*models.Order, error) {
	var updated models.Order
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var staff models.User
		if err := tx.Where("id = ? AND is_active = ?", staffID, true).First(&staff).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrStaffNotFound
			}
			return err
		}
		if !strings.EqualFold(staff.Role, "STAFF") {
			return ErrInvalidStaffRole
		}

		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompleted
		}
		if order.Status == utils.OrderStatusCancelled {
			return ErrOrderCancelled
		}
		if err := r.ensurePickingTasksForOrderTx(tx, order.ID); err != nil {
			return err
		}

		now := time.Now()
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ?", order.ID, utils.PickingStatusDone).
			Updates(map[string]any{
				"status":       utils.PickingStatusPicking,
				"assigned_to":  staffID,
				"assigned_at":  now,
				"started_at":   gorm.Expr("COALESCE(started_at, ?)", now),
				"completed_at": nil,
				"updated_at":   now,
			}).Error; err != nil {
			return err
		}

		order.Status = utils.OrderStatusPicking
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		updated = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *orderRepository) UnassignOrder(orderID uint) (*models.Order, error) {
	var updated models.Order
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompleted
		}
		if order.Status == utils.OrderStatusCancelled {
			return ErrOrderCancelled
		}

		hasPickingData, err := r.orderHasPickingDataTx(tx, order.ID)
		if err != nil {
			return err
		}
		if hasPickingData {
			return ErrCannotUnassignAfterPicking
		}

		now := time.Now()
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ?", order.ID, utils.PickingStatusDone).
			Updates(map[string]any{
				"status":       utils.PickingStatusWaiting,
				"assigned_to":  nil,
				"assigned_at":  nil,
				"started_at":   nil,
				"completed_at": nil,
				"verified":     false,
				"updated_at":   now,
			}).Error; err != nil {
			return err
		}

		order.Status = utils.OrderStatusPending
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		updated = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

// FindByIDWithItems lấy chi tiết order kèm order_items.
func (r *orderRepository) FindByIDWithItems(orderID uint) (*models.Order, error) {
	var order models.Order
	if err := r.db.Preload("Items").First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOrderEntityNotFound
		}
		return nil, err
	}
	return &order, nil
}

// FindOrderDetailRows lay order va task rows da join product/tray/location/ton kho theo san pham.
func (r *orderRepository) FindOrderDetailRows(orderID uint) (*models.Order, []OrderDetailTaskRow, error) {
	var order models.Order
	if err := r.db.Preload("Items").First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrOrderEntityNotFound
		}
		return nil, nil, err
	}

	var rows []OrderDetailTaskRow
	err := r.db.Table("picking_tasks AS pt").
		Select(`
				pt.id AS picking_task_id,
				pt.order_id AS order_id,
				pt.product_id AS product_id,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(p.product_name, '') AS product_name,
				pt.tray_id AS tray_id,
				COALESCE(t.tray_code, '') AS tray_code,
				COALESCE(l.location_code, '') AS location_code,
				pt.required_quantity AS required_quantity,
				pt.picked_quantity AS picked_quantity,
				COALESCE(i.total_quantity, 0) AS inventory_qty,
				pt.status AS status,
				pt.verified AS verified,
				pt.assigned_to AS assigned_to,
				pt.assigned_at AS assigned_at,
				pt.started_at AS started_at,
			pt.completed_at AS completed_at,
			COALESCE(u.full_name, '') AS assignee_name,
			COALESCE(u.username, '') AS assignee_username
			`).
		Joins("LEFT JOIN products AS p ON p.id = pt.product_id").
		Joins("LEFT JOIN trays AS t ON t.id = pt.tray_id").
		Joins("LEFT JOIN locations AS l ON l.id = t.location_id").
		Joins(`
				LEFT JOIN (
					SELECT product_id, SUM(quantity) AS total_quantity
					FROM inventory
					GROUP BY product_id
				) AS i ON i.product_id = pt.product_id
			`).
		Joins("LEFT JOIN users AS u ON u.id = pt.assigned_to").
		Where("pt.order_id = ?", order.ID).
		Order("pt.id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, nil, err
	}

	return &order, rows, nil
}

// ScanForPicking quét order_code: chỉ cho người đã nhận việc mở luồng picking.
func (r *orderRepository) ScanForPicking(orderCode string, userID uint) (*models.Order, []models.PickingTask, error) {
	var updatedOrder models.Order
	var tasks []models.PickingTask

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1) Lock order row để tránh race condition quét đồng thời.
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("order_code = ?", orderCode).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}

		// 2) Không cho quét order đã đóng.
		if order.Status == utils.OrderStatusCompleted || order.Status == utils.OrderStatusCancelled {
			return ErrOrderAlreadyClosed
		}

		if err := r.ensurePickingTasksForOrderTx(tx, order.ID); err != nil {
			return err
		}

		var assignedToOther int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ? AND assigned_to IS NOT NULL AND assigned_to <> ?", order.ID, utils.PickingStatusDone, userID).
			Count(&assignedToOther).Error; err != nil {
			return err
		}
		if assignedToOther > 0 {
			return ErrPickingTaskNotAssignedToYou
		}

		var assignedToMe int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND status <> ? AND assigned_to = ?", order.ID, utils.PickingStatusDone, userID).
			Count(&assignedToMe).Error; err != nil {
			return err
		}
		if assignedToMe == 0 {
			return ErrPickingTaskNotClaimed
		}

		if err := tx.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
			return err
		}

		if err := tx.Preload("Items").First(&order, order.ID).Error; err != nil {
			return err
		}

		updatedOrder = order
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	// 8) Phòng trường hợp hiếm tasks chưa có trong slice, load bổ sung.
	if len(tasks) == 0 {
		if err := r.db.Where("order_id = ?", updatedOrder.ID).Order("id ASC").Find(&tasks).Error; err != nil {
			return nil, nil, err
		}
	}

	return &updatedOrder, tasks, nil
}

// VerifyTrayForTask kiem tra tray QR cua task, danh dau verified neu hop le.
func (r *orderRepository) VerifyTrayForTask(taskID uint, trayQRCode string, userID uint) (*models.PickingTask, error) {
	var responseTask models.PickingTask

	err := r.db.Transaction(func(tx *gorm.DB) error {
		normalizedTray := strings.TrimSpace(trayQRCode)
		if normalizedTray == "" {
			return ErrTrayQRNotFound
		}

		var task models.PickingTask
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&task, taskID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}

		if task.Status == utils.PickingStatusDone {
			return ErrPickingTaskAlreadyDone
		}
		if task.AssignedTo == nil {
			return ErrPickingTaskNotClaimed
		}
		if *task.AssignedTo != userID {
			return ErrPickingTaskNotAssignedToYou
		}
		if task.AssignedTo == nil {
			return ErrPickingTaskNotClaimed
		}
		if *task.AssignedTo != userID {
			return ErrPickingTaskNotAssignedToYou
		}

		var order models.Order
		if err := tx.Where("id = ?", task.OrderID).First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompletedCannotPick
		}

		var tray models.Tray
		if err := tx.Where("id = ? AND is_active = ?", task.TrayID, true).First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}

		matchTrayCode := strings.EqualFold(tray.TrayCode, normalizedTray)
		matchTrayQRCode := strings.TrimSpace(tray.QRCode) != "" && strings.EqualFold(tray.QRCode, normalizedTray)
		if !matchTrayCode && !matchTrayQRCode {
			return OrderWrongTrayError{Expected: tray.TrayCode, Got: normalizedTray}
		}

		task.Verified = true
		if task.Status == utils.PickingStatusWaiting {
			task.Status = utils.PickingStatusPicking
		}
		if err := tx.Save(&task).Error; err != nil {
			return err
		}

		responseTask = task
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &responseTask, nil
}

// ScanProductForTask xu ly scan tung product QR (quantity = 1) va tru kho atomic.
func (r *orderRepository) ScanProductForTask(taskID uint, trayQRCode string, productQRCode string, note string, userID uint) (*models.PickingTask, error) {
	var responseTask models.PickingTask

	err := r.db.Transaction(func(tx *gorm.DB) error {
		normalizedTray := strings.TrimSpace(trayQRCode)
		normalizedProduct := strings.TrimSpace(productQRCode)
		if normalizedTray == "" {
			return ErrTrayQRNotFound
		}
		if normalizedProduct == "" {
			return ErrProductQRNotFound
		}

		var task models.PickingTask
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&task, taskID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}
		if task.Status == utils.PickingStatusDone {
			return ErrPickingTaskAlreadyDone
		}

		var order models.Order
		if err := tx.Where("id = ?", task.OrderID).First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}
		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompletedCannotPick
		}
		if order.Status == utils.OrderStatusCancelled {
			return ErrOrderCancelled
		}

		var tray models.Tray
		if err := tx.Where("id = ? AND is_active = ?", task.TrayID, true).First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}
		matchTrayCode := strings.EqualFold(tray.TrayCode, normalizedTray)
		matchTrayQRCode := strings.TrimSpace(tray.QRCode) != "" && strings.EqualFold(tray.QRCode, normalizedTray)
		if !matchTrayCode && !matchTrayQRCode {
			return OrderWrongTrayError{Expected: tray.TrayCode, Got: normalizedTray}
		}

		var scannedProduct models.Product
		if err := tx.Where("qr_code = ? OR product_code = ?", normalizedProduct, normalizedProduct).First(&scannedProduct).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrProductQRNotFound
			}
			return err
		}
		if scannedProduct.ID != task.ProductID {
			return ErrPickingTaskWrongProduct
		}

		remainingRequired := task.RequiredQuantity - task.PickedQuantity
		if remainingRequired <= 0 {
			return ErrPickingTaskAlreadyDone
		}

		var inventory models.Inventory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("product_id = ? AND tray_id = ?", task.ProductID, task.TrayID).
			First(&inventory).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrConfirmTaskDependencyNotFound
			}
			return err
		}
		if inventory.Quantity < 1 {
			return ErrOrderInsufficientStock
		}

		beforeQty := inventory.Quantity
		afterQty := beforeQty - 1
		inventory.Quantity = afterQty
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		task.PickedQuantity += 1
		task.Verified = true
		if task.PickedQuantity >= task.RequiredQuantity {
			task.Status = utils.PickingStatusDone
			now := time.Now()
			task.CompletedAt = &now
		} else {
			task.Status = utils.PickingStatusPicking
		}
		if err := tx.Save(&task).Error; err != nil {
			return err
		}

		pickedBy := userID
		trayID := task.TrayID
		pickNote := fmt.Sprintf("Scanned product QR: %s", normalizedProduct)
		if strings.TrimSpace(note) != "" {
			pickNote = pickNote + " | " + strings.TrimSpace(note)
		}

		pickLog := models.PickLog{
			PickingTaskID:  &task.ID,
			OrderID:        &task.OrderID,
			ProductID:      &task.ProductID,
			TrayID:         &trayID,
			PickedQuantity: 1,
			PickedBy:       &pickedBy,
			PickedAt:       time.Now(),
			Note:           pickNote,
		}
		if err := tx.Create(&pickLog).Error; err != nil {
			return err
		}

		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeExport,
			ProductID:       task.ProductID,
			TrayID:          &trayID,
			Quantity:        1,
			BeforeQuantity:  beforeQty,
			AfterQuantity:   afterQty,
			ReferenceCode:   order.OrderCode,
			Note:            "Quét QR sản phẩm khi picking",
		}
		if userID > 0 {
			stockTx.CreatedBy = &userID
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

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
		}

		responseTask = task
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &responseTask, nil
}

// FinishOrder đóng đơn thủ công, đồng thời trả danh sách thiếu hàng (nếu có).
func (r *orderRepository) FinishOrder(orderID uint) (*models.Order, []OrderShortageItem, error) {
	var updatedOrder models.Order
	shortageItems := make([]OrderShortageItem, 0)

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1) Lock order row để finish an toàn.
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}

		if order.Status == utils.OrderStatusCompleted {
			return ErrOrderAlreadyCompleted
		}
		if order.Status == utils.OrderStatusCancelled {
			return ErrOrderCancelled
		}
		if order.Status != utils.OrderStatusPicking {
			return ErrOrderNotInPickingStatus
		}

		// 2) Lấy toàn bộ task để tính thiếu hàng.
		var tasks []models.PickingTask
		if err := tx.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
			return err
		}

		for _, task := range tasks {
			if task.PickedQuantity < task.RequiredQuantity {
				shortageItems = append(shortageItems, OrderShortageItem{
					PickingTaskID: task.ID,
					ProductID:     task.ProductID,
					RequiredQty:   task.RequiredQuantity,
					PickedQty:     task.PickedQuantity,
					MissingQty:    task.RequiredQuantity - task.PickedQuantity,
				})
			}
		}

		// 3) Chốt đơn completed.
		order.Status = utils.OrderStatusCompleted
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		updatedOrder = order
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	return &updatedOrder, shortageItems, nil
}

// FindPickingTasksByOrderID lấy order + danh sách picking tasks theo order id.
func (r *orderRepository) FindPickingTasksByOrderID(orderID uint) (*models.Order, []models.PickingTask, error) {
	var order models.Order
	if err := r.db.First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrOrderEntityNotFound
		}
		return nil, nil, err
	}

	var tasks []models.PickingTask
	if err := r.db.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
		return nil, nil, err
	}

	return &order, tasks, nil
}

// GetOrderProgress trả tổng số tasks, số done và phần trăm tiến độ của order.
func (r *orderRepository) GetOrderProgress(orderID uint) (*OrderProgressSummary, error) {
	var order models.Order
	if err := r.db.First(&order, orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOrderEntityNotFound
		}
		return nil, err
	}

	var total int64
	if err := r.db.Model(&models.PickingTask{}).Where("order_id = ?", order.ID).Count(&total).Error; err != nil {
		return nil, err
	}

	var done int64
	if err := r.db.Model(&models.PickingTask{}).
		Where("order_id = ? AND status = ?", order.ID, utils.PickingStatusDone).
		Count(&done).Error; err != nil {
		return nil, err
	}

	percent := 0.0
	if total > 0 {
		percent = (float64(done) / float64(total)) * 100
	}

	return &OrderProgressSummary{
		OrderID:     order.ID,
		OrderStatus: order.Status,
		DoneTasks:   done,
		TotalTasks:  total,
		Progress:    percent,
	}, nil
}

func (r *orderRepository) UpdateOrderCustomer(orderID uint, customerName string, customerPhone string, customerAddress string) (*models.Order, error) {
	var updated models.Order
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}

		order.CustomerName = customerName
		order.CustomerPhone = customerPhone
		order.CustomerAddress = customerAddress
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		updated = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *orderRepository) UpdateOrderWithItems(orderID uint, customerName string, customerPhone string, customerAddress string, items []OrderItemUpsertInput) (*models.Order, error) {
	var updated models.Order

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}
		if order.Status != utils.OrderStatusPending {
			return ErrOrderCannotEditNonPending
		}

		var pickedCount int64
		if err := tx.Model(&models.PickingTask{}).
			Where("order_id = ? AND picked_quantity > 0", orderID).
			Count(&pickedCount).Error; err != nil {
			return err
		}
		if pickedCount > 0 {
			return ErrOrderCannotEditNonPending
		}

		var pickLogCount int64
		if err := tx.Model(&models.PickLog{}).
			Where("order_id = ?", orderID).
			Count(&pickLogCount).Error; err != nil {
			return err
		}
		if pickLogCount > 0 {
			return ErrOrderHasPickingLogs
		}

		totalAmount := 0.0
		orderItems := make([]models.OrderItem, 0, len(items))
		for _, item := range items {
			totalAmount += float64(item.Quantity) * item.UnitPrice
			orderItems = append(orderItems, models.OrderItem{
				OrderID:   orderID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				UnitPrice: item.UnitPrice,
			})
		}

		if err := tx.Where("order_id = ?", orderID).Delete(&models.PickingTask{}).Error; err != nil {
			return err
		}
		if err := tx.Where("order_id = ?", orderID).Delete(&models.OrderItem{}).Error; err != nil {
			return err
		}
		if len(orderItems) > 0 {
			if err := tx.Create(&orderItems).Error; err != nil {
				return err
			}
		}

		pickingTasks, err := r.buildPickingTasksFromOrderItems(tx, orderID, items)
		if err != nil {
			return err
		}
		if len(pickingTasks) == 0 {
			return ErrOrderHasNoItems
		}
		if err := tx.Create(&pickingTasks).Error; err != nil {
			return err
		}

		order.CustomerName = customerName
		order.CustomerPhone = customerPhone
		order.CustomerAddress = customerAddress
		order.TotalAmount = totalAmount
		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		if err := tx.Preload("Items").First(&order, order.ID).Error; err != nil {
			return err
		}
		updated = order
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *orderRepository) buildPickingTasksFromOrderItems(tx *gorm.DB, orderID uint, items []OrderItemUpsertInput) ([]models.PickingTask, error) {
	type taskKey struct {
		productID uint
		trayID    uint
	}
	taskMap := make(map[taskKey]int)

	for _, item := range items {
		var product models.Product
		if err := tx.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrOrderEntityNotFound
			}
			return nil, err
		}

		if strings.EqualFold(product.ProductType, "FINISHED_GOOD") {
			var bom models.BOM
			if err := tx.Where("product_id = ?", product.ID).First(&bom).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, ErrOrderBOMNotFound
				}
				return nil, err
			}
			var bomItems []models.BOMItem
			if err := tx.Where("bom_id = ?", bom.ID).Find(&bomItems).Error; err != nil {
				return nil, err
			}
			if len(bomItems) == 0 {
				return nil, ErrOrderBOMHasNoItems
			}

			for _, bomItem := range bomItems {
				requiredQty := bomItem.Quantity * item.Quantity
				var tray models.Tray
				if err := tx.Where("product_id = ? AND is_active = ?", bomItem.ComponentProductID, true).First(&tray).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return nil, ErrOrderEntityNotFound
					}
					return nil, err
				}
				key := taskKey{productID: bomItem.ComponentProductID, trayID: tray.ID}
				taskMap[key] += requiredQty
			}
			continue
		}

		var tray models.Tray
		if err := tx.Where("product_id = ? AND is_active = ?", item.ProductID, true).First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrOrderEntityNotFound
			}
			return nil, err
		}
		key := taskKey{productID: item.ProductID, trayID: tray.ID}
		taskMap[key] += item.Quantity
	}

	tasks := make([]models.PickingTask, 0, len(taskMap))
	for key, qty := range taskMap {
		if qty <= 0 {
			continue
		}
		tasks = append(tasks, models.PickingTask{
			OrderID:          orderID,
			ProductID:        key.productID,
			TrayID:           key.trayID,
			RequiredQuantity: qty,
			PickedQuantity:   0,
			Verified:         false,
			Status:           utils.PickingStatusWaiting,
		})
	}
	return tasks, nil
}

func (r *orderRepository) DeleteOrder(orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderEntityNotFound
			}
			return err
		}

		if order.Status == utils.OrderStatusPicking || order.Status == utils.OrderStatusCompleted {
			return ErrOrderCannotDelete
		}

		if err := tx.Where("order_id = ?", orderID).Delete(&models.PickingTask{}).Error; err != nil {
			return err
		}
		if err := tx.Where("order_id = ?", orderID).Delete(&models.OrderItem{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&order).Error; err != nil {
			return err
		}
		return nil
	})
}
