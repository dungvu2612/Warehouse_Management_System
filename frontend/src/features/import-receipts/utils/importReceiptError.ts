/*
Thông tin ghi chú:
- File nay map loi API module Import Receipts thanh thong diep UI nhat quan.
- Phu thuoc vao shape loi axios (`error.response.status`, `error.response.data.error`).
- Neu backend doi ma loi/nghiep vu, cap nhat mapping tai day de trang khong phai sua nhieu diem.
*/

export function mapImportReceiptApiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error

  // Ghi chú: 422 cho payload id/validation khong hop le.
  if (status === 422) return apiMessage || 'Dữ liệu phiếu nhập không hợp lệ (422).'
  // Ghi chú: 404 khi product/tray/receipt khong ton tai.
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu liên quan (404).'
  // Ghi chú: 400 cho quy tac nghiep vu nhu tray-product mismatch/duplicate item.
  if (status === 400) return apiMessage || 'Dữ liệu phiếu nhập không hợp lệ (400).'
  // Ghi chú: 403 cho role khong du quyen tao xem.
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý phiếu nhập, vui lòng thử lại.'
}
