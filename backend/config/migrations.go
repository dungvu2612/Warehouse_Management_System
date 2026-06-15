package config

import "log"

/*
Thông tin handover:
- File này chạy các migration thủ công, idempotent cho schema hiện tại.
- Phụ thuộc vào kết nối `DB` đã khởi tạo ở `config.ConnectDatabase`.
- Lưu ý bảo trì: chỉ thêm migration tăng tiến, tránh sửa logic migration cũ đã chạy production.
*/

// Ghi chú: RunDatabaseMigrations chạy các migration thủ công, idempotent cho schema hiện tại.
func RunDatabaseMigrations() {
	// 0) Tao bang putaway_requests de staff gui yeu cau cho admin duyet.
	if err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS putaway_requests (
			id BIGSERIAL PRIMARY KEY,
			product_qr_code VARCHAR(100) NOT NULL,
			tray_qr_code VARCHAR(100) NOT NULL,
			quantity INTEGER NOT NULL CHECK (quantity > 0),
			note TEXT DEFAULT '',
			reference_code VARCHAR(100) DEFAULT '',
			status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
			requested_by BIGINT NULL,
			approved_by BIGINT NULL,
			approved_at TIMESTAMPTZ NULL,
			reject_reason TEXT DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`).Error; err != nil {
		log.Fatalf("failed to create putaway_requests table: %v", err)
	}

	if err := DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_putaway_requests_status
		ON putaway_requests (status)
	`).Error; err != nil {
		log.Fatalf("failed to create index idx_putaway_requests_status: %v", err)
	}

	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'putaway_requests_status_check'
			) THEN
				ALTER TABLE putaway_requests DROP CONSTRAINT putaway_requests_status_check;
			END IF;
		END $$;
	`).Error; err != nil {
		log.Fatalf("failed to drop old putaway_requests status check: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE putaway_requests
		ADD CONSTRAINT putaway_requests_status_check
		CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
	`).Error; err != nil {
		log.Fatalf("failed to add putaway_requests status check: %v", err)
	}

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

	// 2.1) Chuẩn hóa product_type legacy:
	// - FINISHED -> FINISHED_GOOD
	// - Giá trị khác ngoài 2 giá trị chuẩn sẽ fallback COMPONENT để không phá migration.
	if err := DB.Exec(`
		UPDATE products
		SET product_type = CASE
			WHEN UPPER(TRIM(product_type)) = 'FINISHED' THEN 'FINISHED_GOOD'
			WHEN UPPER(TRIM(product_type)) = 'FINISHED_GOOD' THEN 'FINISHED_GOOD'
			WHEN UPPER(TRIM(product_type)) = 'COMPONENT' THEN 'COMPONENT'
			ELSE 'COMPONENT'
		END
	`).Error; err != nil {
		log.Fatalf("failed to normalize products.product_type values: %v", err)
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

	// 3.1) Enforce check constraint: chỉ nhận COMPONENT hoặc FINISHED_GOOD.
	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'products_product_type_check'
			) THEN
				ALTER TABLE products
				DROP CONSTRAINT products_product_type_check;
			END IF;
		END $$;
	`).Error; err != nil {
		log.Fatalf("failed to drop old products.product_type check constraint: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE products
		ADD CONSTRAINT products_product_type_check
		CHECK (product_type IN ('COMPONENT', 'FINISHED_GOOD'))
	`).Error; err != nil {
		log.Fatalf("failed to add products.product_type check constraint: %v", err)
	}

	// Ghi chú: Thêm cột image_url để lưu ảnh sản phẩm đã chuẩn hóa kích thước từ frontend.
	if err := DB.Exec(`
		ALTER TABLE products
		ADD COLUMN IF NOT EXISTS image_url TEXT
	`).Error; err != nil {
		log.Fatalf("failed to add products.image_url: %v", err)
	}

	// Ghi chú: Them cot qr_code cho products phuc vu scan workflow warehouse.
	if err := DB.Exec(`
		ALTER TABLE products
		ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100)
	`).Error; err != nil {
		log.Fatalf("failed to add products.qr_code: %v", err)
	}

	// Ghi chú: Backfill qr_code = product_code cho du lieu cu.
	if err := DB.Exec(`
		UPDATE products
		SET qr_code = product_code
		WHERE qr_code IS NULL OR TRIM(qr_code) = ''
	`).Error; err != nil {
		log.Fatalf("failed to backfill products.qr_code: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE products
		ALTER COLUMN qr_code SET NOT NULL
	`).Error; err != nil {
		log.Fatalf("failed to set not null for products.qr_code: %v", err)
	}

	// Ghi chú: Dam bao qr_code unique de scan nhanh theo gia tri QR.
	if err := DB.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS uq_products_qr_code
		ON products (qr_code)
	`).Error; err != nil {
		log.Fatalf("failed to create unique index for products.qr_code: %v", err)
	}

	// Ghi chú: Schema cũ từng enforce UNIQUE(product_id) trên trays, làm một sản phẩm chỉ
	// được có một khay kể cả khi khay cũ đã inactive. Luồng hiện tại quản lý theo
	// product + location và kiểm tra trùng active ở service, nên cần gỡ constraint cũ.
	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'ux_trays_product_id'
			) THEN
				ALTER TABLE trays DROP CONSTRAINT ux_trays_product_id;
			END IF;
		END $$;
	`).Error; err != nil {
		log.Fatalf("failed to drop old trays product unique constraint: %v", err)
	}

	if err := DB.Exec(`DROP INDEX IF EXISTS ux_trays_product_id`).Error; err != nil {
		log.Fatalf("failed to drop old trays product unique index: %v", err)
	}

	// 4) Thêm cột created_by cho bảng boms để truy vết người tạo BOM.
	if err := DB.Exec(`
		ALTER TABLE boms
		ADD COLUMN IF NOT EXISTS created_by BIGINT
	`).Error; err != nil {
		log.Fatalf("failed to add boms.created_by: %v", err)
	}

	// Ghi chú: Bo sung customer_phone va customer_address cho orders phuc vu giao hang/in phieu/doi soat.
	if err := DB.Exec(`
		ALTER TABLE orders
		ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)
	`).Error; err != nil {
		log.Fatalf("failed to add orders.customer_phone: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE orders
		ADD COLUMN IF NOT EXISTS customer_address TEXT
	`).Error; err != nil {
		log.Fatalf("failed to add orders.customer_address: %v", err)
	}

	// Ghi chú: Chuẩn hóa constraint orders.status theo flow hiện tại.
	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'orders_status_check'
			) THEN
				ALTER TABLE orders DROP CONSTRAINT orders_status_check;
			END IF;
		END $$
	`).Error; err != nil {
		log.Fatalf("failed to drop old orders status check: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE orders
		ALTER COLUMN status DROP DEFAULT,
		ALTER COLUMN status TYPE VARCHAR(30) USING status::text,
		ALTER COLUMN status SET DEFAULT 'PENDING'
	`).Error; err != nil {
		log.Fatalf("failed to normalize orders.status column type: %v", err)
	}

	if err := DB.Exec(`
		UPDATE orders
		SET status = CASE
			WHEN status IS NULL OR TRIM(status::text) = '' THEN 'PENDING'
			WHEN UPPER(TRIM(status::text)) IN ('PENDING', 'WAITING') THEN 'PENDING'
			WHEN UPPER(TRIM(status::text)) IN ('PICKING', 'PROCESSING') THEN 'PICKING'
			WHEN UPPER(TRIM(status::text)) IN ('COMPLETED', 'DONE') THEN 'COMPLETED'
			WHEN UPPER(TRIM(status::text)) IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'
			ELSE 'PENDING'
		END
	`).Error; err != nil {
		log.Fatalf("failed to normalize orders.status: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE orders
		ADD CONSTRAINT orders_status_check
		CHECK (status IN ('PENDING', 'PICKING', 'COMPLETED', 'CANCELLED'))
	`).Error; err != nil {
		log.Fatalf("failed to add orders status check: %v", err)
	}

	// Ghi chú: Bo sung metadata phan cong picking theo order cho flow staff tu nhan viec.
	if err := DB.Exec(`
		ALTER TABLE picking_tasks
		ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NULL,
		ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
		ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL
	`).Error; err != nil {
		log.Fatalf("failed to add picking task assignment timestamps: %v", err)
	}

	// Ghi chú: Chuẩn hóa constraint picking_tasks.status theo flow staff picking hiện tại.
	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'picking_tasks_status_check'
			) THEN
				ALTER TABLE picking_tasks DROP CONSTRAINT picking_tasks_status_check;
			END IF;
		END $$
	`).Error; err != nil {
		log.Fatalf("failed to drop old picking_tasks status check: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE picking_tasks
		ALTER COLUMN status DROP DEFAULT,
		ALTER COLUMN status TYPE VARCHAR(30) USING status::text,
		ALTER COLUMN status SET DEFAULT 'WAITING'
	`).Error; err != nil {
		log.Fatalf("failed to normalize picking_tasks.status column type: %v", err)
	}

	if err := DB.Exec(`
		UPDATE picking_tasks
		SET status = CASE
			WHEN status IS NULL OR TRIM(status::text) = '' THEN 'WAITING'
			WHEN UPPER(TRIM(status::text)) IN ('PENDING', 'WAITING') THEN 'WAITING'
			WHEN UPPER(TRIM(status::text)) IN ('PICKING', 'PROCESSING') THEN 'PICKING'
			WHEN UPPER(TRIM(status::text)) IN ('COMPLETED', 'DONE') THEN 'DONE'
			ELSE 'WAITING'
		END
	`).Error; err != nil {
		log.Fatalf("failed to normalize picking_tasks.status: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE picking_tasks
		ADD CONSTRAINT picking_tasks_status_check
		CHECK (status IN ('WAITING', 'PICKING', 'DONE'))
	`).Error; err != nil {
		log.Fatalf("failed to add picking_tasks status check: %v", err)
	}

	if err := DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_picking_tasks_order_assignment
		ON picking_tasks (order_id, assigned_to, status)
	`).Error; err != nil {
		log.Fatalf("failed to create index idx_picking_tasks_order_assignment: %v", err)
	}

	// Ghi chú: Dùng import_receipt_items hiện có làm công việc nhập kho cho STAFF, không tạo bảng import_tasks.
	if err := DB.Exec(`
		ALTER TABLE import_receipts
		ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'WAITING'
	`).Error; err != nil {
		log.Fatalf("failed to add import_receipts.status: %v", err)
	}

	if err := DB.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'import_receipts_status_check'
			) THEN
				ALTER TABLE import_receipts DROP CONSTRAINT import_receipts_status_check;
			END IF;
		END $$
	`).Error; err != nil {
		log.Fatalf("failed to drop old import_receipts status check: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE import_receipts
		ALTER COLUMN status DROP DEFAULT,
		ALTER COLUMN status TYPE VARCHAR(30) USING status::text,
		ALTER COLUMN status SET DEFAULT 'WAITING'
	`).Error; err != nil {
		log.Fatalf("failed to normalize import_receipts.status column type: %v", err)
	}

	if err := DB.Exec(`
		UPDATE import_receipts
		SET status = CASE
			WHEN status IS NULL OR TRIM(status::text) = '' THEN 'WAITING'
			WHEN UPPER(TRIM(status::text)) IN ('PENDING', 'WAITING') THEN 'WAITING'
			WHEN UPPER(TRIM(status::text)) IN ('PROCESSING', 'IMPORTING', 'PARTIAL') THEN 'PROCESSING'
			WHEN UPPER(TRIM(status::text)) IN ('COMPLETED', 'DONE') THEN 'COMPLETED'
			ELSE 'WAITING'
		END
	`).Error; err != nil {
		log.Fatalf("failed to normalize import_receipts.status: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE import_receipts
		ADD CONSTRAINT import_receipts_status_check
		CHECK (status IN ('WAITING', 'PROCESSING', 'COMPLETED'))
	`).Error; err != nil {
		log.Fatalf("failed to add import_receipts status check: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE import_receipt_items
		ALTER COLUMN tray_id DROP NOT NULL
	`).Error; err != nil {
		log.Fatalf("failed to drop not null from import_receipt_items.tray_id: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE import_receipt_items
		ADD COLUMN IF NOT EXISTS actual_quantity INTEGER NOT NULL DEFAULT 0,
		ADD COLUMN IF NOT EXISTS actual_tray_id BIGINT NULL,
		ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
		ADD COLUMN IF NOT EXISTS assigned_to BIGINT NULL,
		ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NULL,
		ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL
	`).Error; err != nil {
		log.Fatalf("failed to add import receipt item task fields: %v", err)
	}

	if err := DB.Exec(`
		ALTER TABLE import_receipt_items
		ALTER COLUMN status DROP DEFAULT,
		ALTER COLUMN status TYPE VARCHAR(30) USING status::text,
		ALTER COLUMN status SET DEFAULT 'WAITING'
	`).Error; err != nil {
		log.Fatalf("failed to normalize import_receipt_items.status column type: %v", err)
	}

	if err := DB.Exec(`
		UPDATE import_receipt_items
		SET actual_quantity = COALESCE(actual_quantity, 0),
			status = COALESCE(NULLIF(TRIM(status::text), ''), 'WAITING')
	`).Error; err != nil {
		log.Fatalf("failed to backfill import receipt item task fields: %v", err)
	}

	if err := DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_import_receipt_items_assignment
		ON import_receipt_items (assigned_to, status)
	`).Error; err != nil {
		log.Fatalf("failed to create idx_import_receipt_items_assignment: %v", err)
	}

	if err := DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_import_receipt_items_receipt_status
		ON import_receipt_items (receipt_id, status)
	`).Error; err != nil {
		log.Fatalf("failed to create idx_import_receipt_items_receipt_status: %v", err)
	}
}
