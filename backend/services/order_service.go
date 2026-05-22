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

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

// OrderCreateInput là DTO tạo order ở layer service.
type OrderCreateInput struct {
	BOMID        uint
	MachineQty   int
	CustomerName string
	CreatedBy    uint
}

// OrderScanInput là DTO quét order_code để vào luồng picking.
type OrderScanInput struct {
	OrderCode string
	UserID    uint
}

// OrderConfirmPickingInput là DTO xác nhận pick task.
type OrderConfirmPickingInput struct {
	TaskID   uint
	TrayCode string
	Quantity int
	Note     string
	UserID   uint
}

// OrderProgressResult là cấu trúc trả tiến độ picking cho API.
type OrderProgressResult struct {
	OrderID     uint
	OrderStatus string
	DoneTasks   int64
	TotalTasks  int64
	Progress    float64
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
	GetAll(statusRaw string) ([]models.Order, error)
	GetByID(orderID uint) (*models.Order, error)
	ScanForPicking(input OrderScanInput) (*models.Order, []models.PickingTask, error)
	ConfirmPicking(input OrderConfirmPickingInput) (*models.PickingTask, int, error)
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
	if input.BOMID == 0 || input.MachineQty <= 0 {
		return nil, ErrOrderInvalidPayload
	}

	input.CustomerName = strings.TrimSpace(input.CustomerName)
	return s.repo.CreateFromBOM(input.BOMID, input.MachineQty, input.CustomerName, input.CreatedBy)
}

// GetAll lấy danh sách orders, chuẩn hóa status filter.
func (s *orderService) GetAll(statusRaw string) ([]models.Order, error) {
	status := strings.ToUpper(strings.TrimSpace(statusRaw))
	if status == "" {
		return s.repo.FindAll(nil)
	}
	return s.repo.FindAll(&status)
}

// GetByID lấy 1 order + items theo id.
func (s *orderService) GetByID(orderID uint) (*models.Order, error) {
	if orderID == 0 {
		return nil, ErrOrderInvalidID
	}
	return s.repo.FindByIDWithItems(orderID)
}

// ScanForPicking xử lý quét order_code để vào luồng picking.
func (s *orderService) ScanForPicking(input OrderScanInput) (*models.Order, []models.PickingTask, error) {
	orderCode := strings.TrimSpace(input.OrderCode)
	if orderCode == "" {
		return nil, nil, ErrOrderCodeIsRequired
	}
	return s.repo.ScanForPicking(orderCode, input.UserID)
}

// ConfirmPicking xác nhận một lần pick task và trả remaining quantity.
func (s *orderService) ConfirmPicking(input OrderConfirmPickingInput) (*models.PickingTask, int, error) {
	if input.TaskID == 0 {
		return nil, 0, ErrOrderInvalidPickingTaskID
	}
	if input.Quantity <= 0 {
		return nil, 0, ErrOrderInvalidPayload
	}

	trayCode := strings.TrimSpace(input.TrayCode)
	if trayCode == "" {
		return nil, 0, ErrOrderTrayCodeRequired
	}

	note := strings.TrimSpace(input.Note)
	task, err := s.repo.ConfirmPickingTask(input.TaskID, trayCode, input.Quantity, note, input.UserID)
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
