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
	ErrInvalidInventoryID     = errors.New("invalid inventory id")
	ErrInvalidInventoryFilter = errors.New("invalid inventory filter")
	ErrInvalidAdjustPayload   = errors.New("delta must not be 0")
	ErrTrayProductMismatch    = errors.New("tray does not belong to the provided product")
	ErrInsufficientStock      = errors.New("insufficient inventory quantity")
)

type InventoryListQuery struct {
	ProductIDRaw string
	TrayIDRaw    string
}

type CreateInventoryInput struct {
	ProductID uint
	TrayID    uint
	Quantity  int
}

type AdjustInventoryInput struct {
	InventoryID uint
	Delta       int
	Note        string
	CreatedBy   uint
}

type InventoryService interface {
	GetAll(query InventoryListQuery) ([]models.Inventory, error)
	Create(input CreateInventoryInput) (*models.Inventory, error)
	Adjust(input AdjustInventoryInput) (*models.Inventory, error)
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

	if err := s.repo.Create(inventory); err != nil {
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
