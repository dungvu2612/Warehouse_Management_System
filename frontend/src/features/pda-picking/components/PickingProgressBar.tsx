/*
- Mục đích: Progress bar don gian cho item picking tren PDA.
- Phụ thuộc: MUI LinearProgress.
- Giả định màn hình HT730: Tiến độ phải dễ đọc trên màn hình 4 inch mà không cần zoom.
- Quy tắc responsive: Full-width bar, text >=14px, no table cells.
- Luồng scanner: Updates after each valid product scan.
- Ghi chú bảo trì: Keep numeric picked/required visible; do not rely on color only.
*/

import { Box, LinearProgress, Stack, Typography } from '@mui/material'

interface PickingProgressBarProps {
  picked: number
  required: number
}

export function PickingProgressBar({ picked, required }: PickingProgressBarProps) {
  const percent = required > 0 ? Math.min(100, Math.round((picked / required) * 100)) : 0

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
          Đã nhặt {picked}/{required}
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{percent}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={percent} sx={{ mt: 0.75, height: 9, borderRadius: 99 }} />
    </Box>
  )
}
