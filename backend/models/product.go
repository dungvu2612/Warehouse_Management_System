package models

import "time"

/*
Senior Handover Note:
- Purpose: Domain model Product bo sung truong qr_code de ho tro scan workflow trong kho.
- Dependencies: Duoc su dung boi product/inventory/import/order/pda flows qua GORM mapping.
- API contract: Backend tra json field `qr_code` trong cac endpoint products.
- Warehouse business rules: Mac dinh qr_code = product_code neu khong cung cap gia tri rieng.
- Scanner workflow notes: HT730 keyboard wedge scan product QR vao cac mode lookup/putaway/stocktaking.
- Maintenance notes: Neu doi ten cot/format QR, cap nhat dong bo migration + service + frontend types.
*/
type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProductCode string    `gorm:"unique;not null" json:"product_code"`
	QRCode      string    `gorm:"unique;not null" json:"qr_code"`
	ProductName string    `gorm:"not null" json:"product_name"`
	ProductType string    `gorm:"not null;default:COMPONENT" json:"product_type"`
	ImageURL    string    `json:"image_url"`
	Description string    `json:"description"`
	Unit        string    `json:"unit"`
	MinStock    int       `json:"min_stock"`
	Price       float64   `json:"price"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Product) TableName() string {
	return "products"
}
