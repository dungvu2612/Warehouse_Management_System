package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'location'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewLocationService
- Create
- GetAllActive

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

var ErrInvalidLocationPayload = errors.New("location_code is required")

type LocationService interface {
	Create(locationCode, shelf, description string) (*models.Location, error)
	GetAllActive() ([]models.Location, error)
}

type locationService struct {
	repo repositories.LocationRepository
}

func NewLocationService(repo repositories.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) Create(locationCode, shelf, description string) (*models.Location, error) {
	locationCode = strings.TrimSpace(locationCode)
	shelf = strings.TrimSpace(shelf)

	if locationCode == "" {
		return nil, ErrInvalidLocationPayload
	}

	location := &models.Location{
		LocationCode: locationCode,
		Shelf:        shelf,
		Description:  description,
		IsActive:     true,
	}

	if err := s.repo.Create(location); err != nil {
		return nil, err
	}

	return location, nil
}

func (s *locationService) GetAllActive() ([]models.Location, error) {
	return s.repo.FindAllActive()
}
