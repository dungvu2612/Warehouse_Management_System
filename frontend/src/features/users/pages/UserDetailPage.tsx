import { ArrowBack } from '@mui/icons-material'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserByIdQuery } from '../hooks/useUsers'
import { UserRoleBadge } from '../components/UserRoleBadge'
import { UserStatusBadge } from '../components/UserStatusBadge'
import { formatDateTimeVN } from '../../../shared/lib/datetime'

export function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const userId = Number(id)
  const userQuery = useUserByIdQuery(Number.isFinite(userId) ? userId : null)

  if (!Number.isFinite(userId) || userId <= 0) {
    return <Alert severity="error">ID tài khoản không hợp lệ.</Alert>
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/users')}>
          Quay lại danh sách tài khoản
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>Chi tiết tài khoản</Typography>
      </Paper>

      {userQuery.isLoading && <Alert severity="info">Đang tải thông tin tài khoản...</Alert>}
      {userQuery.isError && <Alert severity="error">Không tải được thông tin tài khoản.</Alert>}

      {userQuery.data && (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={1.25}>
            <Typography><strong>Tên đăng nhập:</strong> {userQuery.data.username}</Typography>
            <Typography><strong>Tên người dùng:</strong> {userQuery.data.full_name || '-'}</Typography>
            <Typography component="div"><strong>Vai trò:</strong> <UserRoleBadge role={userQuery.data.role} /></Typography>
            <Typography component="div"><strong>Trạng thái:</strong> <UserStatusBadge isActive={userQuery.data.is_active} /></Typography>
            <Typography><strong>Ngày tạo:</strong> {formatDateTimeVN(userQuery.data.created_at)}</Typography>
            <Typography><strong>Cập nhật:</strong> {formatDateTimeVN(userQuery.data.updated_at)}</Typography>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
