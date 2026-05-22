package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'pick_log'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewPickLogService
- GetByFilters

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strconv"
	"time"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

type PickLogQuery struct {
	OrderIDRaw  string
	PickedByRaw string
	DateFromRaw string
	DateToRaw   string
	LimitRaw    string
}

type PickLogService interface {
	GetByFilters(query PickLogQuery) ([]models.PickLog, error)
}

type pickLogService struct {
	repo repositories.PickLogRepository
}

func NewPickLogService(repo repositories.PickLogRepository) PickLogService {
	return &pickLogService{repo: repo}
}

func (s *pickLogService) GetByFilters(query PickLogQuery) ([]models.PickLog, error) {
	filters := repositories.PickLogFilters{Limit: 50}

	if query.OrderIDRaw != "" {
		v, err := strconv.ParseUint(query.OrderIDRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid order_id")
		}
		x := uint(v)
		filters.OrderID = &x
	}

	if query.PickedByRaw != "" {
		v, err := strconv.ParseUint(query.PickedByRaw, 10, 64)
		if err != nil || v == 0 {
			return nil, errors.New("invalid picked_by")
		}
		x := uint(v)
		filters.PickedBy = &x
	}

	if query.DateFromRaw != "" {
		v, err := time.Parse("2006-01-02", query.DateFromRaw)
		if err != nil {
			return nil, errors.New("invalid date_from format, expected YYYY-MM-DD")
		}
		filters.DateFrom = &v
	}

	if query.DateToRaw != "" {
		v, err := time.Parse("2006-01-02", query.DateToRaw)
		if err != nil {
			return nil, errors.New("invalid date_to format, expected YYYY-MM-DD")
		}
		nextDay := v.Add(24 * time.Hour)
		filters.DateTo = &nextDay
	}

	if query.LimitRaw != "" {
		limit, err := strconv.Atoi(query.LimitRaw)
		if err != nil || limit <= 0 || limit > 200 {
			return nil, errors.New("invalid limit (1-200)")
		}
		filters.Limit = limit
	}

	return s.repo.FindAllByFilters(filters)
}
