import { getApiErrorInfo } from '../../../shared/lib/apiError'

export function mapStaffPerformanceApiError(error: unknown): string {
  const { status, message } = getApiErrorInfo(error)

  if (status === 403) return 'Bạn không có quyền xem báo cáo này.'
  if (status === 422) return message || 'Bộ lọc báo cáo không hợp lệ.'
  return message || 'Không tải được báo cáo hiệu suất nhân viên.'
}
