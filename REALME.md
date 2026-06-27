# Warehouse Management System - Quản lý kho

## 1. Giới thiệu dự án

**Warehouse Management System** là hệ thống quản lý kho được xây dựng nhằm hỗ trợ doanh nghiệp quản lý toàn bộ quy trình vận hành kho, bao gồm quản lý sản phẩm, vị trí lưu trữ, khay hàng, tồn kho, nhập kho, đơn hàng, quy trình nhặt hàng, kiểm kê, nhật ký giao dịch kho và báo cáo hiệu suất nhân viên.

Hệ thống được thiết kế theo mô hình web application, gồm:

* **Frontend**: giao diện web cho Admin và nhân viên kho.
* **Backend**: REST API xử lý nghiệp vụ, phân quyền, giao dịch kho và dữ liệu.
* **Database**: PostgreSQL lưu trữ dữ liệu sản phẩm, tồn kho, đơn hàng, tác vụ picking và lịch sử giao dịch.
* **Realtime/WebSocket**: hỗ trợ cập nhật trạng thái dữ liệu theo thời gian thực.
* **QR/Scanner**: hỗ trợ thao tác quét mã sản phẩm, khay, đơn hàng bằng thiết bị quét hoặc PDA.

Mục tiêu chính của hệ thống là giúp quy trình kho trở nên rõ ràng, hạn chế sai sót khi nhập/xuất hàng, theo dõi được lịch sử thao tác và hỗ trợ nhân viên vận hành kho nhanh hơn thông qua mã QR

---

## 2. Mục tiêu hệ thống

Dự án tập trung giải quyết các nhu cầu chính:

* Quản lý danh mục sản phẩm trong kho.
* Quản lý khay và vị trí lưu trữ hàng hóa.
* Theo dõi số lượng tồn kho theo sản phẩm, khay và vị trí.
* Quản lý BOM cho thành phẩm và linh kiện.
* Tạo đơn hàng và tự động sinh tác vụ nhặt hàng.
* Hỗ trợ nhân viên kho quét mã đơn, mã khay, mã sản phẩm để thực hiện picking.
* Ghi nhận lịch sử giao dịch kho.
* Kiểm kê, điều chỉnh tồn kho và nhập kho.
* Theo dõi hiệu suất nhân viên dựa trên tác vụ đã hoàn thành.
* Đảm bảo dữ liệu kho nhất quán thông qua transaction và các ràng buộc nghiệp vụ.

---

## 3. Đối tượng sử dụng

Hệ thống hiện hỗ trợ 2 nhóm người dùng chính:

### Admin

Admin là người quản trị hệ thống, có quyền thao tác đầy đủ trên các module chính:

* Quản lý sản phẩm.
* Quản lý vị trí/kệ/khu vực kho.
* Quản lý khay.
* Quản lý BOM.
* Quản lý đơn hàng.
* Quản lý nhập kho.
* Quản lý người dùng.
* Xem dashboard và báo cáo.
* Duyệt yêu cầu nhập kho/putaway.
* Điều chỉnh tồn kho.
* Theo dõi lịch sử giao dịch kho.
* Rà soát audit/log vận hành.

### Warehouse/Staff

Warehouse/Staff là nhân viên kho, tập trung vào các thao tác vận hành:

* Xem danh sách tác vụ được giao.
* Nhận tác vụ picking.
* Quét mã đơn hàng.
* Quét mã khay.
* Quét mã sản phẩm.
* Xác nhận số lượng đã nhặt.
* Thực hiện nhập kho/putaway theo quyền được cấp.
* Kiểm kê kho.
* Tra cứu nhanh sản phẩm, khay và tồn kho.

---

## 4. Công nghệ sử dụng

### 4.1 Backend

Backend được xây dựng bằng **Go/Golang**, sử dụng framework Echo để xây dựng REST API.

| Thành phần          | Công nghệ/Phiên bản                                      |
| ------------------- | -------------------------------------------------------- |
| Language            | Go 1.26.3                                                |
| Web framework       | Echo v4.15.2                                             |
| ORM                 | GORM v1.31.1                                             |
| Database driver     | gorm.io/driver/postgres v1.6.0                           |
| Database            | PostgreSQL                                               |
| Authentication      | JWT                                                      |
| Password hashing    | bcrypt                                                   |
| Validation          | go-playground/validator v10                              |
| Environment config  | godotenv                                                 |
| WebSocket           | gorilla/websocket                                        |
| API Documentation   | Swagger / swaggo                                         |
| Security middleware | CORS, security headers, auth middleware, role middleware |

Backend xử lý các nghiệp vụ chính như:

* Đăng nhập và cấp JWT token.
* Kiểm tra phân quyền theo role.
* CRUD sản phẩm, khay, vị trí, BOM, đơn hàng.
* Sinh picking task từ đơn hàng.
* Xác thực quy trình quét khay/sản phẩm.
* Ghi nhận lịch sử nhặt hàng.
* Quản lý tồn kho và giao dịch kho.
* Quản lý nhập kho.
* Báo cáo hiệu suất nhân viên.
* Realtime notification/WebSocket.

---

### 4.2 Frontend

Frontend được xây dựng bằng **React + Vite + TypeScript**, sử dụng Material UI cho giao diện.

