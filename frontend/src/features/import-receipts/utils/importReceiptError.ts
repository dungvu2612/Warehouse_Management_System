/*
Thong tin handover:
- File nay map loi API module Import Receipts thanh thong diep UI nhat quan.
- Phu thuoc vao shape loi axios (`error.response.status`, `error.response.data.error`).
- Neu backend doi ma loi/nghiep vu, cap nhat mapping tai day de page khong phai sua nhieu diem.
*/

export function mapImportReceiptApiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error

  // Senior Handover: 422 cho payload id/validation khong hop le.
  if (status === 422) return apiMessage || 'Dữ liệu phiếu nhập không hợp lệ (422).'
  // Senior Handover: 404 khi product/tray/receipt khong ton tai.
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu liên quan (404).'
  // Senior Handover: 400 cho quy tac nghiep vu nhu tray-product mismatch/duplicate item.
  if (status === 400) return apiMessage || 'Dữ liệu phiếu nhập không hợp lệ (400).'
  // Senior Handover: 403 cho role khong du quyen tao xem.
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý phiếu nhập, vui lòng thử lại.'
}
