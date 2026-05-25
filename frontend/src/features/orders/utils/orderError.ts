/*
Mo ta file:
- Map loi API module Orders sang thong diep de hien thi UI.
- Giu thong bao nhat quan giua cac thao tac create/scan/confirm/finish.

Luong xu ly:
1) Doc status + message tu axios error.
2) Uu tien message domain tu backend neu co.
3) Fallback message tong quat.
*/

export function mapOrderApiError(error: any): string {
  const status = error?.response?.status
  const apiMessage = error?.response?.data?.error

  if (status === 422) return apiMessage || 'Dữ liệu đơn hàng không hợp lệ (422).'
  if (status === 400) return apiMessage || 'Nghiệp vụ đơn hàng không hợp lệ (400).'
  if (status === 403) return 'Bạn không có quyền thao tác chức năng này (403).'
  if (status === 404) return apiMessage || 'Không tìm thấy dữ liệu liên quan (404).'
  if (status === 409) return apiMessage || 'Xung đột dữ liệu kho (409).'

  return apiMessage || 'Có lỗi hệ thống khi xử lý đơn hàng, vui lòng thử lại.'
}
