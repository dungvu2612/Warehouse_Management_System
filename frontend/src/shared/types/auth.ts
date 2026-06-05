export type UserRole = 'ADMIN' | 'WAREHOUSE'

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
