package services

/*
Thông tin ghi chú:
- File nay la service layer module Tray, da mo rong CRUD va sinh tray_code/qr_code tu dong theo location.
- Phu thuoc vao TrayRepository de validate references va cap nhat du lieu theo soft-delete.
- Luu y bao tri: nguoi dung khong nhap tray_code/qr_code; service sinh theo format `<LOCATION_CODE>-T<NN>`.

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
	"fmt"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

var ErrInvalidTrayPayload = errors.New("product_id and location_id are required")
var ErrInvalidTrayID = errors.New("invalid tray id")

type TrayService interface {
	Create(productID uint, locationID uint, description string) (*models.Tray, error)
	GetAllActive() ([]models.Tray, error)
	ScanByQRCode(qrCode string) (*TrayScanResult, error)
	Update(id uint, productID uint, locationID uint, description string) (*models.Tray, error)
	Delete(id uint) error
}

// TrayScanInventoryResult la read-model ton kho theo tray scan.
type TrayScanInventoryResult struct {
	InventoryID   uint   `json:"inventory_id"`
	ProductID     uint   `json:"product_id"`
	ProductCode   string `json:"product_code"`
	ProductName   string `json:"product_name"`
	Quantity      int    `json:"quantity"`
	LastUpdatedAt string `json:"last_updated_at"`
}

// TrayScanResult la response contract cua GET /trays/scan/:qr_code.
type TrayScanResult struct {
	Tray           *models.Tray              `json:"tray"`
	LocationCode   string                    `json:"location_code"`
	InventoryItems []TrayScanInventoryResult `json:"inventory_items"`
	InventoryTotal int                       `json:"inventory_total"`
}

type trayService struct {
	repo repositories.TrayRepository
}

func NewTrayService(repo repositories.TrayRepository) TrayService {
	return &trayService{repo: repo}
}

func (s *trayService) Create(productID uint, locationID uint, description string) (*models.Tray, error) {
	// Ghi chú: Validate payload references, khong cho tao tray neu product/location khong hop le.
	if productID == 0 || locationID == 0 {
		return nil, ErrInvalidTrayPayload
	}

	if _, err := s.repo.FindActiveProductByID(productID); err != nil {
		return nil, err
	}

	location, err := s.repo.FindActiveLocationByID(locationID)
	if err != nil {
		return nil, err
	}

	exists, err := s.repo.ExistsActiveByProductAndLocation(productID, locationID, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, repositories.ErrTrayPairExists
	}

	trayCode, qrCode, err := s.buildTrayAndQRByLocation(location.LocationCode)
	if err != nil {
		return nil, err
	}

	tray := &models.Tray{
		TrayCode:    trayCode,
		ProductID:   productID,
		LocationID:  locationID,
		QRCode:      qrCode,
		Description: strings.TrimSpace(description),
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

func (s *trayService) ScanByQRCode(qrCode string) (*TrayScanResult, error) {
	normalizedQR := strings.TrimSpace(qrCode)
	if normalizedQR == "" {
		return nil, ErrInvalidTrayPayload
	}

	tray, err := s.repo.FindActiveByQRCode(normalizedQR)
	if err != nil {
		return nil, err
	}

	rows, err := s.repo.FindScanInventoryByTrayID(tray.ID)
	if err != nil {
		return nil, err
	}

	locationCode := ""
	location, err := s.repo.FindActiveLocationByID(tray.LocationID)
	if err == nil && location != nil {
		locationCode = location.LocationCode
	}

	total := 0
	items := make([]TrayScanInventoryResult, 0, len(rows))
	for _, row := range rows {
		total += row.Quantity
		items = append(items, TrayScanInventoryResult{
			InventoryID:   row.InventoryID,
			ProductID:     row.ProductID,
			ProductCode:   row.ProductCode,
			ProductName:   row.ProductName,
			Quantity:      row.Quantity,
			LastUpdatedAt: "",
		})
	}

	return &TrayScanResult{
		Tray:           tray,
		LocationCode:   locationCode,
		InventoryItems: items,
		InventoryTotal: total,
	}, nil
}

func (s *trayService) Update(id uint, productID uint, locationID uint, description string) (*models.Tray, error) {
	// Ghi chú: Update se sinh lai tray_code/qr_code neu doi location de giu format nhat quan.
	if id == 0 {
		return nil, ErrInvalidTrayID
	}
	if productID == 0 || locationID == 0 {
		return nil, ErrInvalidTrayPayload
	}

	tray, err := s.repo.FindActiveByID(id)
	if err != nil {
		return nil, err
	}

	if _, err := s.repo.FindActiveProductByID(productID); err != nil {
		return nil, err
	}

	location, err := s.repo.FindActiveLocationByID(locationID)
	if err != nil {
		return nil, err
	}

	exists, err := s.repo.ExistsActiveByProductAndLocation(productID, locationID, &id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, repositories.ErrTrayPairExists
	}

	oldLocationID := tray.LocationID

	tray.ProductID = productID
	tray.LocationID = locationID
	tray.Description = strings.TrimSpace(description)

	if oldLocationID != locationID || !strings.HasPrefix(strings.ToUpper(tray.TrayCode), strings.ToUpper(location.LocationCode+"-T")) {
		trayCode, qrCode, buildErr := s.buildTrayAndQRByLocation(location.LocationCode)
		if buildErr != nil {
			return nil, buildErr
		}
		tray.TrayCode = trayCode
		tray.QRCode = qrCode
	}

	if err := s.repo.Update(tray); err != nil {
		return nil, err
	}

	return tray, nil
}

func (s *trayService) Delete(id uint) error {
	// Ghi chú: Soft delete tray bang is_active=false de giu lich su giao dich kho.
	if id == 0 {
		return ErrInvalidTrayID
	}
	return s.repo.SoftDeleteByID(id)
}

func (s *trayService) buildTrayAndQRByLocation(locationCode string) (string, string, error) {
	locationCode = strings.TrimSpace(locationCode)
	if locationCode == "" {
		return "", "", ErrInvalidTrayPayload
	}

	maxSeq, err := s.repo.FindMaxTraySequenceByLocationCode(locationCode)
	if err != nil {
		return "", "", err
	}

	nextSeq := maxSeq + 1
	trayCode := fmt.Sprintf("%s-T%02d", locationCode, nextSeq)
	// Ghi chú: QR code dung cung gia tri tray_code de scan nhanh va truy vet de dang.
	qrCode := trayCode

	return trayCode, qrCode, nil
}
