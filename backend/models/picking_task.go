package models

import "time"

type PickingTask struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	OrderID          uint      `gorm:"not null" json:"order_id"`
	ProductID        uint      `gorm:"not null" json:"product_id"`
	TrayID           uint      `gorm:"not null" json:"tray_id"`
	RequiredQuantity int       `gorm:"not null;check:required_quantity > 0" json:"required_quantity"`
	PickedQuantity   int       `gorm:"not null;default:0;check:picked_quantity >= 0" json:"picked_quantity"`
	Verified         bool      `gorm:"default:false" json:"verified"`
	Status           string    `gorm:"not null" json:"status"`
	AssignedTo       *uint     `json:"assigned_to"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

