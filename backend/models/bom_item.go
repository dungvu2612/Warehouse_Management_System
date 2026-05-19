package models

import "time"

// BOMItem là 1 dòng linh kiện trong BOM.
// uniqueIndex đảm bảo 1 component không bị lặp trong cùng 1 BOM.
type BOMItem struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	BOMID              uint      `gorm:"column:bom_id;not null;uniqueIndex:ux_bom_component" json:"bom_id"`
	ComponentProductID uint      `gorm:"column:component_product_id;not null;uniqueIndex:ux_bom_component" json:"component_product_id"`
	Quantity           int       `gorm:"not null;check:quantity > 0" json:"quantity"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Quan hệ phục vụ preload khi xem chi tiết BOM
	BOM              BOM     `gorm:"foreignKey:BOMID;references:ID" json:"bom,omitempty"`
	ComponentProduct Product `gorm:"foreignKey:ComponentProductID;references:ID" json:"component_product,omitempty"`
}

