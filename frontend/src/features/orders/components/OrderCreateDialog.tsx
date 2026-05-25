/*
Mo ta file:
- Dialog tao order tu BOM.
- Component nay la presentation layer, khong goi API truc tiep.

Luong xu ly:
1) Render form chon BOM + machine_qty + customer_name.
2) Day su kien onChange/onSubmit cho page coordinator.
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
import type { OrderCreatePayload, BOMOption } from '../types/orderTypes'

interface OrderCreateDialogProps {
  open: boolean
  form: OrderCreatePayload
  bomOptions: BOMOption[]
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: OrderCreatePayload) => void
}

export function OrderCreateDialog({
  open,
  form,
  bomOptions,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: OrderCreateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Tạo đơn hàng từ BOM</DialogTitle>
      <DialogContent>
        <Stack spacing={1.6} sx={{ mt: 0.5 }}>
          <TextField
            select
            label="BOM"
            value={form.bom_id || ''}
            onChange={(e) => onChange({ ...form, bom_id: Number(e.target.value) })}
            fullWidth
          >
            {bomOptions.map((bom) => (
              <MenuItem key={bom.id} value={bom.id}>
                #{bom.id} - {bom.bom_name || 'BOM không tên'}
                {bom.product ? ` (${bom.product.product_code} - ${bom.product.product_name})` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Số lượng máy cần sản xuất"
            type="number"
            value={form.machine_qty}
            onChange={(e) => onChange({ ...form, machine_qty: Number(e.target.value) })}
            fullWidth
          />

          <TextField
            label="Tên khách hàng"
            value={form.customer_name}
            onChange={(e) => onChange({ ...form, customer_name: e.target.value })}
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
          {isSubmitting ? 'Đang tạo...' : 'Tạo đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
