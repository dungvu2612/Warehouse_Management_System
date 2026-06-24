package services

import (
	"errors"
	"strings"
	"time"

	"quan_ly_kho/repositories"
)

var (
	ErrStaffReportInvalidDateRange = errors.New("invalid report date range")
	ErrStaffReportInvalidWorkType  = errors.New("invalid report work type")
)

type StaffPerformanceQuery struct {
	FromDate string
	ToDate   string
	WorkType string
}

type StaffPerformanceResponse struct {
	FromDate string                             `json:"from_date"`
	ToDate   string                             `json:"to_date"`
	Items    []repositories.StaffPerformanceRow `json:"items"`
}

type StaffReportService interface {
	GetStaffPerformance(query StaffPerformanceQuery) (*StaffPerformanceResponse, error)
}

type staffReportService struct {
	repo repositories.StaffReportRepository
}

func NewStaffReportService(repo repositories.StaffReportRepository) StaffReportService {
	return &staffReportService{repo: repo}
}

func (s *staffReportService) GetStaffPerformance(query StaffPerformanceQuery) (*StaffPerformanceResponse, error) {
	workType := strings.ToLower(strings.TrimSpace(query.WorkType))
	if workType == "" {
		workType = "all"
	}
	if workType != "all" && workType != "picking" && workType != "import" {
		return nil, ErrStaffReportInvalidWorkType
	}

	fromDate, toDate, err := normalizeStaffReportDateRange(query.FromDate, query.ToDate)
	if err != nil {
		return nil, err
	}

	rows, err := s.repo.GetStaffPerformance(repositories.StaffPerformanceFilter{
		FromDate: fromDate,
		ToDate:   toDate.AddDate(0, 0, 1),
		WorkType: workType,
	})
	if err != nil {
		return nil, err
	}

	return &StaffPerformanceResponse{
		FromDate: fromDate.Format("2006-01-02"),
		ToDate:   toDate.Format("2006-01-02"),
		Items:    rows,
	}, nil
}

func normalizeStaffReportDateRange(fromRaw string, toRaw string) (time.Time, time.Time, error) {
	now := time.Now()
	fromRaw = strings.TrimSpace(fromRaw)
	toRaw = strings.TrimSpace(toRaw)
	if fromRaw == "" {
		fromRaw = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).Format("2006-01-02")
	}
	if toRaw == "" {
		toRaw = now.Format("2006-01-02")
	}

	fromDate, fromErr := time.ParseInLocation("2006-01-02", fromRaw, time.Local)
	toDate, toErr := time.ParseInLocation("2006-01-02", toRaw, time.Local)
	if fromErr != nil || toErr != nil || fromDate.After(toDate) {
		return time.Time{}, time.Time{}, ErrStaffReportInvalidDateRange
	}
	return fromDate, toDate, nil
}