| Thành phần          | Công nghệ/Phiên bản           |
| ------------------- | ----------------------------- |
| Framework           | React 19.2.6                  |
| Build tool          | Vite 8.0.12                   |
| Language            | TypeScript 6.0.2              |
| UI Library          | Material UI 9.0.1             |
| Icon Library        | MUI Icons                     |
| State/Data fetching | TanStack React Query 5.100.11 |
| HTTP Client         | Axios 1.16.1                  |
| Routing             | React Router DOM 7.15.1       |
| Date handling       | Dayjs                         |
| Chart               | ECharts, echarts-for-react    |
| QR generation       | qrcode                        |
| Validation          | Zod                           |
| Linting             | ESLint                        |

Frontend gồm các màn hình chính:

* Login.
* Dashboard.
* Products.
* Locations.
* Trays.
* Inventory/Warehouse Overview.
* BOM.
* Orders.
* Order Detail.
* Staff Tasks.
* PDA Picking.
* PDA Putaway.
* PDA Stocktaking.
* PDA Lookup.
* Import Receipts.
* Pick Logs.
* Staff Performance Report.
* Users Management.
* Notifications.

---

### 4.3 Database

Hệ thống sử dụng **PostgreSQL** để lưu dữ liệu.

Các nhóm bảng chính:

| Nhóm dữ liệu  | Bảng tiêu biểu                                    |
| ------------- | ------------------------------------------------- |
| Người dùng    | users                                             |
| Sản phẩm      | products                                          |
| Vị trí/kho    | locations                                         |
| Khay          | trays                                             |
| Tồn kho       | inventories                                       |
| BOM           | boms, bom_items                                   |
| Đơn hàng      | orders, order_items                               |
| Picking       | picking_tasks, pick_logs                          |
| Nhập kho      | import_receipts, import_receipt_items             |
| Giao dịch kho | stock_transactions                                |
| Putaway       | putaway_requests                                  |
| Báo cáo/Audit | pick_logs, stock_transactions, audit-related data |

---

## 5. Cấu trúc thư mục dự án

Cấu trúc tổng quan:

```txt
quan_ly_kho/
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── config/
│   ├── docs/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── notifications/
│   ├── realtime/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── go.mod
│   └── go.sum
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── shared/
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── deploy/
│   └── linux/
│
└── README.md
```

### Backend

Backend được chia theo mô hình rõ ràng:

| Thư mục       | Vai trò                                   |
| ------------- | ----------------------------------------- |
| cmd           | Điểm khởi chạy ứng dụng                   |
| config        | Kết nối database, migration, seed dữ liệu |
| models        | Định nghĩa struct tương ứng bảng database |
| routes        | Định nghĩa API route                      |
| handlers      | Nhận request và trả response              |
| services      | Xử lý logic nghiệp vụ                     |
| repositories  | Truy vấn database                         |
| middleware    | Auth, role, rate limit, security          |
| utils         | Hàm tiện ích, JWT, constants              |
| docs          | Swagger docs                              |
| realtime      | WebSocket cập nhật dữ liệu realtime       |
| notifications | Notification realtime                     |

### Frontend

Frontend tổ chức theo feature-based structure:

| Thư mục        | Vai trò                        |
| -------------- | ------------------------------ |
| src/app        | Provider, router, cấu hình app |
| src/features   | Các module nghiệp vụ           |
| src/shared     | Component/hàm dùng chung       |
| public         | Static assets                  |
| package.json   | Dependencies và scripts        |
| vite.config.ts | Cấu hình Vite                  |

---

## 6. Cài đặt môi trường

### 6.1 Yêu cầu môi trường

Cần cài đặt:

* Go.
* Node.js.
* npm.
* PostgreSQL.
* Git.

Kiểm tra version:

```bash
go version
node -v
npm -v
psql --version
git --version
```

---

## 7. Cấu hình Backend

Tạo file `.env` trong thư mục `backend`:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=quan_ly_kho
DB_PORT=5432
DB_SSLMODE=disable

JWT_SECRET=change-this-secret
JWT_EXPIRES_HOURS=24

APP_HOST=0.0.0.0
APP_PORT=8080

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:8080
WS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:8080

SWAGGER_BASE_PATH=/api
```

Lưu ý:

* Không commit file `.env` lên GitHub.
* Với môi trường production cần thay `JWT_SECRET` bằng chuỗi bí mật mạnh.
* Với local direct backend, API thật đang chạy trực tiếp ở `http://localhost:8080`.
* Với production qua Nginx, frontend thường gọi qua prefix `/api`.

---

## 8. Cách chạy Backend local

Di chuyển vào thư mục backend:

```bash
cd backend
```

Cài dependency Go:

```bash
go mod download
```

Chạy backend:

```bash
APP_PORT=8080 go run ./cmd
```

Backend sẽ chạy tại:

```txt
http://localhost:8080
```

Kiểm tra health check:

```bash
curl http://localhost:8080/health
```

Kết quả mong muốn:

```json
{
  "message": "Server running"
}
```

---

## 9. Cách chạy Frontend local ở chế độ dev

Di chuyển vào thư mục frontend:

```bash
cd frontend
```

Cài dependency:

```bash
npm install
```

Chạy frontend dev:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Frontend dev thường chạy tại:

```txt
http://localhost:5173
```

Luồng local dev:

