import { DeleteOutlined, EditOutlined, LockOpenOutlined, LockOutlined, VisibilityOutlined } from '@mui/icons-material'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import type { User } from '../types/user.types'
import { UserRoleBadge } from './UserRoleBadge'
import { UserStatusBadge } from './UserStatusBadge'

interface UserTableProps {
  users: User[]
  isLoading: boolean
  isError: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
}

export function UserTable({ users, isLoading, isError, onView, onEdit, onToggleStatus, onDelete }: UserTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Tên đăng nhập</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Tên người dùng</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Vai trò</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6}>Đang tải danh sách tài khoản...</TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={6}>Không tải được danh sách tài khoản.</TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>Chưa có tài khoản nào</TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell sx={{ fontFamily: 'monospace' }}>{user.username}</TableCell>
              <TableCell>{user.full_name || '-'}</TableCell>
              <TableCell><UserRoleBadge role={user.role} /></TableCell>
              <TableCell><UserStatusBadge isActive={user.is_active} /></TableCell>
              <TableCell>{formatDateTimeVN(user.created_at)}</TableCell>
              <TableCell>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" color="primary" onClick={() => onView(user)}>
                    <VisibilityOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sửa">
                  <IconButton size="small" color="warning" onClick={() => onEdit(user)}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={user.is_active ? 'Khóa tài khoản' : 'Mở tài khoản'}>
                  <IconButton size="small" color="info" onClick={() => onToggleStatus(user)}>
                    {user.is_active ? <LockOutlined fontSize="small" /> : <LockOpenOutlined fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa/Vô hiệu hóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(user)}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
