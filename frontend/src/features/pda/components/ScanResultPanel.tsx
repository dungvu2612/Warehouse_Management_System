/*
- Mục đích: Panel phản hồi thành công/lỗi phải dễ đọc trên HT730.
- Phụ thuộc: MUI Alert.
- Giả định màn hình HT730: Phản hồi quét phải dễ đọc trên màn hình 4 inch.
- Quy tắc responsive: One message per panel, 15px text minimum, no color-only status.
- Luồng scanner: Display after every scan success/error.
- Ghi chú bảo trì: Include concrete expected/scanned codes for mismatch errors.
*/

import { Alert, Typography } from '@mui/material'

interface ScanResultPanelProps {
  severity: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
}

export function ScanResultPanel({ severity, title, message }: ScanResultPanelProps) {
  return (
    // Ghi chú: Phản hồi quét phải dễ đọc trên màn hình 4 inch
    <Alert severity={severity} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
      <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{title}</Typography>
      {message && <Typography sx={{ fontSize: 14 }}>{message}</Typography>}
    </Alert>
  )
}