```txt
Browser
  ↓
Frontend Vite Dev Server - http://localhost:5173
  ↓
API request tới http://localhost:8080
  ↓
Backend Go
  ↓
PostgreSQL
```

---

## 10. Build Frontend

Build frontend:

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8080 npm run build
```

Sau khi build thành công, Vite sẽ tạo thư mục:

```txt
frontend/dist
```

Thư mục `dist` là bản frontend đã được đóng gói để chạy production hoặc để backend serve trực tiếp.

---

## 11. Chạy Backend serve luôn Frontend dist

Dự án backend có hỗ trợ serve frontend build từ thư mục `frontend/dist`.

Chạy như sau:

```bash
cd frontend
rm -rf dist
VITE_API_BASE_URL=http://localhost:8080 npm run build

cd ../backend
APP_PORT=8080 go run ./cmd
```

Sau đó mở:

```txt
http://localhost:8080
```

Luồng chạy:

```txt
Browser
  ↓
http://localhost:8080
  ↓
Backend Go
  ├── Trả frontend dist
  └── Xử lý API
```

---

## 12. Build production qua Nginx

Với môi trường production qua Nginx, frontend nên build với API prefix `/api`:

```bash
cd frontend
VITE_API_BASE_URL=/api npm run build
```

Luồng production dự kiến:

```txt
Browser
  ↓
http://wms.local
  ↓
Nginx
  ├── /        → frontend dist
  └── /api/... → proxy sang backend Go
```

Ví dụ:

```txt
Frontend gọi: /api/products
Nginx proxy:  http://127.0.0.1:8080/products
```

Lưu ý quan trọng:

* Khi chạy local trực tiếp bằng backend `localhost:8080`, nên dùng:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run build
```

* Khi deploy qua Nginx, nên dùng:

```bash
VITE_API_BASE_URL=/api npm run build
```

---

## 13. Tài khoản mặc định cho môi trường dev/test

Backend có seed tài khoản mặc định:

| Username | Password | Role            |
| -------- | -------- | --------------- |
| admin    | admin123 | ADMIN           |
| staff    | staff123 | STAFF/WAREHOUSE |

Lưu ý:

* Chỉ dùng tài khoản mặc định cho môi trường dev/test.
* Không sử dụng password mặc định cho production.
* Nên đổi hoặc tắt seed user khi triển khai thật.

---

## 14. Luồng dữ liệu tổng quan

### 14.1 Luồng đăng nhập

```txt
User nhập username/password
  ↓
Frontend gọi API /auth/login
  ↓
Backend kiểm tra user trong database
  ↓
Backend kiểm tra password bằng bcrypt
  ↓
Backend tạo JWT token
  ↓
Frontend lưu token
  ↓
Các request sau gửi kèm Authorization Bearer token
```

API liên quan:

```txt
POST /auth/login
GET  /auth/me
```

---

### 14.2 Luồng quản lý sản phẩm

```txt
Admin tạo sản phẩm
  ↓
Backend sinh product_code và qr_code
  ↓
Lưu sản phẩm vào bảng products
  ↓
Frontend hiển thị danh sách sản phẩm
  ↓
Admin có thể in QR sản phẩm
```

Sản phẩm có các thông tin chính:

* Mã sản phẩm.
* QR code.
* Tên sản phẩm.
* Loại sản phẩm: COMPONENT hoặc FINISHED_GOOD.
* Đơn vị tính.
* Tồn tối thiểu.
* Giá.
* Độ khó xử lý.
* Trạng thái hoạt động.

API liên quan:

```txt
GET    /products
GET    /products/:id
GET    /products/code-preview
GET    /products/scan/:qr_code
POST   /products
PUT    /products/:id
DELETE /products/:id
```

---

### 14.3 Luồng quản lý vị trí và khay

```txt
Admin tạo vị trí kho
  ↓
Admin tạo khay
  ↓
Khay được gán với vị trí
  ↓
Khay có thể được gán với sản phẩm
  ↓
Tồn kho được theo dõi theo sản phẩm + khay
```

API vị trí:

```txt
GET    /locations
GET    /locations/:id/trays
POST   /locations
PUT    /locations/:id
DELETE /locations/:id
```

API khay:

```txt
GET    /trays
GET    /trays/scan/:qr_code
POST   /trays
PUT    /trays/:id
DELETE /trays/:id
```

---

### 14.4 Luồng tồn kho

```txt
Sản phẩm được nhập vào khay
  ↓
Inventory ghi nhận product_id + tray_id + quantity
  ↓
Các thao tác nhập/xuất/điều chỉnh tạo stock transaction
  ↓
Dashboard và báo cáo lấy dữ liệu từ inventory + stock_transactions
```

API liên quan:

```txt
GET   /inventory
POST  /inventory
PATCH /inventory/:id/adjust
POST  /inventory/adjust-by-tray
POST  /inventory/putaway
POST  /inventory/stocktaking
GET   /stock-transactions
```

---

### 14.5 Luồng BOM

BOM dùng để định nghĩa thành phẩm được tạo từ những linh kiện nào.

```txt
Admin chọn thành phẩm
  ↓
Thêm danh sách linh kiện/component
  ↓
Mỗi linh kiện có số lượng cần thiết
  ↓
Khi tạo đơn hàng thành phẩm, hệ thống có thể dựa vào BOM để kiểm tra và xử lý nhu cầu linh kiện
```

