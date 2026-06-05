/*
- Mục đích: Panel scan tray cho item dang chon.
- Phụ thuộc: ScanWaitingPanel/ScanResultPanel, MUI Button.
- Giả định màn hình HT730: Phản hồi sai khay phải đọc được ngay.
- Quy tắc responsive: One primary button, expected/scanned codes use monospace.
- Luồng scanner: Product scan remains disabled until tray verification succeeds.
- Ghi chú bảo trì: Include expected tray code in every tray scan state.
*/

import { QrCodeScanner } from '@mui/icons-material'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { ScanWaitingPanel } from '../../pda/components/ScanWaitingPanel'

interface TrayScanPanelProps {
  expectedTrayCode: string
  verifiedTrayCode: string
  waiting: boolean
  errorMessage: string
  onScanTray: () => void
  disabled?: boolean
}

export function TrayScanPanel({ expectedTrayCode, verifiedTrayCode, waiting, errorMessage, onScanTray, disabled }: TrayScanPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Scan khay</Typography>
        <Typography sx={{ fontSize: 15 }}>
          Cần tới khay: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 900 }}>{expectedTrayCode || '-'}</Typography>
        </Typography>
        {!verifiedTrayCode && !waiting && !errorMessage && (
          <ScanResultPanel severity="info" title="Chưa scan tray" message="Tới đúng khay rồi bấm Scan Tray" />
        )}
        {waiting && <ScanWaitingPanel title="Đang chờ quét khay" helper="Bấm nút scan trên HT730" codeHint={expectedTrayCode} />}
        {errorMessage && <ScanResultPanel severity="error" title="Sai khay" message={errorMessage} />}
        {verifiedTrayCode && (
          <ScanResultPanel severity="success" title="Đúng khay" message={`Đã quét: ${verifiedTrayCode}`} />
        )}
        <Button
          type="button"
          fullWidth
          variant="contained"
          startIcon={<QrCodeScanner />}
          onClick={onScanTray}
          disabled={disabled}
          sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
        >
          {verifiedTrayCode || errorMessage ? 'Scan lại Tray' : 'Scan Tray'}
        </Button>
      </Stack>
    </Paper>
  )
}
