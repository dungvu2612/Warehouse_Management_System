package models

import "time"

type Inventory struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ProductID  uint      `json:"product_id"`
	TrayID     uint      `json:"tray_id"`
	Quantity   int       `json:"quantity"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}