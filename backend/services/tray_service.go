package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'tray'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewTrayService
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

var ErrInvalidTrayPayload = errors.New("tray_code and qr_code are required")

type TrayService interface {
	Create(trayCode string, productID uint, locationID uint, qrCode string, description string) (*models.Tray, error)
	GetAllActive() ([]models.Tray, error)
}

type trayService struct {
	repo repositories.TrayRepository
}

func NewTrayService(repo repositories.TrayRepository) TrayService {
	return &trayService{repo: repo}
}

func (s *trayService) Create(trayCode string, productID uint, locationID uint, qrCode string, description string) (*models.Tray, error) {
	trayCode = strings.TrimSpace(trayCode)
	qrCode = strings.TrimSpace(qrCode)

	if trayCode == "" || qrCode == "" {
		return nil, ErrInvalidTrayPayload
	}

	if _, err := s.repo.FindActiveProductByID(productID); err != nil {
		return nil, err
	}

	if _, err := s.repo.FindActiveLocationByID(locationID); err != nil {
		return nil, err
	}

	tray := &models.Tray{
		TrayCode:    trayCode,
		ProductID:   productID,
		LocationID:  locationID,
		QRCode:      qrCode,
		Description: description,
		IsActive:    true,
	}

	if err := s.repo.Create(tray); err != nil {
		return nil, err
	}

	return tray, nil
}

func (s *trayService) GetAllActive() ([]models.Tray, error) {
	return s.repo.FindAllActive()
}
