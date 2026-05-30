/*
Thong tin handover:
- File nay la dialog dieu chinh ton kho (PATCH /inventory/:id/adjust), chi xu ly UI form.
- Phu thuoc vao `InventoryAdjustFormValues` va thong tin item duoc chon tu page.
- Khong goi API truc tiep trong component de giu clean architecture.
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
  Typography,
} from '@mui/material'
import type { InventoryAdjustFormValues, InventoryDisplayItem } from '../types/inventoryTypes'

interface InventoryAdjustDialogProps {
  open: boolean
  selectedItem: InventoryDisplayItem | null
  form: InventoryAdjustFormValues
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: InventoryAdjustFormValues) => void
}

export function InventoryAdjustDialog({
  open,
  selectedItem,
  form,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: InventoryAdjustDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Điều chỉnh tồn kho</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedItem
              ? `${selectedItem.product_code} - ${selectedItem.product_name} | ${selectedItem.tray_code} | Tồn hiện tại: ${selectedItem.quantity}`
              : '-'}
          </Typography>

          <TextField
            select
            label="Loại điều chỉnh"
            value={form.operation}
            onChange={(e) =>
              // Senior Handover: Nguoi dung chon import/export, service validation se map sang delta backend.
              onChange({ ...form, operation: e.target.value as InventoryAdjustFormValues['operation'] })
            }
            fullWidth
          >
            <MenuItem value="IMPORT">Nhập kho</MenuItem>
            <MenuItem value="EXPORT">Xuất kho</MenuItem>
          </TextField>

          <TextField
            label="Số lượng điều chỉnh"
            type="number"
            value={form.quantity}
            onChange={(e) => onChange({ ...form, quantity: Number(e.target.value) })}
            fullWidth
          />

          <TextField
            label="Ghi chú"
            value={form.note}
            onChange={(e) => onChange({ ...form, note: e.target.value })}
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
          {isSubmitting ? 'Đang điều chỉnh...' : 'Điều chỉnh tồn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
