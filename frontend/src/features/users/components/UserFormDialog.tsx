import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material'
import { useMemo } from 'react'
import type { User, UserRole } from '../types/user.types'

interface UserFormDialogProps {
  open: boolean
  editingUser: User | null
  form: {
    username: string
    password: string
    full_name: string
    role: UserRole
    is_active: boolean
  }
  errorMessage: string
  isSubmitting: boolean
  onChange: (next: UserFormDialogProps['form']) => void
  onClose: () => void
  onSubmit: () => void
}

export function UserFormDialog({ open, editingUser, form, errorMessage, isSubmitting, onChange, onClose, onSubmit }: UserFormDialogProps) {
  const isEdit = useMemo(() => Boolean(editingUser), [editingUser])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Sửa tài khoản' : 'Thêm tài khoản'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Tên đăng nhập"
            value={form.username}
            onChange={(e) => onChange({ ...form, username: e.target.value })}
            disabled={isEdit}
            fullWidth
          />
          <TextField
            label={isEdit ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
            type="password"
            fullWidth
          />
          <TextField
            label="Tên người dùng"
            value={form.full_name}
            onChange={(e) => onChange({ ...form, full_name: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Vai trò"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value as UserRole })}
            fullWidth
          >
            <MenuItem value="ADMIN">Quản trị</MenuItem>
            <MenuItem value="WAREHOUSE">Nhân viên kho</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
              />
            }
            label="Đang hoạt động"
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Hủy</Button>
        <Button onClick={onSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
