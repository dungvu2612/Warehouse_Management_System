package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'import_receipt'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewImportReceiptRepository
- CreateReceiptWithItemsAndInventory
- FindAll
- FindByID

Luu y khi sua:
- Toan bo create receipt + tang ton + ghi stock transaction phai o cung transaction atomic.
*/

import (
	"errors"
	"fmt"
	"time"

	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ImportReceiptCreateItem biểu diễn 1 dòng nhập kho đầu vào sau khi validate cơ bản.
type ImportReceiptCreateItem struct {
	ProductID uint
	TrayID    uint
	Quantity  int
}

// ImportReceiptRepository định nghĩa data-access cho nghiệp vụ nhập kho.
type ImportReceiptRepository interface {
	CreateReceiptWithItemsAndInventory(
		supplierName string,
		note string,
		createdBy uint,
		items []ImportReceiptCreateItem,
	) (*models.ImportReceipt, []models.ImportReceiptItem, error)
	FindAll() ([]models.ImportReceipt, error)
	FindByID(id uint) (*models.ImportReceipt, error)
}

// Nhóm lỗi domain cho import receipt.
var (
	ErrImportReceiptNotFound      = errors.New("import receipt not found")
	ErrImportReceiptDuplicateItem = errors.New("duplicate product_id and tray_id in import receipt")
	ErrImportReceiptTrayMismatch  = errors.New("tray does not belong to the provided product")
)

type importReceiptRepository struct {
	db *gorm.DB
}

// NewImportReceiptRepository tạo repository mới cho module import receipt.
func NewImportReceiptRepository(db *gorm.DB) ImportReceiptRepository {
	return &importReceiptRepository{db: db}
}

// CreateReceiptWithItemsAndInventory chạy transaction nhập kho đầy đủ.
// Luồng: tạo receipt -> validate product/tray -> upsert inventory -> tạo item -> tạo stock transaction.
func (r *importReceiptRepository) CreateReceiptWithItemsAndInventory(
	supplierName string,
	note string,
	createdBy uint,
	items []ImportReceiptCreateItem,
) (*models.ImportReceipt, []models.ImportReceiptItem, error) {
	var createdReceipt models.ImportReceipt
	var createdItems []models.ImportReceiptItem

	// Transaction đảm bảo atomic cho toàn bộ nghiệp vụ nhập kho.
	err := r.db.Transaction(func(tx *gorm.DB) error {
		receiptCode := fmt.Sprintf("IMP-%d", time.Now().UnixNano())
		receipt := models.ImportReceipt{
			ReceiptCode:  receiptCode,
			SupplierName: supplierName,
			Note:         note,
		}
		if createdBy > 0 {
			receipt.CreatedBy = &createdBy
		}

		// 1) Tạo phiếu nhập header.
		if err := tx.Create(&receipt).Error; err != nil {
			return err
		}

		newItems := make([]models.ImportReceiptItem, 0, len(items))
		for _, item := range items {
			// 2) Validate tray tồn tại và active.
			var tray models.Tray
			if err := tx.Where("id = ? AND is_active = ?", item.TrayID, true).First(&tray).Error; err != nil {
				return err
			}
			// 3) Tray phải thuộc đúng product.
			if tray.ProductID != item.ProductID {
				return ErrImportReceiptTrayMismatch
			}

			// 4) Validate product tồn tại và active.
			var product models.Product
			if err := tx.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
				return err
			}

			// 5) Lock row inventory để tránh race condition nhập đồng thời.
			var inventory models.Inventory
			findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("product_id = ? AND tray_id = ?", item.ProductID, item.TrayID).
				First(&inventory).Error
			if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
				return findErr
			}

			beforeQty := 0
			afterQty := item.Quantity

			// 6) Nếu chưa có inventory row thì tạo mới, ngược lại cộng dồn.
			if errors.Is(findErr, gorm.ErrRecordNotFound) {
				inventory = models.Inventory{
					ProductID: item.ProductID,
					TrayID:    item.TrayID,
					Quantity:  item.Quantity,
				}
				if err := tx.Create(&inventory).Error; err != nil {
					return err
				}
			} else {
				beforeQty = inventory.Quantity
				inventory.Quantity += item.Quantity
				afterQty = inventory.Quantity
				if err := tx.Save(&inventory).Error; err != nil {
					return err
				}
			}

			// 7) Tạo dòng chi tiết phiếu nhập.
			receiptItem := models.ImportReceiptItem{
				ReceiptID: receipt.ID,
				ProductID: item.ProductID,
				TrayID:    item.TrayID,
				Quantity:  item.Quantity,
			}
			if err := tx.Create(&receiptItem).Error; err != nil {
				return err
			}
			newItems = append(newItems, receiptItem)

			// 8) Ghi log stock transaction loại IMPORT.
			trayID := item.TrayID
			stockTx := models.StockTransaction{
				TransactionType: utils.StockTxTypeImport,
				ProductID:       item.ProductID,
				TrayID:          &trayID,
				Quantity:        item.Quantity,
				BeforeQuantity:  beforeQty,
				AfterQuantity:   afterQty,
				ReferenceCode:   receipt.ReceiptCode,
				Note:            note,
			}
			if createdBy > 0 {
				stockTx.CreatedBy = &createdBy
			}
			if err := tx.Create(&stockTx).Error; err != nil {
				return err
			}
		}

		// 9) Preload items để response đủ dữ liệu.
		if err := tx.Preload("Items").First(&receipt, receipt.ID).Error; err != nil {
			return err
		}

		createdReceipt = receipt
		createdItems = newItems
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	return &createdReceipt, createdItems, nil
}

// FindAll lấy danh sách phiếu nhập theo thứ tự mới nhất.
func (r *importReceiptRepository) FindAll() ([]models.ImportReceipt, error) {
	var receipts []models.ImportReceipt
	if err := r.db.Preload("Items").Order("id DESC").Find(&receipts).Error; err != nil {
		return nil, err
	}
	return receipts, nil
}

// FindByID lấy chi tiết 1 phiếu nhập.
func (r *importReceiptRepository) FindByID(id uint) (*models.ImportReceipt, error) {
	var receipt models.ImportReceipt
	if err := r.db.Preload("Items").First(&receipt, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrImportReceiptNotFound
		}
		return nil, err
	}
	return &receipt, nil
}
