package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'order'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewOrderService
- Create
- GetAll
- GetByID
- ScanForPicking
- ConfirmPicking
- Finish
- GetPickingTasks
- GetProgress

Luu y khi sua:
- Neu doi rule status order/picking, phai ra soat dong bo voi flow PDA va API response contract.
*/

import (
	"errors"
	"strings"
	"time"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
	"quan_ly_kho/utils"
)

// OrderCreateInput là DTO tạo order ở layer service.
type OrderCreateInput struct {
	CustomerName    string
	CustomerPhone   string
	CustomerAddress string
	Items           []OrderItemInput
	CreatedBy       uint
}

// OrderScanInput là DTO quét order_code để vào luồng picking.
type OrderScanInput struct {
	OrderCode string
	UserID    uint
}

type OrderUpdateInput struct {
	OrderID         uint
	CustomerName    string
	CustomerPhone   string
	CustomerAddress string
	Items           []OrderItemInput
}

// Senior Handover: Order items are edited as an array, not a single product.
type OrderItemInput struct {
	ProductID uint
	Quantity  int
	UnitPrice float64
}

// OrderVerifyTrayInput la DTO verify tray QR truoc scan product.
type OrderVerifyTrayInput struct {
	TaskID      uint
	TrayQRCode  string
	CurrentRole string
}

// OrderScanProductInput la DTO scan product QR theo tung lan (quantity = 1).
type OrderScanProductInput struct {
	TaskID        uint
	TrayQRCode    string
	ProductQRCode string
	Note          string
	UserID        uint
	CurrentRole   string
}

// OrderProgressResult là cấu trúc trả tiến độ picking cho API.
type OrderProgressResult struct {
	OrderID     uint
	OrderStatus string
	DoneTasks   int64
	TotalTasks  int64
	Progress    float64
}

// StaffTaskResult la read-model danh sach cong viec staff can picking.
type StaffTaskResult struct {
	ID              uint      `json:"id"`
	OrderCode       string    `json:"order_code"`
	CustomerName    string    `json:"customer_name"`
	CustomerPhone   string    `json:"customer_phone"`
	CustomerAddress string    `json:"customer_address"`
	Status          string    `json:"status"`
	TotalItems      int       `json:"total_items"`
	PickedItems     int       `json:"picked_items"`
	CreatedAt       time.Time `json:"created_at"`
}

// OrderDetailTaskResult la DTO task da enrich du lieu san pham/vi tri/ton kho cho UI.
type OrderDetailTaskResult struct {
	ID               uint   `json:"id"`
	OrderID          uint   `json:"order_id"`
	ProductID        uint   `json:"product_id"`
	ProductCode      string `json:"product_code"`
	ProductName      string `json:"product_name"`
	TrayID           uint   `json:"tray_id"`
	TrayCode         string `json:"tray_code"`
	LocationCode     string `json:"location_code"`
	RequiredQuantity int    `json:"required_quantity"`
	PickedQuantity   int    `json:"picked_quantity"`
	InventoryQty     int    `json:"inventory_qty"`
	Status           string `json:"status"`
	Verified         bool   `json:"verified"`
}

// OrderDetailProgressResult la DTO progress trong chi tiet order.
type OrderDetailProgressResult struct {
	TotalTasks int     `json:"total_tasks"`
	DoneTasks  int     `json:"done_tasks"`
	Percent    float64 `json:"percent"`
}

// OrderDetailShortageItemResult la DTO canh bao thieu hang realtime.
type OrderDetailShortageItemResult struct {
	PickingTaskID uint   `json:"picking_task_id"`
	ProductID     uint   `json:"product_id"`
	ProductCode   string `json:"product_code"`
	ProductName   string `json:"product_name"`
	LocationCode  string `json:"location_code"`
	RequiredQty   int    `json:"required_qty"`
	PickedQty     int    `json:"picked_qty"`
	AvailableQty  int    `json:"available_qty"`
	MissingQty    int    `json:"missing_qty"`
}

// OrderDetailShortageResult gom flag va danh sach dong dang thieu hang.
type OrderDetailShortageResult struct {
	HasShortage bool                            `json:"has_shortage"`
	Items       []OrderDetailShortageItemResult `json:"items"`
}

