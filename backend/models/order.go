package models

import "time"

type Order struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	OrderCode    string    `gorm:"unique;not null" json:"order_code"`
	CustomerName string    `json:"customer_name"`
	Status       string    `gorm:"not null" json:"status"`
	TotalAmount  float64   `json:"total_amount"`
	QRCode       string    `gorm:"not null" json:"qr_code"`
	CreatedBy    *uint     `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Items []OrderItem `gorm:"foreignKey:OrderID;references:ID" json:"items,omitempty"`
}

