package models

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProductCode string    `gorm:"unique;not null" json:"product_code"`
	ProductName string    `gorm:"not null" json:"product_name"`
	ProductType string    `gorm:"not null;default:COMPONENT" json:"product_type"`
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
