package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'stock_transaction'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewStockTransactionService
- GetByFilters

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strconv"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

var ErrInvalidStockTransactionQuery = errors.New("invalid stock transaction query")

type StockTransactionQuery struct {
	ProductIDRaw       string
	TrayIDRaw          string
	CreatedByRaw       string
	TransactionTypeRaw string
	LimitRaw           string
}

type StockTransactionService interface {
	GetByFilters(query StockTransactionQuery) ([]models.StockTransaction, error)
}

type stockTransactionService struct {
	repo repositories.StockTransactionRepository
}

func NewStockTransactionService(repo repositories.StockTransactionRepository) StockTransactionService {
	return &stockTransactionService{repo: repo}
}

func (s *stockTransactionService) GetByFilters(query StockTransactionQuery) ([]models.StockTransaction, error) {
	filters := repositories.StockTransactionFilters{Limit: 50}

	if query.ProductIDRaw != "" {
		v, err := strconv.ParseUint(query.ProductIDRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid product_id")
		}
		x := uint(v)
		filters.ProductID = &x
	}

	if query.TrayIDRaw != "" {
		v, err := strconv.ParseUint(query.TrayIDRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid tray_id")
		}
		x := uint(v)
		filters.TrayID = &x
	}

	if query.CreatedByRaw != "" {
		v, err := strconv.ParseUint(query.CreatedByRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid created_by")
		}
		x := uint(v)
		filters.CreatedBy = &x
	}

	filters.TransactionType = strings.ToUpper(strings.TrimSpace(query.TransactionTypeRaw))

	if query.LimitRaw != "" {
		limit, err := strconv.Atoi(query.LimitRaw)
		if err != nil || limit <= 0 || limit > 200 {
			return nil, errors.New("invalid limit (1-200)")
		}
		filters.Limit = limit
	}

	return s.repo.FindAllByFilters(filters)
}
