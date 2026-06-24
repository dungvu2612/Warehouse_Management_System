import { getApiErrorInfo, mapNetworkApiError } from '../../../shared/lib/apiError'

export function mapTrayApiError(error: unknown): string {
  const info = getApiErrorInfo(error)
  const networkMessage = mapNetworkApiError(info)
  if (networkMessage) return networkMessage

  const { status, message, code } = info

  if (code === 'INVALID_TRAY_ID') return message || 'Mã khay không hợp lệ.'
  if (code === 'INVALID_TRAY_PAYLOAD') return message || 'Vui lòng chọn sản phẩm và vị trí hợp lệ.'
  if (code === 'TRAY_NOT_FOUND') return message || 'Không tìm thấy khay hoặc khay đã bị khóa.'
  if (code === 'TRAY_PRODUCT_NOT_FOUND') return message || 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị khóa.'
  if (code === 'TRAY_LOCATION_NOT_FOUND') return message || 'Không tìm thấy vị trí hoặc vị trí đã bị khóa.'
  if (code === 'TRAY_CODE_EXISTS') return message || 'Mã khay tự sinh đã tồn tại, vui lòng thử lại.'
  if (code === 'TRAY_PAIR_EXISTS') return message || 'Sản phẩm này đã có khay active tại vị trí đã chọn.'
  if (code === 'TRAY_INTERNAL_ERROR') return message || 'Có lỗi hệ thống khi xử lý khay.'

  if (status === 422) return message || 'Dữ liệu khay không hợp lệ (422).'
  if (status === 404) return message || 'Không tìm thấy product/location liên quan (404).'
  if (status === 409) return message || 'Mã khay đã tồn tại hoặc đã gắn product khác (409).'
  if (status === 403) return 'Bạn không có quyền thao tác khay (403).'

  return message || 'Có lỗi hệ thống khi xử lý khay, vui lòng thử lại.'
}
