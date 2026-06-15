/*
Mo ta file:
- Dialog tao/cap nhat BOM.
- Component nay thuoc presentation layer: nhan state/handlers tu trang va render form da tach module.

Luong xu ly:
1) Render form header BOM (parent product, ten, mo ta).
2) Render danh sach component dong va cho phep them/xoa/sua dong.
3) Tra su kien submit/close ve trang de trang goi mutation create/update.
*/

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AddCircleOutlined, DeleteOutlined } from '@mui/icons-material'
import { useMemo } from 'react'
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
  const duplicateComponentIds = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of form.items) {
      if (!item.component_product_id) continue
      counts.set(item.component_product_id, (counts.get(item.component_product_id) || 0) + 1)
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([productId]) => productId),
    )
  }, [form.items])

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { sx: { maxHeight: '88vh' } } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === 'create' ? 'Tạo BOM mới' : 'Cập nhật BOM'}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid #e2e8f0',
            px: 3,
            py: 2,
          }}
        >
          <Stack spacing={1.75}>
            <Autocomplete
              options={parentProducts}
              value={parentProducts.find((product) => product.id === form.product_id) || null}
              onChange={(_, product) => onChange({ ...form, product_id: product?.id || 0 })}
              getOptionLabel={(option) => `${option.product_code} - ${option.product_name}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label="Thành phẩm cha (FINISHED_GOOD)" fullWidth />
              )}
            />

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

            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Danh sách linh kiện component
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
          </Stack>
        </Box>

        <Box sx={{ px: 3, py: 2, overflowY: 'auto', flex: 1, minHeight: 240 }}>
          <Stack spacing={1.2}>
            {form.items.map((item, index) => {
              const isDuplicate = item.component_product_id > 0 && duplicateComponentIds.has(item.component_product_id)

              return (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderColor: isDuplicate ? 'error.main' : '#e2e8f0',
                    bgcolor: isDuplicate ? 'rgba(220, 38, 38, 0.06)' : 'background.paper',
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { md: 'flex-start' } }}>
                    <Autocomplete
                      options={componentProducts}
                      value={
                        componentProducts.find(
                          (product) => product.id === item.component_product_id,
                        ) || null
                      }
                      onChange={(_, product) =>
                        updateItem(index, { component_product_id: product?.id || 0 })
                      }
                      getOptionLabel={(option) => `${option.product_code} - ${option.product_name}`}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={`Linh kiện #${index + 1}`}
                          error={isDuplicate}
                          helperText={isDuplicate ? 'Linh kiện này đang bị trùng trong BOM.' : ' '}
                          fullWidth
                        />
                      )}
                      fullWidth
                    />

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
                </Paper>
              )
            })}

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          </Stack>
        </Box>
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
