package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'location'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewLocationRepository
- Create
- FindAllActive

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"quan_ly_kho/models"

	"gorm.io/gorm"
)

type LocationRepository interface {
	Create(location *models.Location) error
	FindAllActive() ([]models.Location, error)
	FindActiveByID(id uint) (*models.Location, error)
	Update(location *models.Location) error
	SoftDeleteByID(id uint) error
}

type locationRepository struct {
	db DBTX
}

func NewLocationRepository(db DBTX) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(location *models.Location) error {
	if err := r.db.Create(location).Error; err != nil {
		if isUniqueConstraintError(err) {
			return ErrLocationCodeExists
		}
		return err
	}
	return nil
}

func (r *locationRepository) FindAllActive() ([]models.Location, error) {
	var locations []models.Location
	if err := r.db.Where("is_active = ?", true).Find(&locations).Error; err != nil {
		return nil, err
	}
	return locations, nil
}

func (r *locationRepository) FindActiveByID(id uint) (*models.Location, error) {
	var location models.Location
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&location).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLocationNotFound
		}
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) Update(location *models.Location) error {
	if err := r.db.Save(location).Error; err != nil {
		if isUniqueConstraintError(err) {
			return ErrLocationCodeExists
		}
		return err
	}
	return nil
}

func (r *locationRepository) SoftDeleteByID(id uint) error {
	location, err := r.FindActiveByID(id)
	if err != nil {
		return err
	}

	if err := r.db.Model(location).Update("is_active", false).Error; err != nil {
		return err
	}
	return nil
}
