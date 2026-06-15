/*
Thông tin ghi chú:
- File nay map loi API module Trays thanh thong diep UI nhat quan.
- Phu thuoc vao shape loi axios (`error.response.status`, `error.response.data.error`).
- Neu backend doi ma loi/nghiep vu, cap nhat mapping tai day de trang khong phai sua nhieu diem.
*/

export function mapTrayApiError(error: unknown): string {
  const typedError = error as {
    code?: string
    response?: { status?: number; data?: { error?: string; error_code?: string } }
  }
  const status = typedError?.response?.status
  const apiMessage = typedError?.response?.data?.error
  const errorCode = typedError?.response?.data?.error_code

  if (!typedError?.response) {
    if (typedError?.code === 'ECONNABORTED') return 'Kết nối API quá lâu, kiểm tra backend hoặc mạng.'
    return 'Không kết nối được API. Kiểm tra backend service, Nginx /api hoặc địa chỉ API của frontend.'
  }

  if (errorCode === 'INVALID_TRAY_ID') return apiMessage || 'Mã khay không hợp lệ.'
  if (errorCode === 'INVALID_TRAY_PAYLOAD') return apiMessage || 'Vui lòng chọn sản phẩm và vị trí hợp lệ.'
  if (errorCode === 'TRAY_NOT_FOUND') return apiMessage || 'Không tìm thấy khay hoặc khay đã bị khóa.'
  if (errorCode === 'TRAY_PRODUCT_NOT_FOUND') return apiMessage || 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị khóa.'
  if (errorCode === 'TRAY_LOCATION_NOT_FOUND') return apiMessage || 'Không tìm thấy vị trí hoặc vị trí đã bị khóa.'
  if (errorCode === 'TRAY_CODE_EXISTS') return apiMessage || 'Mã khay tự sinh đã tồn tại, vui lòng thử lại.'
  if (errorCode === 'TRAY_PAIR_EXISTS') return apiMessage || 'Sản phẩm này đã có khay active tại vị trí đã chọn.'
  if (errorCode === 'TRAY_INTERNAL_ERROR') return apiMessage || 'Có lỗi hệ thống khi xử lý khay.'

  // Ghi chú: 422 cho validate payload.
  if (status === 422) return apiMessage || 'Dữ liệu khay không hợp lệ (422).'
  // Ghi chú: 404 cho product/location khong ton tai.
  if (status === 404) return apiMessage || 'Không tìm thấy product/location liên quan (404).'
  // Ghi chú: 409 cho tray_code trung hoac conflict unique.
  if (status === 409) return apiMessage || 'Mã khay đã tồn tại hoặc đã gắn product khác (409).'
  // Ghi chú: 403 khi role khong du quyen.
  if (status === 403) return 'Bạn không có quyền thao tác khay (403).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý khay, vui lòng thử lại.'
}
