/*
- Mục đích: PDA Stocktaking trang toi uu thao tac nhanh tren HT730.
- Phụ thuộc: PdaLayout, centralized scanner hook, scan tray + stocktaking mutations.
- Hợp đồng API: GET /trays/scan/:qr_code, POST /inventory/stocktaking.
- Hành vi máy quét HT730: TagAccess Keyboard nhập QR vào input ẩn đang focus, sau đó gửi Enter.
- Hợp đồng callback API: Mode STOCKTAKING gọi GET /trays/scan/:qr_code.
- Ghi chú bảo trì: Stocktaking legitimately needs physical quantity input; picking flow does not.
*/

import { useMemo, useState } from 'react'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { usePDAScanTrayMutation, usePDAStocktakingMutation } from '../hooks/usePdaStocktaking'

export function PDAStocktakingPage() {
  const [trayCode, setTrayCode] = useState('')
  const [physicalQty, setPhysicalQty] = useState(0)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [errorText, setErrorText] = useState('')

  const scanMutation = usePDAScanTrayMutation({
    onError: () => setErrorText('Không scan được khay.'),
  })

  const stocktakingMutation = usePDAStocktakingMutation({
    onError: () => setErrorText('Không thể xác nhận kiểm kê.'),
  })

  const systemQty = useMemo(() => scanMutation.data?.inventory_total || 0, [scanMutation.data])
  const diffQty = physicalQty - systemQty

  const handleSubmit = async () => {
    if (!trayCode.trim()) return
    setErrorText('')
    const result = await stocktakingMutation.mutateAsync({
      tray_qr_code: trayCode.trim(),
      physical_qty: physicalQty,
      note,
    })
    setMessage(`${result.message} | Delta: ${result.delta}`)
    setNote('')
  }

  const scanner = useScannerInput({
    autoStart: true,
    initialMode: 'STOCKTAKING',
    // Ghi chú: Tập trung logic quét tại đây để tránh lặp handler.
    onScanComplete: async ({ mode, code }) => {
      if (mode !== 'STOCKTAKING') return
      setErrorText('')
      setMessage('')
      setTrayCode(code)
      await scanMutation.mutateAsync(code)
    },
  })

  return (
    <PdaLayout title="Kiểm kê" subtitle="Kiểm kê khay">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Sẵn sàng quét mã khay</Typography>
          <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>Không cần bấm nút scan, có thể quét ngay bằng HT730.</Typography>
          <Button type="button" variant="outlined" onClick={() => scanner.focusScannerInput()}>
            Đưa con trỏ quét về máy scan
          </Button>
        </Stack>
      </Paper>

      {scanner.isScanning && <ScanResultPanel severity="info" title="Đang chờ quét..." message="Bấm nút scan vật lý trên HT730" />}
      {scanner.scanStatus === 'SUCCESS' && <ScanResultPanel severity="success" title="Scan thành công" message={scanner.lastScannedCode} />}
      {scanner.scanStatus === 'ERROR' && <ScanResultPanel severity="error" title="Scan lỗi" message={scanner.scanMessage} />}
      {message && <ScanResultPanel severity="success" title="Đã xác nhận kiểm kê" message={message} />}
      {errorText && <ScanResultPanel severity="error" title="Kiểm kê lỗi" message={errorText} />}

      {scanMutation.data && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900 }}>
              {scanMutation.data.tray.tray_code}
            </Typography>
            <Typography sx={{ fontSize: 15 }}>Vị trí: {scanMutation.data.location_code || '-'}</Typography>
            <TextField
              label="Số lượng thực tế"
              type="number"
              value={physicalQty}
              onChange={(event) => setPhysicalQty(Number(event.target.value) || 0)}
              slotProps={{ htmlInput: { style: { fontSize: 18, fontWeight: 800 } } }}
              fullWidth
            />
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Chênh lệch: {diffQty}</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 900 }}>Sản phẩm trong khay:</Typography>
            {scanMutation.data.inventory_items.length === 0 && (
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Khay hiện chưa có sản phẩm.</Typography>
            )}
            {scanMutation.data.inventory_items.map((item) => (
              <Paper key={item.inventory_id} variant="outlined" sx={{ p: 1 }}>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{item.product_code}</Typography>
                  <Typography sx={{ fontSize: 14 }}>{item.product_name}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Số lượng: {item.quantity}</Typography>
                </Stack>
              </Paper>
            ))}
            <TextField label="Ghi chú" value={note} onChange={(event) => setNote(event.target.value)} fullWidth />
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={() => void handleSubmit()}
              disabled={stocktakingMutation.isPending}
              sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
            >
              {stocktakingMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận kiểm kê'}
            </Button>
          </Stack>
        </Paper>
      )}

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
