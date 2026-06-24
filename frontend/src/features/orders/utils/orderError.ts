import { getApiErrorInfo, mapNetworkApiError } from '../../../shared/lib/apiError'

export function mapOrderApiError(error: unknown): string {
  const info = getApiErrorInfo(error)
  const networkMessage = mapNetworkApiError(info)
  if (networkMessage) return networkMessage

  const { status, message, code } = info

  if (code === 'WRONG_TRAY') return 'Sai QR khay so với picking task.'
  if (code === 'WRONG_PRODUCT') return 'Sai QR sản phẩm so với task đang nhặt.'
  if (code === 'INSUFFICIENT_STOCK') return 'Không đủ tồn kho để xác nhận picking.'
  if (code === 'INVALID_PICK_QTY') return 'Số lượng pick không hợp lệ hoặc vượt yêu cầu còn lại.'
  if (code === 'PICKING_TASK_ALREADY_DONE') return 'Picking task đã hoàn thành trước đó.'
  if (code === 'TASK_DONE') return 'Task đã hoàn thành, không thể scan thêm.'
  if (code === 'ORDER_COMPLETED') return 'Đơn hàng đã hoàn tất.'
  if (code === 'PRODUCT_QR_NOT_FOUND') return 'Không tìm thấy mã QR sản phẩm.'
  if (code === 'TRAY_QR_NOT_FOUND') return 'Không tìm thấy mã QR khay.'
  if (code === 'UNAUTHORIZED') return 'Bạn không có quyền thao tác scan picking.'
  if (code === 'TASK_ALREADY_ASSIGNED') return 'Công việc đã được nhân viên khác nhận.'
  if (code === 'TASK_NOT_ASSIGNED_TO_YOU') return 'Bạn không phải người phụ trách công việc này.'
  if (code === 'TASK_NOT_CLAIMED') return 'Bạn cần nhận việc trước khi nhặt hàng.'
  if (code === 'CANNOT_UNASSIGN_AFTER_PICKING') return 'Công việc đã có dữ liệu nhặt hàng, không thể gỡ phân công trực tiếp.'
  if (code === 'CANNOT_REASSIGN_AFTER_PICKING') return 'Công việc đã phát sinh dữ liệu nhặt hàng, không thể gán lại trực tiếp.'
  if (code === 'STAFF_NOT_FOUND') return 'Không tìm thấy nhân viên.'
  if (code === 'INVALID_STAFF_ROLE') return 'Người được gán phải là nhân viên.'
  if (code === 'ORDER_CANCELLED') return 'Đơn hàng đã bị hủy.'
  if (code === 'ORDER_ALREADY_COMPLETED') return 'Đơn hàng đã hoàn thành.'
  if (code === 'INVALID_ORDER_PAYLOAD') return message || 'Dữ liệu đơn hàng không hợp lệ.'
  if (code === 'ORDER_BOM_NOT_FOUND') return message || 'Sản phẩm thành phẩm chưa có BOM.'
  if (code === 'ORDER_BOM_HAS_NO_ITEMS') return message || 'BOM của sản phẩm chưa có linh kiện.'
  if (code === 'ORDER_PICKING_SOURCE_NOT_FOUND') return message || 'Thiếu sản phẩm hoặc khay đang hoạt động để tạo tác vụ nhặt hàng.'
  if (code === 'ORDER_HAS_NO_PICKING_TASKS') return message || 'Không tạo được tác vụ nhặt hàng cho đơn này.'

  if (status === 422) return message || 'Dữ liệu đơn hàng không hợp lệ (422).'
  if (status === 400) return message || 'Nghiệp vụ đơn hàng không hợp lệ (400).'
  if (status === 403) return 'Bạn không có quyền thao tác chức năng này (403).'
  if (status === 404) return message || 'Không tìm thấy dữ liệu liên quan (404).'
  if (status === 409) return message || 'Xung đột dữ liệu kho (409).'

  return message || 'Có lỗi hệ thống khi xử lý đơn hàng, vui lòng thử lại.'
}
