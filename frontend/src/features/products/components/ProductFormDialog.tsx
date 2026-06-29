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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
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
  onProductCodeManualChange?: (value: string) => void
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
  onProductCodeManualChange,
  onImportImage,
}: ProductFormDialogProps) {
  const [difficultyInput, setDifficultyInput] = useState(String(form.difficulty_weight || 1.0))
  const [minStockInput, setMinStockInput] = useState(String(form.min_stock ?? 0))
  const [priceInput, setPriceInput] = useState(String(form.price ?? 0))

  useEffect(() => {
    setDifficultyInput(String(form.difficulty_weight || 1.0))
    setMinStockInput(String(form.min_stock ?? 0))
    setPriceInput(String(form.price ?? 0))
  }, [form.difficulty_weight, form.min_stock, form.price, open])

  const handleIntegerInputChange = (
    rawValue: string,
    onInputChange: (value: string) => void,
    onValueChange: (value: number) => void,
  ) => {
    const value = rawValue.trim()
    if (!/^\d*$/.test(value)) return
    onInputChange(rawValue)
    if (value === '') return
    onValueChange(Number(value))
  }

  const handleIntegerInputBlur = (
    currentInput: string,
    fallbackValue: number,
    onInputChange: (value: string) => void,
    onValueChange: (value: number) => void,
  ) => {
    const normalized = currentInput.trim()
    if (normalized === '') {
      onInputChange(String(fallbackValue))
      return
    }
    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
      onInputChange(String(fallbackValue))
      return
    }
    onValueChange(parsed)
    onInputChange(String(parsed))
  }

  const handleDecimalInputChange = (
    rawValue: string,
    onInputChange: (value: string) => void,
    onValueChange: (value: number) => void,
  ) => {
    const value = rawValue.trim()
    if (!/^(\d+([.,]\d*)?|[.,]\d*)?$/.test(value)) return
    onInputChange(rawValue)
    const normalized = value.replace(',', '.')
    if (normalized === '' || normalized === '.' || normalized === ',' || normalized.endsWith('.')) {
      return
    }
    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) return
    onValueChange(parsed)
  }

  const handleDecimalInputBlur = (
    currentInput: string,
    fallbackValue: number,
    onInputChange: (value: string) => void,
    onValueChange: (value: number) => void,
  ) => {
    const normalized = currentInput.trim().replace(',', '.')
    if (normalized === '' || normalized === '.' || normalized === ',') {
      onInputChange(String(fallbackValue))
      return
    }
    const parsed = Number(normalized.endsWith('.') ? normalized.slice(0, -1) : normalized)
    if (Number.isNaN(parsed)) {
      onInputChange(String(fallbackValue))
      return
    }
    onValueChange(parsed)
    onInputChange(String(parsed))
  }

  const handleDifficultyWeightChange = (rawValue: string) => {
    const value = rawValue.trim()
    if (!/^(\d+([.,]\d*)?|[.,]\d*)?$/.test(value)) return

    setDifficultyInput(rawValue)

    const normalized = value.replace(',', '.')
    if (normalized === '' || normalized === '.' || normalized === ',' || normalized.endsWith('.')) {
      return
    }

    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) return

    onChange({ ...form, difficulty_weight: parsed })
  }

  const handleDifficultyWeightBlur = () => {
    const normalized = difficultyInput.trim().replace(',', '.')
    if (normalized === '' || normalized === '.' || normalized === ',') {
      setDifficultyInput(String(form.difficulty_weight || 1.0))
      return
    }

    const parsed = Number(normalized.endsWith('.') ? normalized.slice(0, -1) : normalized)
    if (Number.isNaN(parsed)) {
      setDifficultyInput(String(form.difficulty_weight || 1.0))
      return
    }

    onChange({ ...form, difficulty_weight: parsed })
    setDifficultyInput(String(parsed))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.6} sx={{ mt: 0.5 }}>
          <TextField
            label="Mã sản phẩm"
            value={form.product_code}
            onChange={(e) => {
              onProductCodeManualChange?.(e.target.value)
              onChange({ ...form, product_code: e.target.value })
            }}
            slotProps={{ input: { readOnly: isEditing } }}
            helperText={isEditing ? 'Mã đã phát hành, không thay đổi khi cập nhật.' : 'Có thể sửa hoặc để trống để hệ thống tự sinh.'}
            fullWidth
          />
          <TextField
            label="Mã QR"
            value={form.qr_code}
            onChange={(e) => onChange({ ...form, qr_code: e.target.value })}
            helperText="Nếu để trống khi tạo mới, hệ thống dùng mã sản phẩm làm mã QR."
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
            <Stack
              spacing={1.2}
              sx={{
                alignItems: 'center',
                border: '1px dashed #cbd5e1',
                borderRadius: 2,
                px: 2,
                py: 1.75,
                textAlign: 'center',
              }}
            >
              <ProductImageThumb src={form.image_url} alt={form.product_name || 'Ảnh sản phẩm'} size={PRODUCT_IMAGE_SIZE} />
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
              {!form.image_url && <FormHelperText sx={{ m: 0 }}>Chưa có ảnh sản phẩm.</FormHelperText>}
            </Stack>
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
              type="text"
              value={minStockInput}
              onChange={(e) =>
                handleIntegerInputChange(
                  e.target.value,
                  setMinStockInput,
                  (value) => onChange({ ...form, min_stock: value }),
                )
              }
              onBlur={() =>
                handleIntegerInputBlur(
                  minStockInput,
                  form.min_stock ?? 0,
                  setMinStockInput,
                  (value) => onChange({ ...form, min_stock: value }),
                )
              }
              slotProps={{ htmlInput: { inputMode: 'numeric', placeholder: 'Ví dụ: 10' } }}
              fullWidth
            />
            <TextField
              label="Giá"
              type="text"
              value={priceInput}
              onChange={(e) =>
                handleDecimalInputChange(
                  e.target.value,
                  setPriceInput,
                  (value) => onChange({ ...form, price: value }),
                )
              }
              onBlur={() =>
                handleDecimalInputBlur(
                  priceInput,
                  form.price ?? 0,
                  setPriceInput,
                  (value) => onChange({ ...form, price: value }),
                )
              }
              slotProps={{ htmlInput: { inputMode: 'decimal', placeholder: 'Ví dụ: 100000 hoặc 100000.5' } }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Hệ số độ khó"
            type="text"
            value={difficultyInput}
            onChange={(e) => handleDifficultyWeightChange(e.target.value)}
            onBlur={handleDifficultyWeightBlur}
            helperText="Admin tự nhập hệ số độ khó xử lý cho sản phẩm."
            fullWidth
            slotProps={{ htmlInput: { inputMode: 'decimal', placeholder: 'Ví dụ: 1.5, 1,5 hoặc 100' } }}
          />
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
