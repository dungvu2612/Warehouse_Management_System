package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'pick_log'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewPickLogRepository
- FindAllByFilters

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"time"

	"quan_ly_kho/models"
)

type PickLogRepository interface {
	FindAllByFilters(filters PickLogFilters) ([]models.PickLog, error)
}

type PickLogFilters struct {
	OrderID  *uint
	PickedBy *uint
	DateFrom *time.Time
	DateTo   *time.Time
	Limit    int
}

type pickLogRepository struct {
	db DBTX
}

func NewPickLogRepository(db DBTX) PickLogRepository {
	return &pickLogRepository{db: db}
}

func (r *pickLogRepository) FindAllByFilters(filters PickLogFilters) ([]models.PickLog, error) {
	var logs []models.PickLog
	query := r.db.Model(&models.PickLog{})

	if filters.OrderID != nil {
		query = query.Where("order_id = ?", *filters.OrderID)
	}
	if filters.PickedBy != nil {
		query = query.Where("picked_by = ?", *filters.PickedBy)
	}
	if filters.DateFrom != nil {
		query = query.Where("picked_at >= ?", *filters.DateFrom)
	}
	if filters.DateTo != nil {
		query = query.Where("picked_at < ?", *filters.DateTo)
	}

	if err := query.Order("picked_at DESC").Limit(filters.Limit).Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}
