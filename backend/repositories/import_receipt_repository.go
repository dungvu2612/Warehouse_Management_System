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
- ADMIN tao phieu chi tao ke hoach. STAFF confirm tung dong moi cong ton va ghi IMPORT.
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

// ImportReceiptCreateItem biểu diễn 1 dòng nhập kho đầu vào sau khi validate cơ bản.
type ImportReceiptCreateItem struct {
	ProductID uint
	Quantity  int
}

type ImportReceiptTaskRow struct {
	ID               uint       `json:"id"`
	ReceiptID        uint       `json:"receipt_id"`
	ReceiptCode      string     `json:"receipt_code"`
	SupplierName     string     `json:"supplier_name"`
	ProductID        uint       `json:"product_id"`
	ProductCode      string     `json:"product_code"`
	ProductName      string     `json:"product_name"`
	ProductImageURL  string     `json:"product_image_url"`
	ExpectedQuantity int        `json:"expected_quantity"`
	ActualQuantity   int        `json:"actual_quantity"`
	ActualTrayID     *uint      `json:"actual_tray_id"`
	ActualTrayCode   string     `json:"actual_tray_code"`
	Status           string     `json:"status"`
	AssignedTo       *uint      `json:"assigned_to"`
	AssigneeName     string     `json:"assignee_name"`
	AssigneeUsername string     `json:"assignee_username"`
	AssignedAt       *time.Time `json:"assigned_at"`
	CompletedAt      *time.Time `json:"completed_at"`
	CreatedAt        time.Time  `json:"created_at"`
}

type ImportReceiptTaskSummaryRow struct {
	ImportWaitingCount    int `json:"import_waiting_count"`
	ImportInProgressCount int `json:"import_in_progress_count"`
}

type ImportReceiptConfirmInput struct {
	ItemID   uint
	UserID   uint
	TrayCode string
	TrayID   uint
	Quantity int
	Note     string
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
	FindStaffImportTaskRows(userID uint, role string) ([]ImportReceiptTaskRow, error)
	GetImportTaskSummary(userID uint, role string) (ImportReceiptTaskSummaryRow, error)
	ClaimImportReceiptItem(itemID uint, userID uint) (*models.ImportReceiptItem, error)
	ConfirmImportReceiptItem(input ImportReceiptConfirmInput) (*models.ImportReceiptItem, error)
	AssignImportReceiptItem(itemID uint, staffID uint) (*models.ImportReceiptItem, error)
	UnassignImportReceiptItem(itemID uint) (*models.ImportReceiptItem, error)
}

// Nhóm lỗi domain cho import receipt.
var (
	ErrImportReceiptNotFound      = errors.New("import receipt not found")
	ErrImportReceiptItemNotFound  = errors.New("import receipt item not found")
	ErrImportReceiptDuplicateItem = errors.New("duplicate product_id in import receipt")
	ErrImportReceiptTrayMismatch  = errors.New("tray does not belong to the provided product")
	ErrImportTaskAlreadyAssigned  = errors.New("import task already assigned")
	ErrImportTaskNotClaimed       = errors.New("import task not claimed")
	ErrImportTaskNotAssignedToYou = errors.New("import task not assigned to current user")
	ErrImportTaskAlreadyDone      = errors.New("import task already done")
	ErrImportTaskHasQuantity      = errors.New("import task has imported quantity")
	ErrImportQuantityExceeded     = errors.New("import quantity exceeded expected quantity")
	ErrInvalidImportQuantity      = errors.New("invalid import quantity")
)

type importReceiptRepository struct {
	db *gorm.DB
}

// NewImportReceiptRepository tạo repository mới cho module import receipt.
func NewImportReceiptRepository(db *gorm.DB) ImportReceiptRepository {
	return &importReceiptRepository{db: db}
}

// CreateReceiptWithItemsAndInventory tạo phiếu nhập kế hoạch.
// Luồng mới: ADMIN tạo receipt + items; chưa cộng tồn và chưa ghi stock transaction.
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
			Status:       "WAITING",
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
			// 2) Validate product tồn tại và active. Khay sẽ do STAFF quét khi nhập thực tế.
			var product models.Product
			if err := tx.Where("id = ? AND is_active = ?", item.ProductID, true).First(&product).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrProductNotFound
				}
				return err
			}

			// 3) Tạo dòng chi tiết phiếu nhập ở trạng thái chờ nhận.
			receiptItem := models.ImportReceiptItem{
				ReceiptID: receipt.ID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				Status:    "WAITING",
			}
			if err := tx.Create(&receiptItem).Error; err != nil {
				return err
			}
			newItems = append(newItems, receiptItem)
		}

		// 4) Preload items để response đủ dữ liệu.
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

