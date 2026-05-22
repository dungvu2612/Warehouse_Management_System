package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'audit'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewAuditService
- GetOrderConsistency

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"

	"quan_ly_kho/repositories"
)

var ErrInvalidOrderID = errors.New("invalid order id")

type AuditConsistency struct {
	OrderID          uint   `json:"order_id"`
	OrderCode        string `json:"order_code"`
	PickLogsTotalQty int64  `json:"pick_logs_total_qty"`
	ExportTxTotalQty int64  `json:"export_tx_total_qty"`
	IsConsistent     bool   `json:"is_consistent"`
}

type AuditService interface {
	GetOrderConsistency(orderID uint) (*AuditConsistency, error)
}

type auditService struct {
	repo repositories.AuditRepository
}

func NewAuditService(repo repositories.AuditRepository) AuditService {
	return &auditService{repo: repo}
}

func (s *auditService) GetOrderConsistency(orderID uint) (*AuditConsistency, error) {
	if orderID == 0 {
		return nil, ErrInvalidOrderID
	}

	order, err := s.repo.FindOrderByID(orderID)
	if err != nil {
		return nil, err
	}

	pickTotal, err := s.repo.SumPickedQuantityByOrderID(order.ID)
	if err != nil {
		return nil, err
	}

	exportTotal, err := s.repo.SumExportQuantityByOrderCode(order.OrderCode)
	if err != nil {
		return nil, err
	}

	return &AuditConsistency{
		OrderID:          order.ID,
		OrderCode:        order.OrderCode,
		PickLogsTotalQty: pickTotal,
		ExportTxTotalQty: exportTotal,
		IsConsistent:     pickTotal == exportTotal,
	}, nil
}