API liên quan:

```txt
GET    /boms
GET    /boms/:id/items
POST   /boms
PUT    /boms/:id
DELETE /boms/:id
```

---

### 14.6 Luồng đơn hàng

```txt
Admin tạo đơn hàng
  ↓
Thêm sản phẩm vào đơn
  ↓
Backend kiểm tra dữ liệu sản phẩm và tồn kho
  ↓
Backend tạo order_items
  ↓
Backend sinh picking_tasks tương ứng
  ↓
Nhân viên kho thực hiện picking
```

API liên quan:

```txt
GET    /orders
GET    /orders/:id
POST   /orders
PUT    /orders/:id
DELETE /orders/:id
GET    /orders/:id/picking-tasks
GET    /orders/:id/progress
POST   /orders/:id/finish
```

---

### 14.7 Luồng picking/nhặt hàng

```txt
Nhân viên quét mã đơn hàng
  ↓
Hệ thống hiển thị danh sách picking task
  ↓
Nhân viên chọn hoặc nhận task
  ↓
Nhân viên quét mã khay
  ↓
Backend xác thực khay có đúng với task không
  ↓
Nhân viên quét mã sản phẩm
  ↓
Backend xác thực sản phẩm có đúng không
  ↓
Cập nhật picked_quantity
  ↓
Ghi pick_log
  ↓
Cập nhật tồn kho
  ↓
Khi đủ số lượng, task hoàn thành
  ↓
Khi tất cả task hoàn thành, đơn có thể hoàn tất
```

API liên quan:

```txt
POST /orders/scan
GET  /orders/scan/:qr_code
POST /orders/picking-tasks/:id/verify-tray
POST /orders/picking-tasks/:id/scan-product
GET  /pick-logs
GET  /staff/tasks
GET  /staff/task-summary
POST /staff/orders/:order_id/claim
```

---

### 14.8 Luồng nhập kho

```txt
Admin tạo phiếu nhập kho
  ↓
Thêm danh sách sản phẩm cần nhập
  ↓
Nhân viên kho nhận task nhập
  ↓
Nhân viên xác nhận số lượng thực tế
  ↓
Hệ thống cập nhật tồn kho
  ↓
Ghi stock transaction
  ↓
Phiếu nhập hoàn thành khi các item hoàn tất
```

API liên quan:

```txt
GET    /import-receipts
GET    /import-receipts/:id
POST   /import-receipts
PUT    /import-receipts/:id
DELETE /import-receipts/:id

GET    /staff/import-receipt-items
GET    /staff/import-receipt-items/summary
POST   /staff/import-receipt-items/:item_id/claim
POST   /staff/import-receipt-items/:item_id/confirm

PATCH  /admin/import-receipt-items/:item_id/assign
PATCH  /admin/import-receipt-items/:item_id/unassign
```

---

### 14.9 Luồng kiểm kê

```txt
Nhân viên quét khay
  ↓
Hệ thống hiển thị sản phẩm/tồn hiện tại trong khay
  ↓
Nhân viên nhập số lượng thực tế
  ↓
Backend tính chênh lệch
  ↓
Cập nhật inventory
  ↓
Ghi stock transaction loại kiểm kê/điều chỉnh
```

API liên quan:

```txt
POST /inventory/stocktaking
POST /inventory/adjust-by-tray
GET  /inventory
GET  /stock-transactions
```

---

### 14.10 Luồng báo cáo hiệu suất nhân viên

```txt
Nhân viên hoàn thành picking/import task
  ↓
Hệ thống ghi nhận người thực hiện, thời gian, số lượng
  ↓
Dữ liệu được tổng hợp theo nhân viên
  ↓
Tính điểm hiệu suất dựa trên số task, số lượng và độ khó sản phẩm
  ↓
Admin xem báo cáo hiệu suất
```

API liên quan:

```txt
GET /admin/reports/staff-performance
```

---

## 15. Danh sách tính năng chính

### 15.1 Authentication & Authorization

* Đăng nhập bằng username/password.
* Mã hóa password bằng bcrypt.
* Cấp JWT token.
* Kiểm tra token với middleware.
* Phân quyền theo role ADMIN và WAREHOUSE.
* Hỗ trợ token version để vô hiệu hóa token cũ khi cần.
* Có rate limit cho login.

### 15.2 Dashboard

* Hiển thị số liệu tổng quan.
* Theo dõi trạng thái vận hành kho.
* Hiển thị các chỉ số đơn hàng, tồn kho, giao dịch gần đây.
* Hỗ trợ biểu đồ bằng ECharts.

### 15.3 Products

* Tạo sản phẩm.
* Sửa sản phẩm.
* Xem chi tiết sản phẩm.
* Xóa mềm sản phẩm.
* Sinh mã sản phẩm.
* Sinh QR sản phẩm.
* Scan QR sản phẩm.
* In QR sản phẩm.
* Quản lý loại sản phẩm: linh kiện/thành phẩm.
* Quản lý độ khó xử lý sản phẩm.

### 15.4 Locations

* Tạo vị trí kho.
* Sửa vị trí kho.
* Xóa vị trí kho.
* Xem danh sách khay thuộc vị trí.
* Quản lý trạng thái hoạt động của vị trí.

### 15.5 Trays

