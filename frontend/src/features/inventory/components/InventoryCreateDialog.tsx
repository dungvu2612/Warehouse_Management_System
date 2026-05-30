/*
Thong tin handover:
- File nay la dialog tao ton kho ban dau (POST /inventory), chi xu ly UI/form controls.
- Phu thuoc vao `InventoryCreatePayload`, `ProductOption`, `TrayOption` tu page.
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
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
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
          <Autocomplete
            options={productOptions}
            value={productOptions.find((product) => product.id === form.product_id) || null}
            onChange={(_, product) =>
              // Senior Handover: Khi doi product, reset tray de bat buoc chon lai khay hop le theo product moi.
              onChange({ ...form, product_id: product?.id || 0, tray_id: 0 })
            }
            getOptionLabel={(option) => `${option.product_code} - ${option.product_name}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ProductImageThumb src={option.image_url} alt={option.product_name} size={32} />
                  <span>
                    {option.product_code} - {option.product_name}
                  </span>
                </Stack>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Sản phẩm" fullWidth />}
          />

          <Autocomplete
            options={trayOptionsByProduct}
            value={trayOptionsByProduct.find((tray) => tray.id === form.tray_id) || null}
            onChange={(_, tray) => onChange({ ...form, tray_id: tray?.id || 0 })}
            getOptionLabel={(option) =>
              `${option.tray_code}${productLabelById[option.product_id] ? ` (${productLabelById[option.product_id]})` : ''}`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={form.product_id <= 0}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Khay"
                fullWidth
                helperText={
                  form.product_id > 0
                    ? 'Chỉ hiển thị khay thuộc sản phẩm đã chọn.'
                    : 'Chọn sản phẩm trước để lọc khay chính xác.'
                }
              />
            )}
          />

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