// OrderDetailResult la response contract cua GET /orders/:id.
type OrderDetailResult struct {
	Order        *models.Order             `json:"order"`
	PickingTasks []OrderDetailTaskResult   `json:"picking_tasks"`
	Progress     OrderDetailProgressResult `json:"progress"`
	Shortage     OrderDetailShortageResult `json:"shortage"`
}

// OrderShortageItemResult là cấu trúc thiếu hàng khi finish thủ công.
type OrderShortageItemResult struct {
	PickingTaskID uint
	ProductID     uint
	RequiredQty   int
	PickedQty     int
	MissingQty    int
}

// OrderService định nghĩa use-cases cho module order/picking.
type OrderService interface {
	Create(input OrderCreateInput) (*models.Order, error)
	Update(input OrderUpdateInput) (*models.Order, error)
	Delete(orderID uint) error
	GetAll(statusRaw string) ([]models.Order, error)
	GetStaffTasks() ([]StaffTaskResult, error)
	GetByID(orderID uint) (*OrderDetailResult, error)
	ScanForPicking(input OrderScanInput) (*models.Order, []models.PickingTask, error)
	VerifyTray(input OrderVerifyTrayInput) (*models.PickingTask, error)
	ScanProduct(input OrderScanProductInput) (*models.PickingTask, int, error)
	Finish(orderID uint) (*models.Order, []OrderShortageItemResult, error)
	GetPickingTasks(orderID uint) (*models.Order, []models.PickingTask, error)
	GetProgress(orderID uint) (*OrderProgressResult, error)
}

// Nhóm lỗi service để handler map HTTP status chuẩn.
var (
	ErrOrderInvalidID            = errors.New("invalid order id")
	ErrOrderInvalidPickingTaskID = errors.New("invalid picking task id")
	ErrOrderInvalidPayload       = errors.New("invalid order payload")
	ErrOrderCodeIsRequired       = errors.New("order_code is required")
	ErrOrderTrayCodeRequired     = errors.New("tray_code is required")
	ErrOrderUnauthorizedRole     = errors.New("unauthorized role")
	ErrOrderProductCodeRequired  = errors.New("product_qr_code is required")
)

type orderService struct {
	repo repositories.OrderRepository
}

// NewOrderService khởi tạo service order.
func NewOrderService(repo repositories.OrderRepository) OrderService {
	return &orderService{repo: repo}
}

// Create validate payload tạo order rồi gọi repository.
func (s *orderService) Create(input OrderCreateInput) (*models.Order, error) {
	if len(input.Items) == 0 {
		return nil, ErrOrderInvalidPayload
	}

	input.CustomerName = strings.TrimSpace(input.CustomerName)
	input.CustomerPhone = strings.TrimSpace(input.CustomerPhone)
	input.CustomerAddress = strings.TrimSpace(input.CustomerAddress)
	if input.CustomerName == "" {
		return nil, ErrOrderInvalidPayload
	}
	for _, item := range input.Items {
		if item.ProductID == 0 || item.Quantity <= 0 || item.UnitPrice < 0 {
			return nil, ErrOrderInvalidPayload
		}
	}
	seen := make(map[uint]struct{}, len(input.Items))
	for _, item := range input.Items {
		if _, exists := seen[item.ProductID]; exists {
			return nil, ErrOrderInvalidPayload
		}
		seen[item.ProductID] = struct{}{}
	}

	return s.repo.CreateOrderWithItems(
		input.CustomerName,
		input.CustomerPhone,
		input.CustomerAddress,
		mapOrderItemInputs(input.Items),
		input.CreatedBy,
	)
}

func (s *orderService) Update(input OrderUpdateInput) (*models.Order, error) {
	if input.OrderID == 0 {
		return nil, ErrOrderInvalidID
	}
	name := strings.TrimSpace(input.CustomerName)
	if name == "" {
		return nil, ErrOrderInvalidPayload
	}
	phone := strings.TrimSpace(input.CustomerPhone)
	address := strings.TrimSpace(input.CustomerAddress)
	if len(input.Items) == 0 {
		return nil, ErrOrderInvalidPayload
	}
	for _, item := range input.Items {
		if item.ProductID == 0 || item.Quantity <= 0 || item.UnitPrice < 0 {
			return nil, ErrOrderInvalidPayload
		}
	}
	seen := make(map[uint]struct{}, len(input.Items))
	for _, item := range input.Items {
		if _, exists := seen[item.ProductID]; exists {
			return nil, ErrOrderInvalidPayload
		}
		seen[item.ProductID] = struct{}{}
	}
	return s.repo.UpdateOrderWithItems(input.OrderID, name, phone, address, mapOrderItemInputs(input.Items))
}

