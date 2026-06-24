import { getApiErrorInfo } from '../../../shared/lib/apiError'

// Map lỗi API sang message hiển thị chuẩn cho người dùng.
export function mapProductApiError(error: unknown): string {
  const { status, message } = getApiErrorInfo(error)

  if (status === 409) return message || 'Mã sản phẩm đã tồn tại (409).'
  if (status === 404) return message || 'Không tìm thấy sản phẩm (404).'
  if (status === 422) return message || 'Dữ liệu không hợp lệ (422).'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'
  return message || 'Có lỗi hệ thống, vui lòng thử lại.'
}
