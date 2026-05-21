// Danh sách key localStorage dùng chung toàn app.
// Tách ra 1 nơi để tránh gõ sai key ở nhiều file.
export const STORAGE_KEYS = {
  // Key lưu JWT access token sau khi login thành công.
  accessToken: 'wms_access_token',
  // Key lưu thông tin user hiện tại (id, username, role...).
  user: 'wms_user',
} as const