func mapOrderItemInputs(items []OrderItemInput) []repositories.OrderItemUpsertInput {
	results := make([]repositories.OrderItemUpsertInput, 0, len(items))
	for _, item := range items {
		results = append(results, repositories.OrderItemUpsertInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		})
	}
	return results
}

func (s *orderService) Delete(orderID uint) error {
	if orderID == 0 {
		return ErrOrderInvalidID
	}
	return s.repo.DeleteOrder(orderID)
}

// GetAll lấy danh sách orders, chuẩn hóa status filter.
func (s *orderService) GetAll(statusRaw string) ([]models.Order, error) {
	status := strings.ToUpper(strings.TrimSpace(statusRaw))
	if status == "" {
		return s.repo.FindAll(nil)
	}
	return s.repo.FindAll(&status)
}

// GetStaffTasks tra ve danh sach order PENDING/PICKING de staff vao viec.
func (s *orderService) GetStaffTasks() ([]StaffTaskResult, error) {
	rows, err := s.repo.FindStaffTaskRows()
	if err != nil {
		return nil, err
	}

	results := make([]StaffTaskResult, 0, len(rows))
	for _, row := range rows {
		results = append(results, StaffTaskResult{
			ID:              row.ID,
			OrderCode:       row.OrderCode,
			CustomerName:    row.CustomerName,
			CustomerPhone:   row.CustomerPhone,
			CustomerAddress: row.CustomerAddress,
			Status:          row.Status,
			TotalItems:      row.TotalItems,
			PickedItems:     row.PickedItems,
			CreatedAt:       row.CreatedAt,
		})
	}

	return results, nil
}

// GetByID lấy chi tiet order + picking tasks + progress + shortage realtime.
func (s *orderService) GetByID(orderID uint) (*OrderDetailResult, error) {
	if orderID == 0 {
		return nil, ErrOrderInvalidID
	}

	order, rows, err := s.repo.FindOrderDetailRows(orderID)
	if err != nil {
		return nil, err
	}

	tasks := make([]OrderDetailTaskResult, 0, len(rows))
	shortageItems := make([]OrderDetailShortageItemResult, 0)
	doneTasks := 0

	for _, row := range rows {
		task := OrderDetailTaskResult{
			ID:               row.PickingTaskID,
			OrderID:          row.OrderID,
			ProductID:        row.ProductID,
			ProductCode:      row.ProductCode,
			ProductName:      row.ProductName,
			TrayID:           row.TrayID,
			TrayCode:         row.TrayCode,
			LocationCode:     row.LocationCode,
			RequiredQuantity: row.RequiredQuantity,
			PickedQuantity:   row.PickedQuantity,
			InventoryQty:     row.InventoryQty,
			Status:           row.Status,
			Verified:         row.Verified,
		}
		tasks = append(tasks, task)

		if row.Status == utils.PickingStatusDone {
			doneTasks++
		}

		remainingQty := row.RequiredQuantity - row.PickedQuantity
		if remainingQty < 0 {
			remainingQty = 0
		}
		if row.InventoryQty < remainingQty {
			shortageItems = append(shortageItems, OrderDetailShortageItemResult{
				PickingTaskID: row.PickingTaskID,
				ProductID:     row.ProductID,
				ProductCode:   row.ProductCode,
				ProductName:   row.ProductName,
				LocationCode:  row.LocationCode,
				RequiredQty:   row.RequiredQuantity,
				PickedQty:     row.PickedQuantity,
				AvailableQty:  row.InventoryQty,
				MissingQty:    remainingQty - row.InventoryQty,
			})
		}
	}

	percent := 0.0
	if len(tasks) > 0 {
		percent = (float64(doneTasks) / float64(len(tasks))) * 100
	}

	return &OrderDetailResult{
		Order:        order,
		PickingTasks: tasks,
		Progress: OrderDetailProgressResult{
			TotalTasks: len(tasks),
			DoneTasks:  doneTasks,
			Percent:    percent,
		},
		Shortage: OrderDetailShortageResult{
			HasShortage: len(shortageItems) > 0,
			Items:       shortageItems,
		},
	}, nil
}

