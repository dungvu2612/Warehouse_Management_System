package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'audit'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewAuditRepository
- FindOrderByID
- SumPickedQuantityByOrderID
- SumExportQuantityByOrderCode

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"

	"quan_ly_kho/models"
	"quan_ly_kho/utils"

	"gorm.io/gorm"
)

var ErrOrderNotFound = errors.New("order not found")

type AuditRepository interface {
	FindOrderByID(id uint) (*models.Order, error)
	SumPickedQuantityByOrderID(orderID uint) (int64, error)
	SumExportQuantityByOrderCode(orderCode string) (int64, error)
}

type auditRepository struct {
	db DBTX
}

func NewAuditRepository(db DBTX) AuditRepository {
	return &auditRepository{db: db}
}

func (r *auditRepository) FindOrderByID(id uint) (*models.Order, error) {
	var order models.Order
	if err := r.db.First(&order, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &order, nil
}

func (r *auditRepository) SumPickedQuantityByOrderID(orderID uint) (int64, error) {
	var total int64
	if err := r.db.Model(&models.PickLog{}).
		Where("order_id = ?", orderID).
		Select("COALESCE(SUM(picked_quantity), 0)").
		Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}

func (r *auditRepository) SumExportQuantityByOrderCode(orderCode string) (int64, error) {
	var total int64
	if err := r.db.Model(&models.StockTransaction{}).
		Where("reference_code = ? AND transaction_type = ?", orderCode, utils.StockTxTypeExport).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}
