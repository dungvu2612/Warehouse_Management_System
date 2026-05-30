/*
Senior Handover Note:
- Purpose: Shared scan action/status panel without exposing a text input.
- Dependencies: MUI button/alert primitives and scanner hook state.
- HT730 scanner behavior: User presses action, then physical scan key types QR into hidden input.
- API callback contract: Parent starts the correct ScanMode and handles API in useScannerInput callback.
- Maintenance notes: Keep status rendering generic; business-specific details stay in pages.
*/

import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import type { ScanMode, ScanStatus } from '../hooks/useScannerInput'

interface ScannerActionPanelProps {
  title: string
  description?: string
  buttonLabel: string
  scanMode: ScanMode
  scanStatus: ScanStatus
  scanMessage: string
  isScanning: boolean
  lastScannedCode: string
  onStartScan: () => void
  onCancelScan?: () => void
  disabled?: boolean
}

export function ScannerActionPanel({
  title,
  description,
  buttonLabel,
  scanStatus,
  scanMessage,
  isScanning,
  lastScannedCode,
  onStartScan,
  onCancelScan,
  disabled = false,
}: ScannerActionPanelProps) {
  const severity = scanStatus === 'ERROR' ? 'error' : scanStatus === 'SUCCESS' ? 'success' : 'info'

  return (
    <Paper sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{title}</Typography>
        {description && <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>{description}</Typography>}
        <Button type="button" fullWidth variant="contained" onClick={onStartScan} disabled={disabled} sx={{ minHeight: 48, fontWeight: 900 }}>
          {buttonLabel}
        </Button>
        {isScanning && (
          <Alert severity="info">
            <Typography sx={{ fontWeight: 900 }}>Đang chờ quét...</Typography>
            <Typography>Bấm nút scan vật lý trên HT730</Typography>
          </Alert>
        )}
        {scanStatus !== 'IDLE' && scanMessage && (
          <Alert severity={severity}>
            <Typography sx={{ fontWeight: 900 }}>{scanStatus === 'ERROR' ? 'Scan lỗi' : scanStatus === 'SUCCESS' ? 'Scan thành công' : 'Scanner'}</Typography>
            <Typography>{scanMessage}</Typography>
            {lastScannedCode && <Typography sx={{ fontFamily: 'monospace' }}>{lastScannedCode}</Typography>}
          </Alert>
        )}
        {isScanning && onCancelScan && (
          <Button type="button" variant="outlined" onClick={onCancelScan} sx={{ minHeight: 44 }}>
            Hủy scan
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
