package models

import "time"

type Tray struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TrayCode    string    `gorm:"unique;not null" json:"tray_code"`
	ProductID   uint      `json:"product_id"`
	LocationID  uint      `json:"location_id"`
	QRCode      string    `json:"qr_code"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Tray) TableName() string {
	return "trays"
}
