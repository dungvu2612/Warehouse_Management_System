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
