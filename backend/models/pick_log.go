package models

import "time"

type PickLog struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	PickingTaskID  *uint     `json:"picking_task_id"`
	OrderID        *uint     `json:"order_id"`
	ProductID      *uint     `json:"product_id"`
	TrayID         *uint     `json:"tray_id"`
	PickedQuantity int       `gorm:"not null;check:picked_quantity > 0" json:"picked_quantity"`
	PickedBy       *uint     `json:"picked_by"`
	Picker         *User     `gorm:"foreignKey:PickedBy;references:ID" json:"picker,omitempty"`
	PickedAt       time.Time `json:"picked_at"`
	Note           string    `json:"note"`
}

func (PickLog) TableName() string {
	return "pick_logs"
}
