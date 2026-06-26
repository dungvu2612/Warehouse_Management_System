package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'inventory'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewInventoryRepository
- FindAll
- FindActiveProductByID
- FindActiveTrayByID
- Create
- AdjustWithTransaction

Luu y khi sua:
- Adjust ton phai lock row inventory truoc khi tinh before/after quantity.
*/

import (
	"errors"
	"strings"
	"time"

	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrInventoryNotFound      = errors.New("inventory not found")
	ErrInventoryAlreadyExists = errors.New("inventory for this product and tray already exists")
	ErrInventoryInsufficient  = errors.New("insufficient inventory quantity")
	ErrPutawayRequestNotFound = errors.New("putaway request not found")
)

type InventoryFilters struct {
	ProductID *uint
	TrayID    *uint
}

type InventoryRepository interface {
	FindAll(filters InventoryFilters) ([]models.Inventory, error)
	FindActiveProductByID(id uint) (*models.Product, error)
	FindActiveTrayByID(id uint) (*models.Tray, error)
	Create(inventory *models.Inventory, note string, createdBy uint) error
	AdjustWithTransaction(inventoryID uint, delta int, note string, createdBy uint) (*models.Inventory, error)
	AdjustByTrayQRCode(trayQRCode string, delta int, note string, createdBy uint, referenceCode string) (*models.Inventory, error)
	PutawayByScan(productQRCode string, trayQRCode string, quantity int, note string, createdBy uint, referenceCode string) (*models.Inventory, error)
	StocktakeByTrayQRCode(trayQRCode string, physicalQty int, note string, createdBy uint, referenceCode string) (*models.Inventory, int, error)
	CreatePutawayRequest(req *models.PutawayRequest) error
	FindPutawayRequestsByStatus(status string) ([]models.PutawayRequest, error)
	FindPutawayRequestByID(id uint) (*models.PutawayRequest, error)
	ApprovePutawayRequest(id uint, approvedBy uint) (*models.PutawayRequest, *models.Inventory, error)
	RejectPutawayRequest(id uint, approvedBy uint, reason string) (*models.PutawayRequest, error)
}

type inventoryRepository struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) InventoryRepository {
	return &inventoryRepository{db: db}
}

func (r *inventoryRepository) FindAll(filters InventoryFilters) ([]models.Inventory, error) {
	var inventories []models.Inventory
	query := r.db.Model(&models.Inventory{})

	if filters.ProductID != nil {
		query = query.Where("product_id = ?", *filters.ProductID)
	}
	if filters.TrayID != nil {
		query = query.Where("tray_id = ?", *filters.TrayID)
	}

	if err := query.Find(&inventories).Error; err != nil {
		return nil, err
	}
	return inventories, nil
}

func (r *inventoryRepository) FindActiveProductByID(id uint) (*models.Product, error) {
	var product models.Product
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &product, nil
}

func (r *inventoryRepository) FindActiveTrayByID(id uint) (*models.Tray, error) {
	var tray models.Tray
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&tray).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrayNotFound
		}
		return nil, err
	}
	return &tray, nil
}

func (r *inventoryRepository) Create(inventory *models.Inventory, note string, createdBy uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(inventory).Error; err != nil {
			if isUniqueConstraintError(err) {
				return ErrInventoryAlreadyExists
			}
			return err
		}

		if inventory.Quantity <= 0 {
			return nil
		}

		trayID := inventory.TrayID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeImport,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        inventory.Quantity,
			BeforeQuantity:  0,
			AfterQuantity:   inventory.Quantity,
			Note:            note,
		}
		if createdBy > 0 {
			stockTx.CreatedBy = &createdBy
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *inventoryRepository) AdjustWithTransaction(inventoryID uint, delta int, note string, createdBy uint) (*models.Inventory, error) {
	var updated models.Inventory

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var inventory models.Inventory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", inventoryID).
			First(&inventory).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInventoryNotFound
			}
			return err
		}

		newQuantity := inventory.Quantity + delta
		if newQuantity < 0 {
			return ErrInventoryInsufficient
		}

		beforeQuantity := inventory.Quantity
		inventory.Quantity = newQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		trayID := inventory.TrayID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeAdjust,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        delta,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   newQuantity,
			Note:            note,
		}
		if createdBy > 0 {
			stockTx.CreatedBy = &createdBy
		}

		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		updated = inventory
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *inventoryRepository) AdjustByTrayQRCode(trayQRCode string, delta int, note string, createdBy uint, referenceCode string) (*models.Inventory, error) {
	var updated models.Inventory

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var tray models.Tray
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("qr_code = ? AND is_active = ?", strings.TrimSpace(trayQRCode), true).
			First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTrayNotFound
			}
			return err
		}

		var inventory models.Inventory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("tray_id = ? AND product_id = ?", tray.ID, tray.ProductID).
			First(&inventory).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInventoryNotFound
			}
			return err
		}

		beforeQuantity := inventory.Quantity
		afterQuantity := beforeQuantity + delta
		if afterQuantity < 0 {
			return ErrInventoryInsufficient
		}

		inventory.Quantity = afterQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		trayID := inventory.TrayID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeAdjust,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        delta,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   afterQuantity,
			ReferenceCode:   referenceCode,
			Note:            note,
		}
		if createdBy > 0 {
			stockTx.CreatedBy = &createdBy
		}

		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		updated = inventory
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &updated, nil
}

