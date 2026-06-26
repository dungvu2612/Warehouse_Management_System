package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'inventory'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewInventoryService
- GetAll
- Create
- Adjust

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strconv"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

var (
	ErrInvalidInventoryID       = errors.New("invalid inventory id")
	ErrInvalidInventoryFilter   = errors.New("invalid inventory filter")
	ErrInvalidAdjustPayload     = errors.New("delta must not be 0")
	ErrTrayProductMismatch      = errors.New("tray does not belong to the provided product")
	ErrInsufficientStock        = errors.New("insufficient inventory quantity")
	ErrPutawayRequestNotPending = errors.New("putaway request is not pending")
)

type InventoryListQuery struct {
	ProductIDRaw string
	TrayIDRaw    string
}

type CreateInventoryInput struct {
	ProductID uint
	TrayID    uint
	Quantity  int
	Note      string
	CreatedBy uint
}

type AdjustInventoryInput struct {
	InventoryID uint
	Delta       int
	Note        string
	CreatedBy   uint
}

type AdjustByTrayInput struct {
	TrayQRCode    string
	Delta         int
	Note          string
	CreatedBy     uint
	ReferenceCode string
}

type PutawayInput struct {
	ProductQRCode string
	TrayQRCode    string
	Quantity      int
	Note          string
	CreatedBy     uint
	ReferenceCode string
}

type PutawayApprovalActionInput struct {
	RequestID  uint
	ApprovedBy uint
	Reason     string
}

type StocktakeInput struct {
	TrayQRCode    string
	PhysicalQty   int
	Note          string
	CreatedBy     uint
	ReferenceCode string
}

type StocktakeResult struct {
	Inventory *models.Inventory `json:"inventory"`
	Delta     int               `json:"delta"`
}

type InventoryService interface {
	GetAll(query InventoryListQuery) ([]models.Inventory, error)
	Create(input CreateInventoryInput) (*models.Inventory, error)
	Adjust(input AdjustInventoryInput) (*models.Inventory, error)
	AdjustByTray(input AdjustByTrayInput) (*models.Inventory, error)
	Putaway(input PutawayInput) (*models.Inventory, error)
	GetPutawayRequests(status string) ([]models.PutawayRequest, error)
	ApprovePutawayRequest(input PutawayApprovalActionInput) (*models.PutawayRequest, *models.Inventory, error)
	RejectPutawayRequest(input PutawayApprovalActionInput) (*models.PutawayRequest, error)
	Stocktake(input StocktakeInput) (*StocktakeResult, error)
}

type inventoryService struct {
	repo repositories.InventoryRepository
}

func NewInventoryService(repo repositories.InventoryRepository) InventoryService {
	return &inventoryService{repo: repo}
}

func (s *inventoryService) GetAll(query InventoryListQuery) ([]models.Inventory, error) {
	filters := repositories.InventoryFilters{}

	if query.ProductIDRaw != "" {
		v, err := strconv.ParseUint(query.ProductIDRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid product_id")
		}
		x := uint(v)
		filters.ProductID = &x
	}

	if query.TrayIDRaw != "" {
		v, err := strconv.ParseUint(query.TrayIDRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid tray_id")
		}
		x := uint(v)
		filters.TrayID = &x
	}

	return s.repo.FindAll(filters)
}

func (s *inventoryService) Create(input CreateInventoryInput) (*models.Inventory, error) {
	if _, err := s.repo.FindActiveProductByID(input.ProductID); err != nil {
		return nil, err
	}

	tray, err := s.repo.FindActiveTrayByID(input.TrayID)
	if err != nil {
		return nil, err
	}

	if tray.ProductID != input.ProductID {
		return nil, ErrTrayProductMismatch
	}

	inventory := &models.Inventory{
		ProductID: input.ProductID,
		TrayID:    input.TrayID,
		Quantity:  input.Quantity,
	}

	if err := s.repo.Create(inventory, strings.TrimSpace(input.Note), input.CreatedBy); err != nil {
		return nil, err
	}
	return inventory, nil
}

