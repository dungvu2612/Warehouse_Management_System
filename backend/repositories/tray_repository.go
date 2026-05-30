package repositories

/*
Thong tin handover:
- File nay la data-access layer cho module Tray, da mo rong CRUD + helper sequence cho sinh ma khay.
- Phu thuoc vao DBTX abstraction trong common.go de query/soft-delete ma khong khoa chat vao *gorm.DB.
- Luu y bao tri: sequence lay theo pattern `<LOCATION_CODE>-T<number>` tren toan bo bang trays (ca active va inactive) de tranh reuse ma.

Mo ta file:
- File nay la data-access layer cho module 'tray'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewTrayRepository
- Create
- FindAllActive
- FindActiveProductByID
- FindActiveLocationByID

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"

	"quan_ly_kho/models"

	"gorm.io/gorm"
)

var (
	ErrTrayNotFound     = errors.New("tray not found")
	ErrProductNotFound  = errors.New("product not found")
	ErrLocationNotFound = errors.New("location not found")
)

type TrayRepository interface {
	Create(tray *models.Tray) error
	FindAllActive() ([]models.Tray, error)
	FindActiveByID(id uint) (*models.Tray, error)
	FindActiveByQRCode(qrCode string) (*models.Tray, error)
	Update(tray *models.Tray) error
	SoftDeleteByID(id uint) error
	FindActiveProductByID(id uint) (*models.Product, error)
	FindActiveLocationByID(id uint) (*models.Location, error)
	FindMaxTraySequenceByLocationCode(locationCode string) (int, error)
	FindScanInventoryByTrayID(trayID uint) ([]TrayScanInventoryRow, error)
}

// TrayScanInventoryRow la read-model inventory + product theo tray scan.
type TrayScanInventoryRow struct {
	InventoryID uint
	ProductID   uint
	ProductCode string
	ProductName string
	Quantity    int
}

type trayRepository struct {
	db DBTX
}

func NewTrayRepository(db DBTX) TrayRepository {
	return &trayRepository{db: db}
}

func (r *trayRepository) Create(tray *models.Tray) error {
	if err := r.db.Create(tray).Error; err != nil {
		if isUniqueConstraintError(err) {
			return ErrTrayCodeExists
		}
		return err
	}
	return nil
}

func (r *trayRepository) FindAllActive() ([]models.Tray, error) {
	var trays []models.Tray
	if err := r.db.Where("is_active = ?", true).Find(&trays).Error; err != nil {
		return nil, err
	}
	return trays, nil
}

func (r *trayRepository) FindActiveByID(id uint) (*models.Tray, error) {
	var tray models.Tray
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&tray).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrayNotFound
		}
		return nil, err
	}
	return &tray, nil
}

func (r *trayRepository) FindActiveByQRCode(qrCode string) (*models.Tray, error) {
	var tray models.Tray
	if err := r.db.Where("qr_code = ? AND is_active = ?", qrCode, true).First(&tray).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTrayNotFound
		}
		return nil, err
	}
	return &tray, nil
}

func (r *trayRepository) Update(tray *models.Tray) error {
	if err := r.db.Save(tray).Error; err != nil {
		if isUniqueConstraintError(err) {
			return ErrTrayCodeExists
		}
		return err
	}
	return nil
}

func (r *trayRepository) SoftDeleteByID(id uint) error {
	tray, err := r.FindActiveByID(id)
	if err != nil {
		return err
	}

	if err := r.db.Model(tray).Update("is_active", false).Error; err != nil {
		return err
	}
	return nil
}

func (r *trayRepository) FindActiveProductByID(id uint) (*models.Product, error) {
	var product models.Product
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &product, nil
}

func (r *trayRepository) FindActiveLocationByID(id uint) (*models.Location, error) {
	var location models.Location
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&location).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLocationNotFound
		}
		return nil, err
	}
	return &location, nil
}

func (r *trayRepository) FindMaxTraySequenceByLocationCode(locationCode string) (int, error) {
	var maxSeq int
	pattern := locationCode + "-T%"

	// Senior Handover: Lay sequence lon nhat theo prefix location_code, de sinh ma tiep theo dang A-01-T01.
	if err := r.db.Raw(`
		SELECT COALESCE(MAX(CAST(SUBSTRING(tray_code FROM '.+-T([0-9]+)$') AS INTEGER)), 0) AS max_seq
		FROM trays
		WHERE tray_code LIKE ?
	`, pattern).Scan(&maxSeq).Error; err != nil {
		return 0, err
	}

	return maxSeq, nil
}

func (r *trayRepository) FindScanInventoryByTrayID(trayID uint) ([]TrayScanInventoryRow, error) {
	rows := make([]TrayScanInventoryRow, 0)
	if err := r.db.Raw(`
		SELECT
			i.id AS inventory_id,
			i.product_id AS product_id,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(p.product_name, '') AS product_name,
			COALESCE(i.quantity, 0) AS quantity
		FROM inventory i
		LEFT JOIN products p ON p.id = i.product_id
		WHERE i.tray_id = ?
		ORDER BY i.updated_at DESC, i.id DESC
	`, trayID).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
