package models

import "time"

/*
Senior Handover Note:
- Purpose: Domain model cho orders, bo sung customer_phone/customer_address phuc vu giao hang va in phieu.
- Dependencies: Duoc preload/serialize boi order repository/service/handler va dashboard revenue.
- API contract: JSON order response phai tra day du customer_name/customer_phone/customer_address.
- Business rules: Revenue chi derive tu orders.status = COMPLETED; customer info chi la metadata don hang.
- Replacement refactor notes: staff picking flow moi van dung cung order entity, khong tao entity don hang song song.
- Scanner workflow notes: Order QR scan load order cung customer info de staff xac nhan truoc khi picking.
- Permission notes: ADMIN/WAREHOUSE duoc xem va van hanh picking tren order.
- Maintenance notes: Neu them customer_id table rieng sau nay, giu backward compatibility cho 3 field text.
*/
type Order struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	OrderCode       string    `gorm:"unique;not null" json:"order_code"`
	CustomerName    string    `json:"customer_name"`
	CustomerPhone   string    `json:"customer_phone"`
	CustomerAddress string    `json:"customer_address"`
	Status          string    `gorm:"not null" json:"status"`
	TotalAmount     float64   `json:"total_amount"`
	QRCode          string    `gorm:"not null" json:"qr_code"`
	CreatedBy       *uint     `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Items []OrderItem `gorm:"foreignKey:OrderID;references:ID" json:"items,omitempty"`
}

func (Order) TableName() string {
	return "orders"
}
