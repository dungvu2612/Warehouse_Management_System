package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'import_receipt'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewImportReceiptService
- Create
- GetAll
- GetByID

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"fmt"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

// ImportReceiptCreateInput biểu diễn payload nghiệp vụ tạo phiếu nhập.
type ImportReceiptCreateInput struct {
	SupplierName string
	Note         string
	CreatedBy    uint
	Items        []ImportReceiptCreateItemInput
}

// ImportReceiptCreateItemInput biểu diễn từng dòng item đầu vào.
type ImportReceiptCreateItemInput struct {
	ProductID uint
	TrayID    uint
	Quantity  int
}

// ImportReceiptService định nghĩa use-cases của module import receipt.
type ImportReceiptService interface {
	Create(input ImportReceiptCreateInput) (*models.ImportReceipt, []models.ImportReceiptItem, error)
	GetAll() ([]models.ImportReceipt, error)
	GetByID(id uint) (*models.ImportReceipt, error)
}

// Nhóm lỗi domain cho service import receipt.
var (
	ErrInvalidImportReceiptPayload = errors.New("invalid import receipt payload")
	ErrInvalidImportReceiptID      = errors.New("invalid import receipt id")
)

type importReceiptService struct {
	repo repositories.ImportReceiptRepository
}

// NewImportReceiptService khởi tạo service import receipt.
func NewImportReceiptService(repo repositories.ImportReceiptRepository) ImportReceiptService {
	return &importReceiptService{repo: repo}
}

// Create tạo phiếu nhập mới sau khi validate payload nghiệp vụ.
func (s *importReceiptService) Create(input ImportReceiptCreateInput) (*models.ImportReceipt, []models.ImportReceiptItem, error) {
	if len(input.Items) == 0 {
		return nil, nil, ErrInvalidImportReceiptPayload
	}

	// Chuẩn hóa text để tránh lưu khoảng trắng thừa.
	input.SupplierName = strings.TrimSpace(input.SupplierName)
	input.Note = strings.TrimSpace(input.Note)

	// Validate duplicate product+tray trong cùng payload để fail sớm.
	seen := make(map[string]struct{}, len(input.Items))
	repoItems := make([]repositories.ImportReceiptCreateItem, 0, len(input.Items))

	for _, item := range input.Items {
		if item.ProductID == 0 || item.TrayID == 0 || item.Quantity <= 0 {
			return nil, nil, ErrInvalidImportReceiptPayload
		}

		key := fmt.Sprintf("%d-%d", item.ProductID, item.TrayID)
		if _, ok := seen[key]; ok {
			return nil, nil, repositories.ErrImportReceiptDuplicateItem
		}
		seen[key] = struct{}{}

		repoItems = append(repoItems, repositories.ImportReceiptCreateItem{
			ProductID: item.ProductID,
			TrayID:    item.TrayID,
			Quantity:  item.Quantity,
		})
	}

	return s.repo.CreateReceiptWithItemsAndInventory(
		input.SupplierName,
		input.Note,
		input.CreatedBy,
		repoItems,
	)
}

// GetAll lấy danh sách phiếu nhập.
func (s *importReceiptService) GetAll() ([]models.ImportReceipt, error) {
	return s.repo.FindAll()
}

// GetByID lấy chi tiết 1 phiếu nhập.
func (s *importReceiptService) GetByID(id uint) (*models.ImportReceipt, error) {
	if id == 0 {
		return nil, ErrInvalidImportReceiptID
	}
	return s.repo.FindByID(id)
}
