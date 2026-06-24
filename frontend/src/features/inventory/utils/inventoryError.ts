import { getApiErrorInfo } from '../../../shared/lib/apiError'

export function mapInventoryApiError(error: unknown): string {
  const { status, message } = getApiErrorInfo(error)

  if (status === 422) return message || 'Dữ liệu tồn kho không hợp lệ (422).'
  if (status === 404) return message || 'Không tìm thấy dữ liệu liên quan (404).'
  if (status === 409) return message || 'Xung đột dữ liệu tồn kho (409).'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'

  return message || 'Có lỗi hệ thống khi xử lý tồn kho, vui lòng thử lại.'
}
