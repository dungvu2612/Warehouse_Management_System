/*
Senior Handover Note:
- Purpose: Dinh nghia role contract frontend theo DB hien tai.
- Dependencies: Duoc dung boi auth provider, role guard, va tat ca page permission guard.
- API contract: login response `user.role` chi nhan ADMIN/WAREHOUSE/VIEWER.
- Role access: Khong su dung STAFF moi; STAFF cu neu co se duoc backend normalize thanh WAREHOUSE.
- Maintenance notes: Neu them role moi, cap nhat type va toan bo guard map.
*/

export type UserRole = 'ADMIN' | 'WAREHOUSE' | 'VIEWER'

// Kiểu dữ liệu user backend trả về trong response login.
export interface AuthUser {
  id: number
  username: string
  full_name?: string
  role: UserRole
}

// Payload gửi lên API login.
export interface LoginRequest {
  username: string
  password: string
}

// Response login chuẩn từ backend.
export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  user: AuthUser
}
