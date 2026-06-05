/*
- Mục đích: Panel thao tác/trạng thái quét dùng chung, không hiển thị ô nhập text.
- Phụ thuộc: Button/Alert của MUI và state từ scanner hook.
- Hành vi máy quét HT730: Người dùng bấm thao tác, sau đó phím quét vật lý nhập QR vào input ẩn.
- Hợp đồng callback API: Component cha khởi động đúng ScanMode và xử lý API trong callback của useScannerInput.
- Ghi chú bảo trì: Giữ phần render trạng thái ở mức dùng chung; chi tiết nghiệp vụ nằm ở page.
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
