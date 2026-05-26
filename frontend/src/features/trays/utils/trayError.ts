/*
Senior Handover Note:
- File nay map loi API module Trays thanh thong diep UI nhat quan.
- Phu thuoc vao shape loi axios (`error.response.status`, `error.response.data.error`).
- Neu backend doi ma loi/nghiep vu, cap nhat mapping tai day de page khong phai sua nhieu diem.
*/

export function mapTrayApiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error

  // Senior Handover: 422 cho validate payload.
  if (status === 422) return apiMessage || 'Dữ liệu khay không hợp lệ (422).'
  // Senior Handover: 404 cho product/location khong ton tai.
  if (status === 404) return apiMessage || 'Không tìm thấy product/location liên quan (404).'
  // Senior Handover: 409 cho tray_code trung hoac conflict unique.
  if (status === 409) return apiMessage || 'Mã khay đã tồn tại hoặc đã gắn product khác (409).'
  // Senior Handover: 403 khi role khong du quyen.
  if (status === 403) return 'Bạn không có quyền thao tác khay (403).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý khay, vui lòng thử lại.'
}
