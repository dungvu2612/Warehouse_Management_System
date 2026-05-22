package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'bom'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewBOMService
- Create
- GetAll
- GetItemsByBOMID

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

// BOMCreateItemInput là DTO item đầu vào ở layer service.
type BOMCreateItemInput struct {
	ComponentProductID uint
	Quantity           int
}

// BOMCreateInput là DTO tạo BOM ở layer service.
type BOMCreateInput struct {
	ProductID   uint
	BOMName     string
	Description string
	Items       []BOMCreateItemInput
}

// BOMListQuery gom filter query string cho API list BOM.
type BOMListQuery struct {
	ProductIDRaw string
}

// BOMService định nghĩa use-cases của module BOM.
type BOMService interface {
	Create(input BOMCreateInput) (*models.BOM, error)
	GetAll(query BOMListQuery) ([]models.BOM, error)
	GetItemsByBOMID(bomID uint) (*models.BOM, []models.BOMItem, error)
}

// Nhóm lỗi nghiệp vụ của module BOM ở layer service.
var (
	ErrInvalidBOMPayload = errors.New("invalid bom payload")
	ErrInvalidBOMID      = errors.New("invalid bom id")
)

type bomService struct {
	repo repositories.BOMRepository
}

// NewBOMService khởi tạo service cho module BOM.
func NewBOMService(repo repositories.BOMRepository) BOMService {
	return &bomService{repo: repo}
}

// Create validate/normalize rồi gọi repository tạo BOM trong transaction.
func (s *bomService) Create(input BOMCreateInput) (*models.BOM, error) {
	if input.ProductID == 0 || len(input.Items) == 0 {
		return nil, ErrInvalidBOMPayload
	}

	input.BOMName = strings.TrimSpace(input.BOMName)
	input.Description = strings.TrimSpace(input.Description)

	// Validate duplicate component trong cùng request để fail sớm.
	componentSeen := make(map[uint]struct{}, len(input.Items))
	mappedItems := make([]repositories.BOMCreateItemInput, 0, len(input.Items))

	for _, item := range input.Items {
		if item.ComponentProductID == 0 || item.Quantity <= 0 {
			return nil, ErrInvalidBOMPayload
		}
		if _, exists := componentSeen[item.ComponentProductID]; exists {
			return nil, repositories.ErrBOMDuplicateComponent
		}
		componentSeen[item.ComponentProductID] = struct{}{}

		mappedItems = append(mappedItems, repositories.BOMCreateItemInput{
			ComponentProductID: item.ComponentProductID,
			Quantity:           item.Quantity,
		})
	}

	return s.repo.CreateWithItems(repositories.BOMCreateInput{
		ProductID:   input.ProductID,
		BOMName:     input.BOMName,
		Description: input.Description,
		Items:       mappedItems,
	})
}

// GetAll lấy danh sách BOM theo filter product_id tùy chọn.
func (s *bomService) GetAll(query BOMListQuery) ([]models.BOM, error) {
	filters := repositories.BOMListFilters{}

	if strings.TrimSpace(query.ProductIDRaw) != "" {
		productID, err := strconv.ParseUint(strings.TrimSpace(query.ProductIDRaw), 10, 64)
		if err != nil || productID == 0 {
			return nil, errors.New("invalid product_id")
		}
		productIDUint := uint(productID)
		filters.ProductID = &productIDUint
	}

	return s.repo.FindAll(filters)
}

// GetItemsByBOMID trả BOM header + danh sách component items.
func (s *bomService) GetItemsByBOMID(bomID uint) (*models.BOM, []models.BOMItem, error) {
	if bomID == 0 {
		return nil, nil, ErrInvalidBOMID
	}

	bom, err := s.repo.FindByID(bomID)
	if err != nil {
		return nil, nil, err
	}

	items, err := s.repo.FindItemsByBOMID(bom.ID)
	if err != nil {
		return nil, nil, err
	}

	return bom, items, nil
}
