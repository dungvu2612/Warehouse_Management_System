import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  InputLabel,
  Stack,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import { PRODUCT_IMAGE_SIZE } from '../../../shared/constants/productImage'
import type { ProductPayload } from '../types/productTypes'

interface ProductFormDialogProps {
  open: boolean
  title: string
  form: ProductPayload
  errorMessage: string
  isSubmitting: boolean
  isEditing: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: (next: ProductPayload) => void
  onImportImage: (file: File | null) => void
}

// Dialog form dùng chung cho tạo/sửa sản phẩm.
export function ProductFormDialog({
  open,
  title,
  form,
  errorMessage,
  isSubmitting,
  isEditing,
  onClose,
  onSubmit,
  onChange,
  onImportImage,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.6} sx={{ mt: 0.5 }}>
          <TextField
            label="Mã sản phẩm (tự sinh)"
            value={form.product_code}
            slotProps={{ input: { readOnly: true } }}
            helperText={
              isEditing
                ? 'Mã đã phát hành, không thay đổi khi cập nhật.'
                : 'Mã dự kiến theo tên + loại. Mã cuối cùng do backend cấp khi lưu.'
            }
            fullWidth
          />
          <TextField
            label="QR sản phẩm"
            value={form.qr_code}
            onChange={(e) => onChange({ ...form, qr_code: e.target.value })}
            helperText="Để trống sẽ tự dùng product_code."
            fullWidth
          />
          <TextField
            label="Tên sản phẩm"
            value={form.product_name}
            onChange={(e) => onChange({ ...form, product_name: e.target.value })}
            fullWidth
          />
          <Box>
            <InputLabel sx={{ mb: 0.8, fontSize: 13, color: 'text.secondary' }}>Ảnh sản phẩm</InputLabel>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center' }}>
              <ProductImageThumb src={form.image_url} alt={form.product_name || 'Ảnh sản phẩm'} size={PRODUCT_IMAGE_SIZE} />
              <Stack spacing={0.6}>
                <Button variant="outlined" component="label">
                  Import ảnh
                  <input
                    hidden
                    accept="image/png,image/jpeg,image/webp"
                    type="file"
                    onChange={(e) => onImportImage(e.target.files?.[0] || null)}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Ảnh sẽ được chuẩn hóa về cùng kích thước trước khi lưu.
                </Typography>
              </Stack>
            </Stack>
            {!form.image_url && <FormHelperText>Chưa có ảnh sản phẩm.</FormHelperText>}
          </Box>
          <TextField
            select
            label="Loại sản phẩm"
            value={form.product_type}
            onChange={(e) =>
              onChange({
                ...form,
                product_type: e.target.value as ProductPayload['product_type'],
              })
            }
            fullWidth
          >
            <MenuItem value="COMPONENT">Linh kiện (COMPONENT)</MenuItem>
            <MenuItem value="FINISHED_GOOD">Thành phẩm (FINISHED_GOOD)</MenuItem>
          </TextField>

          <TextField
            label="Đơn vị"
            value={form.unit}
            onChange={(e) => onChange({ ...form, unit: e.target.value })}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Min stock"
              type="number"
              value={form.min_stock}
              onChange={(e) => onChange({ ...form, min_stock: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Giá"
              type="number"
              value={form.price}
              onChange={(e) => onChange({ ...form, price: Number(e.target.value) })}
              fullWidth
            />
          </Stack>
          <TextField
            label="Mô tả"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