* Tạo khay.
* Sửa khay.
* Xóa mềm khay.
* Gán khay với vị trí.
* Gán khay với sản phẩm.
* Sinh QR khay.
* Scan QR khay.
* Theo dõi tồn kho theo khay.

### 15.6 Inventory

* Xem tồn kho.
* Tạo tồn kho ban đầu.
* Điều chỉnh tồn kho.
* Điều chỉnh theo khay.
* Putaway.
* Kiểm kê.
* Ghi nhận tồn trước và sau khi thay đổi.

### 15.7 BOM

* Tạo BOM cho thành phẩm.
* Thêm linh kiện vào BOM.
* Cập nhật BOM.
* Xóa BOM.
* Xem danh sách item trong BOM.
* Kiểm soát sản phẩm liên quan đến BOM.

### 15.8 Orders

* Tạo đơn hàng.
* Sửa đơn hàng.
* Xóa đơn hàng.
* Xem chi tiết đơn hàng.
* Quản lý nhiều sản phẩm trong một đơn.
* Sinh QR đơn hàng.
* Theo dõi tiến độ picking.
* Hoàn tất đơn hàng.

### 15.9 Picking

* Quét mã đơn hàng.
* Quét mã khay.
* Quét mã sản phẩm.
* Kiểm tra đúng/sai khay.
* Kiểm tra đúng/sai sản phẩm.
* Cập nhật số lượng đã nhặt.
* Ghi pick log.
* Cập nhật tồn kho.
* Theo dõi tiến độ từng đơn.

### 15.10 Import Receipts

* Tạo phiếu nhập.
* Thêm sản phẩm cần nhập.
* Giao task nhập hàng cho nhân viên.
* Nhân viên nhận task.
* Nhân viên xác nhận số lượng thực tế.
* Admin phân công hoặc hủy phân công.
* Cập nhật tồn kho sau khi nhập.

### 15.11 Staff Tasks

* Nhân viên xem danh sách task.
* Nhân viên nhận đơn cần picking.
* Theo dõi task đang chờ hoặc đang xử lý.
* Xem summary task.

### 15.12 Reports

* Báo cáo hiệu suất nhân viên.
* Tổng hợp số lượng task đã hoàn thành.
* Tổng hợp số lượng sản phẩm đã xử lý.
* Tính điểm hiệu suất theo độ khó sản phẩm.

### 15.13 Notifications & Realtime

* Cập nhật dữ liệu realtime qua WebSocket.
* Thông báo thay đổi dữ liệu.
* Xem danh sách notification.
* Đánh dấu đã đọc toàn bộ notification.

---

## 16. API Documentation

Backend có tích hợp Swagger.

Sau khi chạy backend, truy cập:

```txt
http://localhost:8080/docs/index.html
```

Health check:

```txt
GET http://localhost:8080/health
```

### Ghi chú về API prefix `/api`

Trong source backend hiện tại, route API được khai báo trực tiếp ở root, ví dụ:

```txt
/products
/orders
/import-receipts
```

Khi deploy qua Nginx, frontend có thể gọi:

```txt
/api/products
/api/orders
/api/import-receipts
```

Nginx sẽ proxy về backend và bỏ prefix `/api`.

Ví dụ:

```txt
Client gọi: /api/products
Nginx chuyển về backend: /products
```

Do đó:

| Môi trường               | API Base URL nên dùng |
| ------------------------ | --------------------- |
| Local frontend dev       | http://localhost:8080 |
| Local backend serve dist | http://localhost:8080 |
| Production qua Nginx     | /api                  |

---

## 17. Tổng hợp API chính

### 17.1 Auth API

| Method | Endpoint    | Mô tả                       | Role          |
| ------ | ----------- | --------------------------- | ------------- |
| POST   | /auth/login | Đăng nhập                   | Public        |
| GET    | /auth/me    | Lấy thông tin user hiện tại | Authenticated |

### 17.2 Product API

| Method | Endpoint                | Mô tả                  | Role        |
| ------ | ----------------------- | ---------------------- | ----------- |
| GET    | /products               | Lấy danh sách sản phẩm | Public/Auth |
| GET    | /products/:id           | Lấy chi tiết sản phẩm  | Public/Auth |
| GET    | /products/code-preview  | Xem trước mã sản phẩm  | Public/Auth |
| GET    | /products/scan/:qr_code | Quét QR sản phẩm       | Public/Auth |
| POST   | /products               | Tạo sản phẩm           | ADMIN       |
| PUT    | /products/:id           | Cập nhật sản phẩm      | ADMIN       |
| DELETE | /products/:id           | Xóa mềm sản phẩm       | ADMIN       |

### 17.3 Location API

| Method | Endpoint             | Mô tả                           | Role        |
| ------ | -------------------- | ------------------------------- | ----------- |
| GET    | /locations           | Lấy danh sách vị trí            | Public/Auth |
| GET    | /locations/:id/trays | Lấy danh sách khay trong vị trí | Public/Auth |
| POST   | /locations           | Tạo vị trí                      | ADMIN       |
| PUT    | /locations/:id       | Cập nhật vị trí                 | ADMIN       |
| DELETE | /locations/:id       | Xóa vị trí                      | ADMIN       |

### 17.4 Tray API

