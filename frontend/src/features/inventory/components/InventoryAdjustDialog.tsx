/*
Thông tin ghi chú:
- File nay la dialog dieu chinh ton kho (PATCH /inventory/:id/adjust), chi xu ly UI form.
- Phu thuoc vao `InventoryAdjustFormValues` va thong tin item duoc chon tu trang.
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
import type { InventoryAdjustFormValues, InventoryDisplayItem, TrayOption } from '../types/inventoryTypes'

interface InventoryAdjustDialogProps {
  open: boolean
  selectedItem: InventoryDisplayItem | null
  form: InventoryAdjustFormValues
  isSubmitting: boolean
  errorMessage: string
  trayOptions?: TrayOption[]
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
  trayOptions = [],
  onClose,
  onSubmit,
  onChange,
}: InventoryAdjustDialogProps) {
  const isCreateMode = Boolean(selectedItem?.is_virtual_row)
  const availableTrays = selectedItem
    ? trayOptions.filter((tray) => tray.product_id === selectedItem.product_id)
    : []

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>{isCreateMode ? 'Thêm tồn kho' : 'Điều chỉnh tồn kho'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedItem
              ? `${selectedItem.product_code} - ${selectedItem.product_name} | ${selectedItem.tray_code} | Tồn hiện tại: ${selectedItem.quantity}`
              : '-'}
          </Typography>

          {isCreateMode && (
            <TextField
              select
              label="Khay nhập hàng"
              value={form.tray_id}
              onChange={(e) => onChange({ ...form, tray_id: Number(e.target.value) })}
              helperText={availableTrays.length ? 'Chỉ hiện khay đang dùng của sản phẩm này.' : 'Sản phẩm này chưa có khay đang dùng để nhập tồn.'}
              fullWidth
            >
              {availableTrays.map((tray) => (
                <MenuItem key={tray.id} value={tray.id}>
                  {tray.tray_code}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            label="Loại điều chỉnh"
            value={form.operation}
            onChange={(e) =>
              // Ghi chú: Nguoi dung chon import/export, service validation se map sang delta backend.
              onChange({ ...form, operation: e.target.value as InventoryAdjustFormValues['operation'] })
            }
            fullWidth
            disabled={isCreateMode}
          >
            <MenuItem value="IMPORT">Nhập kho</MenuItem>
            {!isCreateMode && <MenuItem value="EXPORT">Xuất kho</MenuItem>}
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
          {isSubmitting ? 'Đang xử lý...' : isCreateMode ? 'Thêm tồn' : 'Điều chỉnh tồn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
