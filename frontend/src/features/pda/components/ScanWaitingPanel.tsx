/*
- Mục đích: Panel cho trang thai dang cho scan tren HT730.
- Phụ thuộc: MUI Paper/Typography.
- Giả định màn hình HT730: Nhân viên đọc nội dung này ở khoảng cách thao tác trên màn hình 4 inch.
- Quy tắc responsive: Large text, no columns, icon-sized visual cue only.
- Luồng scanner: Dùng sau khi bấm quét đơn/khay/sản phẩm để focus input ẩn.
- Ghi chú bảo trì: Keep copy short and operational.
*/

import { QrCodeScanner } from '@mui/icons-material'
import { Paper, Stack, Typography } from '@mui/material'

interface ScanWaitingPanelProps {
  title: string
  helper: string
  codeHint?: string
}

export function ScanWaitingPanel({ title, helper, codeHint }: ScanWaitingPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eef7ff' }}>
      <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <QrCodeScanner color="primary" sx={{ fontSize: 40 }} />
        <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{title}</Typography>
        <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>{helper}</Typography>
        {codeHint && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }}>
            {codeHint}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
