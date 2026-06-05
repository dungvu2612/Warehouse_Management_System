/*
Thông tin ghi chú:
- File nay map loi API module Inventory thanh thong diep UI nhat quan.
- Phu thuoc vao shape loi axios (`error.response.status`, `error.response.data.error`).
- Neu backend doi ma loi/nghiep vu, cap nhat mapping tai day de trang khong phai sua nhieu diem.
*/

export function mapInventoryApiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error

  // Ghi chú: 422 cho payload/filter/adjust khong hop le.
  if (status === 422) return apiMessage || 'Dữ liệu tồn kho không hợp lệ (422).'
  // Ghi chú: 404 khi product/tray/inventory khong ton tai.
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu liên quan (404).'
  // Ghi chú: 409 cho xung dot tao ton da ton tai hoac adjust am qua muc.
  if (status === 409) return apiMessage || 'Xung đột dữ liệu tồn kho (409).'
  // Ghi chú: 403 cho role khong du quyen tao/adjust.
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý tồn kho, vui lòng thử lại.'
}

