/*
Thông tin ghi chú:
- File nay la dialog form tao/cap nhat tray, chi xu ly UI/form controls.
- Phu thuoc vao `TrayPayload` va option lists (`ProductOption`, `LocationOption`) tu trang.
- Khong tich hop API truc tiep trong component de giu phan tang ro rang.
*/

import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
          <Autocomplete
            options={productOptions}
            value={productOptions.find((product) => product.id === form.product_id) || null}
            onChange={(_, product) => onChange({ ...form, product_id: product?.id || 0 })}
            getOptionLabel={(option) => `${option.product_code} - ${option.product_name}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Sản phẩm" fullWidth />}
          />

          <Autocomplete
            options={locationOptions}
            value={locationOptions.find((location) => location.id === form.location_id) || null}
            onChange={(_, location) => onChange({ ...form, location_id: location?.id || 0 })}
            getOptionLabel={(option) =>
              `${option.location_code}${option.description ? ` - ${option.description}` : ''}`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Vị trí" fullWidth />}
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
              ? 'Tạo khay'
              : 'Cập nhật khay'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
