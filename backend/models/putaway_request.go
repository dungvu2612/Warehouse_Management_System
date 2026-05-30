package models

import "time"

// PutawayRequest lưu yêu cầu nhập kho chờ admin duyệt.
type PutawayRequest struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ProductQRCode  string     `gorm:"not null;index" json:"product_qr_code"`
	TrayQRCode     string     `gorm:"not null;index" json:"tray_qr_code"`
	Quantity       int        `gorm:"not null;check:quantity > 0" json:"quantity"`
	Note           string     `json:"note"`
	ReferenceCode  string     `json:"reference_code"`
	Status         string     `gorm:"not null;default:PENDING;index" json:"status"`
	RequestedBy    *uint      `json:"requested_by"`
	ApprovedBy     *uint      `json:"approved_by"`
	ApprovedAt     *time.Time `json:"approved_at"`
	RejectReason   string     `json:"reject_reason"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (PutawayRequest) TableName() string {
	return "putaway_requests"
}

