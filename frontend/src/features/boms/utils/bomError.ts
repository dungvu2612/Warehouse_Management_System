import { getApiErrorInfo, mapNetworkApiError } from '../../../shared/lib/apiError'

// Map loi backend -> message frontend.
export function mapBOMApiError(error: unknown): string {
  const info = getApiErrorInfo(error)
  const networkMessage = mapNetworkApiError(info)
  if (networkMessage) return networkMessage

  const { status, message, code } = info

  if (code === 'INVALID_BOM_PAYLOAD') return message || 'Dữ liệu BOM không hợp lệ.'
  if (code === 'INVALID_BOM_ID') return message || 'Mã BOM không hợp lệ.'
  if (code === 'BOM_DUPLICATE_COMPONENT') return message || 'Không được chọn trùng linh kiện trong cùng BOM.'
  if (code === 'BOM_PARENT_PRODUCT_NOT_FOUND') return message || 'Không tìm thấy thành phẩm cha hoặc thành phẩm đã ngưng sử dụng.'
  if (code === 'BOM_COMPONENT_PRODUCTS_NOT_FOUND') return message || 'Một hoặc nhiều linh kiện không tồn tại hoặc đã ngưng sử dụng.'
  if (code === 'BOM_PARENT_MUST_BE_FINISHED_GOOD') return message || 'Sản phẩm cha của BOM phải là thành phẩm FINISHED_GOOD.'
  if (code === 'BOM_COMPONENTS_MUST_BE_COMPONENTS') return message || 'Tất cả dòng linh kiện trong BOM phải là sản phẩm loại COMPONENT.'
  if (code === 'BOM_NOT_FOUND') return message || 'Không tìm thấy BOM.'
  if (code === 'BOM_INTERNAL_ERROR') return message || 'Có lỗi hệ thống khi xử lý BOM.'

  if (status === 422) return message || 'Dữ liệu BOM không hợp lệ (422).'

  if (status === 400) return message || 'Quy tắc nghiệp vụ BOM không hợp lệ (400).'

  if (status === 404) return message || 'Không tìm thấy dữ liệu sản phẩm/BOM (404).'

  if (status === 403) return 'Bạn không có quyền thao tác BOM (403).'

  return message || 'Có lỗi hệ thống khi xử lý BOM, vui lòng thử lại.'
}
