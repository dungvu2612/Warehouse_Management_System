/*
Thông tin ghi chú:
- File nay la dialog tao phieu nhap nhieu item, chi xu ly UI/form controls.
- Phu thuoc vao `CreateImportReceiptPayload` va option lists (`ProductOption`, `TrayOption`, `LocationOption`) tu trang.
- Khong tich hop API truc tiep trong component de giu phan tang ro rang.
*/

import { Add, DeleteOutlined } from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import type {
  CreateImportReceiptItemPayload,
  CreateImportReceiptPayload,
  ProductOption,
} from '../types/importReceiptTypes'

interface ImportReceiptCreateDialogProps {
  open: boolean
  form: CreateImportReceiptPayload
  productOptions: ProductOption[]
  trayOptions: unknown[]
  locationOptions: unknown[]
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: () => void
  onChange: (next: CreateImportReceiptPayload) => void
}

export function ImportReceiptCreateDialog({
  open,
  form,
  productOptions,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: ImportReceiptCreateDialogProps) {
  const updateItem = (index: number, patch: Partial<CreateImportReceiptItemPayload>) => {
    // Ghi chú: Dynamic item form block - cap nhat dung index item de tranh mutate state truc tiep.
    const nextItems = form.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      return {
        ...item,
        ...patch,
      }
    })

    onChange({ ...form, items: nextItems })
  }

  const addItem = () => {
    // Ghi chú: Dynamic item form block - them dong item moi voi gia tri mac dinh an toan.
    onChange({
      ...form,
      items: [...form.items, { product_id: 0, quantity: 1 }],
    })
  }

  const removeItem = (index: number) => {
    // Ghi chú: Dynamic item form block - luon giu it nhat 1 dong item de dung contract backend min=1.
    if (form.items.length <= 1) return
    onChange({
      ...form,
      items: form.items.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>Tạo phiếu nhập</DialogTitle>
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          <TextField
            label="Nhà cung cấp"
            value={form.supplier_name}
            onChange={(e) => onChange({ ...form, supplier_name: e.target.value })}
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

          <Divider sx={{ my: 0.5 }} />

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Danh sách sản phẩm nhập
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={addItem}>
              Thêm dòng
            </Button>
          </Stack>

          {form.items.map((item, index) => {
            return (
              <Paper key={`import-item-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Dòng {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={form.items.length <= 1}
                      onClick={() => removeItem(index)}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                    <Autocomplete
                      options={productOptions}
                      value={productOptions.find((product) => product.id === item.product_id) || null}
                      onChange={(_, product) =>
                        updateItem(index, { product_id: product?.id || 0 })
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
                      fullWidth
                    />

                    <TextField
                      label="Số lượng dự kiến"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </Paper>
            )
          })}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu nhập'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
