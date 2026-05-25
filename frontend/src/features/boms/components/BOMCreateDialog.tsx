/*
Mo ta file:
- Dialog tao/cap nhat BOM.
- Component nay thuoc presentation layer: nhan state/handlers tu page va render form da tach module.

Luong xu ly:
1) Render form header BOM (parent product, ten, mo ta).
2) Render danh sach component dong va cho phep them/xoa/sua dong.
3) Tra su kien submit/close ve page de page goi mutation create/update.
*/

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AddCircleOutlined, DeleteOutlined } from '@mui/icons-material'
import type { BOMPayload, ProductOption } from '../types/bomTypes'

interface BOMCreateDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  form: BOMPayload
  parentProducts: ProductOption[]
  componentProducts: ProductOption[]
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: BOMPayload) => void
}

// Dialog form tao/cap nhat BOM.
export function BOMCreateDialog({
  open,
  mode,
  form,
  parentProducts,
  componentProducts,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: BOMCreateDialogProps) {
  // Handler cap nhat 1 item trong mang components.
  const updateItem = (
    index: number,
    patch: Partial<BOMPayload['items'][number]>,
  ) => {
    const nextItems = form.items.map((item, idx) => {
      if (idx !== index) return item
      return { ...item, ...patch }
    })
    onChange({ ...form, items: nextItems })
  }

  // Them dong component moi.
  const addItem = () => {
    onChange({
      ...form,
      items: [...form.items, { component_product_id: 0, quantity: 1 }],
    })
  }

  // Xoa dong component theo index.
  const removeItem = (index: number) => {
    const nextItems = form.items.filter((_, idx) => idx !== index)
    onChange({
      ...form,
      items: nextItems.length > 0 ? nextItems : [{ component_product_id: 0, quantity: 1 }],
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === 'create' ? 'Tạo BOM mới' : 'Cập nhật BOM'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          <TextField
            select
            label="Thành phẩm cha (FINISHED_GOOD)"
            value={form.product_id || ''}
            onChange={(e) => onChange({ ...form, product_id: Number(e.target.value) })}
            fullWidth
          >
            {parentProducts.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.product_code} - {product.product_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Tên BOM"
            value={form.bom_name}
            onChange={(e) => onChange({ ...form, bom_name: e.target.value })}
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

          <Box sx={{ pt: 0.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Danh sách linh kiện thành phần
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCircleOutlined fontSize="small" />}
                onClick={addItem}
              >
                Thêm dòng
              </Button>
            </Stack>

            <Stack spacing={1.2}>
              {form.items.map((item, index) => (
                <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    select
                    label={`Linh kiện #${index + 1}`}
                    value={item.component_product_id || ''}
                    onChange={(e) =>
                      updateItem(index, { component_product_id: Number(e.target.value) })
                    }
                    fullWidth
                  >
                    {componentProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.product_code} - {product.product_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Số lượng"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    sx={{ width: { xs: '100%', md: 140 } }}
                  />

                  <IconButton color="error" onClick={() => removeItem(index)}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>

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
              ? 'Tạo BOM'
              : 'Cập nhật BOM'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
