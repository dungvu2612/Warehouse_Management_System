/*
Senior Handover Note:
- Purpose: PDA scan order entry screen cho HT730; sau khi scan thi mo staff picking detail.
- Dependencies: PdaLayout, centralized scanner hook, pdaPickingApi, React Router.
- API contract: GET /orders/scan/:qr_code.
- HT730 scanner behavior: TagAccess Keyboard types QR into the focused hidden input, then Enter.
- API callback contract: ORDER mode calls GET /orders/scan/:qr_code.
- Maintenance notes: Tray/product scan belongs to /staff/picking/:orderId to avoid duplicate picking flows.
*/

import { useEffect, useMemo, useState } from 'react'
import { ArrowForward } from '@mui/icons-material'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { usePDAScanOrderMutation } from '../hooks/usePdaPicking'
import type { PDAPickingOrderResult } from '../types/pdaPickingTypes'

export function PDAPickingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialOrderCode = searchParams.get('order') || ''
  const [result, setResult] = useState<PDAPickingOrderResult | null>(null)

  const scanOrderMutation = usePDAScanOrderMutation()

  const totalItems = useMemo(() => {
    if (!result) return 0
    return result.tasks?.reduce((sum, task) => sum + task.required_quantity, 0) || result.order.items?.length || 0
  }, [result])

  const scanner = useScannerInput({
    autoStart: true,
    initialMode: 'ORDER',
    // Senior Handover: HT730 scanner works as keyboard wedge, so this page keeps a hidden input focused.
    // Senior Handover: Auto scan mode removes the need to press Scan QR before every scan.
    // Senior Handover: Scanner logic is centralized here to avoid duplicate handlers.
    onScanComplete: async ({ mode, code }) => {
      if (mode !== 'ORDER') return
      const data = await scanOrderMutation.mutateAsync(code)
      setResult(data)
    },
  })

  useEffect(() => {
    if (!initialOrderCode) return
    void scanOrderMutation.mutateAsync(initialOrderCode).then(setResult)
  }, [initialOrderCode])

  return (
    <PdaLayout
      title="Quét đơn hàng"
      subtitle="Nhặt hàng PDA"
      bottomAction={
        result ? (
          <Button
            type="button"
            fullWidth
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => navigate(`/staff/picking/${result.order.id}`)}
            sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
          >
            Mở đơn
          </Button>
        ) : undefined
      }
    >
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 900 }}>Sẵn sàng quét mã đơn hàng</Typography>
          <Typography sx={{ color: 'text.secondary' }}>Không cần bấm nút Scan, có thể quét ngay bằng phím scan HT730.</Typography>
          <Stack direction="row" spacing={1}>
            <Button type="button" variant="outlined" onClick={() => scanner.focusScannerInput()}>
              Đưa con trỏ quét về máy scan
            </Button>
            <Button type="button" variant="outlined" onClick={() => scanner.resumeScanner('ORDER')}>
              Quét đơn mới
            </Button>
          </Stack>
          {scanOrderMutation.isPending && <Typography>Đang xử lý mã...</Typography>}
          {scanner.scanStatus === 'SUCCESS' && scanner.lastScannedCode && (
            <Typography sx={{ color: 'success.main', fontWeight: 800 }}>Scan thành công: {scanner.lastScannedCode}</Typography>
          )}
          {scanner.scanStatus === 'ERROR' && scanner.scanMessage && (
            <Typography sx={{ color: 'error.main', fontWeight: 800 }}>{scanner.scanMessage}</Typography>
          )}
        </Stack>
      </Paper>

      {scanner.isScanning && (
        <ScanResultPanel
          severity="info"
          title="Đang chờ quét..."
          message="Bấm nút scan vật lý trên HT730"
        />
      )}

      {result && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900 }} noWrap>
                  {result.order.order_code}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{result.order.customer_name || '-'}</Typography>
              </Box>
              <Chip label={result.order.status} color="secondary" sx={{ fontWeight: 900 }} />
            </Stack>
            <Typography sx={{ fontSize: 15 }}>SĐT: {result.order.customer_phone || '-'}</Typography>
            <Typography sx={{ fontSize: 15 }}>Địa chỉ: {result.order.customer_address || '-'}</Typography>
            <Typography sx={{ fontSize: 15 }}>Tổng tiền: {Number(result.order.total_amount || 0).toLocaleString('vi-VN')}</Typography>
            <Typography sx={{ fontSize: 15 }}>Tổng items: {totalItems}</Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Tạo: {new Date(result.order.created_at).toLocaleString('vi-VN')}
            </Typography>
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