| Method | Endpoint             | Mô tả              | Role        |
| ------ | -------------------- | ------------------ | ----------- |
| GET    | /trays               | Lấy danh sách khay | Public/Auth |
| GET    | /trays/scan/:qr_code | Quét QR khay       | Public/Auth |
| POST   | /trays               | Tạo khay           | ADMIN       |
| PUT    | /trays/:id           | Cập nhật khay      | ADMIN       |
| DELETE | /trays/:id           | Xóa mềm khay       | ADMIN       |

### 17.5 Inventory API

| Method | Endpoint                                | Mô tả                         | Role            |
| ------ | --------------------------------------- | ----------------------------- | --------------- |
| GET    | /inventory                              | Xem tồn kho                   | ADMIN/WAREHOUSE |
| POST   | /inventory                              | Tạo tồn kho                   | ADMIN           |
| PATCH  | /inventory/:id/adjust                   | Điều chỉnh tồn kho            | ADMIN           |
| POST   | /inventory/adjust-by-tray               | Điều chỉnh tồn theo khay      | ADMIN/WAREHOUSE |
| POST   | /inventory/putaway                      | Nhập hàng vào khay            | ADMIN/WAREHOUSE |
| GET    | /inventory/putaway-requests             | Lấy danh sách yêu cầu putaway | ADMIN           |
| POST   | /inventory/putaway-requests/:id/approve | Duyệt yêu cầu putaway         | ADMIN           |
| POST   | /inventory/putaway-requests/:id/reject  | Từ chối yêu cầu putaway       | ADMIN           |
| POST   | /inventory/stocktaking                  | Kiểm kê                       | ADMIN/WAREHOUSE |

### 17.6 BOM API

| Method | Endpoint        | Mô tả                      | Role            |
| ------ | --------------- | -------------------------- | --------------- |
| GET    | /boms           | Lấy danh sách BOM          | ADMIN/WAREHOUSE |
| GET    | /boms/:id/items | Lấy danh sách item của BOM | ADMIN/WAREHOUSE |
| POST   | /boms           | Tạo BOM                    | ADMIN/WAREHOUSE |
| PUT    | /boms/:id       | Cập nhật BOM               | ADMIN/WAREHOUSE |
| DELETE | /boms/:id       | Xóa BOM                    | ADMIN/WAREHOUSE |

### 17.7 Order API

| Method | Endpoint                               | Mô tả                     | Role            |
| ------ | -------------------------------------- | ------------------------- | --------------- |
| GET    | /orders                                | Lấy danh sách đơn hàng    | ADMIN           |
| GET    | /orders/:id                            | Lấy chi tiết đơn hàng     | ADMIN/WAREHOUSE |
| POST   | /orders                                | Tạo đơn hàng              | ADMIN           |
| PUT    | /orders/:id                            | Cập nhật đơn hàng         | ADMIN           |
| DELETE | /orders/:id                            | Xóa đơn hàng              | ADMIN           |
| POST   | /orders/scan                           | Quét đơn hàng để picking  | ADMIN/WAREHOUSE |
| GET    | /orders/scan/:qr_code                  | Quét đơn hàng bằng QR     | ADMIN/WAREHOUSE |
| GET    | /orders/:id/picking-tasks              | Lấy picking task của đơn  | ADMIN/WAREHOUSE |
| GET    | /orders/:id/progress                   | Xem tiến độ picking       | ADMIN/WAREHOUSE |
| POST   | /orders/:id/finish                     | Hoàn tất đơn hàng         | ADMIN/WAREHOUSE |
| POST   | /orders/picking-tasks/:id/verify-tray  | Xác thực khay khi picking | ADMIN/WAREHOUSE |
| POST   | /orders/picking-tasks/:id/scan-product | Quét sản phẩm khi picking | ADMIN/WAREHOUSE |

### 17.8 Staff API

| Method | Endpoint                      | Mô tả               | Role            |
| ------ | ----------------------------- | ------------------- | --------------- |
| GET    | /staff/tasks                  | Lấy task của staff  | ADMIN/WAREHOUSE |
| GET    | /staff/task-summary           | Tổng hợp task staff | ADMIN/WAREHOUSE |
| POST   | /staff/orders/:order_id/claim | Nhận đơn picking    | ADMIN/WAREHOUSE |

### 17.9 Import Receipt API

| Method | Endpoint                                      | Mô tả                         | Role            |
| ------ | --------------------------------------------- | ----------------------------- | --------------- |
| GET    | /import-receipts                              | Lấy danh sách phiếu nhập      | ADMIN/WAREHOUSE |
| GET    | /import-receipts/:id                          | Lấy chi tiết phiếu nhập       | ADMIN/WAREHOUSE |
| POST   | /import-receipts                              | Tạo phiếu nhập                | ADMIN           |
| PUT    | /import-receipts/:id                          | Cập nhật phiếu nhập           | ADMIN           |
| DELETE | /import-receipts/:id                          | Xóa phiếu nhập                | ADMIN           |
| GET    | /staff/import-receipt-items                   | Lấy task nhập hàng            | ADMIN/WAREHOUSE |
| GET    | /staff/import-receipt-items/summary           | Tổng hợp task nhập hàng       | ADMIN/WAREHOUSE |
| POST   | /staff/import-receipt-items/:item_id/claim    | Nhận task nhập hàng           | ADMIN/WAREHOUSE |
| POST   | /staff/import-receipt-items/:item_id/confirm  | Xác nhận nhập hàng            | ADMIN/WAREHOUSE |
| PATCH  | /admin/import-receipt-items/:item_id/assign   | Admin phân công task nhập     | ADMIN           |
| PATCH  | /admin/import-receipt-items/:item_id/unassign | Admin hủy phân công task nhập | ADMIN           |

