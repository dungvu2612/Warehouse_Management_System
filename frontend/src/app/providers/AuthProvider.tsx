import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STORAGE_KEYS } from '../../shared/constants/storage'
import type { AuthUser, LoginResponse } from '../../shared/types/auth'

// Interface định nghĩa toàn bộ dữ liệu/hành động auth mà app cần.
interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  loginSuccess: (payload: LoginResponse) => void
  logout: () => void
}

// Tạo context auth. Ban đầu để undefined để bắt lỗi dùng sai provider.
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Đọc token ban đầu từ localStorage khi app vừa mount.
function readInitialToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken)
}

// Đọc user ban đầu từ localStorage.
function readInitialUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user)
  if (!raw) return null

  // Parse JSON an toàn.
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    // Nếu dữ liệu hỏng thì trả null thay vì crash app.
    return null
  }
}

// Provider bọc toàn app để mọi nơi đều truy cập auth state.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Dùng lazy initializer để chỉ đọc localStorage 1 lần khi mount.
  const [token, setToken] = useState<string | null>(() => readInitialToken())
  const [user, setUser] = useState<AuthUser | null>(() => readInitialUser())

  // Hàm gọi khi login thành công.
  // Nhiệm vụ: cập nhật state + persist localStorage.
  const loginSuccess = (payload: LoginResponse) => {
    setToken(payload.access_token)
    setUser(payload.user)
    localStorage.setItem(STORAGE_KEYS.accessToken, payload.access_token)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user))
  }

  // Hàm logout chuẩn hóa.
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.user)
  }

  // Memo hóa object value để tránh re-render thừa cho consumer.
  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loginSuccess,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook giúp dùng auth context gọn hơn.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Nếu dùng ngoài AuthProvider thì báo lỗi rõ ràng cho dev.
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
