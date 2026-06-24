import { getApiErrorInfo } from '../../../shared/lib/apiError'

export function mapImportReceiptApiError(error: unknown): string {
  const { status, message } = getApiErrorInfo(error)

  if (status === 422) return message || 'Dữ liệu phiếu nhập không hợp lệ (422).'
  if (status === 404) return message || 'Không tìm thấy dữ liệu liên quan (404).'
  if (status === 400) return message || 'Dữ liệu phiếu nhập không hợp lệ (400).'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'

  return message || 'Có lỗi hệ thống khi xử lý phiếu nhập, vui lòng thử lại.'
}
