package services

import (
	"errors"
	"time"

	"quan_ly_kho/repositories"
)

const (
	defaultPurgeRetentionDays = 180
	minPurgeRetentionDays     = 30
	maxPurgeRetentionDays     = 3650
)

var ErrInvalidPurgeRetention = errors.New("retention_days must be between 30 and 3650")

type PurgeInactiveInput struct {
	RetentionDays int  `json:"retention_days"`
	DryRun        bool `json:"dry_run"`
}

type PurgeInactiveResult struct {
	RetentionDays int                               `json:"retention_days"`
	CutoffAt      time.Time                         `json:"cutoff_at"`
	DryRun        bool                              `json:"dry_run"`
	Deleted       repositories.PurgeInactiveResult  `json:"deleted"`
}

type MaintenanceService interface {
	PurgeInactiveMasterData(input PurgeInactiveInput) (PurgeInactiveResult, error)
}

type maintenanceService struct {
	repo repositories.MaintenanceRepository
}

func NewMaintenanceService(repo repositories.MaintenanceRepository) MaintenanceService {
	return &maintenanceService{repo: repo}
}

func (s *maintenanceService) PurgeInactiveMasterData(input PurgeInactiveInput) (PurgeInactiveResult, error) {
	retentionDays := input.RetentionDays
	if retentionDays == 0 {
		retentionDays = defaultPurgeRetentionDays
	}
	if retentionDays < minPurgeRetentionDays || retentionDays > maxPurgeRetentionDays {
		return PurgeInactiveResult{}, ErrInvalidPurgeRetention
	}

	cutoff := time.Now().AddDate(0, 0, -retentionDays)
	deleted, err := s.repo.PurgeInactiveMasterData(cutoff, input.DryRun)
	if err != nil {
		return PurgeInactiveResult{}, err
	}

	return PurgeInactiveResult{
		RetentionDays: retentionDays,
		CutoffAt:      cutoff,
		DryRun:        input.DryRun,
		Deleted:       deleted,
	}, nil
}
