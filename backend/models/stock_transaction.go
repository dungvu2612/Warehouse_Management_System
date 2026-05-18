package models

import "time"

type StockTransaction struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	TransactionType string    `json:"transaction_type"`
	ProductID       uint      `json:"product_id"`
	TrayID          *uint     `json:"tray_id"`
	Quantity        int       `json:"quantity"`
	BeforeQuantity  int       `json:"before_quantity"`
	AfterQuantity   int       `json:"after_quantity"`
	ReferenceCode   string    `json:"reference_code"`
	Note            string    `json:"note"`
	CreatedBy       *uint     `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
}
