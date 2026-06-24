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

type ImportReceiptUpdateInput struct {
	ID           uint
	SupplierName string
	Note         string
	Items        []ImportReceiptCreateItemInput
}

// ImportReceiptCreateItemInput biểu diễn từng dòng item đầu vào.
type ImportReceiptCreateItemInput struct {
	ProductID uint
	Quantity  int
}

type ImportReceiptConfirmInput struct {
	ItemID   uint
	UserID   uint
	TrayCode string
	TrayID   uint
	Quantity int
	Note     string
}

type ImportReceiptAssignInput struct {
	ItemID  uint
	StaffID uint
}

// ImportReceiptService định nghĩa use-cases của module import receipt.
type ImportReceiptService interface {
	Create(input ImportReceiptCreateInput) (*models.ImportReceipt, []models.ImportReceiptItem, error)
	Update(input ImportReceiptUpdateInput) (*models.ImportReceipt, error)
	Delete(id uint) error
	GetAll() ([]models.ImportReceipt, error)
	GetByID(id uint) (*models.ImportReceipt, error)
	GetStaffImportTasks(userID uint, role string) ([]repositories.ImportReceiptTaskRow, error)
	GetImportTaskSummary(userID uint, role string) (repositories.ImportReceiptTaskSummaryRow, error)
	ClaimImportReceiptItem(itemID uint, userID uint) (*models.ImportReceiptItem, error)
	ConfirmImportReceiptItem(input ImportReceiptConfirmInput) (*models.ImportReceiptItem, error)
	AssignImportReceiptItem(input ImportReceiptAssignInput) (*models.ImportReceiptItem, error)
	UnassignImportReceiptItem(itemID uint) (*models.ImportReceiptItem, error)
}

// Nhóm lỗi domain cho service import receipt.
var (
	ErrInvalidImportReceiptPayload = errors.New("invalid import receipt payload")
	ErrInvalidImportReceiptID      = errors.New("invalid import receipt id")
	ErrInvalidImportReceiptItemID  = errors.New("invalid import receipt item id")
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
	repoItems, err := normalizeImportReceiptItems(input.Items)
	if err != nil {
		return nil, nil, err
	}

	input.SupplierName = strings.TrimSpace(input.SupplierName)
	input.Note = strings.TrimSpace(input.Note)

	receipt, items, err := s.repo.CreateReceiptWithItemsAndInventory(
		input.SupplierName,
		input.Note,
		input.CreatedBy,
		repoItems,
	)
	return receipt, items, err
}

func normalizeImportReceiptItems(items []ImportReceiptCreateItemInput) ([]repositories.ImportReceiptCreateItem, error) {
	if len(items) == 0 {
		return nil, ErrInvalidImportReceiptPayload
	}

	seen := make(map[string]struct{}, len(items))
	repoItems := make([]repositories.ImportReceiptCreateItem, 0, len(items))

	for _, item := range items {
		if item.ProductID == 0 || item.Quantity <= 0 {
			return nil, ErrInvalidImportReceiptPayload
		}

		key := fmt.Sprintf("%d", item.ProductID)
		if _, ok := seen[key]; ok {
			return nil, repositories.ErrImportReceiptDuplicateItem
		}
		seen[key] = struct{}{}

		repoItems = append(repoItems, repositories.ImportReceiptCreateItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		})
	}

	return repoItems, nil
}

func (s *importReceiptService) Update(input ImportReceiptUpdateInput) (*models.ImportReceipt, error) {
	if input.ID == 0 {
		return nil, ErrInvalidImportReceiptID
	}
	repoItems, err := normalizeImportReceiptItems(input.Items)
	if err != nil {
		return nil, err
	}

	return s.repo.UpdateReceiptWithItems(repositories.ImportReceiptUpdateInput{
		ID:           input.ID,
		SupplierName: strings.TrimSpace(input.SupplierName),
		Note:         strings.TrimSpace(input.Note),
		Items:        repoItems,
	})
}

func (s *importReceiptService) Delete(id uint) error {
	if id == 0 {
		return ErrInvalidImportReceiptID
	}
	return s.repo.DeleteReceiptByID(id)
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

func (s *importReceiptService) GetStaffImportTasks(userID uint, role string) ([]repositories.ImportReceiptTaskRow, error) {
	return s.repo.FindStaffImportTaskRows(userID, role)
}

func (s *importReceiptService) GetImportTaskSummary(userID uint, role string) (repositories.ImportReceiptTaskSummaryRow, error) {
	return s.repo.GetImportTaskSummary(userID, role)
}

func (s *importReceiptService) ClaimImportReceiptItem(itemID uint, userID uint) (*models.ImportReceiptItem, error) {
	if itemID == 0 {
		return nil, ErrInvalidImportReceiptItemID
	}
	return s.repo.ClaimImportReceiptItem(itemID, userID)
}

func (s *importReceiptService) ConfirmImportReceiptItem(input ImportReceiptConfirmInput) (*models.ImportReceiptItem, error) {
	if input.ItemID == 0 {
		return nil, ErrInvalidImportReceiptItemID
	}
	input.TrayCode = strings.TrimSpace(input.TrayCode)
	input.Note = strings.TrimSpace(input.Note)
	if input.TrayID == 0 && input.TrayCode == "" {
		return nil, repositories.ErrTrayNotFound
	}
	if input.Quantity <= 0 {
		return nil, repositories.ErrInvalidImportQuantity
	}

	return s.repo.ConfirmImportReceiptItem(repositories.ImportReceiptConfirmInput{
		ItemID:   input.ItemID,
		UserID:   input.UserID,
		TrayCode: input.TrayCode,
		TrayID:   input.TrayID,
		Quantity: input.Quantity,
		Note:     input.Note,
	})
}

func (s *importReceiptService) AssignImportReceiptItem(input ImportReceiptAssignInput) (*models.ImportReceiptItem, error) {
	if input.ItemID == 0 || input.StaffID == 0 {
		return nil, ErrInvalidImportReceiptItemID
	}
	return s.repo.AssignImportReceiptItem(input.ItemID, input.StaffID)
}

func (s *importReceiptService) UnassignImportReceiptItem(itemID uint) (*models.ImportReceiptItem, error) {
	if itemID == 0 {
		return nil, ErrInvalidImportReceiptItemID
	}
	return s.repo.UnassignImportReceiptItem(itemID)
}
