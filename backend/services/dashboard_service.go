package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'dashboard'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewDashboardService
- GetStats

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"quan_ly_kho/repositories"
	"quan_ly_kho/utils"
)

type DashboardStats struct {
	OrdersPending   int64 `json:"orders_pending"`
	OrdersPicking   int64 `json:"orders_picking"`
	OrdersCompleted int64 `json:"orders_completed"`
	TotalStockQty   int64 `json:"total_stock_qty"`
	LowStockCount   int64 `json:"low_stock_count"`
}

type DashboardService interface {
	GetStats() (*DashboardStats, error)
}

type dashboardService struct {
	repo repositories.DashboardRepository
}

func NewDashboardService(repo repositories.DashboardRepository) DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetStats() (*DashboardStats, error) {
	pending, err := s.repo.CountOrdersByStatus(utils.OrderStatusPending)
	if err != nil {
		return nil, err
	}

	picking, err := s.repo.CountOrdersByStatus(utils.OrderStatusPicking)
	if err != nil {
		return nil, err
	}

	completed, err := s.repo.CountOrdersByStatus(utils.OrderStatusCompleted)
	if err != nil {
		return nil, err
	}

	totalStock, err := s.repo.SumTotalStockQuantity()
	if err != nil {
		return nil, err
	}

	lowStock, err := s.repo.CountLowStockProducts()
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		OrdersPending:   pending,
		OrdersPicking:   picking,
		OrdersCompleted: completed,
		TotalStockQty:   totalStock,
		LowStockCount:   lowStock,
	}, nil
}
