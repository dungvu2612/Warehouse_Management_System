// Map lỗi API sang message hiển thị chuẩn cho người dùng.
export function mapProductApiError(error: any): string {
  const status = error?.response?.status
  const apiMessage = error?.response?.data?.error

  if (status === 409) return apiMessage || 'Mã sản phẩm đã tồn tại (409).'
  if (status === 404) return apiMessage || 'Không tìm thấy sản phẩm (404).'
  if (status === 422) return apiMessage || 'Dữ liệu không hợp lệ (422).'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này (403).'
  return apiMessage || 'Có lỗi hệ thống, vui lòng thử lại.'
}
