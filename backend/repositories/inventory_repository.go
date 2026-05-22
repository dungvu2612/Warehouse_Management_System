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

	"quan_ly_kho/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrInventoryNotFound      = errors.New("inventory not found")
	ErrInventoryAlreadyExists = errors.New("inventory for this product and tray already exists")
	ErrInventoryInsufficient  = errors.New("insufficient inventory quantity")
)

type InventoryFilters struct {
	ProductID *uint
	TrayID    *uint
}

type InventoryRepository interface {
	FindAll(filters InventoryFilters) ([]models.Inventory, error)
	FindActiveProductByID(id uint) (*models.Product, error)
	FindActiveTrayByID(id uint) (*models.Tray, error)
	Create(inventory *models.Inventory) error
	AdjustWithTransaction(inventoryID uint, delta int, note string, createdBy uint) (*models.Inventory, error)
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

func (r *inventoryRepository) Create(inventory *models.Inventory) error {
	if err := r.db.Create(inventory).Error; err != nil {
		if isUniqueConstraintError(err) {
			return ErrInventoryAlreadyExists
		}
		return err
	}
	return nil
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
			TransactionType: "ADJUST",
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
