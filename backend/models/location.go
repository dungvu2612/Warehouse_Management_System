package models

import "time"

type Location struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	LocationCode string    `gorm:"unique;not null" json:"location_code"`
	Shelf        string    `json:"shelf"`
	Description  string    `json:"description"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Location) TableName() string {
	return "locations"
}
