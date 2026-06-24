import { getApiErrorInfo } from '../../../shared/lib/apiError'

export function mapUserApiError(error: unknown): string {
  const fallback = error instanceof Error ? error.message : 'Không thao tác được tài khoản'
  const { code, message, hasResponse } = getApiErrorInfo(error)
  if (!hasResponse) return fallback

  if (code === 'USERNAME_ALREADY_EXISTS') return 'Tên đăng nhập đã tồn tại'
  if (code === 'USER_NOT_FOUND') return 'Không tìm thấy tài khoản'
  if (code === 'INVALID_ROLE') return 'Vai trò không hợp lệ'
  if (code === 'PASSWORD_TOO_SHORT') return 'Mật khẩu phải có ít nhất 6 ký tự'
  if (code === 'CANNOT_DISABLE_LAST_ADMIN') return 'Không thể khóa admin cuối cùng'
  if (code === 'CANNOT_DELETE_SELF') return 'Không thể xóa chính tài khoản đang đăng nhập'
  if (code === 'PERMISSION_DENIED') return 'Bạn không có quyền thao tác'
  if (code === 'USER_HAS_HISTORY') return 'Tài khoản đã có lịch sử thao tác, chỉ có thể khóa tài khoản'

  return message || fallback
}