### 17.10 Report API

| Method | Endpoint                         | Mô tả                       | Role  |
| ------ | -------------------------------- | --------------------------- | ----- |
| GET    | /admin/reports/staff-performance | Báo cáo hiệu suất nhân viên | ADMIN |

### 17.11 Notification API

| Method | Endpoint                | Mô tả                  | Role            |
| ------ | ----------------------- | ---------------------- | --------------- |
| GET    | /notifications/summary  | Tổng hợp notification  | ADMIN/WAREHOUSE |
| GET    | /notifications          | Danh sách notification | ADMIN/WAREHOUSE |
| POST   | /notifications/read-all | Đánh dấu tất cả đã đọc | ADMIN/WAREHOUSE |
| GET    | /notifications/ws       | WebSocket notification | ADMIN/WAREHOUSE |

### 17.12 Maintenance API

| Method | Endpoint                    | Mô tả                                               | Role  |
| ------ | --------------------------- | --------------------------------------------------- | ----- |
| POST   | /maintenance/purge-inactive | Xóa hẳn dữ liệu master không còn liên kết nghiệp vụ | ADMIN |

---

## 18. Business Rules quan trọng

### 18.1 Quy tắc xóa mềm

Sản phẩm, khay và một số dữ liệu master không nên bị xóa cứng ngay lập tức.

Cơ chế đề xuất:

```txt
is_active = false
```

Dữ liệu bị xóa mềm sẽ không hiển thị trong luồng vận hành thông thường nhưng vẫn giữ được lịch sử nghiệp vụ.

### 18.2 Khi nào không được xóa sản phẩm?

Không cho xóa sản phẩm nếu:

* Sản phẩm còn tồn kho.
* Sản phẩm đang nằm trong khay còn active.
* Sản phẩm đang được dùng trong BOM.
* Sản phẩm đang nằm trong đơn hàng chưa hoàn tất.
* Sản phẩm đang nằm trong picking task chưa hoàn tất.
* Sản phẩm có liên kết nghiệp vụ quan trọng cần giữ lịch sử.

### 18.3 Khi nào không được xóa khay?

Không cho xóa khay nếu:

* Khay còn tồn kho.
* Khay đang được dùng trong picking task.
* Khay đang được dùng trong nhập kho/putaway.
* Khay có liên kết với giao dịch kho cần giữ lịch sử.

### 18.4 Khi nào được xóa hẳn khỏi database?

Chỉ xóa cứng khi dữ liệu:

* Đã bị xóa mềm.
* Không còn tồn kho.
* Không còn liên kết với BOM.
* Không còn liên kết với order.
* Không còn liên kết với picking task.
* Không còn liên kết với import receipt.
* Không còn liên kết với stock transaction quan trọng.
* Không ảnh hưởng đến lịch sử vận hành.

---

## 19. Transaction và an toàn dữ liệu

Các nghiệp vụ liên quan đến tồn kho cần được xử lý trong database transaction để đảm bảo ACID.

Ví dụ nghiệp vụ picking:

```txt
Quét sản phẩm
  ↓
Kiểm tra picking task
  ↓
Kiểm tra tồn kho
  ↓
Trừ tồn kho
  ↓
Cập nhật picked_quantity
  ↓
Ghi pick_log
  ↓
Ghi stock_transaction
  ↓
Commit transaction
```

Nếu một bước lỗi, toàn bộ transaction cần rollback để tránh lệch dữ liệu.

Các trường hợp cần kiểm soát:

* Nhặt quá số lượng yêu cầu.
* Nhặt khi tồn kho không đủ.
* Quét sai khay.
* Quét sai sản phẩm.
* Hai nhân viên cùng thao tác một tồn kho.
* Đơn hàng đã hoàn tất nhưng vẫn bị thao tác tiếp.
* Task đã hoàn thành nhưng vẫn bị scan tiếp.

---

## 20. Bảo mật

Hệ thống có các cơ chế bảo mật cơ bản:

* JWT authentication.
* Role-based access control.
* Bcrypt password hashing.
* Login rate limit.
* CORS config.
* Security headers:

  * X-Content-Type-Options.
  * X-Frame-Options.
  * Referrer-Policy.
  * Permissions-Policy.
  * Content-Security-Policy.
* Không trả password hash ra response.
* Token có thời hạn.
* Middleware kiểm tra quyền trước khi vào API quan trọng.

Khuyến nghị khi deploy production:

* Đổi `JWT_SECRET`.
* Không sử dụng tài khoản seed mặc định.
* Không commit `.env`.
* Không public database credentials.
* Dùng HTTPS.
* Giới hạn CORS theo domain thật.
* Backup database định kỳ.
* Kiểm tra security scan trước khi bàn giao.

---

## 21. WebSocket/Reatime

Hệ thống có hỗ trợ WebSocket cho realtime data change và notification.

Endpoint realtime:

```txt
GET /ws
GET /notifications/ws
```

Mục đích:

