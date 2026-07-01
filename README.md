# WMS Warehouse Management System

## Mục Tiêu

WMS là hệ thống quản lý kho dùng cho luồng vận hành thực tế: nhập kho, xuất kho, kiểm kê, nhặt hàng và theo dõi tồn kho. Hệ thống hỗ trợ giao diện web cho quản trị và giao diện PDA/HT730 để nhân viên kho thao tác bằng quét mã.

Các mục tiêu chính:

- Quản lý sản phẩm, vị trí, khay và tồn kho.
- Theo dõi sản phẩm đang nằm ở khay nào, vị trí nào.
- Cảnh báo tồn thấp và ghi nhận lịch sử giao dịch kho.
- Quản lý đơn hàng, tiến độ nhặt hàng và nhật ký thao tác.
- Hỗ trợ vận hành bằng máy quét HT730 theo dạng keyboard wedge.

## Công Nghệ

- Backend: Go
- Frontend: Vite, React, TypeScript
- Database: PostgreSQL
- Scanner: HT730, TagAccess Keyboard hoặc keyboard wedge

## Phân Quyền

### ADMIN

- Quản lý danh mục sản phẩm, vị trí, khay, BOM, đơn hàng và tài khoản.
- Xem dashboard tổng quan, báo cáo doanh thu và hiệu suất.
- Theo dõi cảnh báo, lịch sử giao dịch và nhật ký vận hành.

### WAREHOUSE

- Xem và xử lý các tác vụ kho được phân quyền.
- Thực hiện picking, nhập kho, kiểm kê và tra cứu bằng PDA.
- Không truy cập các màn hình quản trị chỉ dành cho ADMIN.

## Chức Năng Chính

### Dashboard

- Hiển thị các chỉ số tổng quan vận hành.
- Theo dõi doanh thu theo thời gian.
- Thống kê trạng thái đơn hàng: `PENDING`, `PICKING`, `COMPLETED`, `CANCELLED`.
- Hiển thị cảnh báo kho, giao dịch gần đây và tình trạng tồn kho.

### Sản Phẩm

- Thêm, sửa, xóa và tra cứu sản phẩm.
- Hỗ trợ hai loại sản phẩm: `COMPONENT` và `FINISHED_GOOD`.
- Quản lý mã QR theo mã vận hành.
- Chọn nhiều sản phẩm để in QR hàng loạt.
- Cho phép ADMIN nhập hệ số độ khó xử lý cho từng sản phẩm.

### Vị Trí

- Quản lý vị trí trong kho.
- Lưu thông tin kệ, mô tả và trạng thái hoạt động.
- Phục vụ việc gắn khay vào vị trí cụ thể.

### Khay

- Quản lý danh sách khay.
- Tự sinh mã khay và QR theo chuẩn hệ thống.
- Liên kết khay với vị trí và sản phẩm.

### Kho Tổng Hợp

- Xem tồn kho tổng hợp theo sản phẩm, khay và vị trí.
- Lọc, tìm kiếm và phân trang dữ liệu.
- Theo dõi cảnh báo tồn thấp.
- Xem lịch sử giao dịch nhập, xuất và điều chỉnh tồn.

### Đơn Hàng

- Tạo, sửa, xóa và tìm kiếm đơn hàng.
- Quản lý nhiều sản phẩm trong một đơn.
- Đồng bộ sản phẩm trong đơn với tác vụ picking.
- In đơn hàng đơn lẻ hoặc in nhiều đơn cùng lúc.
- Kiểm tra thiếu linh kiện trước khi tạo đơn và hiển thị cảnh báo mềm.

### Chi Tiết Đơn Hàng

- Xem thông tin đơn, khách hàng, trạng thái và mã QR.
- Xem danh sách sản phẩm trong đơn.
- Theo dõi tiến độ nhặt hàng và giao dịch kho liên quan.
- Xem pick log và người thực hiện thao tác.
- In phiếu đơn dạng hóa đơn.

### Tác Vụ Nhân Viên Kho

- Hiển thị danh sách tác vụ nhặt hàng cho nhân viên.
- Theo dõi trạng thái `PENDING` và `PICKING`.
- Mở nhanh màn xử lý nhặt hàng theo từng đơn.

### PDA Picking

- Quét mã đơn, mã khay và mã sản phẩm.
- Kiểm tra đúng sai theo trạng thái hiện tại.
- Cập nhật số lượng nhặt theo thời gian thực.
- Giữ focus input ẩn để quét liên tục.

### PDA Stocktaking

- Quét khay để kiểm kê.
- Nhập số lượng thực tế.
- Tính chênh lệch giữa tồn hệ thống và tồn thực tế.
- Hiển thị danh sách sản phẩm đang có trong khay.

### PDA Lookup

- Quét để tra cứu nhanh sản phẩm, khay và tồn kho.
- Hỗ trợ nhân viên kho kiểm tra thông tin ngay tại khu vực làm việc.

### PDA Putaway

- Hỗ trợ luồng nhập kho bằng quét mã.
- Có cơ chế gửi yêu cầu để ADMIN duyệt theo workflow đã triển khai.

### Pick Logs Và Audit

- Ghi nhận nhật ký nhặt hàng.
- Theo dõi lịch sử thao tác để phục vụ kiểm tra và đối soát.

### Quản Lý Tài Khoản

- ADMIN tạo, sửa, khóa, mở khóa và xử lý xóa tài khoản.
- Có ràng buộc để tránh xóa dữ liệu người dùng đã có lịch sử thao tác.

## Tối Ưu Cho HT730

- Scanner hoạt động theo dạng keyboard wedge.
- Hỗ trợ Enter suffix để submit sau khi quét.
- Tự refocus sau mỗi lần quét.
- Các màn PDA được tối ưu để dễ thao tác và hạn chế tràn ngang.

## In Ấn

- In QR sản phẩm đơn lẻ.
- In QR sản phẩm hàng loạt.
- In phiếu đơn hàng đơn lẻ.
- In nhiều đơn hàng trong popup với layout hóa đơn riêng cho từng đơn.
