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

// StaffTaskRow la read-model danh sach cong viec staff can xu ly.
type StaffTaskRow struct {
	ID              uint
	OrderCode       string
	CustomerName    string
	CustomerPhone   string
	CustomerAddress string
	Status          string
	TotalItems      int
	PickedItems     int
	CreatedAt       time.Time
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
	FindStaffTaskRows() ([]StaffTaskRow, error)
	FindByIDWithItems(orderID uint) (*models.Order, error)
	FindOrderDetailRows(orderID uint) (*models.Order, []OrderDetailTaskRow, error)
	ScanForPicking(orderCode string, userID uint) (*models.Order, []models.PickingTask, error)
	VerifyTrayForTask(taskID uint, trayQRCode string) (*models.PickingTask, error)
	ScanProductForTask(taskID uint, trayQRCode string, productQRCode string, note string, userID uint) (*models.PickingTask, error)
	FinishOrder(orderID uint) (*models.Order, []OrderShortageItem, error)
	FindPickingTasksByOrderID(orderID uint) (*models.Order, []models.PickingTask, error)
	GetOrderProgress(orderID uint) (*OrderProgressSummary, error)
	UpdateOrderCustomer(orderID uint, customerName string, customerPhone string, customerAddress string) (*models.Order, error)
	UpdateOrderWithItems(orderID uint, customerName string, customerPhone string, customerAddress string, items []OrderItemUpsertInput) (*models.Order, error)
	DeleteOrder(orderID uint) error
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

// FindStaffTaskRows lay danh sach order PENDING/PICKING va tong hop tien do item de staff xu ly.
func (r *orderRepository) FindStaffTaskRows() ([]StaffTaskRow, error) {
	rows := make([]StaffTaskRow, 0)
	err := r.db.Raw(`
		SELECT
			o.id,
			o.order_code,
			COALESCE(o.customer_name, '') AS customer_name,
			COALESCE(o.customer_phone, '') AS customer_phone,
			COALESCE(o.customer_address, '') AS customer_address,
			o.status,
			o.created_at,
			COALESCE(oi.total_items, 0) AS total_items,
			COALESCE(pt.picked_items, 0) AS picked_items
		FROM orders o
		LEFT JOIN (
			SELECT order_id, COALESCE(SUM(quantity), 0) AS total_items
			FROM order_items
			GROUP BY order_id
		) oi ON oi.order_id = o.id
		LEFT JOIN (
			SELECT order_id, COALESCE(SUM(picked_quantity), 0) AS picked_items
			FROM picking_tasks
			GROUP BY order_id
		) pt ON pt.order_id = o.id
		WHERE o.status IN (?, ?)
		ORDER BY o.created_at DESC
	`, utils.OrderStatusPending, utils.OrderStatusPicking).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
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

// FindOrderDetailRows lay order va task rows da join product/tray/location/inventory.
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
			COALESCE(i.quantity, 0) AS inventory_qty,
			pt.status AS status,
			pt.verified AS verified,
			pt.assigned_to AS assigned_to,
			COALESCE(u.full_name, '') AS assignee_name,
			COALESCE(u.username, '') AS assignee_username
		`).
		Joins("LEFT JOIN products AS p ON p.id = pt.product_id").
		Joins("LEFT JOIN trays AS t ON t.id = pt.tray_id").
		Joins("LEFT JOIN locations AS l ON l.id = t.location_id").
		Joins("LEFT JOIN inventory AS i ON i.product_id = pt.product_id AND i.tray_id = pt.tray_id").
		Joins("LEFT JOIN users AS u ON u.id = pt.assigned_to").
		Where("pt.order_id = ?", order.ID).
		Order("pt.id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, nil, err
	}

	return &order, rows, nil
}

// ScanForPicking quét order_code: sinh tasks nếu chưa có và chuyển order sang PICKING.
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

		// 3) Kiểm tra order đã có task chưa.
		var existingTaskCount int64
		if err := tx.Model(&models.PickingTask{}).Where("order_id = ?", order.ID).Count(&existingTaskCount).Error; err != nil {
			return err
		}

		if existingTaskCount == 0 {
			// 4) Nếu chưa có task thì đọc order_items để sinh tasks.
			var orderItems []models.OrderItem
			if err := tx.Where("order_id = ?", order.ID).Find(&orderItems).Error; err != nil {
				return err
			}
			if len(orderItems) == 0 {
				return ErrOrderHasNoItems
			}

			newTasks := make([]models.PickingTask, 0, len(orderItems))
			for _, item := range orderItems {
				// 5) Mỗi product lấy khay active đầu tiên để assign cho picking.
				var tray models.Tray
				if err := tx.Where("product_id = ? AND is_active = ?", item.ProductID, true).First(&tray).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return ErrOrderEntityNotFound
					}
					return err
				}

				assignedTo := userID
				newTasks = append(newTasks, models.PickingTask{
					OrderID:          order.ID,
					ProductID:        item.ProductID,
					TrayID:           tray.ID,
					RequiredQuantity: item.Quantity,
					PickedQuantity:   0,
					Verified:         false,
					Status:           utils.PickingStatusWaiting,
					AssignedTo:       &assignedTo,
				})
			}

			if err := tx.Create(&newTasks).Error; err != nil {
				return err
			}
			tasks = newTasks
		} else {
			// 6) Nếu đã có task thì load lại để trả đầy đủ.
			if err := tx.Where("order_id = ?", order.ID).Order("id ASC").Find(&tasks).Error; err != nil {
				return err
			}
		}

		// 7) Chuyển trạng thái order sang PICKING.
		order.Status = utils.OrderStatusPicking
		if err := tx.Save(&order).Error; err != nil {
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
func (r *orderRepository) VerifyTrayForTask(taskID uint, trayQRCode string) (*models.PickingTask, error) {
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
