# Tóm tắt tiến trình chat dự án WMS (Frontend + Backend hỗ trợ)

## 1. Yêu cầu nguyên tắc làm việc
- Áp dụng clean architecture frontend: tách `api`, `types`, `hooks`, `components`, `pages`.
- Tránh file lớn rối logic.
- Mỗi file mới/sửa có block handover ở đầu file.
- Các block logic quan trọng có comment `// Senior Handover: ...`.
- Không phá flow login/auth/router/layout.
- Tận dụng `apiClient/http` hiện có.
- TypeScript strict, hạn chế `any`.
- UI đồng bộ style hiện tại.
- Sau khi code phải báo file sửa + khu vực sửa + checklist test thủ công.

## 2. Các feature đã triển khai theo yêu cầu trước đó

### 2.1 Locations
- Hoàn thiện màn Locations theo clean architecture.
- Có list + create ban đầu, sau đó mở rộng CRUD (thêm/sửa/xóa mềm).
- Hiển thị đầy đủ các trường:
  - `id`
  - `location_code`
  - `shelf`
  - `description`
  - `is_active`
  - `created_at`
  - `updated_at`
- Permission:
  - `ADMIN`: tạo/sửa/xóa
  - `STAFF`: chỉ xem

### 2.2 Trays
- Hoàn thiện màn Trays theo clean architecture.
- Có CRUD và permission theo role.
- Hiển thị `location_code` + `description` thay vì `location_id`.
- Chuẩn hóa mã khay theo format:
  - `<LOCATION_CODE>-T<TRAY_NUMBER>`
  - Ví dụ: `A-01-T01`, `A-01-T02`
- Khi tạo tray:
  - Tự sinh `tray_code`
  - Tự sinh `qr_code`
  - User không cần nhập tay

### 2.3 Inventory
- Hoàn thiện màn Inventory theo clean architecture.
- Kết nối API dựa trên source backend (không đoán endpoint):
  - `GET /inventory`
  - `POST /inventory` (tạo tồn ban đầu)
  - `PATCH /inventory/:id/adjust` (điều chỉnh tồn)
- Có:
  - bảng tồn kho
  - filter/search
  - loading/error/empty state
  - low-stock warning (đổi màu/cảnh báo khi tồn thấp)
  - form điều chỉnh tồn cho ADMIN
  - STAFF chỉ xem
- Mở rộng thêm:
  - Lịch sử điều chỉnh tồn ở dưới bảng chính
  - Hiển thị `product_code + product_name` thay vì `product_id`
  - Điều chỉnh tồn có lựa chọn `Nhập kho/Xuất kho`
  - Chặn frontend khi tray không thuộc product để tránh lỗi backend:
    - `tray does not belong to the provided product`

### 2.4 Import Receipts
- Hoàn thiện feature Import Receipts theo clean architecture.
- Đọc backend để xác nhận endpoint:
  - `GET /import-receipts`
  - `GET /import-receipts/:id`
  - `POST /import-receipts`
- UI có:
  - danh sách phiếu nhập
  - chi tiết phiếu nhập
  - form tạo phiếu nhập nhiều item (dynamic item form)
  - chọn product/tray
  - submit + refresh data sau tạo
- Permission:
  - `ADMIN`: được tạo
  - `STAFF`: chỉ xem (nếu backend cho phép endpoint read)

## 3. Bổ sung ảnh sản phẩm theo yêu cầu mới
- Thêm khả năng import ảnh khi tạo/sửa product.
- Ảnh được chuẩn hóa về 1 kích thước thống nhất sau khi import (resize/crop).
- Dùng component thumbnail dùng chung để hiển thị đồng nhất toàn hệ thống.
- Đã bổ sung hiển thị ảnh tại các màn có sản phẩm chính:
  - Products
  - Inventory (bảng tồn + lịch sử điều chỉnh + form chọn product)
  - Trays (bảng)
  - Import Receipts (form tạo + dialog chi tiết)
  - Order detail (task table)
  - BOM list + BOM items dialog (đã bổ sung thêm sau)

## 4. Backend hỗ trợ ảnh sản phẩm
- Đã thêm field `image_url` cho `Product` model.
- Đã thêm migration `products.image_url`.
- Đã map `image_url` trong handler/service create/update product.

## 5. Điều chỉnh theo yêu cầu “handover”
- Đã đổi phần tiêu đề đầu file từ dạng có chữ `"Senior Handover Note"` sang dạng nội dung `Thong tin handover:` theo yêu cầu.
- Vẫn giữ comment block quan trọng `// Senior Handover: ...`.

## 6. Sự cố/khó khăn đã gặp
- Lỗi nghiệp vụ inventory khi tạo tồn:
  - `tray does not belong to the provided product`
  - Nguyên nhân: chọn tray không thuộc product tương ứng.
  - Hướng xử lý đã áp dụng: lọc tray theo product + reset tray khi đổi product + chặn submit sai trước khi gọi API.
- Lỗi push git:
  - `RPC failed; HTTP 500 ... remote end hung up unexpectedly`
  - Đây là lỗi phía remote/server hoặc payload push lớn, không phải lỗi code logic frontend.

## 7. Trạng thái hiện tại
- Nhiều feature chính đã hoàn thiện theo hướng clean architecture.
- Build TypeScript frontend đã pass ở các lần kiểm tra gần nhất.
- Bạn đang phản hồi issue mới: “create product có ảnh nhưng chưa hiển thị”.
  - Đã bắt đầu trace luồng frontend/backend để xác định điểm mất `image_url`.
  - Chưa chốt nguyên nhân cuối cùng trong đoạn chat này.

## 8. Gợi ý kiểm tra nhanh cho issue ảnh product chưa hiển thị
1. Kiểm tra response `POST /products` có trả `image_url` không.
2. Kiểm tra response `GET /products` có field `image_url` cho bản ghi vừa tạo không.
3. Kiểm tra DB có cột `image_url` và dữ liệu đã lưu chưa (migration đã chạy chưa).
4. Kiểm tra giá trị `image_url` có đúng format `data:image/...` hoặc `http/https` để pass validate thumbnail.
5. Hard refresh frontend sau khi tạo để loại trừ cache/render cũ.

