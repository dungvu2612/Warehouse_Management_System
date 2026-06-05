import { Chip } from '@mui/material'
import type { UserRole } from '../types/user.types'

export function UserRoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') return <Chip size="small" color="secondary" label="Quản trị" />
  return <Chip size="small" color="info" label="Nhân viên kho" />
}
