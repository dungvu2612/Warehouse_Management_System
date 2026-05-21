package models

import "time"

// ImportReceiptItem là từng dòng nhập trong phiếu nhập.
type ImportReceiptItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ReceiptID uint      `gorm:"not null" json:"receipt_id"`
	ProductID uint      `gorm:"not null" json:"product_id"`
	TrayID    uint      `gorm:"not null" json:"tray_id"`
	Quantity  int       `gorm:"not null;check:quantity > 0" json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ImportReceiptItem) TableName() string {
	return "import_receipt_items"
}
