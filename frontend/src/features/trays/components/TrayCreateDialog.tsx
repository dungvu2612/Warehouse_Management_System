/*
Senior Handover Note:
- File nay la dialog form tao/cap nhat tray, chi xu ly UI/form controls.
- Phu thuoc vao `TrayPayload` va option lists (`ProductOption`, `LocationOption`) tu page.
- Khong tich hop API truc tiep trong component de giu phan tang ro rang.
*/

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import type { LocationOption, ProductOption, TrayPayload } from '../types/trayTypes'

interface TrayCreateDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  form: TrayPayload
  productOptions: ProductOption[]
  locationOptions: LocationOption[]
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: TrayPayload) => void
}

export function TrayCreateDialog({
  open,
  mode,
  form,
  productOptions,
  locationOptions,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: TrayCreateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === 'create' ? 'Tạo khay mới' : 'Cập nhật khay'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          <TextField
            select
            label="Sản phẩm"
            value={form.product_id || ''}
            onChange={(e) => onChange({ ...form, product_id: Number(e.target.value) })}
            fullWidth
          >
            {productOptions.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.product_code} - {product.product_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Vị trí"
            value={form.location_id || ''}
            onChange={(e) => onChange({ ...form, location_id: Number(e.target.value) })}
            fullWidth
          >
            {locationOptions.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {location.location_code} {location.description ? `- ${location.description}` : ''}
              </MenuItem>
            ))}
          </TextField>

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
              ? 'Tạo khay'
              : 'Cập nhật khay'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
