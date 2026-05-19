package models

import "time"

// BOM đại diện cấu trúc linh kiện của 1 máy/sản phẩm thành phẩm.
// product_id là sản phẩm "cha" (thành phẩm).
type BOM struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProductID   uint      `gorm:"not null" json:"product_id"`
	BOMName     string    `gorm:"column:bom_name" json:"bom_name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Quan hệ phục vụ preload ở bước API sau
	Product Product   `gorm:"foreignKey:ProductID;references:ID" json:"product,omitempty"`
	Items   []BOMItem `gorm:"foreignKey:BOMID;references:ID" json:"items,omitempty"`
}

