/*
- Mục đích: Route guards cho auth va role-level trang access.
- Phụ thuộc: React Router Navigate + AuthProvider user/session state.
- Hành vi máy quét HT730: Route Staff/PDA là điểm vào chỉ dành cho WAREHOUSE trong các luồng quét.
- Hợp đồng callback API: Không gọi API; chỉ bảo vệ route frontend trước khi trang quét mount.
- Ghi chú bảo trì: Keep role policy centralized here so menu visibility and route access do not drift.
*/

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

export function RoleRoute({ allowedRoles, children }: { allowedRoles: UserRole[]; children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />

  return children
}