* Cập nhật thay đổi dữ liệu theo thời gian thực.
* Gửi thông báo khi có thay đổi nghiệp vụ.
* Hỗ trợ frontend làm mới trạng thái mà không cần reload trang liên tục.

---

## 22. QR Code và Scanner

Hệ thống hỗ trợ QR cho:

* Sản phẩm.
* Khay.
* Đơn hàng.

Các thiết bị quét như PDA hoặc barcode scanner có thể hoạt động theo kiểu keyboard wedge, tức là khi quét mã, thiết bị nhập chuỗi mã vào input giống như bàn phím.

Luồng scanner:

```txt
Scanner quét mã
  ↓
Mã QR được nhập vào input
  ↓
Frontend gửi mã lên backend
  ↓
Backend xác thực mã
  ↓
Trả kết quả đúng/sai
  ↓
Frontend hiển thị trạng thái cho nhân viên
```

---

## 23. Screenshots

Có thể thêm ảnh giao diện vào thư mục:

```txt
docs/images/
```

Ví dụ:

```txt
docs/images/login.png
docs/images/dashboard.png
docs/images/products.png
docs/images/orders.png
docs/images/picking.png
docs/images/report.png
```

Chèn ảnh trong README:

```md
## Giao diện hệ thống

### Login
![Login](docs/images/login.png)

### Dashboard
![Dashboard](docs/images/dashboard.png)

### Quản lý sản phẩm
![Products](docs/images/products.png)

### Picking
![Picking](docs/images/picking.png)
```

Lưu ý khi đưa ảnh lên GitHub:

* Dùng dữ liệu demo.
* Không để lộ tên khách hàng thật.
* Không để lộ số điện thoại, email, địa chỉ thật.
* Không để lộ domain nội bộ, IP server hoặc token.
* Không để lộ thông tin công ty nếu chưa được phép.

---

## 24. Scripts thường dùng

### Backend

```bash
cd backend
go mod download
go run ./cmd
```

Build backend:

```bash
cd backend
go build -o wms-backend ./cmd
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

Build frontend dùng backend local:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run build
```

Build frontend dùng Nginx `/api`:

```bash
VITE_API_BASE_URL=/api npm run build
```

---

## 25. Troubleshooting

### 25.1 Frontend gọi API lỗi 404

Kiểm tra `VITE_API_BASE_URL`.

Local direct backend:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

Production qua Nginx:

```bash
VITE_API_BASE_URL=/api
```

### 25.2 Lỗi `e.map is not a function`

Nguyên nhân thường gặp:

* API trả về object lỗi thay vì array.
* Frontend gọi sai endpoint.
* Build frontend với sai `VITE_API_BASE_URL`.
* Backend trả HTML `index.html` thay vì JSON API.

Cách kiểm tra:

* Mở DevTools.
* Vào tab Network.
* Xem request đang gọi URL nào.
* Kiểm tra response là JSON hay HTML.

### 25.3 Backend không kết nối được database

Kiểm tra file `.env`:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=quan_ly_kho
DB_PORT=5432
DB_SSLMODE=disable
```

Kiểm tra PostgreSQL có đang chạy không.

### 25.4 Login không được

Kiểm tra:

* User có tồn tại không.
* Password đúng không.
* User có `is_active = true` không.
* Backend có kết nối được DB không.
* JWT_SECRET có thay đổi khiến token cũ không hợp lệ không.

### 25.5 Build frontend thành công nhưng web vẫn là bản cũ

Có thể backend đang serve `frontend/dist` cũ.

Cách xử lý:

```bash
cd frontend
rm -rf dist
VITE_API_BASE_URL=http://localhost:8080 npm run build

cd ../backend
APP_PORT=8080 go run ./cmd
```

---

## 26. Git ignore khuyến nghị

Không nên commit các file/thư mục sau:

```gitignore
.env
.env.*
node_modules/
dist/
build/
release/
logs/
tmp/
*.log
.DS_Store
```

Với GitHub cá nhân hoặc public portfolio, nên kiểm tra kỹ trước khi push:

* Không có mật khẩu.
* Không có token.
* Không có file `.env`.
* Không có dữ liệu thật của công ty.
* Không có thông tin khách hàng thật.
* Không có IP/domain nội bộ.

---

## 27. Roadmap phát triển

Một số hướng phát triển tiếp theo:

* Chuẩn hóa toàn bộ backend API dưới prefix `/api`.
* Tối ưu bundle frontend bằng code splitting.
* Tối ưu import MUI icons để giảm dung lượng file build.
* Bổ sung Error Boundary cho frontend.
* Bổ sung test tự động cho nghiệp vụ picking.
* Bổ sung test transaction chống race condition.
* Tăng cường audit log cho các thao tác quan trọng.
* Bổ sung backup/restore database.
* Bổ sung phân quyền chi tiết hơn theo từng module.
* Bổ sung dashboard nâng cao cho quản lý kho.
* Tối ưu giao diện cho PDA/HT730.

---

## 28. Tác giả

Dự án được xây dựng nhằm phục vụ bài toán quản lý kho, hỗ trợ vận hành sản phẩm, tồn kho, đơn hàng và quy trình picking bằng QR code.

```txt
Project: Warehouse Management System
Type: Web Application
Backend: Go + Echo + PostgreSQL
Frontend: React + Vite + TypeScript
Database: PostgreSQL
```
