/*
Senior Handover Note:
- Purpose: Layout chung cho cac route PDA/Staff tren Unitech HT730.
- Dependencies: PdaHeader, PdaBottomActionBar, auth context, MUI layout primitives.
- HT730 screen assumptions: 480x800 px portrait, one-hand use, staff may wear gloves.
- Responsive rules: Mobile-first, max-width 480px on PDA/mobile, no sidebar, no horizontal overflow.
- Scanner workflow: Pages render hidden keyboard-wedge inputs inside this constrained surface.
- Maintenance notes: Desktop/admin layout is separate in AppLayout; keep PDA routes card-based here.
*/

import type { ReactNode } from 'react'
import { Box, Stack } from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { PdaHeader } from '../components/PdaHeader'
import { PdaBottomActionBar } from '../components/PdaBottomActionBar'

interface PdaLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  bottomAction?: ReactNode
}

export function PdaLayout({ title, subtitle, children, bottomAction }: PdaLayoutProps) {
  const { user } = useAuth()

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        bgcolor: '#f4f6f8',
        overflowX: 'hidden',
      }}
    >
      {/* Senior Handover: HT730 viewport target is 480x800 portrait */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '480px', sm: '480px', md: '100%' },
          minHeight: '100dvh',
          mx: 'auto',
          bgcolor: '#f4f6f8',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PdaHeader title={title} subtitle={subtitle} role={user?.role || 'N/A'} username={user?.username || ''} />
        <Stack
          component="main"
          spacing={1.5}
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2 },
            // Senior Handover: Bottom action bar requires content padding to avoid covering the last action button on HT730.
            pb: bottomAction ? 'calc(112px + env(safe-area-inset-bottom))' : 2,
            overflowX: 'hidden',
          }}
        >
          {children}
        </Stack>
        {bottomAction && <PdaBottomActionBar>{bottomAction}</PdaBottomActionBar>}
      </Box>
    </Box>
  )
}