func (r *inventoryRepository) PutawayByScan(productQRCode string, trayQRCode string, quantity int, note string, createdBy uint, referenceCode string) (*models.Inventory, error) {
	var updated models.Inventory
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var product models.Product
		if err := tx.Where("qr_code = ? AND is_active = ?", strings.TrimSpace(productQRCode), true).First(&product).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrProductNotFound
			}
			return err
		}

		var tray models.Tray
		if err := tx.Where("qr_code = ? AND is_active = ?", strings.TrimSpace(trayQRCode), true).First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTrayNotFound
			}
			return err
		}
		if tray.ProductID != product.ID {
			return ErrTrayNotFound
		}

		var inventory models.Inventory
		findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("product_id = ? AND tray_id = ?", product.ID, tray.ID).
			First(&inventory).Error

		beforeQuantity := 0
		if findErr != nil {
			if !errors.Is(findErr, gorm.ErrRecordNotFound) {
				return findErr
			}

			inventory = models.Inventory{
				ProductID: product.ID,
				TrayID:    tray.ID,
				Quantity:  0,
			}
			if err := tx.Create(&inventory).Error; err != nil {
				return err
			}
		} else {
			beforeQuantity = inventory.Quantity
		}

		afterQuantity := inventory.Quantity + quantity
		inventory.Quantity = afterQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		trayID := inventory.TrayID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeImport,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        quantity,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   afterQuantity,
			ReferenceCode:   referenceCode,
			Note:            note,
		}
		if createdBy > 0 {
			stockTx.CreatedBy = &createdBy
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		updated = inventory
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *inventoryRepository) StocktakeByTrayQRCode(trayQRCode string, physicalQty int, note string, createdBy uint, referenceCode string) (*models.Inventory, int, error) {
	var updated models.Inventory
	var delta int
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var tray models.Tray
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("qr_code = ? AND is_active = ?", strings.TrimSpace(trayQRCode), true).
			First(&tray).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTrayNotFound
			}
			return err
		}

		var inventory models.Inventory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("tray_id = ? AND product_id = ?", tray.ID, tray.ProductID).
			First(&inventory).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInventoryNotFound
			}
			return err
		}

		beforeQuantity := inventory.Quantity
		delta = physicalQty - beforeQuantity
		afterQuantity := physicalQty

		inventory.Quantity = afterQuantity
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		trayID := inventory.TrayID
		stockTx := models.StockTransaction{
			TransactionType: utils.StockTxTypeAdjust,
			ProductID:       inventory.ProductID,
			TrayID:          &trayID,
			Quantity:        delta,
			BeforeQuantity:  beforeQuantity,
			AfterQuantity:   afterQuantity,
			ReferenceCode:   referenceCode,
			Note:            note,
		}
		if createdBy > 0 {
			stockTx.CreatedBy = &createdBy
		}
		if err := tx.Create(&stockTx).Error; err != nil {
			return err
		}

		updated = inventory
		return nil
	})
	if err != nil {
		return nil, 0, err
	}
	return &updated, delta, nil
}

func (r *inventoryRepository) CreatePutawayRequest(req *models.PutawayRequest) error {
	if err := r.db.Create(req).Error; err != nil {
		return err
	}
	return nil
}

