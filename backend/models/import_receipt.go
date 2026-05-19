package models

import "time"

// ImportReceipt là phiếu nhập kho (header).
type ImportReceipt struct {
	ID           uint               `gorm:"primaryKey" json:"id"`
	ReceiptCode  string             `gorm:"unique;not null" json:"receipt_code"`
	SupplierName string             `json:"supplier_name"`
	Note         string             `json:"note"`
	CreatedBy    *uint              `json:"created_by"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`

	Items []ImportReceiptItem `gorm:"foreignKey:ReceiptID;references:ID" json:"items,omitempty"`
}

