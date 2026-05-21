import { http } from '../../../shared/lib/http'
import type { LoginRequest, LoginResponse } from '../../../shared/types/auth'

// Tập hợp API của module Auth.
export const authApi = {
  // Gọi API đăng nhập.
  // payload: username/password người dùng nhập.
  // return: access_token + user info từ backend.
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    // Gửi POST /auth/login đúng contract backend.
    const { data } = await http.post<LoginResponse>('/auth/login', payload)
    return data
  },
}
