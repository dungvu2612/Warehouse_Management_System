/*
Senior Handover Note:
- File nay la dialog tao ton kho ban dau (POST /inventory), chi xu ly UI/form controls.
- Phu thuoc vao `InventoryCreatePayload`, `ProductOption`, `TrayOption` tu page.
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
import type { InventoryCreatePayload, ProductOption, TrayOption } from '../types/inventoryTypes'

interface InventoryCreateDialogProps {
  open: boolean
  form: InventoryCreatePayload
  productOptions: ProductOption[]
  trayOptions: TrayOption[]
  productLabelById: Record<number, string>
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: InventoryCreatePayload) => void
}

export function InventoryCreateDialog({
  open,
  form,
  productOptions,
  trayOptions,
  productLabelById,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: InventoryCreateDialogProps) {
  // Senior Handover: Chi hien khay thuoc san pham dang chon de tranh loi tray-product mismatch tu backend.
  const trayOptionsByProduct =
    form.product_id > 0 ? trayOptions.filter((tray) => tray.product_id === form.product_id) : []

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Tạo tồn kho ban đầu</DialogTitle>
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          <TextField
            select
            label="Sản phẩm"
            value={form.product_id || ''}
            onChange={(e) =>
              // Senior Handover: Khi doi product, reset tray de bat buoc chon lai khay hop le theo product moi.
              onChange({ ...form, product_id: Number(e.target.value), tray_id: 0 })
            }
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
            label="Khay"
            value={form.tray_id || ''}
            onChange={(e) => onChange({ ...form, tray_id: Number(e.target.value) })}
            fullWidth
            disabled={form.product_id <= 0}
            helperText={
              form.product_id > 0
                ? 'Chỉ hiển thị khay thuộc sản phẩm đã chọn.'
                : 'Chọn sản phẩm trước để lọc khay chính xác.'
            }
          >
            {trayOptionsByProduct.map((tray) => (
              <MenuItem key={tray.id} value={tray.id}>
                {tray.tray_code} {productLabelById[tray.product_id] ? `(${productLabelById[tray.product_id]})` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Số lượng tồn ban đầu"
            type="number"
            value={form.quantity}
            onChange={(e) => onChange({ ...form, quantity: Number(e.target.value) })}
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
          {isSubmitting ? 'Đang tạo...' : 'Tạo tồn kho'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
