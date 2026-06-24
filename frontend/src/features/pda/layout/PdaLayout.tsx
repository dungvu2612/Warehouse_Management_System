/*
- Mục đích: Layout chung cho cac route PDA/Staff tren Unitech HT730.
- Phụ thuộc: PdaHeader, PdaBottomActionBar, auth context, MUI layout primitives.
- Giả định màn hình HT730: Màn hình dọc 480x800 px, dùng một tay, nhân viên có thể đeo găng.
- Quy tắc responsive: Mobile-first, max-width 480px on PDA/mobile, no sidebar, no horizontal overflow.
- Luồng scanner: Pages render hidden keyboard-wedge inputs inside this constrained surface.
- Ghi chú bảo trì: Desktop/admin layout is separate in AppLayout; keep PDA routes card-based here.
*/

import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Box,
  Drawer,
  Stack,
} from '@mui/material'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { PdaHeader } from '../components/PdaHeader'
import { PdaBottomActionBar } from '../components/PdaBottomActionBar'
import { AppNavigationDrawer, appDrawerWidth } from '../../../layouts/AppNavigationDrawer'

interface PdaLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  bottomAction?: ReactNode
}

export function PdaLayout({ title, subtitle, children, bottomAction }: PdaLayoutProps) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        bgcolor: '#f4f6f8',
        overflowX: 'hidden',
      }}
    >
      {/* Ghi chú: Mục tiêu viewport HT730 là màn hình dọc 480x800 */}
      <Box
        sx={{
          width: 'min(100%, 480px)',
          maxWidth: '480px',
          minHeight: '100dvh',
          mx: 'auto',
          bgcolor: '#f4f6f8',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <PdaHeader
          title={title}
          subtitle={subtitle}
          role={user?.role || 'N/A'}
          username={user?.username || ''}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <Drawer
          anchor="left"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          slotProps={{
            paper: {
              sx: {
                width: appDrawerWidth,
                maxWidth: '82vw',
                boxSizing: 'border-box',
                bgcolor: 'primary.main',
                color: 'white',
                borderRight: 'none',
                display: 'flex',
              },
            },
          }}
        >
          <AppNavigationDrawer
            pathname={pathname}
            user={user}
            onNavigate={() => setMenuOpen(false)}
            onLogout={handleLogout}
          />
        </Drawer>
        <Stack
          component="main"
          spacing={1.5}
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2 },
            // Ghi chú: Thanh thao tác dưới cần padding nội dung để không che nút cuối trên HT730.
            pb: bottomAction ? 'calc(112px + env(safe-area-inset-bottom))' : 2,
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
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
