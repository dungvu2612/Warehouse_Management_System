package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'dashboard'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewDashboardRepository
- CountOrdersByStatus
- SumTotalStockQuantity
- CountLowStockProducts

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import "quan_ly_kho/utils"

type DashboardRepository interface {
	CountOrdersByStatus(status string) (int64, error)
	SumTotalStockQuantity() (int64, error)
	CountLowStockProducts() (int64, error)
}

type dashboardRepository struct {
	db DBTX
}

func NewDashboardRepository(db DBTX) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) CountOrdersByStatus(status string) (int64, error) {
	var count int64
	if err := r.db.Model(nil).Raw("SELECT COUNT(*) FROM orders WHERE status = ?", status).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *dashboardRepository) SumTotalStockQuantity() (int64, error) {
	var total int64
	if err := r.db.Model(nil).Raw("SELECT COALESCE(SUM(quantity), 0) FROM inventory").Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}

func (r *dashboardRepository) CountLowStockProducts() (int64, error) {
	var count int64
	query := `
		SELECT COUNT(*) FROM products p
		LEFT JOIN (
			SELECT product_id, SUM(quantity) AS total_qty
			FROM inventory
			GROUP BY product_id
		) inv ON inv.product_id = p.id
		WHERE p.is_active = TRUE
		  AND COALESCE(inv.total_qty, 0) < p.min_stock
	`
	if err := r.db.Raw(query).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

var _ = utils.OrderStatusPending
