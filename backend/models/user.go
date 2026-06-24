package models

import "time"

type User struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	Username            string    `gorm:"unique;not null" json:"username"`
	PasswordHash        string    `json:"-"`
	FullName            string    `json:"full_name"`
	Role                string    `json:"role"`
	IsActive            bool      `json:"is_active"`
	TokenVersion        int       `json:"-"`
	FailedLoginAttempts int       `json:"-"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
