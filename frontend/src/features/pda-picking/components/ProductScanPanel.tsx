/*
- Mục đích: Panel scan product tung don vi sau khi tray dung.
- Phụ thuộc: ScanWaitingPanel/ScanResultPanel, MUI Button.
- Giả định màn hình HT730: Phản hồi +1 sản phẩm và lỗi sai sản phẩm phải dễ đọc trên màn hình 4 inch.
- Quy tắc responsive: Product scan button is full-width and >=48px; no manual quantity field for WAREHOUSE.
- Luồng scanner: Each successful product QR increments picked quantity by exactly 1.
- Ghi chú bảo trì: Manual override, if required later, must be ADMIN-only and audited.
*/

import { QrCodeScanner } from '@mui/icons-material'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { ScanWaitingPanel } from '../../pda/components/ScanWaitingPanel'

interface ProductScanPanelProps {
  enabled: boolean
  waiting: boolean
  lastFeedback: { severity: 'success' | 'error' | 'info' | 'warning'; title: string; message: string } | null
  remaining: number
  onScanProduct: () => void
  disabled?: boolean
}

export function ProductScanPanel({ enabled, waiting, lastFeedback, remaining, onScanProduct, disabled }: ProductScanPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Scan sản phẩm</Typography>
        {!enabled && <ScanResultPanel severity="warning" title="Chưa được scan product" message="Cần scan đúng khay trước." />}
        {enabled && waiting && <ScanWaitingPanel title="Đang chờ quét sản phẩm" helper="Bấm nút scan trên HT730" />}
        {enabled && lastFeedback && (
          <ScanResultPanel severity={lastFeedback.severity} title={lastFeedback.title} message={lastFeedback.message} />
        )}
        {enabled && (
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>Còn cần nhặt: {remaining}</Typography>
        )}
        <Button
          type="button"
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<QrCodeScanner />}
          onClick={onScanProduct}
          disabled={!enabled || disabled || remaining <= 0}
          sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
        >
          Scan Product
        </Button>
      </Stack>
    </Paper>
  )
}
