import { Chip } from '@mui/material'

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Chip size="small" color="success" label="Đang hoạt động" />
  ) : (
    <Chip size="small" color="default" label="Đã khóa" />
  )
}
