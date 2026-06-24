import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'
import { ListPagination } from '../../../shared/components/ListPagination'
import { UserFormDialog } from '../components/UserFormDialog'
import { UserTable } from '../components/UserTable'
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from '../hooks/useUsers'
import type { User, UserRole } from '../types/user.types'
import { mapUserApiError } from '../utils/userError'

const defaultForm = {
  username: '',
  password: '',
  full_name: '',
  role: 'WAREHOUSE' as UserRole,
  is_active: true,
}

export function UserManagementPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'true' | 'false'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formError, setFormError] = useState('')

  const usersQuery = useUsersQuery({
    search,
    role: roleFilter === 'ALL' ? '' : roleFilter,
    is_active: statusFilter === 'ALL' ? '' : statusFilter,
  })
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
  const updateStatusMutation = useUpdateUserStatusMutation()
  const deleteMutation = useDeleteUserMutation()

  const users = useMemo(() => usersQuery.data || [], [usersQuery.data])
  const paginatedUsers = useMemo(() => paginateItems(users, currentPage, DEFAULT_PAGE_SIZE), [users, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter, statusFilter])

  const openCreateDialog = () => {
    setEditingUser(null)
    setForm(defaultForm)
    setFormError('')
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setForm({
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      is_active: user.is_active,
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.username.trim()) return setFormError('Tên đăng nhập là bắt buộc')
    if (!editingUser && form.password.trim().length < 6) return setFormError('Mật khẩu phải có ít nhất 6 ký tự')
    if (editingUser && form.password.trim() !== '' && form.password.trim().length < 6) return setFormError('Mật khẩu phải có ít nhất 6 ký tự')
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            full_name: form.full_name.trim(),
            role: form.role,
            is_active: form.is_active,
            password: form.password.trim() || undefined,
          },
        })
        setBanner({ type: 'success', text: 'Cập nhật tài khoản thành công' })
      } else {
        await createMutation.mutateAsync({
          username: form.username.trim(),
          password: form.password.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          is_active: form.is_active,
        })
        setBanner({ type: 'success', text: 'Tạo tài khoản thành công' })
      }
      setDialogOpen(false)
    } catch (error) {
      setFormError(mapUserApiError(error))
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, isActive: !user.is_active })
      setBanner({ type: 'success', text: 'Cập nhật trạng thái thành công' })
    } catch (error) {
      setBanner({ type: 'error', text: mapUserApiError(error) })
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Xóa/Vô hiệu hóa tài khoản ${user.username}?`)) return
    try {
      await deleteMutation.mutateAsync(user.id)
      setBanner({ type: 'success', text: 'Thao tác xóa tài khoản thành công' })
    } catch (error) {
      setBanner({ type: 'error', text: mapUserApiError(error) })
    }
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Quản lý tài khoản</Typography>
            <Typography color="text.secondary">Quản lý tài khoản đăng nhập và phân quyền người dùng</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => usersQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
              Thêm tài khoản
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField fullWidth label="Tìm kiếm" placeholder="Tìm theo username hoặc tên người dùng" value={search} onChange={(e) => setSearch(e.target.value)} />
          <TextField select label="Vai trò" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)} sx={{ minWidth: 180 }}>
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="ADMIN">Quản trị</MenuItem>
            <MenuItem value="WAREHOUSE">Nhân viên kho</MenuItem>
          </TextField>
          <TextField select label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'true' | 'false')} sx={{ minWidth: 180 }}>
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="true">Đang hoạt động</MenuItem>
            <MenuItem value="false">Đã khóa</MenuItem>
          </TextField>
          <Chip color="secondary" label={`Tổng: ${users.length}`} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 800 }} />
        </Stack>

        <UserTable
          users={paginatedUsers}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          onView={(user) => navigate(`/users/${user.id}`)}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={users.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <UserFormDialog
        open={dialogOpen}
        editingUser={editingUser}
        form={form}
        errorMessage={formError}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  )
}
