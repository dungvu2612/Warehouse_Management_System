import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import type { UserRole } from '../types/auth'

// Guard cho route cần đăng nhập.
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  // Nếu chưa đăng nhập thì điều hướng về login.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}

// Guard cho route public (ví dụ login).
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  // Nếu đã đăng nhập thì không cho quay lại login, đẩy về dashboard.
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return children
}

// Guard theo role.
export function RoleGuard({ children, roles }: { children: ReactNode; roles: UserRole[] }) {
  const { user } = useAuth()

  // Không có user hoặc role không nằm trong danh sách cho phép -> forbidden.
  if (!user || !roles.includes(user.role)) return <Navigate to="/forbidden" replace />

  return children
}
