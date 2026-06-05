/*
- Mục đích: PDA Putaway theo flow QR cũ trên HT730: quét sản phẩm, quét QR khay hợp lệ, nhập số lượng.
- Phụ thuộc: PdaLayout, scanner hook dùng chung, products scan API, trays scan API, putaway mutation.
- Hành vi máy quét HT730: TagAccess Keyboard nhập QR vào input ẩn đang focus, Enter để gửi lượt quét.
- Hợp đồng API: PRODUCT mode gọi GET /products/scan/:qr_code, TRAY mode gọi GET /trays/scan/:qr_code, submit gọi POST /inventory/putaway.
- Ghi chú bảo trì: Chỉ cho nhập vào khay thuộc đúng sản phẩm, giữ flow nhập kho bằng QR.
*/

import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { QrCodeScanner } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { usePDAPutawayMutation } from '../hooks/usePdaPutaway'
import { productsApi } from '../../products/api/productsApi'
import type { ProductScanResponse } from '../../products/types/productTypes'
import { traysApi } from '../../trays/api/traysApi'
import type { TrayScanResponse } from '../../trays/types/trayTypes'

export function PDAPutawayPage() {
  const [productScanResult, setProductScanResult] = useState<ProductScanResponse | null>(null)
  const [trayScanResult, setTrayScanResult] = useState<TrayScanResponse | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [errorText, setErrorText] = useState('')
  const [requestedScanMode, setRequestedScanMode] = useState<'PRODUCT' | 'TRAY'>('PRODUCT')

  const scanProductMutation = useMutation({
    mutationFn: (qrCode: string) => productsApi.scanProductByQRCode(qrCode),
  })

  const scanTrayMutation = useMutation({
    mutationFn: (qrCode: string) => traysApi.scanTrayByQRCode(qrCode),
  })

  const putawayMutation = usePDAPutawayMutation({
    onError: () => setErrorText('Nhập kho thất bại.'),
  })

  const handleScanTray = async (code: string) => {
    if (!productScanResult) throw new Error('Vui lòng quét sản phẩm trước khi quét khay.')
    const data = await scanTrayMutation.mutateAsync(code)
    if (data.tray.product_id !== productScanResult.product.id) {
      setTrayScanResult(null)
      throw new Error('Khay vừa quét không thuộc sản phẩm đã chọn.')
    }
    setTrayScanResult(data)
    setMessage(`Đã quét khay ${data.tray.tray_code}.`)
  }

  const handleSubmit = async () => {
    if (!productScanResult || !trayScanResult || quantity <= 0) return
    setErrorText('')
    setMessage('')

    const result = await putawayMutation.mutateAsync({
      product_qr_code: productScanResult.product.qr_code,
      tray_qr_code: trayScanResult.tray.qr_code || trayScanResult.tray.tray_code,
      quantity,
      note: note.trim(),
    })

    setMessage(result.message)
    setQuantity(1)
    setNote('')
  }

  const scanner = useScannerInput({
    onScanComplete: async ({ mode, code }) => {
      if (mode === 'TRAY') {
        setErrorText('')
        setMessage('')
        await handleScanTray(code)
        return
      }
      if (mode !== 'PRODUCT') return
      setErrorText('')
      setMessage('')
      const data = await scanProductMutation.mutateAsync(code)
      setProductScanResult(data)
      setTrayScanResult(null)
      setRequestedScanMode('TRAY')
    },
  })

  useEffect(() => {
    scanner.startScan(requestedScanMode)
  }, [requestedScanMode, scanner.startScan])

  return (
    <PdaLayout title="Nhập kho PDA" subtitle="Quét sản phẩm rồi quét QR khay">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Sẵn sàng quét mã sản phẩm</Typography>
          <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>Không cần bấm nút scan, có thể quét ngay bằng HT730.</Typography>
          <Button type="button" variant="outlined" onClick={() => scanner.startScan(requestedScanMode)}>
            Đưa con trỏ quét về máy scan
          </Button>
        </Stack>
      </Paper>

      {productScanResult && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900 }}>
              {productScanResult.product.product_code}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{productScanResult.product.product_name}</Typography>
            <Chip color="secondary" label={`Tồn hiện tại: ${productScanResult.inventory_total}`} sx={{ fontWeight: 900 }} />
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setProductScanResult(null)
                setTrayScanResult(null)
                setRequestedScanMode('PRODUCT')
                scanner.startScan('PRODUCT')
              }}
            >
              Quét sản phẩm khác
            </Button>
          </Stack>
        </Paper>
      )}

      {productScanResult && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Khay đang có sản phẩm này</Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Đi tới đúng khay bên dưới rồi quét QR khay để nhập thêm hàng.
            </Typography>
            {productScanResult.trays.length === 0 && <Alert severity="info">Sản phẩm này chưa có tồn trong khay nào.</Alert>}
            {productScanResult.trays.length > 0 && (
              <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                <Stack spacing={0.75}>
                  {productScanResult.trays.map((tray) => (
                    <Paper key={tray.tray_id} variant="outlined" sx={{ p: 1, borderRadius: 1.5 }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }} noWrap>
                            {tray.tray_code}
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                            Vị trí: {tray.location_code || '-'}
                          </Typography>
                        </Box>
                        <Chip color="info" label={`SL: ${tray.quantity}`} sx={{ fontWeight: 900 }} />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {productScanResult && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Quét QR khay nhập</Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Không chọn khay thủ công. Nếu QR khay thuộc sản phẩm khác, hệ thống sẽ chặn nhập kho.
            </Typography>
            <Button
              type="button"
              variant={trayScanResult ? 'outlined' : 'contained'}
              startIcon={<QrCodeScanner />}
              onClick={() => {
                setRequestedScanMode('TRAY')
                scanner.startScan('TRAY')
              }}
              sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
            >
              {scanner.scanMode === 'TRAY' && scanner.isScanning ? 'Đang chờ QR khay...' : 'Quét QR khay'}
            </Button>
            {trayScanResult && (
              <Alert severity="success">
                Đã quét khay {trayScanResult.tray.tray_code} · vị trí {trayScanResult.location_code || '-'} · tồn trong khay:{' '}
                {trayScanResult.inventory_total}
              </Alert>
            )}

            <TextField
              label="Số lượng nhập"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              fullWidth
            />
            <TextField
              label="Ghi chú"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              fullWidth
            />

            <Button
              type="button"
              variant="contained"
              startIcon={<QrCodeScanner />}
              onClick={() => void handleSubmit()}
              disabled={!trayScanResult || putawayMutation.isPending}
              sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
            >
              {putawayMutation.isPending ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
            </Button>
          </Stack>
        </Paper>
      )}

      {message && <Alert severity="success">{message}</Alert>}
      {errorText && <Alert severity="error">{errorText}</Alert>}

      <Box>
        <ScannerHiddenInput
          inputRef={scanner.scannerInputRef}
          value={scanner.scanValue}
          onChange={scanner.handleScannerChange}
          onKeyDown={(event) => void scanner.handleScannerKeyDown(event)}
        />
      </Box>
    </PdaLayout>
  )
}
