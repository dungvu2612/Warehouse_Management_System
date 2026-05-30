/*
Mo ta file:
- Map loi API module Orders sang thong diep de hien thi UI.
- Giu thong bao nhat quan giua cac thao tac create/scan/confirm/finish.

Luong xu ly:
1) Doc status + message tu axios error.
2) Uu tien message domain tu backend neu co.
3) Fallback message tong quat.
*/

export function mapOrderApiError(error: any): string {
  const status = error?.response?.status
  const apiMessage = error?.response?.data?.error
  const errorCode = error?.response?.data?.error_code

  if (errorCode === 'WRONG_TRAY') return 'Sai QR khay so với picking task.'
  if (errorCode === 'WRONG_PRODUCT') return 'Sai QR sản phẩm so với task đang nhặt.'
  if (errorCode === 'INSUFFICIENT_STOCK') return 'Không đủ tồn kho để xác nhận picking.'
  if (errorCode === 'INVALID_PICK_QTY') return 'Số lượng pick không hợp lệ hoặc vượt yêu cầu còn lại.'
  if (errorCode === 'PICKING_TASK_ALREADY_DONE') return 'Picking task đã hoàn thành trước đó.'
  if (errorCode === 'TASK_DONE') return 'Task đã hoàn thành, không thể scan thêm.'
  if (errorCode === 'ORDER_COMPLETED') return 'Đơn hàng đã hoàn tất.'
  if (errorCode === 'PRODUCT_QR_NOT_FOUND') return 'Không tìm thấy mã QR sản phẩm.'
  if (errorCode === 'TRAY_QR_NOT_FOUND') return 'Không tìm thấy mã QR khay.'
  if (errorCode === 'UNAUTHORIZED') return 'Bạn không có quyền thao tác scan picking.'

  if (status === 422) return apiMessage || 'Dữ liệu đơn hàng không hợp lệ (422).'
  if (status === 400) return apiMessage || 'Nghiệp vụ đơn hàng không hợp lệ (400).'
  if (status === 403) return 'Bạn không có quyền thao tác chức năng này (403).'
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu liên quan (404).'
  if (status === 409) return apiMessage || 'Xung đột dữ liệu kho (409).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý đơn hàng, vui lòng thử lại.'
}
