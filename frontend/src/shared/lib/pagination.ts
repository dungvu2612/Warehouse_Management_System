/* - Mục đích: Điểm kết nối trung tâm cho scanner HT730 đối với tất cả các luồng quét bằng bàn phím.

- Các phụ thuộc: Tham chiếu/trạng thái React và hàm gọi lại API scanner do trang cung cấp.

- Hành vi của scanner HT730: Bàn phím TagAccess gửi văn bản mã QR vào ô nhập liệu được chọn, sau đó nhấn Enter.

- Hợp đồng hàm gọi lại API: onScanComplete({ mode, code }) thực hiện cuộc gọi API cụ thể cho từng chế độ.

- Ghi chú bảo trì: Giữ việc xử lý đầu vào scanner ở đây; các trang không nên sao chép các trình xử lý phím/thay đổi.

*/

export const DEFAULT_PAGE_SIZE = 10

export function getPageCount(totalItems: number, trangSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalItems / trangSize))
}

export function clampPage(trang: number, totalItems: number, trangSize = DEFAULT_PAGE_SIZE) {
  const trangCount = getPageCount(totalItems, trangSize)
  return Math.min(Math.max(trang, 1), trangCount)
}

export function paginateItems<T>(items: T[], currentPage: number, trangSize = DEFAULT_PAGE_SIZE) {
  // Ghi chú: Phân trang được áp dụng sau khi lọc để tổng số trang khớp dữ liệu đang hiển thị.
  const safePage = clampPage(currentPage, items.length, trangSize)
  const start = (safePage - 1) * trangSize
  return items.slice(start, start + trangSize)
}
