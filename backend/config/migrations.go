package config

import "log"

// RunDatabaseMigrations chạy các migration thủ công, idempotent cho schema hiện tại.
// Hiện tại bổ sung product_type để tách thành phẩm và linh kiện trong cùng bảng products.
func RunDatabaseMigrations() {
	// 1) Thêm cột product_type nếu chưa có.
	if err := DB.Exec(`
		ALTER TABLE products
		ADD COLUMN IF NOT EXISTS product_type VARCHAR(30)
	`).Error; err != nil {
		log.Fatalf("failed to add products.product_type: %v", err)
	}

	// 2) Backfill dữ liệu cũ để tránh null.
	if err := DB.Exec(`
		UPDATE products
		SET product_type = 'COMPONENT'
		WHERE product_type IS NULL OR TRIM(product_type) = ''
	`).Error; err != nil {
		log.Fatalf("failed to backfill products.product_type: %v", err)
	}

	// 3) Đặt default và not null cho các bản ghi mới.
	if err := DB.Exec(`
		ALTER TABLE products
		ALTER COLUMN product_type SET DEFAULT 'COMPONENT'
	`).Error; err != nil {
		log.Fatalf("failed to set default for products.product_type: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE products
		ALTER COLUMN product_type SET NOT NULL
	`).Error; err != nil {
		log.Fatalf("failed to set not null for products.product_type: %v", err)
	}

	// 4) Thêm cột created_by cho bảng boms để truy vết người tạo BOM.
	if err := DB.Exec(`
		ALTER TABLE boms
		ADD COLUMN IF NOT EXISTS created_by BIGINT
	`).Error; err != nil {
		log.Fatalf("failed to add boms.created_by: %v", err)
	}
}
