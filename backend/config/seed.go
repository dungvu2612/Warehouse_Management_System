package config

import (
	"log"
	"quan_ly_kho/models"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

/*
- Mục đích: Seed tai khoan mac dinh cho moi truong dev/test.
- Phụ thuộc: Su dung `DB` va model `users`.
- Hợp đồng API: Khong expose API; chi tao du lieu mau noi bo.
- Role access: User seed van hanh theo role contract ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Khong dung seed credentials nay cho production.
*/
func SeedDefaultUsers() {
	users := []struct {
		Username string
		Password string
		FullName string
		Role     string
	}{
		{
			Username: "admin",
			Password: "admin123",
			FullName: "System Admin",
			Role:     "ADMIN",
		},
		{
			Username: "staff",
			Password: "staff123",
			FullName: "Warehouse Staff",
			Role:     "STAFF",
		},
	}

	for _, seedUser := range users {
		var existing models.User
		err := DB.Where("username = ?", seedUser.Username).First(&existing).Error
		if err == nil {
			continue
		}

		hash, hashErr := bcrypt.GenerateFromPassword([]byte(seedUser.Password), bcrypt.DefaultCost)
		if hashErr != nil {
			log.Printf("failed to hash password for %s: %v", seedUser.Username, hashErr)
			continue
		}

		user := models.User{
			Username:     seedUser.Username,
			PasswordHash: string(hash),
			FullName:     seedUser.FullName,
			Role:         strings.ToUpper(seedUser.Role),
			IsActive:     true,
		}

		if createErr := DB.Create(&user).Error; createErr != nil {
			log.Printf("failed to seed user %s: %v", seedUser.Username, createErr)
		}
	}
}