func (s *inventoryService) Adjust(input AdjustInventoryInput) (*models.Inventory, error) {
	if input.InventoryID == 0 {
		return nil, ErrInvalidInventoryID
	}
	if input.Delta == 0 {
		return nil, ErrInvalidAdjustPayload
	}

	note := strings.TrimSpace(input.Note)
	updated, err := s.repo.AdjustWithTransaction(input.InventoryID, input.Delta, note, input.CreatedBy)
	if err != nil {
		if errors.Is(err, repositories.ErrInventoryNotFound) {
			return nil, repositories.ErrInventoryNotFound
		}
		if errors.Is(err, repositories.ErrProductNotFound) {
			return nil, repositories.ErrProductNotFound
		}
		if errors.Is(err, repositories.ErrInventoryInsufficient) {
			return nil, ErrInsufficientStock
		}
		if err.Error() == ErrInsufficientStock.Error() {
			return nil, ErrInsufficientStock
		}
		return nil, err
	}
	return updated, nil
}

func (s *inventoryService) AdjustByTray(input AdjustByTrayInput) (*models.Inventory, error) {
	if strings.TrimSpace(input.TrayQRCode) == "" {
		return nil, ErrInvalidAdjustPayload
	}
	if input.Delta == 0 {
		return nil, ErrInvalidAdjustPayload
	}

	note := strings.TrimSpace(input.Note)
	updated, err := s.repo.AdjustByTrayQRCode(
		input.TrayQRCode,
		input.Delta,
		note,
		input.CreatedBy,
		strings.TrimSpace(input.ReferenceCode),
	)
	if err != nil {
		if errors.Is(err, repositories.ErrInventoryInsufficient) {
			return nil, ErrInsufficientStock
		}
		return nil, err
	}
	return updated, nil
}

func (s *inventoryService) Putaway(input PutawayInput) (*models.Inventory, error) {
	if strings.TrimSpace(input.ProductQRCode) == "" || strings.TrimSpace(input.TrayQRCode) == "" || input.Quantity <= 0 {
		return nil, ErrInvalidInventoryFilter
	}

	updated, err := s.repo.PutawayByScan(
		input.ProductQRCode,
		input.TrayQRCode,
		input.Quantity,
		strings.TrimSpace(input.Note),
		input.CreatedBy,
		strings.TrimSpace(input.ReferenceCode),
	)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *inventoryService) GetPutawayRequests(status string) ([]models.PutawayRequest, error) {
	return s.repo.FindPutawayRequestsByStatus(status)
}

func (s *inventoryService) ApprovePutawayRequest(input PutawayApprovalActionInput) (*models.PutawayRequest, *models.Inventory, error) {
	if input.RequestID == 0 {
		return nil, nil, ErrInvalidInventoryID
	}
	req, inv, err := s.repo.ApprovePutawayRequest(input.RequestID, input.ApprovedBy)
	if err != nil {
		if strings.Contains(err.Error(), "not pending") {
			return nil, nil, ErrPutawayRequestNotPending
		}
		return nil, nil, err
	}
	return req, inv, nil
}

func (s *inventoryService) RejectPutawayRequest(input PutawayApprovalActionInput) (*models.PutawayRequest, error) {
	if input.RequestID == 0 {
		return nil, ErrInvalidInventoryID
	}
	req, err := s.repo.RejectPutawayRequest(input.RequestID, input.ApprovedBy, input.Reason)
	if err != nil {
		if strings.Contains(err.Error(), "not pending") {
			return nil, ErrPutawayRequestNotPending
		}
		return nil, err
	}
	return req, nil
}

func (s *inventoryService) Stocktake(input StocktakeInput) (*StocktakeResult, error) {
	if strings.TrimSpace(input.TrayQRCode) == "" || input.PhysicalQty < 0 {
		return nil, ErrInvalidInventoryFilter
	}
	note := strings.TrimSpace(input.Note)
	inventory, delta, err := s.repo.StocktakeByTrayQRCode(
		input.TrayQRCode,
		input.PhysicalQty,
		note,
		input.CreatedBy,
		strings.TrimSpace(input.ReferenceCode),
	)
	if err != nil {
		return nil, err
	}
	return &StocktakeResult{
		Inventory: inventory,
		Delta:     delta,
	}, nil
}
