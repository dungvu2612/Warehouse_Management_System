/*
Thông tin handover:
- File nay chua hằng số dùng chung cho ảnh sản phẩm trên toàn frontend.
- Phụ thuộc bởi các component bảng/dialog có hiển thị ảnh product.
- Lưu ý bảo trì: khi đổi chuẩn hiển thị hoặc resize, cập nhật đồng bộ các giá trị tại đây.
*/

// Ghi chú: Kích thước ảnh chuẩn toàn hệ thống sau khi import/resize.
export const PRODUCT_IMAGE_SIZE = 96

// Ghi chú: Placeholder an toàn khi sản phẩm chưa có ảnh.
export const PRODUCT_IMAGE_PLACEHOLDER = '/images/product-placeholder.svg'
