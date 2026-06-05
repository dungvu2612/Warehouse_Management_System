# Tóm tắt chức năng dự án WMS 

## 1) Mục tiêu hệ thống
- Quản lý kho theo luồng thực tế: nhập/xuất/kiểm kê/nhặt hàng.
- Quản lý vị trí lưu trữ: sản phẩm nằm ở khay nào, vị trí nào.
- Theo dõi tồn kho và cảnh báo tồn thấp.
- Vận hành bằng web + thiết bị PDA/HT730 quét mã.

## 2) Công nghệ
- Backend: Golang
- Frontend: Vite + React + TypeScript
- Database: PostgreSQL
- Scanner: HT730 (keyboard wedge / TagAccess Keyboard)

## 3) Phân quyền hiện tại
- `ADMIN`:
  - Quản trị danh mục, đơn hàng, tài khoản người dùng, cấu hình vận hành.
  - Xem dashboard đầy đủ (bao gồm doanh thu).
- `WAREHOUSE` (staff):
  - Vận hành kho, xem dữ liệu cần thiết, chạy luồng PDA.
  - Không vào các phần quản trị chỉ dành cho ADMIN.

## 4) Chức năng theo module

### 4.1 Dashboard
- Thẻ tổng quan vận hành.
- Biểu đồ doanh thu theo thời gian.
- Biểu đồ trạng thái đơn hàng (PENDING/PICKING/COMPLETED/CANCELLED).
- Các block theo dõi vận hành kho (cảnh báo, giao dịch gần đây, tình trạng tồn).

### 4.2 Sản phẩm (Products)
- CRUD sản phẩm.
- loại sản phẩm: `COMPONENT`, `FINISHED_GOOD`.
- QR sản phẩm tự quản lý theo mã vận hành.
- Chọn nhiều sản phẩm bằng checkbox để in QR hàng loạt.

### 4.3 Vị trí (Locations)
- CRUD vị trí kho.
- Quản lý shelf/mô tả/trạng thái hoạt động.

### 4.4 Khay (Trays)
- CRUD khay.
- Mã khay/QR tự sinh theo chuẩn.
- Liên kết khay với vị trí và sản phẩm.

### 4.5 Kho tổng hợp (Warehouse Overview)
- Màn tổng hợp tồn kho + lịch sử giao dịch kho.
- Lọc/search/phân trang.
- Cảnh báo tồn thấp.
- Đã bỏ các thao tác trùng flow khác (ví dụ nút tạo tồn ban đầu/scan tray điều chỉnh trên màn này).

### 4.6 Tồn kho & giao dịch kho
- Xem tồn theo sản phẩm/khay/vị trí.
- Điều chỉnh tồn theo quyền.
- Lịch sử giao dịch nhập/xuất/điều chỉnh.

### 4.7 Đơn hàng (Orders)
- Danh sách đơn, lọc theo trạng thái, tìm kiếm nhanh.
- Tạo/sửa/xóa đơn theo quyền.
- Quản lý nhiều sản phẩm trong một đơn (thêm/sửa/xóa dòng).
- Đồng bộ order items với luồng picking task.
- Checkbox chọn nhiều đơn để in hàng loạt.

### 4.8 Chi tiết đơn (Order Detail)
- Xem tổng quan đơn, khách hàng, trạng thái, mã QR.
- Xem danh sách sản phẩm của đơn.
- Xem tiến độ nhặt + giao dịch kho liên quan.
- Xem pick logs và thông tin người thực hiện.
- In phiếu đơn dạng hóa đơn.

### 4.9 Nhân viên kho (Staff Tasks)
- Danh sách tác vụ nhặt hàng cho staff.
- Phân trạng thái PENDING / PICKING.
- Mở nhanh chi tiết nhặt theo từng đơn.

### 4.10 PDA Picking (HT730)
- Quét mã đơn, quét khay, quét sản phẩm.
- Xử lý đúng/sai theo trạng thái hiện tại.
- Cập nhật số lượng nhặt realtime.
- Giữ focus input ẩn để quét liên tục.

### 4.11 PDA Stocktaking
- Quét khay kiểm kê.
- Nhập số lượng thực tế, tính chênh lệch.
- Hiển thị danh sách sản phẩm đang có trong khay.

### 4.12 PDA Lookup
- Quét tra cứu nhanh sản phẩm/khay/tồn cho staff.

### 4.13 PDA Putaway
- Luồng nhập kho bằng quét mã.
- Có cơ chế gửi yêu cầu để ADMIN duyệt theo workflow đã triển khai.

### 4.14 Pick Logs / Audit vận hành
- Lưu và hiển thị nhật ký nhặt hàng.

### 4.15 Quản lý tài khoản (Users)
- ADMIN quản lý user: xem/tạo/sửa/khóa/mở/xử lý xóa theo ràng buộc lịch sử.

## 5) Tối ưu cho thiết bị HT730
- Scanner dùng keyboard wdge với hidden input focusable.
- Quét Enter suffix để submit tự động.
- Refocus sau mỗi lần quét để quét liên tục.
- Nhiều màn staff/PDA đã chỉnh để tránh tràn ngang và dễ thao tác.

## 6) In ấn hiện có
- In QR sản phẩm đơn lẻ và hàng loạt.
- In phiếu đơn hàng đơn lẻ.
- In nhiều đơn hàng trong popup với layout hóa đơn đầy đủ cho từng đơn.