func (r *inventoryRepository) FindPutawayRequestsByStatus(status string) ([]models.PutawayRequest, error) {
	var rows []models.PutawayRequest
	query := r.db.Model(&models.PutawayRequest{}).Order("created_at DESC")
	if strings.TrimSpace(status) != "" && strings.ToUpper(strings.TrimSpace(status)) != "ALL" {
		query = query.Where("status = ?", strings.ToUpper(strings.TrimSpace(status)))
	}
	if err := query.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *inventoryRepository) FindPutawayRequestByID(id uint) (*models.PutawayRequest, error) {
	var row models.PutawayRequest
	if err := r.db.Where("id = ?", id).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPutawayRequestNotFound
		}
		return nil, err
	}
	return &row, nil
}

func (r *inventoryRepository) ApprovePutawayRequest(id uint, approvedBy uint) (*models.PutawayRequest, *models.Inventory, error) {
	var updatedRequest models.PutawayRequest
	var updatedInventory *models.Inventory
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var req models.PutawayRequest
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).
			First(&req).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrPutawayRequestNotFound
			}
			return err
		}
		if req.Status != "PENDING" {
			return errors.New("putaway request is not pending")
		}

		inventory, err := r.putawayByScanTx(tx, req.ProductQRCode, req.TrayQRCode, req.Quantity, req.Note, approvedBy, req.ReferenceCode)
		if err != nil {
			return err
		}

		now := time.Now()
		req.Status = "APPROVED"
		req.ApprovedBy = &approvedBy
		req.ApprovedAt = &now
		req.RejectReason = ""
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		updatedRequest = req
		updatedInventory = inventory
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	return &updatedRequest, updatedInventory, nil
}

func (r *inventoryRepository) RejectPutawayRequest(id uint, approvedBy uint, reason string) (*models.PutawayRequest, error) {
	var updated models.PutawayRequest
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var req models.PutawayRequest
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).
			First(&req).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrPutawayRequestNotFound
			}
			return err
		}
		if req.Status != "PENDING" {
			return errors.New("putaway request is not pending")
		}
		now := time.Now()
		req.Status = "REJECTED"
		req.ApprovedBy = &approvedBy
		req.ApprovedAt = &now
		req.RejectReason = strings.TrimSpace(reason)
		if err := tx.Save(&req).Error; err != nil {
			return err
		}
		updated = req
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *inventoryRepository) putawayByScanTx(tx *gorm.DB, productQRCode string, trayQRCode string, quantity int, note string, createdBy uint, referenceCode string) (*models.Inventory, error) {
	var updated models.Inventory
	var product models.Product
	if err := tx.Where("qr_code = ? AND is_active = ?", strings.TrimSpace(productQRCode), true).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	var tray models.Tray
	if err := tx.Where("qr_code = ? AND is_active = ?", strings.TrimSpace(trayQRCode), true).First(&tray).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrayNotFound
		}
		return nil, err
	}
	if tray.ProductID != product.ID {
		return nil, ErrTrayNotFound
	}

	var inventory models.Inventory
	findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("product_id = ? AND tray_id = ?", product.ID, tray.ID).
		First(&inventory).Error

	beforeQuantity := 0
	if findErr != nil {
		if !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return nil, findErr
		}
		inventory = models.Inventory{
			ProductID: product.ID,
			TrayID:    tray.ID,
			Quantity:  0,
		}
		if err := tx.Create(&inventory).Error; err != nil {
			return nil, err
		}
	} else {
		beforeQuantity = inventory.Quantity
	}

	afterQuantity := inventory.Quantity + quantity
	inventory.Quantity = afterQuantity
	if err := tx.Save(&inventory).Error; err != nil {
		return nil, err
	}

	trayID := inventory.TrayID
	stockTx := models.StockTransaction{
		TransactionType: utils.StockTxTypeImport,
		ProductID:       inventory.ProductID,
		TrayID:          &trayID,
		Quantity:        quantity,
		BeforeQuantity:  beforeQuantity,
		AfterQuantity:   afterQuantity,
		ReferenceCode:   referenceCode,
		Note:            note,
	}
	if createdBy > 0 {
		stockTx.CreatedBy = &createdBy
	}
	if err := tx.Create(&stockTx).Error; err != nil {
		return nil, err
	}
	updated = inventory
	return &updated, nil
}
