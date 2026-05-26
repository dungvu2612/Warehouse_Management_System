/*
Senior Handover Note:
- File này chuẩn hóa mapping lỗi API của module Locations sang thông điệp UI.
- Phụ thuộc vào shape lỗi axios (`error.response.status`, `error.response.data.error`).
- Nếu backend đổi mã lỗi/ngữ nghĩa business, cập nhật rule mapping tại đây để UI đồng bộ.
*/

export function mapLocationApiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error

  // Senior Handover: 422 cho validate payload không hợp lệ.
  if (status === 422) return apiMessage || 'Dữ liệu location không hợp lệ (422).'
  // Senior Handover: 409 cho xung đột mã location đã tồn tại.
  if (status === 409) return apiMessage || 'Mã location đã tồn tại (409).'
  // Senior Handover: 403 cho role không đủ quyền (STAFF submit create).
  if (status === 403) return 'Bạn không có quyền tạo location (403).'
  // Senior Handover: 404 cho thao tác update/delete trên bản ghi không tồn tại.
  if (status === 404) return apiMessage || 'Không tìm thấy location (404).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý location, vui lòng thử lại.'
}
