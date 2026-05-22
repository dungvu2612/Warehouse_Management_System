package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'stock_transaction'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewStockTransactionRepository
- FindAllByFilters

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import "quan_ly_kho/models"

type StockTransactionRepository interface {
	FindAllByFilters(filters StockTransactionFilters) ([]models.StockTransaction, error)
}

type StockTransactionFilters struct {
	ProductID       *uint
	TrayID          *uint
	CreatedBy       *uint
	TransactionType string
	Limit           int
}

type stockTransactionRepository struct {
	db DBTX
}

func NewStockTransactionRepository(db DBTX) StockTransactionRepository {
	return &stockTransactionRepository{db: db}
}

func (r *stockTransactionRepository) FindAllByFilters(filters StockTransactionFilters) ([]models.StockTransaction, error) {
	var transactions []models.StockTransaction
	query := r.db.Model(&models.StockTransaction{})

	if filters.ProductID != nil {
		query = query.Where("product_id = ?", *filters.ProductID)
	}
	if filters.TrayID != nil {
		query = query.Where("tray_id = ?", *filters.TrayID)
	}
	if filters.CreatedBy != nil {
		query = query.Where("created_by = ?", *filters.CreatedBy)
	}
	if filters.TransactionType != "" {
		query = query.Where("transaction_type = ?", filters.TransactionType)
	}

	if err := query.Order("created_at DESC").Limit(filters.Limit).Find(&transactions).Error; err != nil {
		return nil, err
	}
	return transactions, nil
}
