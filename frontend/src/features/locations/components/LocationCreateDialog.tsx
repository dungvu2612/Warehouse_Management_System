/*
Thông tin ghi chú:
- File này là dialog form tạo/cập nhật location, chỉ xử lý UI/form input.
- Phụ thuộc vào type `CreateLocationPayload`; submit/permission được trang điều phối.
- Không tích hợp API trực tiếp trong dialog để đảm bảo clean architecture.
*/

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import type { CreateLocationPayload } from '../types/locationTypes'

interface LocationCreateDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  form: CreateLocationPayload
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: CreateLocationPayload) => void
}

export function LocationCreateDialog({
  open,
  mode,
  form,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: LocationCreateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === 'create' ? 'Tạo vị trí mới' : 'Cập nhật vị trí'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          <TextField
            label="Mã location"
            value={form.location_code}
            onChange={(e) => onChange({ ...form, location_code: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Shelf"
            value={form.shelf}
            onChange={(e) => onChange({ ...form, shelf: e.target.value })}
            fullWidth
          />
          <TextField
            label="Mô tả"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'create'
              ? 'Đang tạo...'
              : 'Đang cập nhật...'
            : mode === 'create'
              ? 'Tạo vị trí'
              : 'Cập nhật vị trí'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
