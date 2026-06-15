package models

import "time"

// ImportReceiptItem là từng dòng nhập trong phiếu nhập.
type ImportReceiptItem struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ReceiptID      uint       `gorm:"not null" json:"receipt_id"`
	ProductID      uint       `gorm:"not null" json:"product_id"`
	TrayID         *uint      `json:"tray_id"`
	Quantity       int        `gorm:"not null;check:quantity > 0" json:"quantity"`
	ActualQuantity int        `gorm:"default:0" json:"actual_quantity"`
	ActualTrayID   *uint      `json:"actual_tray_id"`
	Status         string     `gorm:"default:WAITING" json:"status"`
	AssignedTo     *uint      `json:"assigned_to"`
	AssignedAt     *time.Time `json:"assigned_at"`
	CompletedAt    *time.Time `json:"completed_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (ImportReceiptItem) TableName() string {
	return "import_receipt_items"
}