// FindStaffImportTaskRows lấy các dòng phiếu nhập đang là công việc cho màn Tác vụ kho.
func (r *importReceiptRepository) FindStaffImportTaskRows(userID uint, role string) ([]ImportReceiptTaskRow, error) {
	rows := make([]ImportReceiptTaskRow, 0)
	query := r.db.Table("import_receipt_items AS iri").
		Select(`
			iri.id AS id,
			iri.receipt_id AS receipt_id,
			ir.receipt_code AS receipt_code,
			COALESCE(ir.supplier_name, '') AS supplier_name,
			iri.product_id AS product_id,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(p.product_name, '') AS product_name,
			COALESCE(p.image_url, '') AS product_image_url,
			iri.quantity AS expected_quantity,
			COALESCE(iri.actual_quantity, 0) AS actual_quantity,
			iri.actual_tray_id AS actual_tray_id,
			COALESCE(t.tray_code, '') AS actual_tray_code,
			COALESCE(iri.status, 'WAITING') AS status,
			iri.assigned_to AS assigned_to,
			COALESCE(u.full_name, '') AS assignee_name,
			COALESCE(u.username, '') AS assignee_username,
			iri.assigned_at AS assigned_at,
			iri.completed_at AS completed_at,
			iri.created_at AS created_at
		`).
		Joins("JOIN import_receipts AS ir ON ir.id = iri.receipt_id").
		Joins("JOIN products AS p ON p.id = iri.product_id").
		Joins("LEFT JOIN trays AS t ON t.id = iri.actual_tray_id").
		Joins("LEFT JOIN users AS u ON u.id = iri.assigned_to").
		Where("COALESCE(iri.status, 'WAITING') <> ?", "DONE")

	if strings.EqualFold(role, "ADMIN") {
		query = query.Where("(iri.assigned_to IS NULL OR iri.assigned_to IS NOT NULL)")
	} else {
		query = query.Where("(iri.assigned_to IS NULL OR iri.assigned_to = ?)", userID)
	}

	if err := query.Order(clause.Expr{SQL: `
		CASE
			WHEN iri.assigned_to IS NULL THEN 0
			WHEN iri.assigned_to = ? THEN 1
			ELSE 2
		END,
		iri.id DESC
	`, Vars: []interface{}{userID}}).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// GetImportTaskSummary đếm công việc nhập kho để cộng vào badge Tác vụ kho.
func (r *importReceiptRepository) GetImportTaskSummary(userID uint, role string) (ImportReceiptTaskSummaryRow, error) {
	var row ImportReceiptTaskSummaryRow
	var waitingCount int64
	if err := r.db.Model(&models.ImportReceiptItem{}).
		Where("(status IS NULL OR status <> ?)", "DONE").
		Where("assigned_to IS NULL").
		Count(&waitingCount).Error; err != nil {
		return row, err
	}
	row.ImportWaitingCount = int(waitingCount)

	var inProgressCount int64
	query := r.db.Model(&models.ImportReceiptItem{}).
		Where("(status IS NULL OR status <> ?)", "DONE").
		Where("assigned_to IS NOT NULL")
	if !strings.EqualFold(role, "ADMIN") {
		query = query.Where("assigned_to = ?", userID)
	}
	if err := query.Count(&inProgressCount).Error; err != nil {
		return row, err
	}
	row.ImportInProgressCount = int(inProgressCount)
	return row, nil
}

// ClaimImportReceiptItem gán một dòng phiếu nhập cho STAFF hiện tại, chống claim trùng bằng conditional update.
func (r *importReceiptRepository) ClaimImportReceiptItem(itemID uint, userID uint) (*models.ImportReceiptItem, error) {
	var item models.ImportReceiptItem
	err := r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.ImportReceiptItem{}).
			Where("id = ? AND assigned_to IS NULL AND COALESCE(status, 'WAITING') <> ?", itemID, "DONE").
			Updates(map[string]interface{}{
				"assigned_to": userID,
				"assigned_at": time.Now(),
				"status":      "IMPORTING",
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			var existing models.ImportReceiptItem
			if err := tx.First(&existing, itemID).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrImportReceiptItemNotFound
				}
				return err
			}
			if strings.EqualFold(existing.Status, "DONE") {
				return ErrImportTaskAlreadyDone
			}
			if existing.AssignedTo != nil && *existing.AssignedTo != userID {
				return ErrImportTaskAlreadyAssigned
			}
		}
		return tx.First(&item, itemID).Error
	})
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// ConfirmImportReceiptItem cộng tồn thực tế và ghi IMPORT cho dòng phiếu đã được STAFF nhận.
func (r *importReceiptRepository) ConfirmImportReceiptItem(input ImportReceiptConfirmInput) (*models.ImportReceiptItem, error) {
	var updated models.ImportReceiptItem
	if input.Quantity <= 0 {
		return nil, ErrInvalidImportQuantity
	}

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var item models.ImportReceiptItem
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&item, input.ItemID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrImportReceiptItemNotFound
			}
			return err
		}
		if item.AssignedTo == nil {
			return ErrImportTaskNotClaimed
		}
		if *item.AssignedTo != input.UserID {
			return ErrImportTaskNotAssignedToYou
		}
		if strings.EqualFold(item.Status, "DONE") {
			return ErrImportTaskAlreadyDone
		}
		if item.ActualQuantity+input.Quantity > item.Quantity {
			return ErrImportQuantityExceeded
		}

		var tray models.Tray
		trayQuery := tx.Where("is_active = ?", true)
		if input.TrayID > 0 {
			trayQuery = trayQuery.Where("id = ?", input.TrayID)
		} else {
			trayQuery = trayQuery.Where("(LOWER(qr_code) = LOWER(?) OR LOWER(tray_code) = LOWER(?))", strings.TrimSpace(input.TrayCode), strings.TrimSpace(input.TrayCode))
		}
		if err := trayQuery.First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTrayNotFound
			}
			return err
		}
		if tray.ProductID != item.ProductID {
			return ErrTrayNotFound
		}

		var inventory models.Inventory
		findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("product_id = ? AND tray_id = ?", item.ProductID, tray.ID).
			First(&inventory).Error
		if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}

		beforeQuantity := 0
		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			inventory = models.Inventory{
				ProductID: item.ProductID,
				TrayID:    tray.ID,
				Quantity:  0,
			}
			if err := tx.Create(&inventory).Error; err != nil {
				return err
			}
		} else {
			beforeQuantity = inventory.Quantity
		}

		afterQuantity := beforeQuantity + input.Quantity
		inventory.Quantity = afterQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		var receipt models.ImportReceipt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&receipt, item.ReceiptID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrImportReceiptNotFound
			}
			return err
		}

		trayID := tray.ID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeImport,
			ProductID:       item.ProductID,
			TrayID:          &trayID,
			Quantity:        input.Quantity,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   afterQuantity,
			ReferenceCode:   receipt.ReceiptCode,
			Note:            input.Note,
		}
		if input.UserID > 0 {
			stockTx.CreatedBy = &input.UserID
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		item.ActualQuantity += input.Quantity
		item.ActualTrayID = &trayID
		item.TrayID = &trayID
		if item.ActualQuantity >= item.Quantity {
			item.Status = "DONE"
			now := time.Now()
			item.CompletedAt = &now
		} else {
			item.Status = "PARTIAL"
		}
		if err := tx.Save(&item).Error; err != nil {
			return err
		}

		if err := refreshImportReceiptStatusTx(tx, item.ReceiptID); err != nil {
			return err
		}

		updated = item
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

// AssignImportReceiptItem cho ADMIN gán một dòng phiếu nhập chưa phát sinh nhập kho cho STAFF.
func (r *importReceiptRepository) AssignImportReceiptItem(itemID uint, staffID uint) (*models.ImportReceiptItem, error) {
	var item models.ImportReceiptItem
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureStaffUserTx(tx, staffID); err != nil {
			return err
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&item, itemID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrImportReceiptItemNotFound
			}
			return err
		}
		if item.ActualQuantity > 0 {
			return ErrImportTaskHasQuantity
		}
		if strings.EqualFold(item.Status, "DONE") {
			return ErrImportTaskAlreadyDone
		}
		now := time.Now()
		item.AssignedTo = &staffID
		item.AssignedAt = &now
		item.Status = "IMPORTING"
		if err := tx.Save(&item).Error; err != nil {
			return err
		}
		return refreshImportReceiptStatusTx(tx, item.ReceiptID)
	})
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// UnassignImportReceiptItem cho ADMIN gỡ phân công nếu dòng chưa phát sinh nhập kho.
func (r *importReceiptRepository) UnassignImportReceiptItem(itemID uint) (*models.ImportReceiptItem, error) {
	var item models.ImportReceiptItem
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&item, itemID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrImportReceiptItemNotFound
			}
			return err
		}
		if item.ActualQuantity > 0 {
			return ErrImportTaskHasQuantity
		}
		if err := tx.Model(&item).Updates(map[string]interface{}{
			"assigned_to": nil,
			"assigned_at": nil,
			"status":      "WAITING",
		}).Error; err != nil {
			return err
		}
		if err := tx.First(&item, itemID).Error; err != nil {
			return err
		}
		return refreshImportReceiptStatusTx(tx, item.ReceiptID)
	})
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func ensureStaffUserTx(tx *gorm.DB, staffID uint) error {
	var user models.User
	if err := tx.Where("id = ? AND is_active = ?", staffID, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrStaffNotFound
		}
		return err
	}
	if !strings.EqualFold(strings.TrimSpace(user.Role), "STAFF") {
		return ErrInvalidStaffRole
	}
	return nil
}

func refreshImportReceiptStatusTx(tx *gorm.DB, receiptID uint) error {
	var total int64
	if err := tx.Model(&models.ImportReceiptItem{}).Where("receipt_id = ?", receiptID).Count(&total).Error; err != nil {
		return err
	}
	if total == 0 {
		return nil
	}

	var done int64
	if err := tx.Model(&models.ImportReceiptItem{}).
		Where("receipt_id = ? AND status = ?", receiptID, "DONE").
		Count(&done).Error; err != nil {
		return err
	}

	status := "PROCESSING"
	if done == total {
		status = "COMPLETED"
	}

	return tx.Model(&models.ImportReceipt{}).Where("id = ?", receiptID).Update("status", status).Error
}
