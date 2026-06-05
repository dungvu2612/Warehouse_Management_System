/*
- Mục đích: Fixed bottom action area cho nut chinh tren PDA.
- Phụ thuộc: MUI Box.
- Giả định màn hình HT730: Các thao tác chính nằm dưới cùng để dễ bấm bằng ngón cái trên màn hình dọc 480x800.
- Quy tắc responsive: Height is compact but touch targets remain >=48px.
- Luồng scanner: Hosts Scan/Confirm/Back buttons without crowding content.
- Ghi chú bảo trì: Avoid more than two primary actions in this bar on HT730.
*/

import type { ReactNode } from 'react'
import { Box } from '@mui/material'

export function PdaBottomActionBar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 1.5,
        py: 1,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>{children}</Box>
    </Box>
  )
}
