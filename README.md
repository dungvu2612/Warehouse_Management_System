# Warehouse Management System (WMS) - Backend

## 1) Mô tả ngắn
Backend WMS dùng `Go + Gin + GORM + PostgreSQL`.
Hệ thống hiện hỗ trợ:
- Đăng nhập, phân quyền `ADMIN/STAFF`
- Quản lý product/location/tray/inventory
- Nhập kho qua import receipt (IMPORT)
- Tạo BOM, tạo Order từ BOM
- Picking flow: scan order -> sinh task -> confirm pick -> xuất kho (EXPORT)
- Audit log: `pick_logs`, `stock_transactions`, consistency check
- Dashboard stats

## 2) Cấu trúc chính
- `backend/cmd/main.go`: entrypoint server
- `backend/config`: kết nối DB, seed data
- `backend/models`: khai báo schema model + table mapping
- `backend/handlers`: business logic API
- `backend/routes`: khai báo route và middleware
- `backend/middleware`: auth + role guard
- `backend/utils`: JWT + constants

## 3) Yêu cầu môi trường
- Go >= 1.26
- PostgreSQL

## 4) Cấu hình `.env` (backend)
Ví dụ:

```env
APP_PORT=8080

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=quan_ly_kho_VNA
DB_SSLMODE=disable

JWT_SECRET=super-secret-change-this
JWT_EXPIRES_HOURS=24
```

## 5) Chạy backend
```bash
cd backend
go run cmd/main.go
```

Server mặc định chạy ở `http://localhost:8080`.

## 6) Tài khoản seed mặc định
`config.SeedDefaultUsers()` tự tạo nếu chưa có:
- `admin / admin123` (ADMIN)
- `staff / staff123` (STAFF)

## 7) Nhóm API chính

### Auth
- `POST /auth/login`

### Product
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PUT /products/:id`
- `DELETE /products/:id` (soft delete)

### Location / Tray / Inventory
- `POST /locations`, `GET /locations`
- `POST /trays`, `GET /trays`
- `POST /inventory`, `GET /inventory`
- `PATCH /inventory/:id/adjust`

### Import kho
- `POST /import-receipts`
- `GET /import-receipts`
- `GET /import-receipts/:id`

### BOM
- `POST /boms`
- `GET /boms`
- `GET /boms/:id/items`

### Order + Picking
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/scan`
- `PATCH /orders/picking-tasks/:id/confirm`
- `GET /orders/:id/picking-tasks`
- `GET /orders/:id/progress`
- `POST /orders/:id/finish`

### Audit / Report
- `GET /pick-logs`
- `GET /stock-transactions`
- `GET /audit/consistency/:order_id`
- `GET /dashboard/stats`

## 8) Checklist test E2E (backend)
1. Login admin thành công.
2. Tạo product cha + product linh kiện.
3. Tạo location + tray.
4. Nhập kho qua `POST /import-receipts`.
5. Kiểm tra inventory tăng đúng.
6. Tạo BOM.
7. Tạo order từ BOM (`status = PENDING`).
8. Scan order (`status = PICKING`, sinh tasks).
9. Confirm picking từng task:
   - đúng tray
   - sai tray
   - thiếu tồn kho
   - double confirm
10. Test partial pick (ví dụ 90/100).
11. Finish order và kiểm tra shortage warning.
12. Kiểm tra:
   - `pick-logs`
   - `stock-transactions` (IMPORT/EXPORT/ADJUST)
   - `audit/consistency/:order_id`
   - `dashboard/stats`

## 9) Ghi chú nghiệp vụ
- Tạo product không đồng nghĩa có tồn kho.
- Tồn kho phát sinh qua:
  - nhập kho (`IMPORT`)
  - điều chỉnh tồn (`ADJUST`)
  - xuất kho khi confirm picking (`EXPORT`)
- Rule `1 product = 1 tray` đang enforce ở DB.
