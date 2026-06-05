package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

const vietnamTimezone = "Asia/Ho_Chi_Minh"

func ConnectDatabase() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
		vietnamTimezone,
	)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect database")
	}

	DB = database

	escapedTimezone := strings.ReplaceAll(vietnamTimezone, "'", "''")
	if err := DB.Exec(fmt.Sprintf("SET TIME ZONE '%s'", escapedTimezone)).Error; err != nil {
		log.Fatalf("Failed to set database timezone: %v", err)
	}

	fmt.Println("Database connected successfully")
}
