/*
Mo ta file:
- Map loi API cua module BOM thanh message de hien thi UI.
- Tach rieng file nay de dam bao response error duoc xu ly nhat quan o moi component.

Luong xu ly:
1) Doc status code + error message tu axios error.
2) Ap dung uu tien message domain tu backend neu co.
3) Fallback ve thong bao tong quat de UX khong bi vo.
*/

// Map loi backend -> message frontend.
export function mapBOMApiError(error: any): string {
  // Lay status HTTP neu co.
  const status = error?.response?.status
  // Lay message loi backend da tra ve.
  const apiMessage = error?.response?.data?.error
  const errorCode = error?.response?.data?.error_code

  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'Kết nối API quá lâu, kiểm tra backend hoặc mạng.'
    return 'Không kết nối được API. Kiểm tra backend service, Nginx /api hoặc địa chỉ API của frontend.'
  }

  if (errorCode === 'INVALID_BOM_PAYLOAD') return apiMessage || 'Dữ liệu BOM không hợp lệ.'
  if (errorCode === 'INVALID_BOM_ID') return apiMessage || 'Mã BOM không hợp lệ.'
  if (errorCode === 'BOM_DUPLICATE_COMPONENT') return apiMessage || 'Không được chọn trùng linh kiện trong cùng BOM.'
  if (errorCode === 'BOM_PARENT_PRODUCT_NOT_FOUND') return apiMessage || 'Không tìm thấy thành phẩm cha hoặc thành phẩm đã bị khóa.'
  if (errorCode === 'BOM_COMPONENT_PRODUCTS_NOT_FOUND') return apiMessage || 'Một hoặc nhiều linh kiện không tồn tại hoặc đã bị khóa.'
  if (errorCode === 'BOM_PARENT_MUST_BE_FINISHED_GOOD') return apiMessage || 'Sản phẩm cha của BOM phải là thành phẩm FINISHED_GOOD.'
  if (errorCode === 'BOM_COMPONENTS_MUST_BE_COMPONENTS') return apiMessage || 'Tất cả dòng linh kiện trong BOM phải là sản phẩm loại COMPONENT.'
  if (errorCode === 'BOM_NOT_FOUND') return apiMessage || 'Không tìm thấy BOM.'
  if (errorCode === 'BOM_INTERNAL_ERROR') return apiMessage || 'Có lỗi hệ thống khi xử lý BOM.'

  // Nhom loi validate payload.
  if (status === 422) return apiMessage || 'Dữ liệu BOM không hợp lệ (422).'

  // Nhom loi domain conflict/business rule.
  if (status === 400) return apiMessage || 'Quy tắc nghiệp vụ BOM không hợp lệ (400).'

  // Nhom loi not found reference data.
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu sản phẩm/BOM (404).'

  // Nhom loi phân quyền.
  if (status === 403) return 'Bạn không có quyền thao tác BOM (403).'

  // Fallback loi he thong.
  return apiMessage || 'Có lỗi hệ thống khi xử lý BOM, vui lòng thử lại.'
}
