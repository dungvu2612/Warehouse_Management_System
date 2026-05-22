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
	"quan_ly_kho/models"
)

type LocationRepository interface {
	Create(location *models.Location) error
	FindAllActive() ([]models.Location, error)
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
