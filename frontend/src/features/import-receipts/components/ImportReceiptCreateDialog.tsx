/*
Thông tin ghi chú:
- File nay la dialog tao phieu nhap nhieu item, chi xu ly UI/form controls.
- Phu thuoc vao `CreateImportReceiptPayload` va option lists (`ProductOption`, `TrayOption`, `LocationOption`) tu trang.
- Khong tich hop API truc tiep trong component de giu phan tang ro rang.
*/

import { useEffect, useState } from 'react'
import { Add, DeleteOutlined, QrCodeScanner } from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
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
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import type {
  CreateImportReceiptItemPayload,
  CreateImportReceiptPayload,
  LocationOption,
  ProductOption,
  TrayOption,
} from '../types/importReceiptTypes'

interface ImportReceiptCreateDialogProps {
  open: boolean
  form: CreateImportReceiptPayload
  productOptions: ProductOption[]
  trayOptions: TrayOption[]
  locationOptions: LocationOption[]
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
  trayOptions,
  locationOptions,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  onChange,
}: ImportReceiptCreateDialogProps) {
  const [scanTargetIndex, setScanTargetIndex] = useState<number | null>(null)

  const locationLabelById = Object.fromEntries(
    locationOptions.map((location) => [
      location.id,
      `${location.location_code}${location.description ? ` - ${location.description}` : ''}`,
    ]),
  ) as Record<number, string>

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

  const scanner = useScannerInput({
    onScanComplete: async ({ mode, code }) => {
      if (mode !== 'TRAY') return
      if (scanTargetIndex === null) throw new Error('Vui lòng chọn dòng cần quét khay.')

      const item = form.items[scanTargetIndex]
      if (!item || item.product_id <= 0) throw new Error('Vui lòng chọn sản phẩm trước khi quét khay.')

      const normalizedCode = code.trim().toLowerCase()
      const scannedTray = trayOptions.find((tray) => {
        return tray.qr_code?.toLowerCase() === normalizedCode || tray.tray_code.toLowerCase() === normalizedCode
      })

      if (!scannedTray) throw new Error('Không tìm thấy khay từ QR vừa quét.')
      if (scannedTray.product_id !== item.product_id) {
        throw new Error('Khay vừa quét không thuộc sản phẩm đã chọn.')
      }

      updateItem(scanTargetIndex, {
        tray_id: scannedTray.id,
        tray_qr_code: scannedTray.qr_code || scannedTray.tray_code,
      })
      setScanTargetIndex(null)
    },
  })
  const { startScan, stopScan } = scanner

  useEffect(() => {
    if (!open) {
      setScanTargetIndex(null)
      stopScan()
    }
  }, [open, stopScan])

  useEffect(() => {
    if (scanTargetIndex === null) {
      stopScan()
    }
  }, [scanTargetIndex, stopScan])

  const addItem = () => {
    // Ghi chú: Dynamic item form block - them dong item moi voi gia tri mac dinh an toan.
    onChange({
      ...form,
      items: [...form.items, { product_id: 0, tray_id: 0, tray_qr_code: '', quantity: 1 }],
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
                        updateItem(index, { product_id: product?.id || 0, tray_id: 0, tray_qr_code: '' })
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

                    <Stack spacing={0.75} sx={{ width: '100%' }}>
                      <Button
                        type="button"
                        variant={item.tray_id > 0 ? 'outlined' : 'contained'}
                        startIcon={<QrCodeScanner />}
                        disabled={item.product_id <= 0}
                        onClick={() => {
                          setScanTargetIndex(index)
                          startScan('TRAY')
                        }}
                        sx={{ minHeight: 56, fontWeight: 900 }}
                      >
                        {scanTargetIndex === index && scanner.isScanning ? 'Đang chờ QR khay...' : 'Quét QR khay'}
                      </Button>
                      {item.product_id <= 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Chọn sản phẩm trước khi quét khay.
                        </Typography>
                      )}
                      {item.tray_id > 0 && (() => {
                        const selectedTray = trayOptions.find((tray) => tray.id === item.tray_id)
                        if (!selectedTray) return null
                        return (
                          <Chip
                            color="success"
                            variant="outlined"
                            label={`Đã quét: ${selectedTray.tray_code} - ${locationLabelById[selectedTray.location_id] || '-'}`}
                            sx={{ justifyContent: 'flex-start', fontWeight: 800 }}
                          />
                        )
                      })()}
                    </Stack>

                    <TextField
                      label="Số lượng"
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
          {scanner.scanStatus === 'ERROR' && scanner.scanMessage && (
            <Alert severity="error">{scanner.scanMessage}</Alert>
          )}
          {scanner.scanStatus === 'SUCCESS' && scanner.scanMessage && (
            <Alert severity="success">{scanner.scanMessage}</Alert>
          )}
          <ScannerHiddenInput
            inputRef={scanner.scannerInputRef}
            value={scanner.scanValue}
            onChange={scanner.handleScannerChange}
            onKeyDown={(event) => void scanner.handleScannerKeyDown(event)}
          />
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
