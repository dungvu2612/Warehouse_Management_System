import { getApiErrorInfo } from '../../../shared/lib/apiError'

export function mapLocationApiError(error: unknown): string {
  const { status, message } = getApiErrorInfo(error)

  if (status === 422) return message || 'Dữ liệu location không hợp lệ (422).'
  if (status === 409) return message || 'Mã location đã tồn tại (409).'
  if (status === 403) return 'Bạn không có quyền tạo location (403).'
  if (status === 404) return message || 'Không tìm thấy location (404).'

  return message || 'Có lỗi hệ thống khi xử lý location, vui lòng thử lại.'
}
