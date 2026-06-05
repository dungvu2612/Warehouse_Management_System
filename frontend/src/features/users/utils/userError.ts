import axios from 'axios'

export function mapUserApiError(error: unknown): string {
  const fallback = error instanceof Error ? error.message : 'Không thao tác được tài khoản'
  if (!axios.isAxiosError(error)) return fallback

  const errorCode = String(error.response?.data?.error_code || '')
  if (errorCode === 'USERNAME_ALREADY_EXISTS') return 'Tên đăng nhập đã tồn tại'
  if (errorCode === 'USER_NOT_FOUND') return 'Không tìm thấy tài khoản'
  if (errorCode === 'INVALID_ROLE') return 'Vai trò không hợp lệ'
  if (errorCode === 'PASSWORD_TOO_SHORT') return 'Mật khẩu phải có ít nhất 6 ký tự'
  if (errorCode === 'CANNOT_DISABLE_LAST_ADMIN') return 'Không thể khóa admin cuối cùng'
  if (errorCode === 'CANNOT_DELETE_SELF') return 'Không thể xóa chính tài khoản đang đăng nhập'
  if (errorCode === 'PERMISSION_DENIED') return 'Bạn không có quyền thao tác'
  if (errorCode === 'USER_HAS_HISTORY') return 'Tài khoản đã có lịch sử thao tác, chỉ có thể khóa tài khoản'

  return String(error.response?.data?.error || fallback)
}