// ScanForPicking xử lý quét order_code để vào luồng picking.
func (s *orderService) ScanForPicking(input OrderScanInput) (*models.Order, []models.PickingTask, error) {
	orderCode := strings.TrimSpace(input.OrderCode)
	if orderCode == "" {
		return nil, nil, ErrOrderCodeIsRequired
	}
	return s.repo.ScanForPicking(orderCode, input.UserID)
}

// VerifyTray validate va verify tray QR cho task.
func (s *orderService) VerifyTray(input OrderVerifyTrayInput) (*models.PickingTask, error) {
	if input.TaskID == 0 {
		return nil, ErrOrderInvalidPickingTaskID
	}

	role := strings.ToUpper(strings.TrimSpace(input.CurrentRole))
	if role != "ADMIN" && role != "WAREHOUSE" {
		return nil, ErrOrderUnauthorizedRole
	}

	trayCode := strings.TrimSpace(input.TrayQRCode)
	if trayCode == "" {
		return nil, ErrOrderTrayCodeRequired
	}

	return s.repo.VerifyTrayForTask(input.TaskID, trayCode)
}

// ScanProduct validate va scan product QR 1 lan cho task.
func (s *orderService) ScanProduct(input OrderScanProductInput) (*models.PickingTask, int, error) {
	if input.TaskID == 0 {
		return nil, 0, ErrOrderInvalidPickingTaskID
	}

	role := strings.ToUpper(strings.TrimSpace(input.CurrentRole))
	if role != "ADMIN" && role != "WAREHOUSE" {
		return nil, 0, ErrOrderUnauthorizedRole
	}

	trayCode := strings.TrimSpace(input.TrayQRCode)
	if trayCode == "" {
		return nil, 0, ErrOrderTrayCodeRequired
	}

	productCode := strings.TrimSpace(input.ProductQRCode)
	if productCode == "" {
		return nil, 0, ErrOrderProductCodeRequired
	}

	note := strings.TrimSpace(input.Note)
	task, err := s.repo.ScanProductForTask(input.TaskID, trayCode, productCode, note, input.UserID)
	if err != nil {
		return nil, 0, err
	}

	remaining := task.RequiredQuantity - task.PickedQuantity
	if remaining < 0 {
		remaining = 0
	}

	return task, remaining, nil
}

// Finish đóng đơn thủ công, trả thêm danh sách thiếu hàng.
func (s *orderService) Finish(orderID uint) (*models.Order, []OrderShortageItemResult, error) {
	if orderID == 0 {
		return nil, nil, ErrOrderInvalidID
	}

	order, shortageItems, err := s.repo.FinishOrder(orderID)
	if err != nil {
		return nil, nil, err
	}

	resultItems := make([]OrderShortageItemResult, 0, len(shortageItems))
	for _, item := range shortageItems {
		resultItems = append(resultItems, OrderShortageItemResult{
			PickingTaskID: item.PickingTaskID,
			ProductID:     item.ProductID,
			RequiredQty:   item.RequiredQty,
			PickedQty:     item.PickedQty,
			MissingQty:    item.MissingQty,
		})
	}

	return order, resultItems, nil
}

// GetPickingTasks lấy order + tasks theo order id.
func (s *orderService) GetPickingTasks(orderID uint) (*models.Order, []models.PickingTask, error) {
	if orderID == 0 {
		return nil, nil, ErrOrderInvalidID
	}
	return s.repo.FindPickingTasksByOrderID(orderID)
}

// GetProgress lấy tiến độ picking của order.
func (s *orderService) GetProgress(orderID uint) (*OrderProgressResult, error) {
	if orderID == 0 {
		return nil, ErrOrderInvalidID
	}

	summary, err := s.repo.GetOrderProgress(orderID)
	if err != nil {
		return nil, err
	}

	return &OrderProgressResult{
		OrderID:     summary.OrderID,
		OrderStatus: summary.OrderStatus,
		DoneTasks:   summary.DoneTasks,
		TotalTasks:  summary.TotalTasks,
		Progress:    summary.Progress,
	}, nil
}
