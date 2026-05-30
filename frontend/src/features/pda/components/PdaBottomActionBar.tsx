/*
Senior Handover Note:
- Purpose: Fixed bottom action area cho nut chinh tren PDA.
- Dependencies: MUI Box.
- HT730 screen assumptions: Thumb-accessible actions at bottom of 480x800 portrait screen.
- Responsive rules: Height is compact but touch targets remain >=48px.
- Scanner workflow: Hosts Scan/Confirm/Back buttons without crowding content.
- Maintenance notes: Avoid more than two primary actions in this bar on HT730.
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
