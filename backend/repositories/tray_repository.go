package repositories

/*
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
	FindActiveProductByID(id uint) (*models.Product, error)
	FindActiveLocationByID(id uint) (*models.Location, error)
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
